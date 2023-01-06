const { Controller } = require('../../../dist/index');

module.exports = class extends Controller {
  show() {
    this.json('hello world');
  }

  index() {
    this.json('default action');
  }
}
