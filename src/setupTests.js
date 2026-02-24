/**
 * TextEncoder/TextDecoder polyfill must run first (Node 24 / Jest jsdom).
 * Using require() so it runs before enzyme/cheerio/undici load.
 */
require("./setupTextEncoder.js");

const { configure } = require("enzyme");
require("jest-enzyme");
const Adapter = require("enzyme-adapter-react-16").default;
require("@testing-library/jest-dom/extend-expect");

configure({ adapter: new Adapter() });
