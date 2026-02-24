import React, { useRef, useState } from "react";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";

interface AssistantInputProps {
  onSend: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  isLoading: boolean;
}

const AssistantInput: React.FC<AssistantInputProps> = ({
  onSend, onStartRecording, onStopRecording, isRecording, isTranscribing, isLoading,
}) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border px-3 py-2.5 bg-background mb-16">
      {isTranscribing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Transcribing...</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up..."
          className="flex-1 rounded-full border border-input bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isTranscribing || isLoading}
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-50 ${
            isRecording
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          onClick={handleSend}
          disabled={!text.trim() || isLoading}
          className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AssistantInput;
