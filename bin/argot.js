#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'path';
import { processStylesheet } from '../src/processor/index.ts';

console.log(process.argv);

const [sourceFile, destFile] = process.argv.slice(2);

const source = path.resolve(process.cwd(), sourceFile);
const dest = path.resolve(process.cwd(), destFile);
await fs.mkdir(path.dirname(dest), { recursive: true });
await processStylesheet(source, dest);
