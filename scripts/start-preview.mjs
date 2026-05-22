import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const port = process.env.PORT || "4173";
const host = "0.0.0.0";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const viteBin = resolve(rootDir, "node_modules", "vite", "bin", "vite.js");

const child = spawn(
  process.execPath,
  [viteBin, "preview", "--host", host, "--port", port, "--strictPort"],
  {
    stdio: "inherit",
  },
);

function shutdown(signal) {
  if (!child.killed) {
    child.kill(signal);
  }

  setTimeout(() => process.exit(0), 300).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
    return;
  }

  process.exit(code ?? 0);
});
