

# Fine-tune Bot for Hinglish / Hindi Speaking

## What We'll Do

We'll make two key changes so the bot speaks naturally in Hinglish (a mix of Hindi and English that Indian shoppers use) and sounds great in Hindi:

1. **Update the system prompt** in the chat function to instruct the AI to always respond in natural Hinglish (Roman Hindi mixed with English), making it sound like a friendly Indian shop assistant
2. **Switch to a better Hindi voice** and tune ElevenLabs voice settings for natural Hindi/Hinglish pronunciation
3. **Increase TTS text limit** from 500 to 1000 characters so longer Hindi responses don't get cut off

---

## Technical Changes

### 1. Chat Edge Function (`supabase/functions/chat/index.ts`)

Update the system prompt's language instructions:

- Change from "respond in the same language the user uses" to **always default to Hinglish**
- Add explicit Hinglish speaking style instructions:
  - "Tum ek friendly Indian shopping assistant ho. Hamesha Hinglish mein baat karo — jaise ek dost se baat kar rahe ho."
  - "Mix Hindi and English naturally, e.g. 'Ye perfume bohot popular hai, long-lasting fragrance hai aur price bhi quite affordable hai.'"
  - "Use Roman Hindi script, NOT Devanagari. Write Hindi words in English letters."
  - "Keep sentences short and conversational for voice output."
- Update the welcome message to be more natural Hinglish: "Hello! Main aapka shopping assistant hoon. Bella Vita store par aapka swagat hai! Batao kya dhundh rahe ho?"

### 2. TTS Edge Function (`supabase/functions/sarvam-tts/index.ts`)

- **Voice**: Switch from Sarah (`EXAVITQu4vr4xnSDxMaL`) to **Lily** (`pFZP5JQG7iQjIQuC4Bku`) which has better Hindi pronunciation with the multilingual v2 model, OR keep Sarah but tune settings
- **Voice settings**: Adjust for more natural Hindi speech:
  - `stability`: 0.4 (more expressive, natural conversational tone)
  - `similarity_boost`: 0.8
  - `style`: 0.4 (slightly more stylized for warmth)
  - `speed`: 0.95 (slightly slower for clearer Hindi words)
- **Text limit**: Increase from 500 to 1000 characters
- **Audio quality**: Upgrade from `mp3_22050_32` to `mp3_44100_128` for clearer pronunciation

### 3. No Model Change Needed

The current Lovable AI (Gemini) model already supports Hinglish well. The key improvement is in the **prompt engineering** — telling it exactly how to speak in Hinglish style, and in the **voice settings** for more natural Hindi TTS output.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Update system prompt for Hinglish default language |
| `supabase/functions/sarvam-tts/index.ts` | Tune voice settings, increase text limit, upgrade audio quality |

