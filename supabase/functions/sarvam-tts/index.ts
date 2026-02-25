import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

// Select ElevenLabs voice based on language
function selectVoice(langCode: string): string {
  // Hindi-friendly multilingual voices
  if (langCode === "hi-IN") return "pFZP5JQG7iQjIQuC4Bku"; // Lily - better Hindi pronunciation
  return "pFZP5JQG7iQjIQuC4Bku"; // Lily - great for Hinglish with multilingual v2
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { text, target_language_code, sessionId } = body;

    // Input validation
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text (string) is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 2000) {
      return new Response(JSON.stringify({ error: "Text too long (max 2000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const effectiveSessionId = sessionId || "anonymous";

    const allowed = await checkRateLimit(supabase, effectiveSessionId, "tts", 20);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit text to 1000 chars for TTS (increased for longer Hinglish responses)
    const truncatedText = text.slice(0, 1000);
    const langCode = target_language_code || "en-IN";
    const voiceId = selectVoice(langCode);

    console.log(`TTS: lang=${langCode}, voice=${voiceId}, textLen=${truncatedText.length}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: truncatedText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.8,
            style: 0.4,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Text-to-speech failed", details: errText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ElevenLabs returns raw audio binary — encode to base64
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = base64Encode(audioBuffer);

    // Log request
    try {
      await supabase.from("request_logs").insert({
        session_id: effectiveSessionId,
        function_name: "tts",
        message_length: text.length,
        response_time_ms: Date.now() - startTime,
      });
    } catch {}

    // Return in same format as before, but with audioFormat indicator
    return new Response(JSON.stringify({ 
      audio: audioBase64, 
      audioFormat: "mp3"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
