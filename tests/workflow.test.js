'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createWorkflow, transitionWorkflow, availableActions, workflowView } = require('../demo/logic');
function step(task, action, role) { return transitionWorkflow(task, action, role); }
function discussedTask() {
  return step(step(step(createWorkflow(), 'start', 'student'), 'accept', 'counselor'), 'discuss', 'counselor');
}
test('referral journey requires receiving professional before completion', () => {
  let task = discussedTask();
  task = step(task, 'refer', 'counselor');
  assert.throws(() => step(task, 'finish', 'professional'));
  task = step(task, 'receive', 'professional');
  assert.throws(() => step(task, 'finish', 'counselor'));
  task = step(task, 'finish', 'professional');
  assert.equal(task.status, 'closed');
  assert.equal(task.history.length, 6);
  assert.deepEqual(availableActions(task, 'professional'), []);
});
test('no-referral path closes with original counselor and keeps separate history', () => {
  const before = discussedTask();
  const following = step(before, 'follow', 'counselor');
  assert.throws(() => step(following, 'finish', 'professional'));
  assert.equal(step(following, 'finish', 'counselor').status, 'closed');
  assert.equal(before.status, 'discussed');
  assert.equal(before.history.length, 3);
  assert.equal(following.history.length, 4);
});
test('out-of-order, duplicate and wrong-view actions are rejected', () => {
  const draft = createWorkflow();
  assert.throws(() => step(draft, 'accept', 'counselor'));
  assert.throws(() => step(draft, 'start', 'peer'));
  assert.throws(() => step(draft, 'start', 'unknown'));
  const submitted = step(draft, 'start', 'student');
  assert.throws(() => step(submitted, 'start', 'student'));
  assert.equal(draft.history.length, 0);
  assert.throws(() => availableActions({ status: 'unknown', history: [] }, 'student'));
});
test('peer has no state details, students see own progress summary, reset creates independent task', () => {
  const task = discussedTask();
  const peer = workflowView(task, 'peer');
  assert.equal(peer.visible, false); assert.equal(peer.owner, ''); assert.deepEqual(peer.history, []);
  const student = workflowView(task, 'student');
  assert.equal(student.status, '已沟通核对'); assert.deepEqual(student.history, []);
  const staff = workflowView(task, 'counselor');
  staff.history[0].label = 'changed';
  assert.notEqual(task.history[0].label, 'changed');
  assert.deepEqual(createWorkflow(), { status: 'draft', owner: '学生本人', history: [] });
});
