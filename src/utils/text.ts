export function capitalizeName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        ? `${word.charAt(0).toLocaleUpperCase("pt-BR")}${word.slice(1)}`
        : word,
    )
    .join(" ");
}
