import { tool } from "ai";
import { z } from "zod";
import { searchEmails, getEmail } from "./gmail";

export const tools = {
  searchEmails: tool({
    description:
      "Search Gmail for market newsletter emails. Use sender, subject keywords, or label to filter. Returns a list of matching emails with id, subject, and sender.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Gmail search query, e.g. "from:newsletter@morningbrew.com" or "subject:markets"'
        ),
      maxResults: z
        .number()
        .default(10)
        .describe("Maximum number of emails to return"),
    }),
    execute: async ({ query, maxResults }: { query: string; maxResults: number }) => {
      return await searchEmails(query, maxResults);
    },
  }),

  getEmail: tool({
    description:
      "Fetch the full plain-text body of an email by its message ID. Use this after searchEmails to read the actual newsletter content.",
    inputSchema: z.object({
      messageId: z.string().describe("The Gmail message ID from searchEmails"),
    }),
    execute: async ({ messageId }: { messageId: string }) => {
      return await getEmail(messageId);
    },
  }),
};
