import { Agent } from "@convex-dev/agent";
import { google } from "@ai-sdk/google";
import { components } from "../../_generated/api";
import { getSystemPrompt } from "./types";

export const expenseAgent = new Agent(components.agent, {
  name: "Expense Parser",
  languageModel: google("gemini-3.1-flash-image-preview"),
  instructions: getSystemPrompt(new Date().toISOString().split("T")[0]),
});
