import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Rate limiting ---
async function checkRateLimit(supabase: any, sessionId: string, functionName: string, maxPerMinute: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - 60_000).toISOString();
  const { data } = await supabase
    .from("rate_limits")
    .select("id, request_count")
    .eq("session_id", sessionId)
    .eq("function_name", functionName)
    .gte("window_start", windowStart)
    .order("window_start", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    if (data[0].request_count >= maxPerMinute) return false;
    await supabase.from("rate_limits").update({ request_count: data[0].request_count + 1 }).eq("id", data[0].id);
  } else {
    await supabase.from("rate_limits").insert({ session_id: sessionId, function_name: functionName, request_count: 1, window_start: new Date().toISOString() });
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const apiKey = Deno.env.get("SARVAM_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "SARVAM_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { audio, language_code, sessionId, audioMimeType } = body;

    // Input validation
    if (!audio || typeof audio !== "string") {
      return new Response(JSON.stringify({ error: "audio (base64 string) is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (audio.length > 5_000_000) {
      return new Response(JSON.stringify({ error: "Audio too large (max 5MB base64)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const effectiveSessionId = sessionId || "anonymous";

    const allowed = await checkRateLimit(supabase, effectiveSessionId, "stt", 20);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 audio to binary
    const binaryAudio = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));

    // Build multipart form data
    const formData = new FormData();
    const mimeType = audioMimeType || "audio/webm";
    const ext = mimeType.includes("mp4") ? ".mp4" : mimeType.includes("ogg") ? ".ogg" : ".webm";
    formData.append("file", new Blob([binaryAudio], { type: mimeType }), "recording" + ext);
    formData.append("model", "saaras:v3");
    formData.append("mode", "transcribe");
    if (language_code) {
      formData.append("language_code", language_code);
    }

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": apiKey },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Sarvam STT error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Speech-to-text failed", details: errText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();

    // Log request
    try {
      await supabase.from("request_logs").insert({
        session_id: effectiveSessionId,
        function_name: "stt",
        message_length: audio.length,
        response_time_ms: Date.now() - startTime,
      });
    } catch {}

    return new Response(JSON.stringify({ transcript: result.transcript || "", language_code: result.language_code || "unknown" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("STT error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
