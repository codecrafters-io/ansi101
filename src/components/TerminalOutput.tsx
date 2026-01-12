import clsx from "clsx";

import { AnsiToken, TerminalState } from "@/types/ansi";
import { INITIAL_STATE, updateState, getStyleObject } from "@/utils/ansiToCss";

interface TerminalOutputProps {
  tokens: AnsiToken[];
  hoveredId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onHoverChange: (id: string | null) => void;
}

export default function TerminalOutput({
  tokens,
  hoveredId,
  selectedId,
  onSelect,
  onHoverChange,
}: TerminalOutputProps) {
  let currentState: TerminalState = { ...INITIAL_STATE };
  let activeAnsiTokenId: string | null = null;

  const renderableParts: {
    id: string;
    text: string;
    style: React.CSSProperties;
    isHovered: boolean;
    isSelected: boolean;
  }[] = [];

  tokens.forEach((token) => {
    if (token.type === "ansi") {
      if (token.params) {
        currentState = updateState(currentState, token.params);
      }

      if (token.category === "color" || token.category === "style") {
        activeAnsiTokenId = token.id;
      } else if (token.category === "reset") {
        activeAnsiTokenId = null;
      }
    } else {
      const isHovered =
        hoveredId !== null &&
        (token.id === hoveredId || activeAnsiTokenId === hoveredId);

      const isSelected =
        selectedId !== null &&
        (token.id === selectedId || activeAnsiTokenId === selectedId);

      renderableParts.push({
        id: token.id,
        text: token.raw,
        style: getStyleObject(currentState),
        isHovered,
        isSelected,
      });
    }
  });

  return (
    <div className="font-mono text-sm ios:text-base leading-relaxed whitespace-pre-wrap break-all relative z-10">
      {renderableParts.map((part) => {
        let highlightClass = "";

        if (part.isSelected) {
          highlightClass =
            "bg-blue-500/30 ring-2 ring-blue-500/30 z-20 rounded-[1px]";
        } else if (part.isHovered) {
          highlightClass =
            "bg-yellow-500/30 ring-2 ring-yellow-500/30 z-10 rounded-[1px]";
        }

        return (
          <span
            key={part.id}
            style={part.style}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(part.id);
            }}
            onMouseEnter={() => onHoverChange(part.id)}
            onMouseLeave={() => onHoverChange(null)}
            className={clsx(
              "cursor-pointer transition-all duration-75 relative",
              !part.style.color && "text-slate-300",
              highlightClass
            )}
          >
            {part.text}
          </span>
        );
      })}
    </div>
  );
}
