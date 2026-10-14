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
  const api = Object.freeze({ fields, evaluateCheck, tasksForRole });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.XinqiaoDemo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
