import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number, scheduled_time, conversation_id, session_id, context_summary } = await req.json();

    if (!phone_number || !scheduled_time || !session_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse scheduled_time (e.g. "15:00" or "3:00 PM") into a full IST timestamp for today
    const now = new Date();
    // Convert current time to IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    let hours: number;
    let minutes: number;

    // Handle "HH:MM" or "H:MM PM" formats
    const timeStr = scheduled_time.trim();
    const pmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    const plainMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);

    if (pmMatch) {
      hours = parseInt(pmMatch[1]);
      minutes = parseInt(pmMatch[2]);
      const isPM = pmMatch[3].toUpperCase() === "PM";
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    } else if (plainMatch) {
      hours = parseInt(plainMatch[1]);
      minutes = parseInt(plainMatch[2]);
    } else {
      // Try just hour number like "15" or "3"
      const hourOnly = parseInt(timeStr);
      if (!isNaN(hourOnly)) {
        hours = hourOnly;
        minutes = 0;
      } else {
        return new Response(JSON.stringify({ error: "Invalid time format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build IST date for today at the given time
    const istDate = new Date(istNow);
    istDate.setUTCHours(hours - 5, minutes - 30, 0, 0); // Convert IST to UTC

    // If the time has already passed today, schedule for tomorrow
    if (istDate.getTime() < now.getTime()) {
      istDate.setDate(istDate.getDate() + 1);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Normalize phone number - ensure +91 prefix
    let normalizedPhone = phone_number.replace(/[\s\-()]/g, "");
    if (!normalizedPhone.startsWith("+")) {
      if (normalizedPhone.startsWith("91") && normalizedPhone.length === 12) {
        normalizedPhone = "+" + normalizedPhone;
      } else {
        normalizedPhone = "+91" + normalizedPhone;
      }
    }

    const { data, error } = await supabase.from("scheduled_calls").insert({
      phone_number: normalizedPhone,
      scheduled_at: istDate.toISOString(),
      conversation_id: conversation_id || null,
      session_id,
      context_summary: context_summary || null,
      status: "pending",
    }).select().single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to schedule call" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Call scheduled for ${istDate.toISOString()} to ${normalizedPhone}`);

    return new Response(JSON.stringify({ success: true, scheduled_at: istDate.toISOString(), id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Schedule call error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
