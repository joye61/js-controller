const { Controller } = require("../../dist");
const articleModel = require("../schema/article");
module.exports = class extends Controller{
  async search() {
    const res = await articleModel.findOne().exec();
    this.json(res)
  }
};
