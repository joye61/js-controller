const { runWithinCli } = require("../dist");
const path = require("path");

runWithinCli(() => {
  console.log("logic here");
}, path.resolve(__dirname, "./config"));
