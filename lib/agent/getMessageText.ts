export function getMessageText(m: {
  parts: Array<{ type: string; text?: string }>;
}): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
