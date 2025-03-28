require("clear-any-console")();

console.log("TypeScript REPL started\n");

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { appEnv } from "@/lib/app-env";

require('node:repl').start({
    prompt: ">> ",
    useGlobal: true
});
