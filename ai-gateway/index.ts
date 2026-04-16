import { config } from "dotenv";
config({ path: "../.env.local" });

import { streamText } from "ai";

async function main() {
  const result = streamText({
    model: "openai/gpt-5.4",
    prompt: "Say hello and introduce yourself in one sentence.",
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  const u = await result.usage;
  console.log("\n\n--- Token Usage ---");
  console.log(`Input:  ${u.inputTokens}`);
  console.log(`Output: ${u.outputTokens}`);
}

main().catch(console.error);
