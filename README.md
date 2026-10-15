# 校准 · 心盾与心桥

**让评价与关怀流程，在下结论之前先被核对。**

作者：**罗费翔（LuoFeiXiang）**。这是个人发起的项目，欢迎讨论、改进与合作落地。

联系邮箱：[eoggwccmgeya@163.com](mailto:eoggwccmgeya@163.com)。

GitHub 作者账号：[LuoFeiXiang1228](https://github.com/LuoFeiXiang1228)。

项目仓库：[LuoFeiXiang1228/xindun-xinqiao](https://github.com/LuoFeiXiang1228/xindun-xinqiao)。

心盾提供填表前核对与复核提示；心桥展示观察、受理、沟通、转介和跟进的协作流程。本仓库面向职业教育场景，分享产品设计与交互原型。

> 当前状态：**开源概念验证原型**。仅实现离线静态演示，没有登录、真实上报、数据库、AI 服务或生产权限控制。代码采用 MIT，文档采用 CC BY 4.0，允许按许可复制、修改与商用，须保留相应署名及许可声明。

## 快速体验

**[打开在线演示](https://luofeixiang1228.github.io/xindun-xinqiao/)** · [提交体验反馈](https://github.com/LuoFeiXiang1228/xindun-xinqiao/issues/new?template=feedback.md) · [参与具体任务](docs/contribution-tasks.md)

也可下载或克隆本仓库后，在本地用浏览器打开 [demo/index.html](demo/index.html)。无需安装依赖，也无需账号。页面使用虚构案例，选择只在当前页面内存中存在；刷新或点击“重置演示”即可清除。在线版本由 GitHub Pages 托管，平台会处理访问日志；页面交互不自动上传。

```sh
git clone https://github.com/LuoFeiXiang1228/xindun-xinqiao.git
```

演示包括：

- **心盾**：四项填表前核对，展示未完成、建议复核、未触发示例提示三种结果；不输出健康状态或诊断。
- **心桥**：切换协作角色、查看虚构任务与五步流程；角色切换用于讲解设计，没有身份认证能力。
- **边界说明**：每个页面清楚标示模拟结果，提交入口不会向任何人发送信息。
- **完整任务**：亲自推进受理、沟通、转介接收与跟进；也可选择无需转介分支。模拟操作记录随页面重置清除。
- **评价复核**：用固定虚构案例体验事实记录、暂时判断和补充信息后的复核。
- **体验反馈**：固定选项生成可手动复制的反馈草稿，不自动提交。

一分钟操作：核对虚构答案 → 点击三步复核练习 → 学生发起任务 → 辅导员受理并沟通 → 模拟转介 → 专业人员接收并完成 → 生成反馈草稿。

## 项目价值与边界

| 模块 | 希望验证的价值 | 当前实现 |
| --- | --- | --- |
| 心盾 · 评价校准 | 区分事实记录与终局评价，提供稍后复核的机会 | 浏览器内示例规则与提示 |
| 心桥 · 关怀协同 | 明确受理人、下一步动作和跟进状态 | 内存中可推进的虚构任务、两条路径及模拟操作记录 |
| 权限与审计 | 限定用途、减少不必要的数据可见性 | 设计文档；未实现服务端控制 |

“元闸门”在这里是一个**设计概念**：在执行判断或处置前，先核对输入与流程条件。当前没有效果验证数据，不宣称能够筛查、预警或改善心理健康；示例的“两项触发”规则不具有临床或统计效度。

## 文档导航

- [产品设计与验收目标](docs/product.md)
- [数据与权限架构](docs/architecture.md)
- [隐私与使用边界](docs/privacy-and-boundaries.md)
- [开发路线与上线前检查](docs/roadmap.md)
- [GitHub 发布步骤](docs/releasing.md)
- [首轮可用性验证与空白记录](docs/usability.md) / [可认领的贡献任务](docs/contribution-tasks.md)
- [贡献指南](CONTRIBUTING.md) / [安全问题报告](SECURITY.md) / [许可状态](LICENSE.md)

## 开发与检查

安装 Node.js 22 或更新版本，然后执行：

```sh
npm test
npm run check
```

没有第三方运行时依赖。测试覆盖示例规则边界、输入校验、纯函数与虚构任务聚合；检查脚本覆盖本地资源链接、允许的发布文件和常见敏感信息模式。自动检查不能代替发布前人工审阅。

只有 Node.js、没有 npm 时，也可直接运行 `node --test tests/*.test.js` 和 `node scripts/check-public.js`。界面事件另用轻量模拟 DOM 验证，不能替代真实浏览器、辅助技术和手机布局检查。

```text
demo/                 离线演示（HTML / CSS / JavaScript）
docs/                 面向公开讨论的设计文档
scripts/              发布检查
tests/                规则与演示数据测试
.github/              检查工作流与 Issue 模板
```

## 参与方式

欢迎围绕可访问性、流程清晰度、用途隔离和权限设计提出建议。提交 Issue、截图或测试用例时请仅使用虚构数据。涉及真实学校、学生、研究材料或其他权利人的内容，应先确认授权与发布范围。

## 许可

© 2026 罗费翔（LuoFeiXiang）。代码使用 [MIT](LICENSE-CODE)，说明文档使用 [CC BY 4.0](LICENSE-DOCS)。详细适用范围和署名示例见 [LICENSE.md](LICENSE.md)，作者信息见 [AUTHORS.md](AUTHORS.md)。

本发布包不包含原始研究问卷、论文、内部通知、申报书、个人材料或真实台账，也不包含其他项目的材料。
