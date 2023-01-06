const { Model } = require('../../dist/index');
const path = require('path');

module.exports = class extends Model {
  constructor() {
    super();
    this.t = this.sqliteTable('test', path.resolve(__dirname, '../test.db'));
  }

  add() {
    this.t.add({
      Field1: 1,
      Field2: 2,
      Field3: 'hello world',
      Field4: new Date().toISOString(),
    });

    console.log(this.t.db.lastInsertId, 'add');
  }

  gets(){
    let list1 = this.t.gets({'id >': 20});
    console.log(list1);
  }

  rm(){
    let res = this.t.remove({id: 1});
    console.log(res, 'remove');
  }

  update(){
    let res = this.t.update({Field3: "hello world 周筱"}, {id: 15});
    console.log(res, 'update');
  }

  incre(){
    this.t.update({"Field1 /=": 1000}, {id: 11});
  }

  count(){
    console.log(this.t.count());
    console.log(this.t.count({'id >': 15}));
  }
};
