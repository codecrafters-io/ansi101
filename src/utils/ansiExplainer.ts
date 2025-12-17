import { AnsiTokenPart } from "@/types/ansi";

const PARAM_DESCRIPTIONS: Record<number, string> = {
  0: "Reset / Normal (Clears all styles)",
  1: "Bold / Increased Intensity",
  31: "Set Foreground Color: Red",
  32: "Set Foreground Color: Green",
};

export function generateAnsiBreakdown(
  fullMatch: string,
  command: string,
  params: number[],
  privateMode?: string
): AnsiTokenPart[] {
  const parts: AnsiTokenPart[] = [];

  const csiIndex = fullMatch.indexOf("[");
  const prefix = fullMatch.substring(0, csiIndex);

  // 1. The Escape Sequence Header (e.g \x1b[)
  parts.push({
    label: "ESC",
    value: prefix,
    type: "marker",
    description:
      "Escape Character (ASCII 27 / Hex 1B). Signals the start of a sequence.",
  });

  parts.push({
    label: "[",
    value: "[",
    type: "marker",
    description:
      "Control Sequence Introducer (CSI). Starts the command arguments.",
  });

  if (privateMode) {
    parts.push({
      type: "marker", // It's a marker, similar to [
      value: privateMode,
      label: "DEC",
      description: "DEC Private Mode Indicator.",
    });
  }

  // 2. The Parameters
  params.forEach((param, index) => {
    // Add the Separator if it's not the first param
    if (index > 0) {
      parts.push({
        label: ";",
        value: ";",
        type: "separator",
        description: "Parameter Separator.",
      });
    }

    // Add the Parameter
    let desc = PARAM_DESCRIPTIONS[param];

    // Dynamic descriptions for ranges
    if (!desc) {
      if (param >= 30 && param <= 37)
        desc = `Set Foreground Color (ANSI Standard)`;
      else if (param >= 40 && param <= 47)
        desc = `Set Background Color (ANSI Standard)`;
      else if (param === 38 || param === 48)
        desc = `Extended Color Mode Initiator`;
      else desc = `Parameter Value ${param}`;
    }

    parts.push({
      label: String(param),
      value: String(param),
      type: "param",
      description: desc,
    });
  });

  // 3. The Command Letter
  let cmdDesc = "Unknown Command";
  if (command === "m")
    cmdDesc =
      "Select Graphic Rendition (SGR). Applies the color/style settings.";
  if (command === "A") cmdDesc = "Cursor Up.";
  if (command === "H") cmdDesc = "Cursor Position.";
  if (command === "J") cmdDesc = "Erase in Display.";

  parts.push({
    label: command,
    value: command,
    type: "cmd",
    description: `Command Letter: ${cmdDesc}`,
  });

  return parts;
}
