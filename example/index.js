const { runApp } = require('../dist/index');
const path = require('path');

runApp({
  controllerRoot: path.resolve(__dirname, './controller'),
});
