---
lang: zh
title: "流式响应卡住了？从字节到界面逐层排查（演示）"
description: "区分传输、解码、协议解析和渲染，用可观测的证据定位流式响应问题。"
date: "2026-10-02"
tags: ["Developer Tools", "AI Engineering", "Web Development"]
category: "Developer Tools"
readingTime: "5 min"
featured: false
demo: true
---

这是一篇演示文章，用于展示博客的内容和排版，不代表 Raymond 的真实项目或观点。

## 先描述具体症状

“流式输出失效”可能意味着首字节迟迟未到、收到数据却没有显示、字符乱码，或连接结束后仍显示加载状态。先记录请求开始、响应头到达、首个数据块和结束的时间，再确定停滞发生在哪一层。没有时间线，调试很容易变成同时修改多个地方。

## 把链路拆开观察

分别检查上游生成、服务端写入、代理转发、浏览器读取和界面渲染。开发者工具中看到分批到达的数据，而页面仍整段出现时，应重点检查解析和渲染；若浏览器只在最后收到数据，则需要继续确认服务端与中间层是否缓冲。

一次只改变一个条件，例如绕过开发代理进行对照，或用固定间隔输出的测试端点替代复杂业务。记录差异比凭感觉调整超时更有价值。

## 数据块不是完整消息

网络数据块的边界并不保证与字符或业务事件边界一致。下面的示例仅演示读取与增量解码；实际使用时还需要检查响应状态和协议：

```ts
async function inspectText(response: Response) {
  if (!response.body) throw new Error("Missing body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.debug(decoder.decode(value, { stream: true }));
    }
    console.debug(decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
```

增量解码需要保留跨数据块的字节状态，结束后再刷新解码器，具体行为可参考 [MDN 的解码说明](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/decode)。示例中的内容日志只适合本地合成数据，线上应改为长度、时间等脱敏指标。

## 协议与界面分开验证

得到文本后，还要按应用协议积累缓冲并识别完整事件，不能对每个数据块直接解析 JSON。为解析器准备跨块切分、连续多条事件、空行和提前断开的测试。再用已经解析好的事件单独测试界面，确认状态更新、取消和结束标记都被正确处理。

## 最小排查清单

- [ ] 记录首字节、首个事件与结束时间
- [ ] 检查状态码、响应类型和错误响应体
- [ ] 用故意切碎的多字节文本测试解码
- [ ] 覆盖中途断开、用户取消和正常结束
- [ ] 重连前确认不会重复执行有副作用的请求

最终应能回答两个问题：最后一层正常工作的地方在哪里，下一层期待收到什么。问题边界清楚以后，修复通常会更小，也更容易证明有效。
