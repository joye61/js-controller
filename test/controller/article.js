const { Base } = require("../../dist");
const articleModel = require("../schema/article");
module.exports = class extends Base{
  async search() {
    const res = await articleModel.findOne().exec();
    this.json(res)
  }
};
