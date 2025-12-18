"use client";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const timer = setTimeout(() => {
      setShouldRender(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed inset-0 z-100 flex flex-col items-center justify-center 
        bg-background transition-opacity duration-700 ease-out
        ${mounted ? "opacity-0 pointer-events-none" : "opacity-100"}
      `}
    >
      <div className="flex flex-col items-center gap-6">
        {/* LOGO ANIMATION */}
        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            ANSI
            <span className="text-primary bg-primary/10 px-2 rounded-md border border-primary/20">
              101
            </span>
          </h1>
          {/* A subtle glow effect behind the logo */}
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10 animate-pulse" />
        </div>

        {/* LOADING BAR */}
        <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-[loading_1s_ease-in-out_infinite]" />
        </div>

        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest animate-pulse">
          Initializing Parser...
        </p>
      </div>

      {/* Custom keyframe for the sliding bar */}
      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
