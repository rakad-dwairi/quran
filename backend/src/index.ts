import "dotenv/config";
import { startFlowServer } from "@genkit-ai/express";
import { aiTafsirFlow } from "./aiTafsirFlow";

const port = Number(process.env.PORT || 3500);

startFlowServer({
  flows: [aiTafsirFlow],
  port,
  cors: {
    origin: "*",
  },
});

// eslint-disable-next-line no-console
console.log(`AI server running on http://localhost:${port}/aiTafsirFlow`);

