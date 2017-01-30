import test from 'tape-catch';

import TapeDOM from 'tape-dom';
TapeDOM(test);

export default test;

export function doubleEq(a, b, epsilon=0.00001) {
  const diff = (a-b) / (a+b) / 2;
  return Math.abs(diff) < epsilon;
}
