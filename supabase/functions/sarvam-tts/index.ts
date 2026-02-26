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

// --- Sarvam TTS ---
async function trySarvamTTS(apiKey: string, text: string, langCode: string): Promise<{ ok: boolean; status: number; audio?: string }> {
  const resp = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: langCode === "en-IN" ? "hi-IN" : langCode,
      model: "bulbul:v2",
      speaker: "arvind",
      pace: 1.0,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Sarvam TTS error: ${resp.status} ${errText}`);
    return { ok: false, status: resp.status };
  }

  const data = await resp.json();
  if (data.audios && data.audios.length > 0) {
    return { ok: true, status: 200, audio: data.audios[0] };
  }
  return { ok: false, status: 500 };
}

// --- ElevenLabs TTS fallback ---
async function tryElevenLabsTTS(apiKey: string, text: string): Promise<{ ok: boolean; status: number; audio?: string }> {
  const voiceId = "SAz9YHcvj6GT2YYXdXww"; // River
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.35, similarity_boost: 0.85, style: 0.6, use_speaker_boost: true, speed: 1.0 },
      }),
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`ElevenLabs TTS error: ${resp.status} ${errText}`);
    return { ok: false, status: resp.status };
  }

  const audioBuffer = await resp.arrayBuffer();
  const audioBase64 = base64Encode(audioBuffer);
  return { ok: true, status: 200, audio: audioBase64 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { text, target_language_code, sessionId } = body;

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text (string) is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 2000) {
      return new Response(JSON.stringify({ error: "Text too long (max 2000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const effectiveSessionId = sessionId || "anonymous";

    const allowed = await checkRateLimit(supabase, effectiveSessionId, "tts", 20);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncatedText = text.slice(0, 1000);
    const langCode = target_language_code || "en-IN";

    // --- Fallback chain: Sarvam Key1 -> Sarvam Key2 -> ElevenLabs ---
    const sarvamKey1 = Deno.env.get("SARVAM_API_KEY");
    const sarvamKey2 = Deno.env.get("SARVAM_API_KEY_2");
    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");

    let result: { ok: boolean; status: number; audio?: string } | null = null;
    let audioFormat = "wav";
    let provider = "unknown";

    // Try Sarvam Key 1
    if (sarvamKey1) {
      console.log(`TTS: Trying Sarvam key1, lang=${langCode}, textLen=${truncatedText.length}`);
      result = await trySarvamTTS(sarvamKey1, truncatedText, langCode);
      if (result.ok) { provider = "sarvam-key1"; }
      else if (result.status === 429 || result.status === 403) {
        console.log(`TTS: Sarvam key1 failed (${result.status}), trying key2...`);
        result = null;
      } else {
        // Other error from Sarvam, still try fallbacks
        console.log(`TTS: Sarvam key1 failed (${result.status}), trying key2...`);
        result = null;
      }
    }

    // Try Sarvam Key 2
    if (!result && sarvamKey2) {
      result = await trySarvamTTS(sarvamKey2, truncatedText, langCode);
      if (result.ok) { provider = "sarvam-key2"; }
      else {
        console.log(`TTS: Sarvam key2 failed (${result.status}), falling back to ElevenLabs...`);
        result = null;
      }
    }

    // Try ElevenLabs
    if (!result && elevenLabsKey) {
      result = await tryElevenLabsTTS(elevenLabsKey, truncatedText);
      if (result.ok) { provider = "elevenlabs"; audioFormat = "mp3"; }
      else { result = null; }
    }

    if (!result || !result.ok) {
      return new Response(JSON.stringify({ error: "All TTS providers failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`TTS: Success via ${provider}`);

    // Log request
    try {
      await supabase.from("request_logs").insert({
        session_id: effectiveSessionId, function_name: "tts",
        message_length: text.length, response_time_ms: Date.now() - startTime,
      });
    } catch {}

    return new Response(JSON.stringify({ audio: result.audio, audioFormat }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
