import { config } from "dotenv";
config({ path: ".env.local" });
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  baseURL: "https://ai-gateway.vercel.sh/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

async function main() {
  const { textStream, usage } = await streamText({
    model: openai("openai/gpt-5.4"),
    prompt: "Say hello and introduce yourself in one sentence.",
  });

  for await (const chunk of textStream) {
    process.stdout.write(chunk);
  }

  const u = await usage;
  console.log("\n\n--- Token Usage ---");
  console.log(`Input:  ${u.inputTokens}`);
  console.log(`Output: ${u.outputTokens}`);
}

main().catch(console.error);
