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

  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  const ELEVENLABS_AGENT_ID = Deno.env.get("ELEVENLABS_AGENT_ID");
  const ELEVENLABS_PHONE_NUMBER_ID = Deno.env.get("ELEVENLABS_PHONE_NUMBER_ID");

  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Missing ElevenLabs API key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!ELEVENLABS_AGENT_ID || !ELEVENLABS_PHONE_NUMBER_ID) {
    console.error("ElevenLabs agent or phone number ID not configured");
    return new Response(JSON.stringify({ error: "Missing ElevenLabs agent config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Find pending calls that are due
    const { data: pendingCalls, error: fetchError } = await supabase
      .from("scheduled_calls")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .limit(10);

    if (fetchError) {
      console.error("Error fetching scheduled calls:", fetchError);
      return new Response(JSON.stringify({ error: "DB query failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingCalls || pendingCalls.length === 0) {
      return new Response(JSON.stringify({ message: "No pending calls" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${pendingCalls.length} pending calls to trigger`);

    const results = [];

    for (const call of pendingCalls) {
      try {
        // Load conversation history for context
        let conversationContext = call.context_summary || "User requested a callback";
        
        if (call.conversation_id) {
          const { data: messages } = await supabase
            .from("messages")
            .select("role, content")
            .eq("conversation_id", call.conversation_id)
            .order("created_at", { ascending: true })
            .limit(20);

          if (messages && messages.length > 0) {
            const recentMessages = messages.slice(-10);
            const historyText = recentMessages
              .map((m: any) => `${m.role}: ${m.content.substring(0, 200)}`)
              .join("\n");
            conversationContext = `${call.context_summary || ""}\n\nRecent conversation:\n${historyText}`;
          }
        }

        // Initiate outbound call via ElevenLabs
        const callResponse = await fetch(
          "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              agent_id: ELEVENLABS_AGENT_ID,
              agent_phone_number_id: ELEVENLABS_PHONE_NUMBER_ID,
              to_number: call.phone_number,
              conversation_initiation_client_data: {
                dynamic_variables: {
                  user_name: "customer",
                  context: conversationContext,
                  callback_reason: `User asked for a callback. ${call.context_summary || "Continue the shopping conversation."}`,
                },
              },
            }),
          }
        );

        if (!callResponse.ok) {
          const errBody = await callResponse.text();
          console.error(`ElevenLabs call failed for ${call.id}: ${callResponse.status} ${errBody}`);
          
          await supabase
            .from("scheduled_calls")
            .update({ status: "failed" })
            .eq("id", call.id);

          results.push({ id: call.id, status: "failed", error: errBody });
          continue;
        }

        const callData = await callResponse.json();
        console.log(`Call initiated for ${call.phone_number}:`, callData);

        // Update status to calling
        await supabase
          .from("scheduled_calls")
          .update({
            status: "calling",
            elevenlabs_conversation_id: callData.conversation_id || null,
          })
          .eq("id", call.id);

        results.push({ id: call.id, status: "calling", elevenlabs_conversation_id: callData.conversation_id });
      } catch (callErr) {
        console.error(`Error processing call ${call.id}:`, callErr);
        await supabase
          .from("scheduled_calls")
          .update({ status: "failed" })
          .eq("id", call.id);
        results.push({ id: call.id, status: "failed", error: String(callErr) });
      }
    }

    return new Response(JSON.stringify({ triggered: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Trigger scheduled calls error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
