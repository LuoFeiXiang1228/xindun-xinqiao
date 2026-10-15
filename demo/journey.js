(function () {
  'use strict';
  const { createWorkflow, availableActions, transitionWorkflow, workflowView } = window.XinqiaoDemo;
  const byId = id => document.getElementById(id);
  let task = createWorkflow();
  let role = 'student';
  let reviewStage = 0;
  function node(tag, text) { const el = document.createElement(tag); el.textContent = text; return el; }
  const guide = {
    draft: '请选择“学生本人”，发起虚构沟通请求。',
    submitted: '请切换到“辅导员”，受理此任务。',
    accepted: '继续使用“辅导员”视角，记录虚构沟通与约定。',
    discussed: '可模拟转介，或选择无需转介、直接跟进。',
    referred: '请切换到“授权专业人员”，接收模拟转介。',
    following: '由当前负责人确认约定完成。切换视角不会改变任务负责人。',
    closed: '虚构流程已走完。可以生成反馈，或重新开始以体验另一条路径。'
  };
  function render() {
    const view = workflowView(task, role);
    byId('journey-status').textContent = view.status;
    byId('journey-owner').textContent = view.visible ? `下一步负责人：${view.owner}` : '朋辈视角仅展示上报指引';
    byId('journey-guide').textContent = view.visible ? guide[task.status] : '此处不展示他人任务状态、负责人或模拟操作记录。切换到其他演示视角可继续体验。';
    const actions = byId('journey-actions'); actions.replaceChildren();
    for (const action of availableActions(task, role)) {
      const button = node('button', action.label); button.type = 'button'; button.className = 'primary';
      button.addEventListener('click', () => {
        task = transitionWorkflow(task, action.key, role);
        render();
        // Keep keyboard focus in a stable place after the action button is replaced.
        byId('journey-status').focus();
      });
      actions.append(button);
    }
    if (!actions.children.length) actions.append(node('p', view.visible ? '当前视角没有可执行动作，请参考上方下一步指引。' : '仅提供观察上报说明，不呈现处理结果。'));
    const history = byId('journey-history'); history.replaceChildren();
    if (!view.history.length) history.append(node('li', role === 'student' ? '学生视角仅展示自己的进度摘要，不展示工作人员操作明细。' : role === 'peer' ? '此视角不展示操作记录。' : '尚无模拟操作记录。'));
    view.history.forEach(item => history.append(node('li', `第 ${item.sequence} 步 · ${item.label}（${item.role === 'student' ? '学生本人' : item.role === 'counselor' ? '辅导员' : '授权专业人员'}）`)));
  }
  document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => { role = button.dataset.role; render(); }));
  byId('restart-journey').addEventListener('click', () => { task = createWorkflow(); render(); });
  const reviewCopy = [
    '事实记录：虚构练习中漏了两项步骤，其他步骤已完成。',
    '暂时判断：“我可能还没有掌握这两项步骤。”保留原记录，暂不推断整体能力。',
    '补充信息：重新核对操作单后，发现其中一项已完成但未记录。复核：“需要练习和确认的是剩下的一项。”原事实、暂时判断和修订过程均保留。'
  ];
  function renderReview() {
    byId('record-fact').disabled = reviewStage !== 0;
    byId('record-judgment').disabled = reviewStage !== 1;
    byId('review-judgment').disabled = reviewStage !== 2;
    const log = byId('review-log'); log.replaceChildren();
    if (!reviewStage) log.append(node('li', '等待开始；练习不评价任何真实个人。'));
    reviewCopy.slice(0, reviewStage).forEach(text => log.append(node('li', text)));
  }
  ['record-fact', 'record-judgment', 'review-judgment'].forEach((id, index) => {
    byId(id).addEventListener('click', () => {
      if (reviewStage !== index) return;
      reviewStage++; renderReview();
      if (reviewStage < 3) byId(['record-judgment', 'review-judgment'][reviewStage - 1]).focus();
      else byId('review-log').focus();
    });
  });
  byId('generate-feedback').addEventListener('click', () => {
    const meaning = byId('feedback-meaning').value;
    byId('feedback-draft').value = [
      '心盾心桥 v0.2.0 · 使用反馈草稿（本人可核对后手动提交）',
      `自报任务完成情况：${byId('feedback-completion').value}`,
      `下一步负责人是否清楚：${byId('feedback-owner').value}`,
      `对“未触发复核提示”的理解：${meaning}`,
      `最需改进的地方：${byId('feedback-friction').value}`,
      `本页虚构任务：${role === 'peer' ? '朋辈视角不展示处理结果' : task.status === 'closed' ? '已完成' : '未完成'}`,
      `本页评价复核练习：${reviewStage === 3 ? '已完成' : '未完成'}`,
      '仅基于虚构案例；不包含姓名、健康信息或真实台账。'
    ].join('\n');
    byId('feedback-message').textContent = meaning === '只是未触发示例规则'
      ? '草稿已生成，尚未发送。可核对后手动复制到 Issue。'
      : '草稿已生成，尚未发送。提示：未触发仅说明示例规则没有触发，不能解释为健康正常。';
  });
  byId('reset').addEventListener('click', () => {
    task = createWorkflow(); role = 'student'; reviewStage = 0;
    byId('feedback-completion').value = '未尝试'; byId('feedback-owner').value = '未判断';
    byId('feedback-meaning').value = '未作答'; byId('feedback-friction').value = '暂未发现';
    byId('feedback-draft').value = '';
    byId('feedback-message').textContent = '尚未生成反馈。此页面不向作者发送任何内容。';
    render(); renderReview();
  });
  byId('journey-status').tabIndex = -1;
  byId('review-log').tabIndex = -1;
  render(); renderReview();
})();
