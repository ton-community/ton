import { readFile, readFileSync } from "fs";
import path from "path";
import { Cell } from "./Cell";

const data = readFileSync(path.resolve(__dirname, '__testdata__', 'manyCells.txt'), { encoding: 'utf-8' });
const dataBuffer = Buffer.from(data, 'base64');
const state = Cell.fromBoc(dataBuffer)[0];
console.warn(state.toBoc({ idx: false }).toString('base64'));