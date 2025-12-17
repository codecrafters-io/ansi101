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
