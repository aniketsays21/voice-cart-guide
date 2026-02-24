import React from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceButtonProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "large" | "small";
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ isListening, onToggle, disabled, size = "large" }) => {
  const isLarge = size === "large";

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
          isLarge ? "h-24 w-24" : "h-10 w-10"
        } ${
          isListening
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {/* Pulsing ring for idle large button */}
        {isLarge && !isListening && !disabled && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "2s" }} />
            <span className="absolute -inset-2 rounded-full border-2 border-primary/20 animate-pulse" />
          </>
        )}
        {/* Pulsing ring for listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-destructive/30 animate-ping" style={{ animationDuration: "1s" }} />
            <span className="absolute -inset-2 rounded-full border-2 border-destructive/30 animate-pulse" />
          </>
        )}
        {isListening ? (
          <MicOff className={isLarge ? "h-10 w-10" : "h-4 w-4"} />
        ) : (
          <Mic className={isLarge ? "h-10 w-10" : "h-4 w-4"} />
        )}
      </button>

      {/* Sound wave bars when listening (large only) */}
      {isLarge && isListening && (
        <div className="flex items-end gap-1 h-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 bg-destructive rounded-full"
              style={{
                animation: `voice-wave 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Label */}
      {isLarge && (
        <p className="text-sm font-medium text-muted-foreground">
          {isListening ? "Listening... I'll stop when you pause" : "Tap to Speak"}
        </p>
      )}

      <style>{`
        @keyframes voice-wave {
          0% { height: 4px; }
          100% { height: 24px; }
        }
      `}</style>
    </div>
  );
};

export default VoiceButton;
