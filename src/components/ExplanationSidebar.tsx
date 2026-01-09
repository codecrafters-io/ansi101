import { useEffect, useRef, forwardRef } from "react";
import clsx from "clsx";

import { AnsiToken } from "@/types/ansi";

interface ExplanationSidebarProps {
  tokens: AnsiToken[];
  onHoverChange: (id: string | null) => void;
  hoveredId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function ExplanationSidebar({
  tokens,
  onHoverChange,
  hoveredId,
  selectedId,
  onSelect,
}: ExplanationSidebarProps) {
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedId]);

  return (
    <div className="h-full flex flex-col bg-card border-l border-border text-card-foreground font-sans text-sm">
      <div className="p-4 border-b border-border bg-muted/20 shadow-sm z-10">
        <h2 className="font-bold text-muted-foreground uppercase tracking-wider text-xs">
          Code Explanation
        </h2>
      </div>

      <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-border">
        {tokens.length === 0 && (
          <p className="p-6 text-foreground italic text-center">
            No input detected.
          </p>
        )}

        {tokens.map((token) => (
          <TokenCard
            key={token.id}
            token={token}
            isHovered={hoveredId === token.id}
            isSelected={selectedId === token.id}
            onHoverChange={onHoverChange}
            onSelect={onSelect}
            ref={selectedId === token.id ? selectedRef : null}
          />
        ))}
        <div className="h-20" />
      </div>
    </div>
  );
}

interface TokenCardProps {
  token: AnsiToken;
  isHovered: boolean;
  isSelected: boolean;
  onHoverChange: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}

const TokenCard = forwardRef<HTMLDivElement, TokenCardProps>(
  ({ token, isHovered, isSelected, onHoverChange, onSelect }, ref) => {
    return (
      <div
        ref={ref}
        onClick={() => onSelect(token.id)}
        onMouseEnter={() => onHoverChange(token.id)}
        onMouseLeave={() => onHoverChange(null)}
        className={clsx(
          "border-b border-border transition-all duration-200 cursor-pointer",
          (isSelected || (isSelected && isHovered)) &&
            "border-l-4 border-l-blue-500 bg-muted/50",
          isHovered &&
            !isSelected &&
            "border-l-4 border-l-yellow-500 bg-yellow-500/10",
          !isHovered && !isSelected && "border-l-4 border-l-transparent"
        )}
      >
        <details open className="group">
          <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none">
            {/* ARROW */}
            <div
              className="text-foreground transition-transform group-open:rotate-90 p-1 -m-1 hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {token.type === "ansi" ? (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="6" />
                </svg>
              )}
            </div>

            {/* THE CONTENT */}
            <div
              className="flex-1 min-w-0"
              onClick={(e) => {
                e.preventDefault();
                onSelect(token.id);
              }}
            >
              <div className="flex items-center mb-0.5">
                <code className="font-mono text-primary font-bold text-xs px-1.5 py-0.5 rounded bg-muted/50 border border-border truncate">
                  {token.raw}
                </code>
              </div>
              <div className="text-foreground text-xs font-medium truncate">
                {token.summary}
              </div>
            </div>
          </summary>

          {/* Breakdown Table */}
          <div
            className={clsx(
              "px-4 pl-8 space-y-3",
              Number(token.parts?.length) > 0 && "pb-4 mt-1"
            )}
          >
            {token.parts?.map((part, idx) => (
              <div
                key={idx}
                className="relative flex gap-3 text-xs leading-relaxed group/part"
              >
                <div className="absolute left-0.75 top-3 -bottom-3 w-px bg-border last:hidden"></div>
                <div className="shrink-0 flex flex-col items-center z-10">
                  <span
                    className={clsx(
                      "h-2 w-2 rounded-full mt-1.5",
                      part.type === "marker" && "bg-muted-foreground/50",
                      part.type === "param" && part.status === "error"
                        ? "bg-red-500"
                        : "bg-blue-500",
                      part.type === "cmd" && "bg-pink-500",
                      part.type === "separator" && "bg-border"
                    )}
                  ></span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <code
                      className={clsx(
                        "font-mono font-bold px-1 rounded border",
                        part.status === "error"
                          ? "text-red-600 border-red-200 bg-transparent dark:bg-red-900/30 dark:text-red-400 dark:border-red-900"
                          : "bg-muted text-foreground border-border"
                      )}
                    >
                      {part.value}
                    </code>
                    <span
                      className={clsx(
                        "uppercase text-[10px] font-bold tracking-wider",
                        part.status === "error"
                          ? "text-red-500"
                          : "text-foreground"
                      )}
                    >
                      {part.label === part.value ? part.type : part.label}
                    </span>
                  </div>
                  <div
                    className={clsx(
                      "mt-0.5",
                      part.status === "error"
                        ? "text-red-500/80"
                        : "text-foreground opacity-80"
                    )}
                  >
                    {part.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    );
  }
);

TokenCard.displayName = "TokenCard";
