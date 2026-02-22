import assert from 'assert';
import { ensurePositiveInt, ensureString, parseCsvParam, ValidationError } from '../src/lib/validation';

function run() {
  assert.strictEqual(ensureString(' hola ', 'field'), 'hola');
  assert.strictEqual(ensurePositiveInt('10', 'limit', { min: 1, max: 100 }), 10);
  assert.deepStrictEqual(parseCsvParam('alpha, beta , ,gamma'), ['alpha', 'beta', 'gamma']);

  let threw = false;
  try {
    ensurePositiveInt('0', 'limit', { min: 1 });
  } catch (error) {
    threw = error instanceof ValidationError;
  }
  assert.strictEqual(threw, true);

  console.log('Smoke tests passed');
}

run();
