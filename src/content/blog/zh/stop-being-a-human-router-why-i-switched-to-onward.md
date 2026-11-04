---
lang: zh
title: "别再为智能体充当人肉路由器：我为什么转向 Onward"
description: "通过提示词复用、多窗格广播、内联 Git 差异审查与原生智能体协作，构建顺畅的本地多智能体编码工作流。"
date: "2026-11-04"
tags: ["AI Engineering", "Developer Tools", "Onward"]
category: "AI Engineering"
readingTime: "5 min"
featured: true
demo: false
draft: false
coverTitle: "Why I Switched to Onward"
---

**摘要：** 如果你的主要编码流程都在本地完成，包括并行运行 Claude Code、修复缺陷、生成测试和审查代码差异，就别再把工作流分散到一个个原始终端窗口里了。[**Onward**](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench) 是一款专为此打造的桌面工作台，将提示词复用、多窗格广播和 Git 差异检查整合到一个流畅的窗口中。

![](/images/stop-being-a-human-router-why-i-switched-to-onward/onward-multi-agent-terminal.png)

![](/images/stop-being-a-human-router-why-i-switched-to-onward/onward-integrated-editor.png)

![](/images/stop-being-a-human-router-why-i-switched-to-onward/human-router-comparison.png)

*图 1：别再充当编码智能体之间的人肉消息总线。*

## 瓶颈不是模型智商，而是上下文切换

修复一个不那么简单的缺陷时，我的标准配置是在相互隔离的 Git worktree 中并行运行两个 Claude Code 实例：一个负责实现（`worktree-bug1`），另一个负责回归测试（`worktree-bug2`）。

同时运行 2–4 个智能体时，阻力不在模型能力，而在于你不得不**充当人肉消息总线**：

1. 在每个新会话中复制粘贴相同的系统约束（`Read existing code first. DO NOT break public interfaces.`）。

2. 不小心把测试命令发进了实现窗格。

3. 从终端 Alt-Tab 切到 IDE 检查 `git diff`，再切回来发出修正指令。

传统终端复用器让你困在 shell 脚本和彼此割裂的窗格中。Onward 正是为解决这种高吞吐、人在回路中的编码瓶颈而构建的。

![](/images/stop-being-a-human-router-why-i-switched-to-onward/prompt-multicast.png)

*图 2：Onward 专用提示词面板原生支持提示词多播。*

## 1. 原生提示词多播

[**Onward**](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench) 将提示词作为一等状态管理，而不是依赖外部 dotfiles 或 shell 历史来管理重复使用的系统提示词。

- **专用[提示词面板](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/blob/9ca91e06278de3bcc2d0c4fad3eaf57c09e7ca4b/src/components/PromptNotebook/PromptNotebook.tsx#L1431-L1537)：** 在侧边栏固定反复使用的约束，并用颜色标签分类。

- **一键多播：** 将布局划分为 1、2、4、6 或 8 个[网格窗格](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/blob/9ca91e06278de3bcc2d0c4fad3eaf57c09e7ca4b/src/types/prompt.d.ts#L25-L69)，选中目标智能体，再将核心规则同时[广播](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/blob/9ca91e06278de3bcc2d0c4fad3eaf57c09e7ca4b/src/App.tsx#L806-L1010)给编码和测试智能体。

![](/images/stop-being-a-human-router-why-i-switched-to-onward/inline-diff-verification.png)

*图 3：借助 Onward 集成的任务面板，无需 Alt-Tab 即可核验代码差异。*

## 2. 无需 Alt-Tab 的差异核验

生成代码的成本很低，人工核验才是瓶颈。在传统配置中，检查智能体改动了什么，往往迫使你回到命令行，或切换到外部 IDE。

Onward 把完整的[**任务面板**](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/blob/9ca91e06278de3bcc2d0c4fad3eaf57c09e7ca4b/src/components/TerminalGrid/TerminalGrid.tsx#L3892-L3955)停靠在终端 PTY 旁边，其中包含文件树、编辑器、大纲，以及 **Git 差异与历史记录**。

整个循环都在同一个窗口内完成：`广播提示词` → `智能体执行` → `在右侧检查差异` → `在左侧修正方向`。无需切换窗口。

![](/images/stop-being-a-human-router-why-i-switched-to-onward/onward-bridge-coordination.png)

*图 4：通过原生 onward-bridge 实现顺畅的智能体间协作。*

## 3. 借助 onward-bridge 实现顺畅的智能体间协作

当你需要智能体互相配合，比如让测试智能体先读取实现智能体的标准输出再编写断言时，你不会想为此编写复杂的外部 socket 脚本或胶水代码。

Onward 开箱即带 [**`onward-bridge`**](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/blob/9ca91e06278de3bcc2d0c4fad3eaf57c09e7ca4b/public/skill/onward-bridge/README.md)。运行在当前标签页中的智能体，可以直接读取同级终端的缓冲区，或原生地向其他窗格注入命令和按键。

![](/images/stop-being-a-human-router-why-i-switched-to-onward/macos-systems-engineering.png)

*图 5：扎实的 macOS 系统工程，包括 WebGL、GPU 唤醒恢复和压力测试工具。*

## 4. 不妥协的 macOS 系统工程

当六个窗格同时持续输出标准输出时，采用 Web 渲染的终端通常会不堪重负，还经常在切换 macOS Spaces 或睡眠、唤醒过程中卡住或掉帧。

Onward 的代码仓库从底层解决这些问题：

- **自定义渲染策略：** [WebGL 上下文池化和共享字形缓存策略](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/blob/9ca91e06278de3bcc2d0c4fad3eaf57c09e7ca4b/src/terminal/terminal-renderer-surface-policy.ts#L10-L72)。

- **GPU 恢复能力：** 专门的 [Apple Silicon GPU 唤醒恢复逻辑](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/blob/9ca91e06278de3bcc2d0c4fad3eaf57c09e7ca4b/electron/main/gpu-crash-recovery.ts)，防止取消隐藏窗口后出现空白屏幕和重绘卡死。

- **严格测试：** 内置 [IPC/PTY 压力测试工具](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/blob/9ca91e06278de3bcc2d0c4fad3eaf57c09e7ca4b/src/autotest/test-terminal-stress.ts)、[睡眠与唤醒长时间稳定性测试](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/blob/9ca91e06278de3bcc2d0c4fad3eaf57c09e7ca4b/test/autotest/run-gpu-wake-park-soak.sh)，以及严格的 [CI 验证检查](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/actions/runs/41593696273)。

![](/images/stop-being-a-human-router-why-i-switched-to-onward/local-multi-agent-workflow.png)

*图 6：下载 Onward，让本地多智能体开发循环更顺畅。*

## 结论

如果你的日常开发环境在本地，需要不断创建 `git worktree` 实例、并行调度编码和测试智能体，并实时审查代码差异，那么原始终端窗口正在拖慢你的速度。

今天就[**下载 Onward**](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/releases)。下次修复缺陷时打开两个窗格，广播基础约束，再直接在工作台中审查补丁。你不会再想回到过去。

👉 [**Onward GitHub 仓库**](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench) | [**下载最新版本**](https://github.com/OPPO-PersonalAI/Onward-Agent-Workbench/releases)
