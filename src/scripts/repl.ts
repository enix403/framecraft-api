import "./repl-effects";

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { appEnv } from "@/lib/app-env";

console.log("TypeScript REPL started\n");

// Start the REPL
const r = require("node:repl").start({
  prompt: "\x1b[34m>>\x1b[0m ",
  useGlobal: true
});

// Define custom REPL commands
r.defineCommand("cls", {
  help: "Clears the screen",
  action() {
    console.clear();
    this.displayPrompt();
  }
});
