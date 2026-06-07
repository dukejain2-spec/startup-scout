// ===========================================================================
// STARTUP SCOUT - an AI agent that researches a startup idea, then CHECKS
// its own work and improves it until it is good enough.
//
// There are two loops here:
//   1. INNER loop  - inside writeDraft/revise, the AI searches the web as many
//                    times as it needs (handled by the AI SDK).
//   2. OUTER loop  - the reflection loop we write ourselves in main():
//                    draft -> critic checks it -> revise -> check again ...
//
// Everything is kept basic on purpose so it is easy to read.
// ===========================================================================

import "dotenv/config";
import { generateText, generateObject, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { writeFileSync } from "fs";


// The idea you want to research. Change this line for a different idea.
const idea = "an AI tutor that quizzes Indian students for board exams";

// Which AI model to use.
const model = anthropic("claude-sonnet-4-6");


// ---------------------------------------------------------------------------
// The instructions for the writer (its job description).
// ---------------------------------------------------------------------------
const instructions = `
You are Startup Scout, a helpful and honest startup analyst.

Research the startup idea using web search. Find out:
- how big the market is
- who the main competitors are
- what the biggest risks are

Then write a short one-page report with these sections:
- Summary
- The problem it solves
- Market size
- Competitors
- Risks
- Verdict (be honest, and give a score out of 10)

Write the full report as your reply (do not leave anything out).
`;


// ---------------------------------------------------------------------------
// JOB 1: Write the first draft of the report (this part can search the web).
// ---------------------------------------------------------------------------
async function writeDraft(idea: string): Promise<string> {
  const result = await generateText({
    model: model,
    system: instructions,
    prompt: "Research and write the report for this idea: " + idea,
    tools: {
      web_search: anthropic.tools.webSearch_20260209(),
    },
    stopWhen: stepCountIs(8),
    onStepFinish: (step) => {
      if (step.toolCalls.length > 0) {
        console.log("   (searching the web...)");
      }
    },
  });
  return result.text;
}


// ---------------------------------------------------------------------------
// JOB 2: The CRITIC. It reads a draft and judges whether it is good enough.
// generateObject makes the AI answer in a fixed shape (score, goodEnough,
// feedback) instead of free text, so our code can easily use the result.
// ---------------------------------------------------------------------------
const reviewShape = z.object({
  score: z.number().describe("Quality score from 1 to 10"),
  goodEnough: z.boolean().describe("true only if this is genuinely ready to send to an investor"),
  feedback: z.string().describe("Clear, specific suggestions for what to improve"),
});

async function critique(draft: string) {
  const result = await generateObject({
    model: model,
    schema: reviewShape,
    system: "You are a strict, experienced startup editor. Judge the report harshly but fairly. Only mark it good enough if it truly is.",
    prompt: "Evaluate this startup report. Is it good enough to send to an investor?\n\n" + draft,
  });
  return result.object;
}


// ---------------------------------------------------------------------------
// JOB 3: Rewrite the report using the critic's feedback (can search again).
// ---------------------------------------------------------------------------
async function revise(draft: string, feedback: string): Promise<string> {
  const result = await generateText({
    model: model,
    system: instructions,
    prompt:
      "Here is a draft report:\n\n" + draft +
      "\n\nAn editor gave this feedback:\n\n" + feedback +
      "\n\nRewrite the report to fix every point in the feedback. " +
      "You may use web search if you need more facts. Output the full improved report.",
    tools: {
      web_search: anthropic.tools.webSearch_20260209(),
    },
    stopWhen: stepCountIs(6),
    onStepFinish: (step) => {
      if (step.toolCalls.length > 0) {
        console.log("   (searching the web...)");
      }
    },
  });
  return result.text;
}


// ---------------------------------------------------------------------------
// PUT IT ALL TOGETHER: write -> check -> improve -> check -> ...
// ---------------------------------------------------------------------------
async function main() {
  console.log("Researching idea:", idea);
  console.log("Please wait, this can take a minute...\n");

  // 1. Write the first draft.
  let draft = await writeDraft(idea);
  console.log("First draft is ready.\n");

  // 2. The reflection loop: check the draft, and improve it up to 3 times.
  const maxRounds = 3;
  for (let round = 1; round <= maxRounds; round++) {
    console.log("===== Review round " + round + " =====");

    const review = await critique(draft);
    console.log("Critic's score:", review.score, "/ 10");
    console.log("Critic's feedback:", review.feedback, "\n");

    // If the critic is happy, stop early.
    if (review.goodEnough) {
      console.log("The critic approved the report. Stopping early.\n");
      break;
    }

    // Otherwise, rewrite it using the feedback and loop again.
    console.log("Not good enough yet. Revising the report...\n");
    draft = await revise(draft, review.feedback);
  }

  // 3. Save the final version.
  writeFileSync("report.md", draft);
  console.log("Done! The final report was saved to report.md");
}

main();
