// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const Misc = require('./js/misc');
const {ipcRenderer} = require('electron');
window.ipcRenderer = ipcRenderer;
window.Misc = Misc;
