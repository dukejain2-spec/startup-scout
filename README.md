# 🔍 Startup Scout

A simple **AI agent** that researches a startup idea and writes a one-page
report. You give it one line; it searches the live web, figures out the market,
competitors, and risks, and saves a report — deciding the steps on its own.

Built with the **Vercel AI SDK** and **Claude** (Anthropic).

## What makes it an *agent*, not a chatbot

A chatbot does one thing: text in → text out, once.
An agent is given a **goal** and then runs a **loop**, choosing **tools** until
the goal is done:

```
  goal ─►  Claude thinks ─► uses a tool ─► reads the result ─► thinks again ─► ... ─► done
```

We never tell it "search, then write." It decides the order itself. We only set
the goal and a safety limit on the number of steps.

## The tools it can use

| Tool | What it does |
|------|--------------|
| `web_search` | searches the live web (runs on Anthropic's side) |
| `saveReport` | our own function that saves the final report to a file |

## Run it

```bash
npm install
# put your key in .env :  ANTHROPIC_API_KEY=sk-ant-...
npm run scout
```

To research a different idea, just change the `idea` line near the top of
`src/scout.ts`. The report is saved to `report.md`.

## Files

| File | Purpose |
|------|---------|
| `src/scout.ts` | the whole agent: idea, tool, instructions, and the loop |
| `src/lesson1-hello.ts` | a single AI call — the basic building block |
