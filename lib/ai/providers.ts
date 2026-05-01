import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export function getProviderModel(modelId: string) {
  if (modelId.startsWith("gpt-")) return openai(modelId);
  if (modelId.startsWith("claude-")) return anthropic(modelId);
  if (modelId.startsWith("gemini-")) return google(modelId);
  throw new Error(`Unsupported model: ${modelId}`);
}