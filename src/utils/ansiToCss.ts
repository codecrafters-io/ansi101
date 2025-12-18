export interface TerminalState {
  fgStyle: string | null;
  bgStyle: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  dim: boolean;
  strikethrough: boolean;
}

export const INITIAL_STATE: TerminalState = {
  fgStyle: null,
  bgStyle: null,
  bold: false,
  italic: false,
  underline: false,
  dim: false,
  strikethrough: false,
};

// Standard ANSI Palette (matches standard terminal colors)
const PALETTE_ANSI = [
  "#000000",
  "#cd3131",
  "#0dbc79",
  "#e5e510",
  "#2472c8",
  "#bc3fbc",
  "#11a8cd",
  "#e5e5e5",
  "#666666",
  "#f14c4c",
  "#23d18b",
  "#f5f543",
  "#3b8eea",
  "#d670d6",
  "#29b8db",
  "#ffffff",
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

  // 232-255: Grayscale
  const gray = (index - 232) * 10 + 8;
  return `rgb(${gray}, ${gray}, ${gray})`;
}

export function updateState(
  currentState: TerminalState,
  params: number[]
): TerminalState {
  const newState = { ...currentState };

  for (let i = 0; i < params.length; i++) {
    const code = params[i];

    if (code === 0) return { ...INITIAL_STATE };

    // Styles
    if (code === 1) newState.bold = true;
    if (code === 2) newState.dim = true;
    if (code === 3) newState.italic = true;
    if (code === 4) newState.underline = true;
    if (code === 9) newState.strikethrough = true;
    if (code === 22) {
      newState.bold = false;
      newState.dim = false;
    }
    if (code === 23) newState.italic = false;
    if (code === 24) newState.underline = false;
    if (code === 29) newState.strikethrough = false;

    // Standard Foreground (30-37)
    if (code >= 30 && code <= 37) newState.fgStyle = PALETTE_ANSI[code - 30];
    // Standard Background (40-47)
    if (code >= 40 && code <= 47) newState.bgStyle = PALETTE_ANSI[code - 40];

    // Bright Foreground (90-97)
    if (code >= 90 && code <= 97)
      newState.fgStyle = PALETTE_ANSI[code - 90 + 8];
    // Bright Background (100-107)
    if (code >= 100 && code <= 107)
      newState.bgStyle = PALETTE_ANSI[code - 100 + 8];

    // Reset Colors
    if (code === 39) newState.fgStyle = null; // Default FG
    if (code === 49) newState.bgStyle = null; // Default BG

    // Extended Colors (38/48)
    if (code === 38 || code === 48) {
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
  }
  return newState;
}

export function getStyleObject(state: TerminalState): React.CSSProperties {
  return {
    color: state.fgStyle || undefined,
    backgroundColor: state.bgStyle || undefined,
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
  };
}
