import { TerminalState } from "@/types/ansi";

export const INITIAL_STATE: TerminalState = {
  fgStyle: null,
  bgStyle: null,
  bold: false,
  italic: false,
  underline: false,
  dim: false,
  strikethrough: false,
  hidden: false,
  inverse: false,
};

const PALETTE_ANSI = [
  // Standard (0-7)
  "#000000", // Black
  "#cd3131", // Red
  "#0dbc79", // Green
  "#e5e510", // Yellow
  "#2472c8", // Blue
  "#bc3fbc", // Magenta
  "#11a8cd", // Cyan
  "#e5e5e5", // White

  // Bright (8-15) - Much more distinct now
  "#666666", // Bright Black (Gray)
  "#f14c4c", // Bright Red
  "#23d18b", // Bright Green
  "#f5f543", // Bright Yellow
  "#3b8eea", // Bright Blue
  "#d670d6", // Bright Magenta
  "#29b8db", // Bright Cyan
  "#ffffff", // Bright White
];

// Helper to get color from 256-color mode
function get256Color(index: number): string {
  // 0-15: Standard/Bright
  if (index < 16) return PALETTE_ANSI[index];

  // 16-231: 6x6x6 RGB Cube
  if (index < 232) {
    let i = index - 16;
    const b = (i % 6) * 51;
    i = Math.floor(i / 6);
    const g = (i % 6) * 51;
    i = Math.floor(i / 6);
    const r = i * 51;
    return `rgb(${r}, ${g}, ${b})`;
  }

  // 232-255: Grayscale Ramp
  const gray = (index - 232) * 10 + 8;
  return `rgb(${gray}, ${gray}, ${gray})`;
}

export function updateState(
  currentState: TerminalState,
  params: number[]
): TerminalState {
  const newState = { ...currentState };

  // Use a while loop to handle variable-length arguments (like 38;2;r;g;b)
  let i = 0;
  while (i < params.length) {
    const code = params[i];

    if (code === 0) return { ...INITIAL_STATE };
    // Styles
    else if (code === 1) newState.bold = true;
    else if (code === 2) newState.dim = true;
    else if (code === 3) newState.italic = true;
    else if (code === 4) newState.underline = true;
    else if (code === 7) newState.inverse = true; // Added Inverse
    else if (code === 8) newState.hidden = true; // Added Hidden
    else if (code === 9) newState.strikethrough = true;
    // Reset Styles
    else if (code === 22) {
      newState.bold = false;
      newState.dim = false;
    } else if (code === 23) newState.italic = false;
    else if (code === 24) newState.underline = false;
    else if (code === 27) newState.inverse = false;
    else if (code === 28) newState.hidden = false;
    else if (code === 29) newState.strikethrough = false;
    // Standard Foreground (30-37)
    else if (code >= 30 && code <= 37)
      newState.fgStyle = PALETTE_ANSI[code - 30];
    // Standard Background (40-47)
    else if (code >= 40 && code <= 47)
      newState.bgStyle = PALETTE_ANSI[code - 40];
    // Bright Foreground (90-97)
    else if (code >= 90 && code <= 97)
      newState.fgStyle = PALETTE_ANSI[code - 90 + 8];
    // Bright Background (100-107)
    else if (code >= 100 && code <= 107)
      newState.bgStyle = PALETTE_ANSI[code - 100 + 8];
    // Reset Colors
    else if (code === 39) newState.fgStyle = null; // Default FG
    else if (code === 49) newState.bgStyle = null; // Default BG
    // Extended Colors (38/48)
    else if (code === 38 || code === 48) {
      const isBg = code === 48;
      const type = params[i + 1];

      if (type === 5) {
        // 256
        const colorIndex = params[i + 2];
        if (colorIndex !== undefined) {
          const color = get256Color(colorIndex);
          if (isBg) newState.bgStyle = color;
          else newState.fgStyle = color;
          i += 2; // skip params
        }
      } else if (type === 2) {
        // RGB
        const r = params[i + 2];
        const g = params[i + 3];
        const b = params[i + 4];
        if (b !== undefined) {
          const color = `rgb(${r},${g},${b})`;
          if (isBg) newState.bgStyle = color;
          else newState.fgStyle = color;
          i += 4; // skip params
        }
      }
    }

    i++;
  }
  return newState;
}

export function getStyleObject(state: TerminalState): React.CSSProperties {
  const style: React.CSSProperties = {
    fontWeight: state.bold ? "bold" : "normal",
    fontStyle: state.italic ? "italic" : "normal",
    textDecoration:
      [
        state.underline ? "underline" : "",
        state.strikethrough ? "line-through" : "",
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    opacity: state.dim ? 0.6 : 1,
    visibility: state.hidden ? "hidden" : "visible",
  };

  // Handle Inverse Video (Swap FG and BG)
  if (state.inverse) {
    // If no color is set, assume default terminal colors (White on Black)
    const defaultFg = "#e5e5e5";
    const defaultBg = "transparent";

    style.color = state.bgStyle || defaultBg;
    style.backgroundColor = state.fgStyle || defaultFg;
  } else {
    style.color = state.fgStyle || undefined;
    style.backgroundColor = state.bgStyle || undefined;
  }

  return style;
}
