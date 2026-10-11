---
title: "Designing Useful AI Agents: Start with Boundaries (Demo)"
description: "Clear task boundaries, verifiable tool results, and explicit failure paths help make agents reliable collaborators."
date: "2026-10-08"
tags: ["AI Engineering", "System Design"]
category: "AI Engineering"
readingTime: "5 min"
featured: true
demo: true
lang: en
---

This is a demo article created to showcase the blog's content and layout. It does not represent Raymond's real projects or opinions.

## Define completion before designing the loop

An agent's usefulness starts with whether its work can be checked. Replacing "research this for me" with "compare three options, including sources, constraints, and open questions" makes the inputs, deliverable, and stopping condition clear. The design should also distinguish between a completed task, a task waiting for the user, and an execution failure. A fluent response alone does not establish that the work is done.

Before building an agent, try solving the same task with an ordinary function. If the workflow is fixed and has few branches, direct orchestration is often easier to maintain. Model-based decisions become worthwhile when choosing the next step requires interpreting information from the environment.

## Keep tools focused and explicit

Tool names, parameters, and return values form a contract between the agent and its environment. Each tool should ideally have one responsibility and return structured status, verifiable results, and the error details needed to act on a failure. Design read operations separately from write operations. Combining "retrieve a draft" and "send a message" makes both permissions and testing harder to reason about.

External web pages and documents can supply task data, but they cannot authorize changes to the task or expand the agent's permissions. The execution layer should check authorization independently, rather than relying only on the model to follow instructions in a prompt.

## Set an execution budget

Steps, elapsed time, and cost all need limits. The following code demonstrates only step and deadline checks. A production system should also check tool permissions and resource budgets:

```ts
type Budget = { stepsLeft: number; deadline: number };

function takeStep(budget: Budget): void {
  if (budget.stepsLeft <= 0 || Date.now() >= budget.deadline) {
    throw new Error("Execution budget exhausted");
  }
  budget.stepsLeft -= 1;
}
```

When the budget runs out, preserve completed results and explain what is blocking further progress. Before retrying an operation, determine whether it is safe to repeat. For operations with side effects, such as sending a message or making a payment, a missing response is not enough reason to try again blindly.

## Make failures inspectable

Logs should capture the task identifier, tool name, duration, error category, and state transitions, while avoiding secrets and unnecessary personal data. Alongside successful cases, the evaluation set should cover empty results, conflicting sources, tool timeouts, and users canceling a task midway through. The final deliverable must be traceable to evidence, rather than merely looking plausible.

## Pre-launch checklist

- [ ] Completion criteria can be verified directly by tests or a person
- [ ] Operations that make changes have authorization checked at the execution layer
- [ ] Timeouts, cancellation, and exhausted budgets have explicit exit paths
- [ ] Retry policies distinguish read-only operations from operations with side effects
- [ ] Logs exclude sensitive data, and failure cases are included in regression tests

Make one real task path reliable before gradually expanding the agent's capabilities. Knowing when to stop is an important capability in its own right.
