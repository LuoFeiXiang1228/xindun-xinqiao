'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Minimal DOM harness: validates event wiring and state resets, not browser layout,
// accessibility-tree behavior, CSP enforcement or actual resource loading.
class Node {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.dataset = {};
    this.attributes = {}; this.style = {}; this.listeners = {}; this._text = '';
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this._text = ''; this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(event, handler) { (this.listeners[event] ||= []).push(handler); }
  dispatch(event) { assert.ok(this.listeners[event], `Missing event ${event}`); this.listeners[event].forEach(handler => handler()); }
  focus() { this.focused = true; }
  click() { this.dispatch('click'); }
  querySelector(tag) {
    if (!this.mockChildren) this.mockChildren = {};
    return this.mockChildren[tag] ||= new Node(tag);
  }
}
function boot() {
  const demo = path.resolve(__dirname, '../demo');
  const html = fs.readFileSync(path.join(demo, 'index.html'), 'utf8');
  const nodes = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Node()]));
  const roleButtons = [...html.matchAll(/data-role="([^"]+)"/g)].map(match => {
    const node = new Node('button'); node.dataset.role = match[1]; return node;
  });
  const stepButtons = [...html.matchAll(/data-step="([^"]+)"/g)].map(match => {
    const node = new Node('button'); node.dataset.step = match[1]; return node;
  });
  const inputs = [];
  const resultCard = new Node();
  const document = {
    getElementById(id) { assert.ok(nodes.has(id), `Missing HTML id ${id}`); return nodes.get(id); },
    createElement(tag) { const node = new Node(tag); if (tag === 'input') inputs.push(node); return node; },
    createTextNode(text) { const node = new Node(); node.textContent = text; return node; },
    querySelector(selector) { assert.equal(selector, '.result-card'); return resultCard; },
    querySelectorAll(selector) {
      if (selector === '[data-role]') return roleButtons;
      if (selector === '[data-step]') return stepButtons;
      if (selector === 'input[type="radio"]') return inputs;
      throw new Error(`Unexpected selector ${selector}`);
    }
  };
  const sandbox = { document, window: {}, console };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(demo, 'logic.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(demo, 'app.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(demo, 'journey.js'), 'utf8'), sandbox);
  const choose = (name, value) => {
    const input = inputs.find(node => node.name === name && node.value === String(value));
    assert.ok(input);
    inputs.filter(node => node.name === name).forEach(node => { node.checked = node === input; });
    input.dispatch('change');
  };
  return { nodes, inputs, roleButtons, stepButtons, resultCard, choose };
}

test('UI events preserve incomplete state, show review then allow changed choices', () => {
  const app = boot();
  assert.equal(app.inputs.length, 8);
  app.choose('rest', 1); app.choose('meal', 1);
  assert.equal(app.resultCard.dataset.state, 'incomplete');
  app.choose('body', 0); app.choose('mood', 0);
  assert.equal(app.resultCard.dataset.state, 'review');
  assert.match(app.nodes.get('result-text').textContent, /不是健康判断/);
  app.choose('meal', 0);
  assert.equal(app.resultCard.dataset.state, 'untriggered');
  assert.match(app.nodes.get('result-text').textContent, /不代表健康正常/);
});

test('role switch clears previous result and exposes no peer task cards', () => {
  const app = boot();
  app.nodes.get('simulate').dispatch('click');
  assert.match(app.nodes.get('simulate-status').textContent, /没有消息发出/);
  app.roleButtons.find(button => button.dataset.role === 'peer').dispatch('click');
  assert.equal(app.nodes.get('task-count').textContent, '0 个示例');
  assert.match(app.nodes.get('task-list').textContent, /不展示他人任务/);
  assert.match(app.nodes.get('simulate-status').textContent, /仅展示模拟结果/);
  app.nodes.get('simulate').dispatch('click');
  assert.match(app.nodes.get('simulate-status').textContent, /没有记录上传/);
  assert.equal(app.roleButtons.filter(button => button.attributes['aria-pressed'] === 'true').length, 1);
});

test('reset removes every selection, returns default role and flow, and clears simulation feedback', () => {
  const app = boot();
  for (const field of ['rest', 'meal', 'body', 'mood']) app.choose(field, 1);
  app.roleButtons.find(button => button.dataset.role === 'professional').dispatch('click');
  app.stepButtons[4].dispatch('click');
  app.nodes.get('simulate').dispatch('click');
  app.nodes.get('reset').dispatch('click');
  assert.equal(app.inputs.some(input => input.checked), false);
  assert.equal(app.resultCard.dataset.state, 'incomplete');
  assert.equal(app.nodes.get('role-title').textContent, '学生本人');
  assert.equal(app.nodes.get('progress-fill').style.width, '0%');
  assert.equal(app.stepButtons[0].attributes['aria-pressed'], 'true');
  assert.match(app.nodes.get('simulate-status').textContent, /仅展示模拟结果/);
  assert.match(app.nodes.get('reset-status').textContent, /已清除/);
});

test('interactive journey, review exercise and feedback reset together', () => {
  const app = boot();
  const act = text => {
    const button = app.nodes.get('journey-actions').children.find(child => child.tagName === 'button' && child.textContent.includes(text));
    assert.ok(button, `Missing action ${text}`); button.dispatch('click');
  };
  const switchRole = role => app.roleButtons.find(button => button.dataset.role === role).dispatch('click');
  act('发起'); switchRole('counselor'); act('受理'); act('记录'); act('发起模拟转介');
  switchRole('peer');
  assert.doesNotMatch(app.nodes.get('journey-history').textContent, /第 1 步/);
  switchRole('professional'); act('接收'); act('确认');
  assert.equal(app.nodes.get('journey-status').textContent, '流程已完成');
  assert.equal(app.nodes.get('journey-history').children.length, 6);
  for (const id of ['record-fact', 'record-judgment', 'review-judgment']) app.nodes.get(id).dispatch('click');
  assert.equal(app.nodes.get('review-log').children.length, 3);
  app.nodes.get('feedback-completion').value = '独立完成';
  app.nodes.get('feedback-owner').value = '清楚';
  app.nodes.get('feedback-meaning').value = '只是未触发示例规则';
  app.nodes.get('feedback-friction').value = '暂未发现';
  app.nodes.get('generate-feedback').dispatch('click');
  assert.match(app.nodes.get('feedback-draft').value, /本页虚构任务：已完成/);
  assert.match(app.nodes.get('feedback-draft').value, /本页评价复核练习：已完成/);
  switchRole('peer');
  app.nodes.get('generate-feedback').dispatch('click');
  assert.match(app.nodes.get('feedback-draft').value, /朋辈视角不展示处理结果/);
  assert.doesNotMatch(app.nodes.get('feedback-draft').value, /本页虚构任务：已完成/);
  app.nodes.get('reset').dispatch('click');
  assert.equal(app.nodes.get('journey-status').textContent, '尚未发起');
  assert.equal(app.nodes.get('feedback-draft').value, '');
  assert.equal(app.nodes.get('review-log').children.length, 1);
  assert.equal(app.nodes.get('record-judgment').disabled, true);
});

test('visual track and role handoff advance together without exposing peer progress', () => {
  const app = boot();
  assert.equal(app.nodes.get('track-0').dataset.state, 'active');
  const action = () => app.nodes.get('journey-actions').children.find(child => child.tagName === 'button').dispatch('click');
  action();
  assert.equal(app.nodes.get('track-0').dataset.state, 'complete');
  assert.equal(app.nodes.get('track-1').dataset.state, 'active');
  assert.equal(app.nodes.get('next-role').hidden, false);
  app.nodes.get('next-role').dispatch('click');
  assert.equal(app.nodes.get('role-title').textContent, '辅导员');
  assert.equal(app.nodes.get('next-role').hidden, true);
  action(); action(); action();
  app.nodes.get('next-role').dispatch('click');
  assert.equal(app.nodes.get('role-title').textContent, '授权专业人员');
  action(); action();
  assert.equal(app.nodes.get('track-4').dataset.state, 'complete');
  app.roleButtons.find(button => button.dataset.role === 'peer').dispatch('click');
  for (let index = 0; index < 5; index++) assert.equal(app.nodes.get(`track-${index}`).dataset.state, 'private');
  assert.equal(app.nodes.get('next-role').hidden, true);
  app.nodes.get('reset').dispatch('click');
  assert.equal(app.nodes.get('track-0').dataset.state, 'active');
  assert.match(app.nodes.get('review-after-copy').textContent, /在这里看修订结果/);
});
