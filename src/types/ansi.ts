export type TokenType = "text" | "ansi";

export type AnsiCategory =
  | "color"
  | "style"
  | "reset"
  | "movement"
  | "erase"
  | "unknown";

export interface AnsiTokenPart {
  label: string;
  value: string;
  description: string;
  type: "marker" | "param" | "cmd" | "separator";
}

export interface SequenceDescription {
  category: AnsiCategory;
  description: string;
}

export interface AnsiToken {
  id: string;
  type: TokenType;
  raw: string;
  start: number;
  end: number;
  command?: string;
  params?: number[];
  category?: "color" | "style" | "reset" | "movement" | "erase" | "unknown";
  summary: string;
  parts?: AnsiTokenPart[];
}

export interface TerminalState {
  fgStyle: string | null;
  bgStyle: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  dim: boolean;
  strikethrough: boolean;
  hidden: boolean;
  inverse: boolean;
}
