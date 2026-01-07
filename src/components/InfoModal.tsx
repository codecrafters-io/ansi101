"use client";

import clsx from "clsx";
import { X, Github, Globe } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: Props) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRendered(true);

      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);

      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-100 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out",
        isVisible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/90" onClick={onClose} />
      {/* Modal */}
      <div
        className={clsx(
          "relative bg-card border border-border rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold flex items-center gap-2">
            About
            <span className="text-primary bg-primary/10 px-1.5 rounded border border-primary/20 text-sm">
              ANSI101
            </span>
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              What is this?
            </h3>
            <p>
              ANSI101 is a visual debugger for ANSI escape sequences. It helps
              developers parse, understand, and troubleshoot the ANSI codes that
              power terminal colors, cursor movements, and rich text interfaces.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground font-semibold">Key Features</h3>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Real-time parsing of CSI sequences and SGR codes.</li>
              <li>Full support for 256-color and TrueColor (RGB).</li>
              <li>Deep linking support (share your strings via URL).</li>
              <li>Bidirectional highlighting.</li>
              <li>Detailed timeline breakdown of every parameter.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">
                Created by
              </span>
              <span className="text-xs">CodeCrafters, Inc.</span>
            </div>

            <div className="flex gap-3">
              <a
                href="https://github.com/codecrafters-io"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://codecrafters.io"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
