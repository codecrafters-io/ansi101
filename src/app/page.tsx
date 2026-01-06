"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { Menu, X, HelpCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { parseAnsi } from "@/utils/ansiParser";
import { AnsiToken } from "@/types/ansi";
import ExplanationSidebar from "@/components/ExplanationSidebar";
import TerminalOutput from "@/components/TerminalOutput";
import InputEditor from "@/components/InputEditor";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingScreen from "@/components/LoadingScreen";
import InfoModal from "@/components/InfoModal";

const DEFAULT_INPUT =
  "Basic: \\x1b[31;1mRed Bold\\x1b[0m\nRGB: \\x1b[38;2;255;100;200mPink Custom\\x1b[0m\n256: \\x1b[38;5;82mBright Green\\x1b[0m";

const MIN_SIDEBAR_WIDTH = 250;
const MAX_SIDEBAR_WIDTH = 800;

function ANSIWorkspace() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [tokens, setTokens] = useState<AnsiToken[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

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
      className={`h-dvh w-screen bg-background flex flex-col overflow-hidden text-foreground font-sans transition-colors duration-300 relative ${
        isResizing ? "cursor-col-resize select-none" : ""
      }`}
    >
      <LoadingScreen />
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      {/* HEADER */}
      <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/80 backdrop-blur-sm z-40 relative">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-xl tracking-tight flex items-center gap-1">
            ANSI
            <span className="text-primary bg-primary/10 px-1 rounded border border-primary/20">
              101
            </span>
          </h1>

          <button
            onClick={() => setIsInfoOpen(true)}
            className="cursor-pointer ml-1 text-muted-foreground hover:text-primary transition-colors"
            aria-label="About ANSI101"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
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
            aria-label={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            aria-expanded={isSidebarOpen}
            aria-controls="mobile-sidebar"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT COLUMN: Input & Preview */}
        <div className="flex-1 flex flex-col min-w-0 bg-secondary/5">
          {/* Top: Input Area */}
          <div className="flex-1 flex flex-col border-b border-border relative min-h-[50%] lg:min-h-75">
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

            <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-terminal-border bg-black">
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
          id="mobile-sidebar"
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
            lg:w-(--sidebar-width)
            
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
            className={`hidden lg:block absolute left-0 top-0 bottom-0 w-1 -ml-0.75 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-50 ${
              isResizing ? "bg-primary" : "bg-transparent"
            }`}
            onMouseDown={startResizing}
          />
          {/* Cover Sidebar When Resizing */}
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

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-background flex flex-col items-center justify-center gap-6">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            ANSI
            <span className="text-primary bg-primary/10 px-2 rounded-md border border-primary/20">
              101
            </span>
          </h1>
          <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden" />
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest animate-pulse">
            Initializing Parser...
          </p>
        </div>
      }
    >
      <ANSIWorkspace />
    </Suspense>
  );
}
