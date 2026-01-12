"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { Edit3, Eye, HelpCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

import { parseAnsi } from "@/utils/ansiParser";
import { AnsiToken } from "@/types/ansi";
import ExplanationSidebar from "@/components/ExplanationSidebar";
import TerminalOutput from "@/components/TerminalOutput";
import InputEditor from "@/components/InputEditor";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingScreen from "@/components/LoadingScreen";
import InfoModal from "@/components/InfoModal";

const DEFAULT_INPUT = "Hello \\x1b[32;1mWorld\\x1b[0m";

const MIN_SIDEBAR_WIDTH = 400;
const MAX_SIDEBAR_WIDTH = 1200;

function ANSIWorkspace() {
  const searchParams = useSearchParams();

  const getInitialData = () => {
    const urlInput = searchParams.get("q") || searchParams.get("input");
    const rawInput = urlInput || DEFAULT_INPUT;

    const t = parseAnsi(rawInput);

    const firstAnsi = t.find((x) => x.type === "ansi");
    const s = firstAnsi ? firstAnsi.id : t[0]?.id || null;

    return { input: rawInput, tokens: t, selectedId: s };
  };

  const [initialData] = useState(getInitialData());
  const [input, setInput] = useState(initialData.input);
  const [tokens, setTokens] = useState<AnsiToken[]>(initialData.tokens);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialData.selectedId
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);

  const [sidebarWidth, setSidebarWidth] = useState(600);
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
    const data = getInitialData();
    setInput(data.input);
    setTokens(data.tokens);
    setSelectedId(data.selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const optimizeSidebarWidth = () => {
      const width = window.innerWidth;

      if (width >= 1024) {
        const targetRatio = 0.45;
        const idealWidth = width * targetRatio;

        const finalWidth = Math.min(
          Math.max(idealWidth, MIN_SIDEBAR_WIDTH),
          MAX_SIDEBAR_WIDTH
        );

        setSidebarWidth(finalWidth);
      }
    };

    optimizeSidebarWidth();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setIsEditing(isDesktop);
      setIsDesktop(isDesktop);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

    if (!input) {
      setSelectedId(null);
    }
  }, [input]);

  return (
    <main
      className={clsx(
        "h-dvh w-screen bg-background flex flex-col overflow-hidden text-foreground font-sans transition-colors duration-300 relative",
        isResizing && "cursor-col-resize select-none"
      )}
    >
      <LoadingScreen />
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      {/* HEADER */}
      <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/80 backdrop-blur-sm z-40 relative">
        <div className="flex items-center gap-2">
          <Link href="/">
            <h1 className="font-bold text-xl tracking-tight flex items-center gap-1">
              ANSI
              <span className="text-primary bg-primary/10 px-1 rounded border border-primary/20">
                101
              </span>
            </h1>
          </Link>

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
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT COLUMN */}
        <div className="contents lg:flex lg:flex-col lg:flex-1 lg:min-w-0 lg:bg-secondary/5">
          {/* Input Area */}
          <div className="order-1 shrink-0 h-37.5 lg:h-auto lg:flex-1 flex flex-col border-b border-border relative z-20 min-h-0">
            <div className="bg-muted/50 px-4 py-2 text-xs font-bold text-muted-foreground uppercase z-20 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span>Input String</span>
                {isDesktop && (
                  <span className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                    RAW
                  </span>
                )}
                {!isDesktop && (
                  <span
                    className={clsx(
                      "text-[10px] border px-1.5 py-0.5 rounded font-medium transition-colors",
                      isEditing
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    )}
                  >
                    {isEditing ? "EDITING" : "VIEWING"}
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="lg:hidden flex items-center gap-1.5 text-[10px] ios:text-xs bg-background border border-border px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {isEditing ? (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Done</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 relative bg-background">
              <InputEditor
                input={input}
                setInput={setInput}
                tokens={tokens}
                hoveredId={hoveredId}
                onHoverChange={setHoveredId}
                selectedId={selectedId}
                onSelect={setSelectedId}
                isEditing={isEditing}
              />
            </div>
          </div>

          {/* Preview Area */}
          <div className="order-2 shrink-0 h-37.5 lg:h-2/5 flex flex-col border-t border-border bg-background">
            <div className="bg-muted/50 px-4 py-2 text-xs ios:text-sm font-bold text-muted-foreground uppercase flex justify-between items-center border-b border-border shrink-0">
              <span>Output Preview</span>
              <span className="text-[10px] ios:text-xs bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                TERMINAL VIEW
              </span>
            </div>

            <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-terminal-border bg-black">
              <TerminalOutput
                tokens={tokens}
                hoveredId={hoveredId}
                onHoverChange={setHoveredId}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </div>
        </div>

        {/* Cover UI When Resizing (Desktop) */}
        {isResizing && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-full h-full z-40 cursor-col-resize" />
        )}

        {/* RIGHT COLUMN: Sidebar */}
        <div
          id="mobile-sidebar"
          ref={sidebarRef}
          style={
            { "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties
          }
          className={clsx(
            "order-2 lg:order-0",
            "w-full lg:w-(--sidebar-width)",
            "flex-1 lg:flex-none",
            "bg-card border-b lg:border-b-0 lg:border-l border-border flex flex-col shrink-0 min-h-0"
          )}
        >
          {/* DRAG HANDLE (Desktop Only) */}
          <div
            className={clsx(
              "hidden lg:block absolute top-0 bottom-0 w-1 -ml-0.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-50",
              isResizing ? "bg-primary" : "bg-transparent"
            )}
            onMouseDown={startResizing}
          />

          <ExplanationSidebar
            tokens={tokens}
            onHoverChange={setHoveredId}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onSelect={setSelectedId}
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
