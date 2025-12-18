import { useRef } from "react";
import { AnsiToken } from "@/types/ansi";

interface InputEditorProps {
  input: string;
  setInput: (val: string) => void;
  tokens: AnsiToken[];
  hoveredId: string | null;
}

export default function InputEditor({
  input,
  setInput,
  tokens,
  hoveredId,
}: InputEditorProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const sharedClasses =
    "absolute inset-0 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all border-0 m-0";

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-background font-mono text-sm">
      {/* BACKDROP */}
      <div
        ref={backdropRef}
        className={`${sharedClasses} pointer-events-none overflow-hidden select-none`}
        aria-hidden="true"
      >
        {tokens.map((token) => (
          <span
            key={token.id}
            className={`${
              token.id === hoveredId
                ? "bg-highlight/40 text-transparent"
                : "text-transparent"
            }`}
          >
            {token.raw}
          </span>
        ))}
        {input.endsWith("\n") && <br />}
      </div>

      <textarea
        id="ansi-editor"
        name="ansi-input"
        aria-label="Raw ANSI Input String"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onScroll={handleScroll}
        className={`${sharedClasses} bg-transparent focus:outline-none resize-none text-foreground z-10 block w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-border`}
        spellCheck={false}
        placeholder="Paste your ANSI string here..."
        autoComplete="off"
        autoCapitalize="off"
      />
    </div>
  );
}
