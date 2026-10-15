(function (root) {
  'use strict';
  const fields = Object.freeze([
    Object.freeze({ key: 'rest', label: '休息情况' }),
    Object.freeze({ key: 'meal', label: '进食情况' }),
    Object.freeze({ key: 'body', label: '身体感受' }),
    Object.freeze({ key: 'mood', label: '此刻心情' })
  ]);
  // Illustrative interaction only; this threshold has no validated health meaning.
  function evaluateCheck(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      throw new TypeError('Expected a check state object');
    }
    const keys = fields.map(field => field.key);
    if (Object.keys(state).some(key => !keys.includes(key))) {
      throw new TypeError('Unknown check field');
    }
    const values = keys.filter(key => Object.hasOwn(state, key)).map(key => state[key]);
    if (values.some(value => value !== 0 && value !== 1)) {
      throw new TypeError('Expected 0 or 1');
    }
    const attention = values.filter(value => value === 1).length;
    return Object.freeze({
      completed: values.length,
      attention,
      status: values.length < keys.length ? 'incomplete' : attention >= 2 ? 'review' : 'untriggered'
    });
  }
  const tasks = Object.freeze([
    Object.freeze({ id: 'DEMO-001', title: '希望安排一次沟通', status: '等待受理', next: '授权受理人确认下一步', role: 'counselor' }),
    Object.freeze({ id: 'DEMO-002', title: '已约定后续沟通', status: '约定跟进', next: '任务负责人核对约定是否完成', role: 'counselor' }),
    Object.freeze({ id: 'DEMO-003', title: '转介请求示例', status: '等待接收', next: '授权专业人员决定是否接收', role: 'professional' })
  ]);
  function tasksForRole(role) {
    if (!['student', 'peer', 'counselor', 'professional'].includes(role)) throw new TypeError('Unknown demo role');
    if (role === 'peer') return [];
    if (role === 'student') return [tasks[0]];
    return tasks.filter(task => task.role === role);
  }
  const transitions = Object.freeze({
    start: { from: 'draft', to: 'submitted', role: 'student', label: '发起虚构沟通请求', owner: '辅导员' },
    accept: { from: 'submitted', to: 'accepted', role: 'counselor', label: '受理任务', owner: '辅导员' },
    discuss: { from: 'accepted', to: 'discussed', role: 'counselor', label: '记录虚构沟通与约定', owner: '辅导员' },
    refer: { from: 'discussed', to: 'referred', role: 'counselor', label: '发起模拟转介', owner: '授权专业人员' },
    follow: { from: 'discussed', to: 'following', role: 'counselor', label: '直接约定跟进（无需转介）', owner: '辅导员' },
    receive: { from: 'referred', to: 'following', role: 'professional', label: '接收模拟转介并约定跟进', owner: '授权专业人员' },
    finish: { from: 'following', to: 'closed', label: '确认约定完成，结束演示', owner: '已结束' }
  });
  const statuses = Object.freeze({ draft: '尚未发起', submitted: '等待受理', accepted: '已受理', discussed: '已沟通核对', referred: '等待转介接收', following: '约定跟进', closed: '流程已完成' });
  function createWorkflow() { return { status: 'draft', owner: '学生本人', history: [] }; }
  function validateWorkflow(task) {
    if (!task || !Object.hasOwn(statuses, task.status) || !Array.isArray(task.history)) throw new TypeError('Invalid workflow');
  }
  function availableActions(task, role) {
    validateWorkflow(task);
    if (!['student', 'peer', 'counselor', 'professional'].includes(role)) throw new TypeError('Unknown demo role');
    return Object.entries(transitions).filter(([, item]) => item.from === task.status &&
      (item.role ? item.role === role : (role === 'counselor' && task.owner === '辅导员') || (role === 'professional' && task.owner === '授权专业人员')))
      .map(([key, item]) => ({ key, label: item.label }));
  }
  function transitionWorkflow(task, action, role) {
    if (!availableActions(task, role).some(item => item.key === action)) throw new Error('Action unavailable for current stage and demo role');
    const step = transitions[action];
    return { status: step.to, owner: step.owner, history: [...task.history, { sequence: task.history.length + 1, action, role, label: step.label }] };
  }
  function workflowView(task, role) {
    availableActions(task, role);
    if (role === 'peer') return { visible: false, status: '此视角不展示任务与处置结果', owner: '', history: [] };
    // Student sees their own progress summary; staff action history stays in staff views.
    return { visible: true, status: statuses[task.status], owner: task.owner, history: role === 'student' ? [] : task.history.map(item => ({ ...item })) };
  }
  const api = Object.freeze({ fields, evaluateCheck, tasksForRole, createWorkflow, availableActions, transitionWorkflow, workflowView });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.XinqiaoDemo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
