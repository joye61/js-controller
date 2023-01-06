const { Controller } = require('../../dist/index');
const TM = require('../model/test');

module.exports = class extends Controller {
  show() {
    this.json('hello world');
  }

  index() {
    this.json('default action');
  }

  add(){
    let tm = new TM();
    tm.add();
  }

  gets(){
    let tm = new TM();
    tm.gets();
  }

  rm(){
    let tm = new TM();
    tm.rm();
  }

  up(){
    let tm = new TM();
    tm.update();
  }

  incre(){
    let tm = new TM();
    tm.incre();
  }

  count(){
    let tm = new TM();
    tm.count();
  }
}
