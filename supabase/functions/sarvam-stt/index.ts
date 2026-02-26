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

// --- Sarvam STT ---
async function trySarvamSTT(apiKey: string, audioBlob: Blob): Promise<{ ok: boolean; status: number; transcript?: string; language_code?: string }> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");
  formData.append("model", "saaras:v2");
  formData.append("language_code", "unknown");

  const resp = await fetch("https://api.sarvam.ai/speech-to-text/transcribe", {
    method: "POST",
    headers: { "api-subscription-key": apiKey },
    body: formData,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Sarvam STT error: ${resp.status} ${errText}`);
    return { ok: false, status: resp.status };
  }

  const data = await resp.json();
  return { ok: true, status: 200, transcript: data.transcript || "", language_code: data.language_code || "unknown" };
}

// --- ElevenLabs STT fallback ---
async function tryElevenLabsSTT(apiKey: string, audioBlob: Blob, ext: string): Promise<{ ok: boolean; status: number; transcript?: string; language_code?: string }> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording" + ext);
  formData.append("model_id", "scribe_v2");

  const resp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: formData,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`ElevenLabs STT error: ${resp.status} ${errText}`);
    return { ok: false, status: resp.status };
  }

  const data = await resp.json();
  return { ok: true, status: 200, transcript: data.text || "", language_code: data.language_code || "unknown" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { audio, sessionId, audioMimeType, audioMimeTypeRaw } = body;

    if (!audio || typeof audio !== "string") {
      return new Response(JSON.stringify({ error: "audio (base64 string) is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (audio.length > 5_000_000) {
      return new Response(JSON.stringify({ error: "Audio too large (max 5MB base64)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const effectiveSessionId = sessionId || "anonymous";

    const allowed = await checkRateLimit(supabase, effectiveSessionId, "stt", 20);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 audio
    const binaryAudio = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));

    // Determine MIME type
    function sanitizeMime(raw: string | undefined): string {
      if (!raw) return "audio/webm";
      const base = raw.toLowerCase().split(";")[0].trim();
      if (base.includes("webm")) return "audio/webm";
      if (base.includes("ogg")) return "audio/ogg";
      if (base.includes("mp4") || base.includes("m4a") || base.includes("aac")) return "audio/mp4";
      if (base.includes("wav")) return "audio/wav";
      return "audio/webm";
    }

    function sniffContainer(bytes: Uint8Array): string | null {
      if (bytes.length < 12) return null;
      if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) return "audio/webm";
      if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return "audio/ogg";
      if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "audio/mp4";
      return null;
    }

    const clientMime = sanitizeMime(audioMimeType);
    const sniffedMime = sniffContainer(binaryAudio);
    const resolvedMime = sniffedMime || clientMime;
    const ext = resolvedMime.includes("mp4") ? ".mp4" : resolvedMime.includes("ogg") ? ".ogg" : resolvedMime.includes("wav") ? ".wav" : ".webm";

    console.log(`STT audio: rawMime=${audioMimeTypeRaw || "n/a"}, resolved=${resolvedMime}, bytes=${binaryAudio.length}`);

    const audioBlob = new Blob([binaryAudio], { type: resolvedMime });

    // --- Fallback chain: ElevenLabs first (Sarvam STT returning 404) -> Sarvam Key1 -> Sarvam Key2 ---
    const sarvamKey1 = Deno.env.get("SARVAM_API_KEY");
    const sarvamKey2 = Deno.env.get("SARVAM_API_KEY_2");
    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");

    let result: { ok: boolean; status: number; transcript?: string; language_code?: string } | null = null;
    let provider = "unknown";

    // Try ElevenLabs first (Sarvam STT is currently returning 404)
    if (elevenLabsKey) {
      console.log("STT: Trying ElevenLabs first...");
      result = await tryElevenLabsSTT(elevenLabsKey, audioBlob, ext);
      if (result.ok) { provider = "elevenlabs"; }
      else {
        console.log(`STT: ElevenLabs failed (${result.status}), trying Sarvam...`);
        result = null;
      }
    }

    // Fallback: Try Sarvam Key 1
    if (!result && sarvamKey1) {
      console.log("STT: Trying Sarvam key1...");
      result = await trySarvamSTT(sarvamKey1, audioBlob);
      if (result.ok) { provider = "sarvam-key1"; }
      else {
        console.log(`STT: Sarvam key1 failed (${result.status}), trying key2...`);
        result = null;
      }
    }

    // Fallback: Try Sarvam Key 2
    if (!result && sarvamKey2) {
      result = await trySarvamSTT(sarvamKey2, audioBlob);
      if (result.ok) { provider = "sarvam-key2"; }
      else {
        console.log(`STT: Sarvam key2 failed (${result.status})`);
        result = null;
      }
    }

    if (!result || !result.ok) {
      return new Response(JSON.stringify({ error: "All STT providers failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`STT: Success via ${provider}, transcript="${result.transcript?.slice(0, 50)}..."`);

    // Log request
    try {
      await supabase.from("request_logs").insert({
        session_id: effectiveSessionId, function_name: "stt",
        message_length: audio.length, response_time_ms: Date.now() - startTime,
      });
    } catch {}

    return new Response(JSON.stringify({ transcript: result.transcript, language_code: result.language_code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("STT error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
