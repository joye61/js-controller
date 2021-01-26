const mongoose = require("mongoose");
const { createMongooseModel } = require("../../dist");

const { model } = createMongooseModel("articlemodels", {
  title: String,
  content: String,
  genre: Number,
  grade: Number,
  words: Number,
  tags: [mongoose.Schema.Types.ObjectId],
  views: {
    type: Number,
    default: 0,
    index: true,
  },
});

module.exports = model;
