import { Controller } from '../../dist/index.js';

export default class extends Controller {
  show() {
    this.json();
  }

  // autocannon -c 100 -a 10000 http://127.0.0.1:9000/home
  index() {
    let input = [
      1, 9, -8, 88, 23, 15, 6, 45, 86, 42, 25, 76, 876, 38, 12, 5542, 31, 431,
      43141, 431, 431, 431, 43143, 1431, 431, 43143, 14132, 4321, 43, 5, 43,
      6543, 65, 35, 2, 4323, 565, 51, 4, 6, 456, 32, 54, 53, 25, 25, 25, 25, 2,
      54, 452, 5, 254, 25, 423, 542, 2, 52, 5, 26, 68, 6875, 467, 458, 52, 54,
      3, 2, 45, 254, 23, 5432, 542, 5, 42, 542, 54, 25, 24, 543, 2, 452, 542,
      35,
    ];
    let result = input.sort((a, b) => {
      return a - b;
    });

    console.log(result);
    this.json(result);
  }
}
