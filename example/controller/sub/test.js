const { Controller } = require('../../../dist');

module.exports = class extends Controller {
  show() {
    this.json('hello world');
  }

  index() {
    this.json('default action');
  }
};
