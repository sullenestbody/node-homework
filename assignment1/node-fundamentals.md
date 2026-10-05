# Node.js Fundamentals

## What is Node.js?

Node.js lets Javascript work outside of web browser and view loacl files.

## How does Node.js differ from running JavaScript in the browser?

Browser Javascript can use window, document and the DOM. NOde.js accesses files and the operating system

## What is the V8 engine, and how does Node use it?

V8 is a Javascript created by Google for Chrome. Nde uses it to interact computer files.

## What are some key use cases for Node.js?

Programs and servers that are live.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

CommonJS uses require() and module.exports. ES Modules use import and export.

module.exports = {example};

export function example

**CommonJS (default in Node.js):**
function add(a, b) {
return a + b;
}

module.exports = { add };

const { add } = require("./mathUtils");

**ES Modules (supported in modern Node.js):**
export function add(a, b) {
return a + b;
}

import { add } from "./mathUtils.js";
