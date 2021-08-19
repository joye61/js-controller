exports.index = function (ctx) {
  ctx.json("hello world home");
};

exports.test = function(){
  ctx.json("test function goes");
}
