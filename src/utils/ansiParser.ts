import { AnsiCategory, AnsiToken } from "@/types/ansi";
import { generateAnsiBreakdown } from "./ansiExplainer";

// PREFIXES: Matches literal "\x1b", "\e", "\u001b", "\033" OR the actual ESC char
// CSI: Matches the "[" bracket
// PRIVATE MODE: Matches an optional "?" (common in cursor commands)
// PARAMS: Matches numbers and semi-colons
// COMMAND: Matches a letter OR a tilde "~" (used for special keys like Insert/Delete)
const ANSI_REGEX =
  /((?:\\x1b|\\e|\\u001b|\\033|\u001b)\[(\??)([0-9;]*)([a-zA-Z~]))/g;

export function parseAnsi(input: string): AnsiToken[] {
  const tokens: AnsiToken[] = [];
  let lastIndex = 0;
  let match;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  while ((match = ANSI_REGEX.exec(input)) !== null) {
    const [fullMatch, _prefix, privateMode, paramsRaw, command] = match;
    const index = match.index;

    if (index > lastIndex) {
      tokens.push({
        id: generateId(),
        type: "text",
        raw: input.slice(lastIndex, index),
        start: lastIndex,
        end: index,
        summary: "Literal Text",
      });
    }

    const params = paramsRaw
      ? paramsRaw.split(";").map((p) => (p === "" ? 0 : parseInt(p, 10)))
      : [];

    if (command === "m" && params.length === 0) params.push(0);

    const { category, description } = analyzeSequence(command, params);

    const parts = generateAnsiBreakdown(
      fullMatch,
      command,
      params,
      privateMode
    );

    tokens.push({
      id: generateId(),
      type: "ansi",
      raw: fullMatch,
      start: index,
      end: index + fullMatch.length,
      command,
      params,
      category,
      summary: description,
      parts: parts,
    });

    lastIndex = index + fullMatch.length;
  }

  // Text After
  if (lastIndex < input.length) {
    tokens.push({
      id: generateId(),
      type: "text",
      raw: input.slice(lastIndex),
      start: lastIndex,
      end: input.length,
      summary: "Literal Text",
    });
  }

  return tokens;
}

function analyzeSequence(
  command: string,
  params: number[]
): { category: AnsiCategory; description: string } {
  // Handle Special Keys (ends in ~)
  if (command === "~") {
    const code = params[0];
    if (code === 1) return { category: "unknown", description: "Home Key" };
    if (code === 2) return { category: "unknown", description: "Insert Key" };
    if (code === 3) return { category: "unknown", description: "Delete Key" };
    if (code === 4) return { category: "unknown", description: "End Key" };
    if (code === 5) return { category: "movement", description: "Page Up" };
    if (code === 6) return { category: "movement", description: "Page Down" };
    return { category: "unknown", description: `Special Key Code (~${code})` };
  }

  // Handle Private Modes (h = Set Mode, l = Reset Mode)
  if (command === "h" || command === "l") {
    const mode = params[0];
    const action = command === "h" ? "Set" : "Reset";

    if (mode === 25)
      return {
        category: "style",
        description: `${action} Visible Cursor (Show/Hide)`,
      };
    if (mode === 1049)
      return {
        category: "movement",
        description: `${action} Alternative Screen Buffer`,
      };
    if (mode === 2004)
      return {
        category: "style",
        description: `${action} Bracketed Paste Mode`,
      };

    return {
      category: "unknown",
      description: `${action} Mode (Private: ${mode})`,
    };
  }

  // Cursor / Erase Commands (Non-SGR)
  if (command !== "m") {
    switch (command) {
      case "A":
        return {
          category: "movement",
          description: `Cursor Up (${params[0] || 1})`,
        };
      case "B":
        return {
          category: "movement",
          description: `Cursor Down (${params[0] || 1})`,
        };
      case "C":
        return {
          category: "movement",
          description: `Cursor Forward (${params[0] || 1})`,
        };
      case "D":
        return {
          category: "movement",
          description: `Cursor Back (${params[0] || 1})`,
        };
      case "E":
        return {
          category: "movement",
          description: `Cursor Next Line (${params[0] || 1})`,
        };
      case "F":
        return {
          category: "movement",
          description: `Cursor Prev Line (${params[0] || 1})`,
        };
      case "G":
        return {
          category: "movement",
          description: `Cursor Column Absolute (${params[0] || 1})`,
        };
      case "H":
      case "f":
        return {
          category: "movement",
          description: `Cursor Position (Row: ${params[0] || 1}, Col: ${
            params[1] || 1
          })`,
        };
      case "J":
        return {
          category: "erase",
          description: getEraseDescription(params[0] || 0, "Screen"),
        };
      case "K":
        return {
          category: "erase",
          description: getEraseDescription(params[0] || 0, "Line"),
        };
      default:
        return {
          category: "unknown",
          description: `Unknown Command (${command})`,
        };
    }
  }

  // SGR (Select Graphic Rendition) - The 'm' command
  const descriptions: string[] = [];
  let category: AnsiCategory = "style";

  for (let i = 0; i < params.length; i++) {
    const code = params[i];

    if (code === 38 || code === 48) {
      const isBg = code === 48;
      const type = params[i + 1];

      if (type === 5) {
        const colorId = params[i + 2];
        descriptions.push(
          `${
            isBg ? "Background" : "Foreground"
          } Color (256-Pallete ID: ${colorId})`
        );
        i += 2;
        category = "color";
      } else if (type === 2) {
        const r = params[i + 2];
        const g = params[i + 3];
        const b = params[i + 4];
        descriptions.push(
          `${isBg ? "Background" : "Foreground"} Color (RGB: ${r}, ${g}, ${b})`
        );
        i += 4;
        category = "color";
      } else {
        descriptions.push(`${isBg ? "Background" : "Foreground"} Extended`);
      }
      continue;
    }

    if (code === 0) {
      descriptions.push("Reset / Normal");
      category = "reset";
    } else if (code === 1) descriptions.push("Bold");
    else if (code === 2) descriptions.push("Dim");
    else if (code === 3) descriptions.push("Italic");
    else if (code === 4) descriptions.push("Underline");
    else if (code === 5) descriptions.push("Blink");
    else if (code === 7) descriptions.push("Reverse Video");
    else if (code === 8) descriptions.push("Hidden");
    else if (code === 9) descriptions.push("Strikethrough");
    else if (code >= 30 && code <= 37) {
      descriptions.push(`Foreground ${BASIC_COLORS[code - 30]}`);
      category = "color";
    } else if (code >= 40 && code <= 47) {
      descriptions.push(`Background ${BASIC_COLORS[code - 40]}`);
      category = "color";
    } else if (code >= 90 && code <= 97) {
      descriptions.push(`Foreground Bright ${BASIC_COLORS[code - 90]}`);
      category = "color";
    } else if (code >= 100 && code <= 107) {
      descriptions.push(`Background Bright ${BASIC_COLORS[code - 100]}`);
      category = "color";
    } else {
      descriptions.push(`Unknown Code (${code}) - Ignored by the terminal`);
    }
  }

  return {
    category,
    description: descriptions.join(", "),
  };
}

const BASIC_COLORS = [
  "Black",
  "Red",
  "Green",
  "Yellow",
  "Blue",
  "Magenta",
  "Cyan",
  "White",
];

function getEraseDescription(param: number, scope: "Screen" | "Line") {
  if (param === 0) return `Clear from Cursor to End of ${scope}`;
  if (param === 1) return `Clear from Start of ${scope} to Cursor`;
  if (param === 2) return `Clear Entire ${scope}`;
  return `Clear ${scope} (Unknown: ${param})`;
}
