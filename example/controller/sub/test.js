import { Controller } from '../../../dist/index.js';

export default class extends Controller {
  show() {
    this.json('hello world');
  }

  index() {
    this.json('default action');
  }
}
