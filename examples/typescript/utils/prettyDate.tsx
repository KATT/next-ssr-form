export function prettyDate(str: string) {
  const date = new Date(str);

  return (
    date.toLocaleDateString("sv-SE") +
    " " +
    date.toLocaleTimeString("sv-SE").substr(0, 5)
  );
}
