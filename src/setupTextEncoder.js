/**
 * Polyfill for Jest/jsdom (required by undici/cheerio on Node 24).
 * Must run before setupTests.
 */
const { TextEncoder, TextDecoder } = require("util");
const { ReadableStream } = require("stream/web");
const { MessagePort } = require("worker_threads");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.MessagePort = MessagePort;
