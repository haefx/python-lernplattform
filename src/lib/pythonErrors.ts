const PYTHON_EXCEPTION =
  /(SyntaxError|NameError|TypeError|IndentationError|TabError|ValueError|AttributeError|ZeroDivisionError|KeyError|IndexError|ModuleNotFoundError)/;

function findLastException(text: string): { type: string; detail: string } | null {
  const regex = new RegExp(`${PYTHON_EXCEPTION.source}:\\s*([^]*?)(?=\\s*File\\s|$)`, "gi");
  let last: { type: string; detail: string } | null = null;

  for (const match of text.matchAll(regex)) {
    const detail = match[2]?.replace(/\s+/g, " ").trim();
    if (detail) {
      last = { type: match[1], detail };
    }
  }

  return last;
}

function findUserLine(text: string): number | null {
  const match = text.match(/File "<exec>", line (\d+)/);
  return match ? Number(match[1]) : null;
}

function translateDetail(type: string, detail: string): string {
  const nameError = detail.match(
    /^name '([^']+)' is not defined\.?(?:\s*Did you mean:\s*'([^']+)')?/i,
  );
  if (type === "NameError" && nameError) {
    const [, name, suggestion] = nameError;
    if (suggestion) {
      return `'${name}' ist nicht definiert. Meintest du '${suggestion}'?`;
    }
    return `'${name}' ist nicht definiert.`;
  }

  const syntaxInvalid = detail.match(/^invalid syntax\.?(?:\s*\((.+)\))?/i);
  if (type === "SyntaxError" && syntaxInvalid) {
    const hint = syntaxInvalid[1];
    return hint ? `Ungültige Syntax (${hint}).` : "Ungültige Syntax.";
  }

  if (type === "IndentationError") {
    return detail.replace(/^unexpected indent/i, "Einrückung passt nicht.");
  }

  return detail;
}

const EXCEPTION_LABELS: Record<string, string> = {
  SyntaxError: "Syntaxfehler",
  NameError: "Unbekannter Name",
  TypeError: "Falscher Typ",
  IndentationError: "Einrückungsfehler",
  TabError: "Tab-Fehler",
  ValueError: "Ungültiger Wert",
  AttributeError: "Attribut fehlt",
  ZeroDivisionError: "Division durch null",
  KeyError: "Schlüssel fehlt",
  IndexError: "Index außerhalb",
  ModuleNotFoundError: "Modul fehlt",
};

/** Kurze, kindgerechte Fehlermeldung statt Pyodide-Traceback. */
export function formatPythonError(raw: unknown): string {
  const text = (raw instanceof Error ? raw.message : String(raw))
    .replace(/\r\n/g, "\n")
    .trim();

  if (!text) return "Dein Code hat einen Fehler.";

  if (!text.includes("Traceback") && !PYTHON_EXCEPTION.test(text)) {
    return text;
  }

  const line = findUserLine(text);
  const exception = findLastException(text);

  if (!exception) {
    return "Dein Code hat einen Fehler – schau nochmal auf Tippfehler und Einrückung.";
  }

  const label = EXCEPTION_LABELS[exception.type] ?? exception.type;
  const detail = translateDetail(exception.type, exception.detail);
  const linePrefix = line ? `Zeile ${line}: ` : "";

  return `${linePrefix}${label} – ${detail}`;
}
