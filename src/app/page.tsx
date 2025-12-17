"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { parseAnsi } from "@/utils/ansiParser";
import { AnsiToken } from "@/types/ansi";
import ExplanationSidebar from "@/components/ExplanationSidebar";
import TerminalOutput from "@/components/TerminalOutput";
import InputEditor from "@/components/InputEditor";
import ThemeToggle from "@/components/ThemeToggle";
import { Menu, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

const DEFAULT_INPUT =
  "Basic: \\x1b[31;1mRed Bold\\x1b[0m\nRGB: \\x1b[38;2;255;100;200mPink Custom\\x1b[0m\n256: \\x1b[38;5;82mBright Green\\x1b[0m\nCursor: \\x1b[5A (Move Up 5)\n\\033[31mR\\033[33mA\\033[32mI\\033[34mN\\033[35mB\\033[36mO\\033[31mW\\033[0m";

const MIN_SIDEBAR_WIDTH = 250;
const MAX_SIDEBAR_WIDTH = 800;

export default function Home() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [tokens, setTokens] = useState<AnsiToken[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        // Calculate new width: Total Window Width - Mouse X Position
        const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;

        if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    const queryParam = searchParams.get("q") || searchParams.get("input");

    if (queryParam) {
      setInput(queryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  useEffect(() => {
    setTokens(parseAnsi(input));
  }, [input]);

  return (
    <main
      className={`h-[100dvh] w-screen bg-background flex flex-col overflow-hidden text-foreground font-sans transition-colors duration-300 relative ${
        isResizing ? "cursor-col-resize select-none" : ""
      }`}
    >
      {/* HEADER */}
      <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/80 backdrop-blur-sm z-40 relative">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-xl tracking-tight flex items-center gap-1">
            ANSI
            <span className="text-primary bg-primary/10 px-1 rounded border border-primary/20">
              101
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs font-medium text-muted-foreground">
            ANSI Escape Sequence Debugger
          </span>
          <div className="hidden sm:block h-4 w-px bg-border"></div>
          <ThemeToggle />

          {/* BURGER MENU */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 -mr-2 text-muted-foreground hover:bg-muted rounded-md active:scale-95 transition-all"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT COLUMN: Input & Preview */}
        <div className="flex-1 flex flex-col min-w-0 bg-secondary/5">
          {/* Top: Input Area */}
          <div className="flex-1 flex flex-col border-b border-border relative min-h-[50%] lg:min-h-[300px]">
            <div className="bg-muted/50 px-4 py-2 text-xs font-bold text-muted-foreground uppercase z-20 border-b border-border flex items-center justify-between">
              <span>Input String</span>
              <span className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                RAW
              </span>
            </div>

            <div className="flex-1 relative bg-background">
              <InputEditor
                input={input}
                setInput={setInput}
                tokens={tokens}
                hoveredId={hoveredId}
              />
            </div>
          </div>

          {/* Bottom: Preview Area */}
          <div className="h-1/2 lg:h-1/3 flex flex-col border-t border-border bg-background">
            <div className="bg-muted/50 px-4 py-2 text-xs font-bold text-muted-foreground uppercase flex justify-between items-center border-b border-border">
              <span>Output Preview</span>
              <span className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                TERMINAL VIEW
              </span>
            </div>

            <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-zinc-800 bg-black">
              <TerminalOutput tokens={tokens} hoveredId={hoveredId} />
            </div>
          </div>
        </div>

        {/* Cover UI When Resizing */}
        {isResizing && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-full h-full z-40" />
        )}

        {/* RIGHT COLUMN: Sidebar */}
        <div
          ref={sidebarRef}
          style={
            {
              "--sidebar-width": `${sidebarWidth}px`,
            } as React.CSSProperties
          }
          className={`
            /* BASE WIDTH */
            w-full
            
            /* DESKTOP WIDTH */
            lg:w-[var(--sidebar-width)]
            
            bg-card border-l border-border 
            flex flex-col
            transition-transform duration-300 ease-in-out
            shrink-0
            
            /* MOBILE DRAWER BEHAVIOR */
            ${
              isSidebarOpen
                ? "fixed inset-0 z-50 top-14 translate-x-0" // Open: Cover screen
                : "fixed inset-0 z-50 top-14 translate-x-full lg:translate-x-0 lg:static" // Closed: Off-screen OR Desktop Static
            }
        `}
        >
          {/* DRAG HANDLE (Desktop Only) */}
          <div
            className={`hidden lg:block absolute left-0 top-0 bottom-0 w-1 -ml-[3px] cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-50 ${
              isResizing ? "bg-primary" : "bg-transparent"
            }`}
            onMouseDown={startResizing}
          />
          {/* Cover UI When Resizing */}
          {isResizing && (
            <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-full h-full z-40" />
          )}
          <ExplanationSidebar
            tokens={tokens}
            onHoverChange={setHoveredId}
            hoveredId={hoveredId}
          />
        </div>
      </div>
    </main>
  );
}
