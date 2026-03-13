import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// apiKey defaults to process.env.ANTHROPIC_API_KEY; the SDK will throw a
// clear error at call time if the key is missing, after auth has already run.
export const anthropic = new Anthropic();
