import { createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export interface ProviderConfig {
  id: string;
  name: string;
  apiBase: string;
  apiKey: string;
  model?: string;
}

const providerCache: Record<string, ReturnType<typeof createOpenAI>> = {};

export function getProviderForConfig(config: ProviderConfig) {
  if (!providerCache[config.id]) {
    providerCache[config.id] = createOpenAI({
      baseURL: `${config.apiBase}/v1`,
      apiKey: config.apiKey,
    });
  }
  return providerCache[config.id];
}

export function getModelForProvider(config: ProviderConfig, modelId: string) {
  const provider = getProviderForConfig(config);
  return provider(modelId);
}

export function getProviderModel(modelId: string) {
  if (modelId.startsWith("gpt-")) return createOpenAI()(modelId);
  if (modelId.startsWith("claude-")) return anthropic(modelId);
  if (modelId.startsWith("gemini-")) return google(modelId);
  throw new Error(`Unsupported model: ${modelId}`);
}