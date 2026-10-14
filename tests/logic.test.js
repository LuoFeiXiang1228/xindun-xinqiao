'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fields, evaluateCheck, tasksForRole } = require('../demo/logic');

test('partial choices never produce a complete conclusion, even when the example threshold is reached', () => {
  assert.deepEqual(evaluateCheck({}), { completed: 0, attention: 0, status: 'incomplete' });
  assert.equal(evaluateCheck({ rest: 1, meal: 1 }).status, 'incomplete');
  assert.equal(evaluateCheck({ rest: 1, meal: 1, body: 1 }).status, 'incomplete');
});

test('all 16 complete combinations obey the illustrative threshold', () => {
  for (let mask = 0; mask < 16; mask++) {
    const state = Object.fromEntries(fields.map((field, index) => [field.key, (mask >> index) & 1]));
    const count = Object.values(state).reduce((sum, value) => sum + value, 0);
    const result = evaluateCheck(state);
    assert.equal(result.completed, 4);
    assert.equal(result.attention, count);
    assert.equal(result.status, count >= 2 ? 'review' : 'untriggered');
  }
});

test('invalid input fails rather than silently producing reassurance', () => {
  for (const state of [null, [], '0', { rest: '1' }, { rest: undefined }, { rest: 2 }, { rest: true }, { extra: 0 }]) {
    assert.throws(() => evaluateCheck(state), TypeError);
  }
});

test('evaluation does not mutate input or count inherited choices', () => {
  const state = Object.freeze({ rest: 1 });
  evaluateCheck(state);
  assert.deepEqual(state, { rest: 1 });
  assert.equal(evaluateCheck(Object.create({ rest: 1, meal: 1, body: 1, mood: 1 })).completed, 0);
});

test('demo role views have distinct synthetic tasks and no peer task view', () => {
  assert.equal(tasksForRole('peer').length, 0);
  assert.equal(tasksForRole('student').length, 1);
  assert.equal(tasksForRole('counselor').length, 2);
  assert.equal(tasksForRole('professional').length, 1);
  assert.throws(() => tasksForRole('unknown'), TypeError);
  for (const role of ['student', 'counselor', 'professional']) {
    assert.ok(tasksForRole(role).every(task => /^DEMO-\d{3}$/.test(task.id)));
  }
});

test('callers cannot overwrite synthetic shared tasks', () => {
  const tasks = tasksForRole('student');
  assert.throws(() => { tasks[0].id = 'changed'; }, TypeError);
  tasks.pop();
  assert.equal(tasksForRole('student')[0].id, 'DEMO-001');
});
