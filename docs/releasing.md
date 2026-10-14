# GitHub 发布步骤

## 已配置许可，发布前检查内容

作者已确认个人作品的发布授权与署名“罗费翔（LuoFeiXiang）”，许可为代码 MIT、文档 CC BY 4.0，完整正文已随包提供。发布前运行 `npm run check:release`，并再次审阅实际准备公开的文件。

发布范围只包含本目录中的公开设计与演示，不要把上级目录、原始资料或整理报告一起上传。检查脚本不能替代内容审阅。

## 尚无 GitHub 账号时

先在 [GitHub 注册入口](https://github.com/signup) 创建个人账号，按提示完成邮箱验证；注册、密码设置和必要的验证由账号本人操作。参见 [GitHub 官方注册说明](https://docs.github.com/en/account-and-profile/how-tos/account-management/creating-an-account-on-github)。

用户名可以与公开署名不同，不影响许可证中保留“罗费翔（LuoFeiXiang）”。选好实际可用的用户名后，新建仓库；建议仓库名为 `xindun-xinqiao`，仓库介绍可用本页下方文案。

创建仓库时，因本包已含 README、`.gitignore` 和双许可证文件，不要在 GitHub 再初始化这些文件，以便保持第一次推送简单。使用 Git 上传整个公开目录；直接在网页上传时务必确认点号开头的配置文件没有遗漏。

## 在本目录初始化独立仓库

确认当前工作目录为本公开包，再执行：

```sh
git init
git add .
git diff --cached --stat
git diff --cached
git commit -m "Prepare public prototype and design documentation"
git branch -M main
```

在 GitHub 新建目标仓库，初次推送前可先用私有仓库核对，远程地址使用实际创建的仓库 URL：

```sh
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

不要将内部项目的既有 Git 历史推到公开仓库；从本目录建立新历史。转为公开之前再次检查文件与所有提交。

## 展示演示

推荐先用本地 HTML 展示。若需要 GitHub Pages，可在完成公开发布审核后另行配置静态站点，入口为 `demo/index.html`。当前包没有自动部署工作流，检查 CI 不会发布站点。

## 建议的仓库介绍

检查工作流使用 [actions/checkout](https://github.com/actions/checkout) 与 [actions/setup-node](https://github.com/actions/setup-node) 官方当前文档中的 v7 示例，并仅授予仓库读取权限。工作流尚未在目标 GitHub 仓库实际运行。

中文：职业教育评价校准与关怀协作的开放设计与离线交互原型。

英文：An offline prototype and design for evaluation review and care coordination in vocational education.

建议主题标签：`education`、`workflow`、`privacy-by-design`、`prototype`。不要使用暗示已实现临床筛查、真实 AI 或机构背书的介绍。
