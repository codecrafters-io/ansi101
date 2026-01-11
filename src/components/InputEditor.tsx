import { useRef } from "react";
import clsx from "clsx";

import { AnsiToken } from "@/types/ansi";

interface InputEditorProps {
  input: string;
  setInput: (val: string) => void;
  tokens: AnsiToken[];
  hoveredId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onHoverChange: (id: string | null) => void;
  isEditing: boolean;
}

export default function InputEditor({
  input,
  setInput,
  tokens,
  hoveredId,
  selectedId,
  onSelect,
  onHoverChange,
  isEditing,
}: InputEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // HOVER LOGIC (Unchanged)
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget as HTMLElement;
    if (!target) return;

    const prevPointerEvents = target.style.pointerEvents;
    target.style.pointerEvents = "none";
    const elementUnderneath = document.elementFromPoint(e.clientX, e.clientY);
    target.style.pointerEvents = prevPointerEvents;

    if (elementUnderneath && elementUnderneath.hasAttribute("data-token-id")) {
      const tokenId = elementUnderneath.getAttribute("data-token-id");
      onHoverChange(tokenId);
    } else {
      onHoverChange(null);
    }
  };

  const handleMouseLeave = () => {
    onHoverChange(null);
  };

  // CLICK SELECT (Edit Mode - Cursor Based)
  const handleClickSelect = () => {
    if (!textareaRef.current) return;
    const cursorIndex = textareaRef.current.selectionStart;
    const foundToken = tokens.find(
      (t) => cursorIndex >= t.start && cursorIndex < t.end
    );
    if (foundToken) {
      if (foundToken.id === selectedId) onSelect(null);
      else onSelect(foundToken.id);
    } else {
      onSelect(null);
    }
  };

  // READ MODE CLICK (Hit Test Based)
  const handleReadModeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const prevPointerEvents = target.style.pointerEvents;
    target.style.pointerEvents = "none";
    const elementUnderneath = document.elementFromPoint(e.clientX, e.clientY);
    target.style.pointerEvents = prevPointerEvents;

    if (elementUnderneath && elementUnderneath.hasAttribute("data-token-id")) {
      const tokenId = elementUnderneath.getAttribute("data-token-id");
      if (tokenId === selectedId) onSelect(null);
      else onSelect(tokenId);
    } else {
      onSelect(null);
    }
  };

  const typographyClasses =
    "font-mono text-[16px] md:text-sm leading-relaxed whitespace-pre-wrap break-all";
  const paddingClasses = "p-4";

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-background">
      {/* BACKGROUND HIGHLIGHTS */}
      <div
        ref={highlightRef}
        className={clsx(
          "absolute inset-0 pointer-events-none text-transparent overflow-hidden select-none",
          paddingClasses,
          typographyClasses
        )}
        aria-hidden="true"
      >
        {tokens.map((token) => {
          const isHovered = token.id === hoveredId;
          const isSelected = token.id === selectedId;

          let highlightClass = "";
          if (isSelected) {
            highlightClass =
              "bg-blue-500/40 ring-2 ring-blue-500/40 rounded-[2px] z-20";
          } else if (isHovered) {
            highlightClass =
              "bg-yellow-500/30 ring-2 ring-yellow-500/30 rounded-[2px] z-10";
          } else if (token.type === "ansi") {
            highlightClass = "bg-secondary/50 rounded-[2px]";
          }

          return (
            <span
              key={token.id}
              data-token-id={token.id}
              className={clsx(
                "transition-colors duration-75 pointer-events-auto",
                highlightClass
              )}
            >
              {token.raw}
            </span>
          );
        })}
        {input.endsWith("\n") && <br />}
      </div>

      {/* FOREGROUND INPUT */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          id="ansi-editor"
          name="ansi-input"
          aria-label="Raw ANSI Input String"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onScroll={handleScroll}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClickSelect}
          className={clsx(
            "absolute inset-0 block w-full h-full bg-transparent text-foreground focus:outline-none resize-none z-10 overflow-auto scrollbar-thin scrollbar-thumb-border",
            paddingClasses,
            typographyClasses
          )}
          spellCheck={false}
          placeholder="Paste your ANSI string here..."
          autoComplete="off"
          autoCapitalize="off"
        />
      ) : (
        // READ MODE DIV (Mobile Only)
        <div
          onScroll={handleScroll}
          onClick={handleReadModeClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={clsx(
            "absolute inset-0 block w-full h-full z-10 overflow-auto scrollbar-thin scrollbar-thumb-border",
            "text-foreground cursor-default bg-transparent", // VISIBLE TEXT
            paddingClasses,
            typographyClasses
          )}
        >
          {input}
        </div>
      )}
    </div>
  );
}
