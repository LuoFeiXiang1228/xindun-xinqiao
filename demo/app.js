(function () {
  'use strict';
  const { fields, evaluateCheck, tasksForRole } = window.XinqiaoDemo;
  let state = {};
  let activeRole = 'student';
  const byId = id => document.getElementById(id);
  const roles = {
    student: { title: '学生本人', description: '自己的求助进度与公开说明。', boundary: '仅展示自己的求助记录；自用核对不自动进入协作台账。', action: '模拟发起求助', response: '模拟完成：这只是页面反馈。没有消息发出，没有人收到求助。' },
    peer: { title: '朋辈观察者', description: '观察上报入口，不参与健康判断。', boundary: '只上报必要事实，不查看他人台账或处置结果。', action: '模拟观察上报', response: '模拟完成：没有记录上传，也没有生成真实处置任务。' },
    counselor: { title: '辅导员', description: '被授权分派的任务与下一步动作。', boundary: '真实系统需校验任务、班级范围与用途，不默认开放全部健康档案。', action: '查看任务说明', response: '右侧显示虚构任务。真实受理、访问与转介能力尚未实现。' },
    professional: { title: '授权专业人员', description: '被授权范围内的转介与协作。', boundary: '访问需要明确范围、事由和审计；本页不授予任何真实权限。', action: '查看转介说明', response: '转介卡片仅解释设计，不进行真实接收或专业判断。' }
  };
  const steps = [
    ['观察 / 主动求助', '学生或观察者', '只记录必要事实与希望得到的帮助，不添加诊断或个人定性。'],
    ['授权受理', '被分派的受理人', '核对任务归属、用途与可见范围，明确下一步负责人。'],
    ['沟通与核对', '授权沟通人员', '核对事实、理解需求，约定动作与后续时间，不依赖自动标签下结论。'],
    ['需要时转介', '授权人员之间', '明确接收方，只交接必要内容。当前页面不发送转介或通知。'],
    ['约定跟进', '任务负责人', '确认约定动作是否完成，按规则结束流程与处理保留期限，不形成永久标签。']
  ];
  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  fields.forEach((field, index) => {
    const group = element('fieldset', 'check-row');
    const legend = element('legend');
    legend.append(element('span', '', String(index + 1).padStart(2, '0')), document.createTextNode(field.label));
    group.append(legend);
    const choices = element('div', 'check-options');
    ['无须特别留意', '需要留意'].forEach((label, value) => {
      const wrapper = element('label', 'choice');
      const input = element('input');
      input.type = 'radio'; input.name = field.key; input.value = String(value);
      input.addEventListener('change', () => {
        state[field.key] = value;
        byId('reset-status').textContent = '';
        renderCheck();
      });
      wrapper.append(input, element('span', '', label)); choices.append(wrapper);
    });
    group.append(choices); byId('check-fields').append(group);
  });
  function renderCheck() {
    const result = evaluateCheck(state);
    byId('progress').textContent = `已选 ${result.completed} / 4 项`;
    byId('progress-fill').style.width = `${result.completed * 25}%`;
    const copy = {
      incomplete: ['…', '等待完成核对', `已选 ${result.completed} / 4 项。完成全部示例选择后，再查看提示；未填完时不生成结论。`],
      review: ['↺', '建议稍后复核', `示例中有 ${result.attention} 项需要留意。可以先保留事实记录，稍后复核评价结论；这不是健康判断。`],
      untriggered: ['○', '未触发示例复核提示', '本次选择未触发示例规则。这不代表健康正常，也不证明评价结论有效；仍可自主选择稍后复核。']
    }[result.status];
    byId('result-icon').textContent = copy[0];
    byId('result-title').textContent = copy[1];
    byId('result-text').textContent = copy[2];
    document.querySelector('.result-card').dataset.state = result.status;
  }
  function renderRole(role) {
    activeRole = role;
    const config = roles[role];
    document.querySelectorAll('[data-role]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
    byId('role-title').textContent = config.title;
    byId('role-description').textContent = config.description;
    byId('role-boundary').textContent = config.boundary;
    byId('simulate').textContent = config.action;
    byId('simulate-status').textContent = '按钮仅展示模拟结果，不发送信息。';
    const list = byId('task-list'); list.replaceChildren();
    const tasks = tasksForRole(role);
    byId('task-count').textContent = `${tasks.length} 个示例`;
    if (!tasks.length) list.append(element('p', 'empty', '此视角不展示他人任务与处置结果。可查看观察上报的设计说明。'));
    tasks.forEach(task => {
      const article = element('article', 'task');
      const top = element('div', 'task-top');
      top.append(element('code', '', task.id), element('span', 'badge muted', task.status));
      article.append(top, element('h4', '', task.title), element('p', '', `下一步：${task.next}`));
      list.append(article);
    });
  }
  function renderStep(index) {
    document.querySelectorAll('[data-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.step) === index)));
    const [title, owner, description] = steps[index];
    const summary = element('div');
    summary.append(element('p', 'eyebrow', `责任岗位 / ${owner}`), element('h3', '', title));
    byId('flow-detail').replaceChildren(summary, element('p', '', description));
  }
  document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => renderRole(button.dataset.role)));
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => renderStep(Number(button.dataset.step))));
  byId('simulate').addEventListener('click', () => { byId('simulate-status').textContent = roles[activeRole].response; });
  byId('reset').addEventListener('click', () => {
    state = {};
    document.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = false; });
    renderCheck(); renderRole('student'); renderStep(0);
    byId('reset-status').textContent = '演示已重置，当前页面选择已清除。';
  });
  renderCheck(); renderRole('student'); renderStep(0);
})();
