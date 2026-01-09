import { AnsiTokenPart } from "@/types/ansi";

const getForegroundColorDescription = (code: number): string => {
  const BASIC_COLORS: Record<number, string> = {
    30: "Black",
    31: "Red",
    32: "Green",
    33: "Yellow",
    34: "Blue",
    35: "Magenta",
    36: "Cyan",
    37: "White",
  };
  return `Set Foreground Color: ${BASIC_COLORS[code] || "Unknown"}`;
};

const getBackgroundColorDescription = (code: number): string => {
  const BASIC_COLORS: Record<number, string> = {
    40: "Black",
    41: "Red",
    42: "Green",
    43: "Yellow",
    44: "Blue",
    45: "Magenta",
    46: "Cyan",
    47: "White",
  };
  return `Set Background Color: ${BASIC_COLORS[code] || "Unknown"}`;
};

const getForegroundBrightDescription = (code: number): string => {
  const BRIGHT_COLORS: Record<number, string> = {
    90: "Bright Black (Gray)",
    91: "Bright Red",
    92: "Bright Green",
    93: "Bright Yellow",
    94: "Bright Blue",
    95: "Bright Magenta",
    96: "Bright Cyan",
    97: "Bright White",
  };
  return `Set Foreground Color: ${BRIGHT_COLORS[code] || "Unknown"}`;
};

const getBackgroundBrightDescription = (code: number): string => {
  const BRIGHT_COLORS: Record<number, string> = {
    100: "Bright Black (Gray)",
    101: "Bright Red",
    102: "Bright Green",
    103: "Bright Yellow",
    104: "Bright Blue",
    105: "Bright Magenta",
    106: "Bright Cyan",
    107: "Bright White",
  };
  return `Set Background Color: ${BRIGHT_COLORS[code] || "Unknown"}`;
};

export function generateAnsiBreakdown(
  fullMatch: string,
  command: string,
  params: number[],
  privateMode?: string
): AnsiTokenPart[] {
  const parts: AnsiTokenPart[] = [];

  // Prefix / ESC
  const csiIndex = fullMatch.indexOf("[");
  const prefix = fullMatch.substring(0, csiIndex);

  parts.push({
    label: "ESC",
    value: prefix,
    type: "marker",
    description:
      "Escape Character (ASCII 27 / Hex 1B). Signals the start of a sequence",
  });

  parts.push({
    label: "[",
    value: "[",
    type: "marker",
    description:
      "Control Sequence Introducer (CSI). Starts the command arguments",
  });

  if (privateMode) {
    parts.push({
      type: "marker",
      value: privateMode,
      label: "DEC",
      description: "DEC Private Mode Indicator",
    });
  }

  // Parameter Parsing
  let i = 0;
  while (i < params.length) {
    const code = params[i];

    // Add separator if this is not the very first param
    if (i > 0) {
      parts.push({
        type: "separator",
        value: ";",
        label: "Separator",
        description: "Parameter Separator",
      });
    }

    // EXTENDED COLORS (38 or 48)
    if (command === "m" && (code === 38 || code === 48)) {
      const isBg = code === 48;
      const type = params[i + 1]; // Look ahead to the type (5 or 2)

      // Push the Marker (38/48)
      parts.push({
        type: "param",
        value: code.toString(),
        label: "Param",
        description: `Extended ${
          isBg ? "Background" : "Foreground"
        } Color Marker`,
      });

      // Check next param: Type
      if (type === 5) {
        // 256 COLOR MODE (format: 38;5;ID)
        addSeparator(parts); // Separator between 38 and 5
        parts.push({
          type: "param",
          value: "5",
          label: "Param",
          description: "256-Color Mode Indicator",
        });

        const colorId = params[i + 2];
        if (colorId !== undefined) {
          addSeparator(parts); // Separator between 5 and ID
          parts.push({
            type: "param",
            value: colorId.toString(),
            label: "Param",
            description: `Color ID (${colorId}) from 256-color palette`,
          });
          i += 2; // Skip '5' and 'ID'
        } else {
          i += 1; // Skip just '5' (Malformed)
        }
      } else if (type === 2) {
        // RGB MODE (format: 38;2;R;G;B)
        addSeparator(parts); // Separator between 38 and 2
        parts.push({
          type: "param",
          value: "2",
          label: "Param",
          description: "TrueColor (RGB) Mode Indicator",
        });

        const r = params[i + 2];
        const g = params[i + 3];
        const b = params[i + 4];

        if (r !== undefined && g !== undefined && b !== undefined) {
          // Red
          addSeparator(parts);
          parts.push({
            type: "param",
            value: r.toString(),
            label: "Param",
            description: `Red Component (${r})`,
          });

          // Green
          addSeparator(parts);
          parts.push({
            type: "param",
            value: g.toString(),
            label: "Param",
            description: `Green Component (${g})`,
          });

          // Blue
          addSeparator(parts);
          parts.push({
            type: "param",
            value: b.toString(),
            label: "Param",
            description: `Blue Component (${b})`,
          });

          i += 4; // Skip '2', 'R', 'G', 'B'
        } else {
          i += 1; // Malformed RGB
        }
      }
    }
    // STANDARD CODES
    else {
      const desc = getStandardParamDescription(command, code, i, privateMode);
      const isError = desc.startsWith("Unknown");

      parts.push({
        type: "param",
        value: code.toString(),
        label: "Param",
        description: desc,
        status: isError ? "error" : "valid",
      });
    }

    i++;
  }

  // Command Suffix
  parts.push({
    type: "cmd",
    value: command,
    label: "CMD",
    description: getCommandDescription(command, privateMode),
  });

  return parts;
}

function addSeparator(parts: AnsiTokenPart[]) {
  parts.push({
    type: "separator",
    value: ";",
    label: "Separator",
    description: "Parameter Separator",
  });
}

function getCommandDescription(cmd: string, privateMode?: string): string {
  if (cmd === "m")
    return "Select Graphic Rendition (SGR). Applies the color/style settings";
  if (privateMode === "?") {
    if (cmd === "h") return "Set Mode (DEC Private)";
    if (cmd === "l") return "Reset Mode (DEC Private)";
  }
  if (cmd === "A") return "Cursor Up";
  if (cmd === "B") return "Cursor Down";
  if (cmd === "C") return "Cursor Forward";
  if (cmd === "D") return "Cursor Back";
  if (cmd === "H" || cmd === "f") return "Cursor Position";
  if (cmd === "J") return "Erase in Display";
  if (cmd === "K") return "Erase in Line";
  return "Command Letter";
}

// Simplified Standard Description
function getStandardParamDescription(
  cmd: string,
  param: number,
  index: number,
  privateMode?: string
): string {
  if (cmd === "m") {
    if (param === 0) return "Reset / Normal (Clears all styles)";
    if (param === 1) return "Bold / Increased Intensity";
    if (param === 2) return "Faint / Dim";
    if (param === 3) return "Italic";
    if (param === 4) return "Underline";
    if (param === 5) return "Slow Blink";
    if (param === 7) return "Reverse Video (Invert)";
    if (param === 8) return "Conceal / Hidden";
    if (param === 9) return "Crossed-out / Strikethrough";

    if (param >= 30 && param <= 37) return getForegroundColorDescription(param);
    if (param >= 40 && param <= 47) return getBackgroundColorDescription(param);
    if (param >= 90 && param <= 97)
      return getForegroundBrightDescription(param);
    if (param >= 100 && param <= 107)
      return getBackgroundBrightDescription(param);

    return "Unknown Style Code. This will be ignored by the terminal";
  }

  if (privateMode === "?" && (cmd === "h" || cmd === "l")) {
    if (param === 25) return "Cursor Visibility ID";
    if (param === 1049) return "Alternate Screen Buffer ID";
    if (param === 2004) return "Bracketed Paste ID";
  }

  if (cmd === "H" || cmd === "f") {
    return index === 0 ? "Row (Line)" : "Column";
  }

  return "Parameter Value";
}
