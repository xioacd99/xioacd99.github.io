---
title: "Streaming Response Stuck? Debug from Bytes to UI (Demo)"
description: "Separate transport, decoding, protocol parsing, and rendering to diagnose streaming issues with observable evidence."
date: "2026-10-02"
tags: ["Developer Tools", "AI Engineering", "Web Development"]
category: "Developer Tools"
readingTime: "5 min"
featured: false
demo: true
lang: en
---

This is a demo article created to showcase the blog's content and layout. It does not represent Raymond's real projects or opinions.

## Describe the exact symptom first

"Streaming is broken" can mean a long wait for the first byte, data arriving without appearing on screen, garbled characters, or a loading indicator that remains after the connection ends. First record when the request starts, when response headers arrive, when the first chunk arrives, and when the stream ends. Then identify which layer has stalled. Without a timeline, debugging can easily turn into changing several things at once.

## Observe each part of the chain

Check upstream generation, server writes, proxy forwarding, browser reads, and UI rendering separately. If developer tools show data arriving in batches but the page displays everything at once, focus on parsing and rendering. If the browser receives data only at the end, investigate buffering on the server and in intermediate layers.

Change one condition at a time. For example, compare behavior with the development proxy bypassed, or replace complex application logic with a test endpoint that emits data at fixed intervals. Recording the differences is more useful than adjusting timeouts by intuition.

## Chunks are not complete messages

Network chunk boundaries do not necessarily align with characters or application events. The example below demonstrates only reading and incremental decoding. Real usage also requires checking the response status and protocol:

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

Incremental decoding must preserve byte state across chunks and flush the decoder when the stream ends. See [MDN's decoding documentation](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/decode) for the specific behavior. Logging content as this example does is appropriate only for local synthetic data. In production, use metrics that avoid sensitive content, such as lengths and timestamps.

## Validate the protocol and UI separately

After decoding text, accumulate it in a buffer according to the application protocol and identify complete events. Do not parse each incoming chunk directly as JSON. Test the parser with events split across chunks, multiple consecutive events, blank lines, and connections that close early. Then test the UI separately with already-parsed events to confirm that state updates, cancellation, and end markers are handled correctly.

## Minimal debugging checklist

- [ ] Record the times of the first byte, first event, and stream completion
- [ ] Check the status code, response type, and error response body
- [ ] Test decoding with multibyte text deliberately split into small chunks
- [ ] Cover interrupted connections, user cancellation, and normal completion
- [ ] Before reconnecting, confirm that requests with side effects will not be executed twice

The investigation should eventually answer two questions: What is the last layer that works correctly, and what does the next layer expect to receive? Once that boundary is clear, the fix is usually smaller and easier to verify.
