/**
 * LESSON 1 — The atom: a single model call.
 *
 * Before we build an "agent", understand the one thing agents are made of:
 * sending text to a model and getting text back. That's it. No magic.
 *
 * An agent is just THIS, called in a loop, with the ability to use tools.
 * We'll add those one at a time in lessons 2 and 3.
 */

import "dotenv/config"; // loads ANTHROPIC_API_KEY from the .env file into process.env
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

async function main() {
  // `generateText` does ONE round trip: prompt in -> text out.
  const result = await generateText({
    // Haiku = small, fast, cheap. Perfect while learning. We'll switch to
    // a bigger model (Sonnet) later when we want higher-quality research.
    model: anthropic("claude-haiku-4-5-20251001"),

    // A "system" message sets the model's role/behavior for the whole call.
    system: "You are a concise startup analyst. Answer in 2-3 sentences.",

    // The "prompt" is the user's actual question.
    prompt: "What is a 'TAM' in startup terms, and why do investors care about it?",
  });

  console.log("\n--- MODEL REPLY ---\n");
  console.log(result.text);

  // Every call reports token usage — this is literally what you pay for.
  // Watching this number is how you keep an AI app affordable.
  console.log("\n--- TOKENS USED ---");
  console.log(result.usage);
}

main().catch((err) => {
  console.error("\nSomething went wrong:\n", err.message);
});
