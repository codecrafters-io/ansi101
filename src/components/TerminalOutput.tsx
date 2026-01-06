import { AnsiToken, TerminalState } from "@/types/ansi";
import { INITIAL_STATE, updateState, getStyleObject } from "@/utils/ansiToCss";

interface TerminalOutputProps {
  tokens: AnsiToken[];
  hoveredId: string | null;
}

export default function TerminalOutput({
  tokens,
  hoveredId,
}: TerminalOutputProps) {
  const renderableParts: {
    id: string;
    text: string;
    style: React.CSSProperties;
    isHighlighted: boolean;
  }[] = [];

  let currentState: TerminalState = { ...INITIAL_STATE };
  let activeAnsiHighlighterId: string | null = null;

  tokens.forEach((token) => {
    if (token.type === "ansi") {
      if (
        token.category === "color" ||
        token.category === "style" ||
        token.category === "reset"
      ) {
        if (token.params) {
          currentState = updateState(currentState, token.params);

          if (token.id === hoveredId && token.category !== "reset") {
            activeAnsiHighlighterId = token.id;
          } else if (activeAnsiHighlighterId) {
            const isVisualChange =
              token.category === "color" || token.params.includes(0);
            if (isVisualChange) activeAnsiHighlighterId = null;
          }
        }
      }
    } else {
      renderableParts.push({
        id: token.id,
        text: token.raw,
        style: getStyleObject(currentState),
        isHighlighted:
          token.category !== "reset" &&
          (token.id === hoveredId || activeAnsiHighlighterId !== null),
      });
    }
  });

  return (
    <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-all relative z-10">
      {renderableParts.map((part) => (
        <span
          key={part.id}
          style={part.style}
          className={`
                ${!part.style.color ? "text-slate-300" : ""} 
                ${
                  part.isHighlighted
                    ? "bg-yellow-500/30 ring-2 ring-yellow-500/30 rounded-sm"
                    : ""
                }
            `}
        >
          {part.text}
        </span>
      ))}
    </div>
  );
}
