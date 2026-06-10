import type { PyodideInterface } from "pyodide";
import { formatPythonError } from "./pythonErrors";

const PYODIDE_VERSION = "0.29.4";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise: Promise<PyodideInterface> | null = null;
let inputHookInstalled = false;

type LoadPyodideFn = (config?: { indexURL?: string }) => Promise<PyodideInterface>;

declare global {
  interface Window {
    loadPyodide?: LoadPyodideFn;
  }
}

function loadPyodideScript(): Promise<LoadPyodideFn> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Python läuft nur im Browser."));
  }

  if (window.loadPyodide) {
    return Promise.resolve(window.loadPyodide);
  }

  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-pyodide-runtime="true"]'
  );

  if (existing) {
    return new Promise((resolve, reject) => {
      const onReady = () => {
        if (window.loadPyodide) resolve(window.loadPyodide);
        else reject(new Error("Pyodide geladen, aber loadPyodide fehlt."));
      };
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Pyodide konnte nicht geladen werden.")),
        { once: true }
      );
      if (window.loadPyodide) onReady();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.async = true;
    script.dataset.pyodideRuntime = "true";
    script.onload = () => {
      if (window.loadPyodide) resolve(window.loadPyodide);
      else reject(new Error("Pyodide geladen, aber loadPyodide fehlt."));
    };
    script.onerror = () =>
      reject(new Error("Pyodide konnte nicht geladen werden."));
    document.head.appendChild(script);
  });
}

export function loadPyodideRuntime(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const loadPyodide = await loadPyodideScript();
      return loadPyodide({ indexURL: PYODIDE_CDN });
    })();
  }
  return pyodidePromise;
}

export async function runPythonCode(code: string): Promise<{
  stdout: string;
  stderr: string;
  error: string | null;
}> {
  const pyodide = await loadPyodideRuntime();

  if (!inputHookInstalled) {
    pyodide.runPython(`
import builtins
from js import prompt

def _browser_input(prompt_text=""):
    result = prompt(prompt_text)
    return "" if result is None else str(result)

builtins.input = _browser_input
`);
    inputHookInstalled = true;
  }

  let stdout = "";
  let stderr = "";

  pyodide.setStdout({ batched: (text: string) => { stdout += text; } });
  pyodide.setStderr({ batched: (text: string) => { stderr += text; } });

  try {
    await pyodide.runPythonAsync(code);
    return { stdout, stderr, error: null };
  } catch (err) {
    return { stdout, stderr, error: formatPythonError(err) };
  }
}
