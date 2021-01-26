const mongoose = require("mongoose");
const { createMongooseModel } = require("../../dist");

const { model } = createMongooseModel("articlemodels", {
  // 标题
  title: String,
  // 内容
  content: String,
  // 体裁
  genre: Number,
  // 年级
  grade: Number,
  // 文章字数
  words: Number,
  // 标签列表
  tags: [mongoose.Schema.Types.ObjectId],
  // 浏览数
  views: {
    type: Number,
    default: 0,
    index: true,
  },
});

module.exports = model;
