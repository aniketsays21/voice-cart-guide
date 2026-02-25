

# Voice-Only Widget for Shopify

## What Changes

The widget will become a **voice-first experience**. No more chat tab — when customers (or any Shopify button) opens the widget, they go straight to the voice assistant.

## Changes Overview

### 1. Remove Chat Tab and Chat Mode

- Remove the tab bar entirely (no "Chat" / "Voice" toggle)
- Remove the `renderChatMode` function and related chat UI (textarea, send button, message list)
- The widget opens directly into voice mode
- Chat-related state variables (`messages`, `isLoading`, `input`) and the `send()` function for text chat will be removed

### 2. Change the Floating Button to a Microphone

- Replace the chat bubble icon on the FAB (floating action button) with a **microphone icon**
- Optionally add a small label or tooltip: "Talk to us"

### 3. Expose a Global API for External Buttons

The widget already exposes `window.AIChatWidget.open()`. This will continue to work, so any Shopify button can trigger it.

You'll add a simple `onclick` to any button in your Shopify theme:

```html
<button onclick="window.AIChatWidget.open()">
  Talk to Assistant
</button>
```

This works with any HTML element — a banner button, a navigation link, a product page CTA, etc.

### 4. Header Update

- Header will show the mic icon instead of chat icon
- Title stays configurable (e.g., "Voice Assistant")

## Technical Details

### File: `public/ai-chat-widget.js`

**Remove:**
- `activeTab` variable and all tab-switching logic
- `renderChatMode()` function (~45 lines)
- Tab HTML generation and tab click handlers
- Text chat `send()` function and related streaming logic (~80 lines)
- Chat-related state: `messages`, `isLoading` arrays

**Modify:**
- FAB button: change icon from `ICONS.chat` to `ICONS.mic`, add "Talk to us" label
- `render()` function: when open, go directly to `renderVoiceMode()` without tabs
- `renderVoiceMode()`: remove `tabsHtml` parameter since no tabs exist
- Header icon: use `ICONS.mic` instead of `ICONS.chat`
- Keep all voice state, STT, TTS, product display, and Shopify action logic intact

**Keep:**
- `window.AIChatWidget` API (`open`, `close`, `destroy`) — already works for external buttons
- All voice mode logic (recording, VAD, STT, Chat API, TTS, product cards)
- Shadow DOM, styles, auto-init

### Shopify Integration

On your Shopify theme, you can add a button anywhere (header, banner, product page) like:

```html
<button class="voice-assistant-btn" onclick="window.AIChatWidget.open()">
  Ask our Voice Assistant
</button>
```

The floating mic button will still be there as a fallback, but any custom button can also trigger the same panel.

### Estimated Change

The file will shrink from ~1128 lines to ~900 lines by removing chat-only code. The voice experience remains identical — mic button, waveform, silence detection, product cards, and auto-restart.
