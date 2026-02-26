import React from "react";

type AvatarState = "idle" | "speaking" | "listening";

interface TalkingAvatarProps {
  state: AvatarState;
  size?: "large" | "small";
  className?: string;
}

const TalkingAvatar: React.FC<TalkingAvatarProps> = ({ state, size = "large", className = "" }) => {
  const isLarge = size === "large";
  const containerSize = isLarge ? "h-40 w-40" : "h-12 w-12";
  const iconSize = isLarge ? "text-5xl" : "text-xl";

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glow rings */}
        {state === "speaking" && (
          <>
            <span
              className={`absolute rounded-full bg-primary/20 animate-ping ${isLarge ? "-inset-6" : "-inset-2"}`}
              style={{ animationDuration: "1.5s" }}
            />
            <span
              className={`absolute rounded-full bg-primary/10 animate-pulse ${isLarge ? "-inset-10" : "-inset-4"}`}
              style={{ animationDuration: "2s" }}
            />
          </>
        )}

        {state === "idle" && isLarge && (
          <span
            className="absolute -inset-4 rounded-full border-2 border-primary/15 animate-pulse"
            style={{ animationDuration: "3s" }}
          />
        )}

        {state === "listening" && (
          <span
            className={`absolute rounded-full border-2 border-destructive/30 animate-pulse ${isLarge ? "-inset-4" : "-inset-2"}`}
            style={{ animationDuration: "1s" }}
          />
        )}

        {/* Avatar circle */}
        <div
          className={`${containerSize} rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg transition-transform duration-500 ${
            state === "speaking" ? "scale-105" : state === "idle" ? "animate-pulse" : ""
          }`}
          style={state === "idle" ? { animationDuration: "4s" } : undefined}
        >
          {/* AI face icon */}
          <span className={`${iconSize} select-none`}>🤖</span>
        </div>

        {/* Speaking wave bars */}
        {state === "speaking" && isLarge && (
          <div className="absolute -bottom-8 flex items-end gap-1 h-6">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full"
                style={{
                  animation: `avatar-wave 0.5s ease-in-out ${i * 0.08}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      {isLarge && (
        <p className={`text-sm font-medium mt-4 ${
          state === "speaking"
            ? "text-primary"
            : state === "listening"
            ? "text-destructive"
            : "text-muted-foreground"
        }`}>
          {state === "speaking"
            ? "Priya is speaking..."
            : state === "listening"
            ? "Listening..."
            : "Hi! I'm Priya, your shopping assistant"}
        </p>
      )}

      <style>{`
        @keyframes avatar-wave {
          0% { height: 4px; }
          100% { height: 20px; }
        }
      `}</style>
    </div>
  );
};

export default TalkingAvatar;
