const { JSController } = require("../dist/index");
const path = require("path");

new JSController({
  rootDir: path.resolve(__dirname, "./controller"),
});
