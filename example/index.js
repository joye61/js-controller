const { App } = require('../dist/index');
const path = require('path');

(async () => {
  await new App({
    controllerRoot: path.resolve(__dirname, './controller'),
  }).run();
})();
