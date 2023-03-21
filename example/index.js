const { App } = require('../dist');
const path = require('path');

new App({
  controllerRoot: path.resolve(__dirname, './controller'),
}).run();
