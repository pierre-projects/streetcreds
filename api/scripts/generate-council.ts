// Drafts plain-language council summaries and quiz questions from pasted agenda text.
// Prints drafts for a human to check. Never writes api/src/quests/council.json.
//
// Usage (from api/):
//   npx tsx --env-file-if-exists=.env scripts/generate-council.ts path/to/agenda.txt
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { env, requireEnv } from '../src/lib/env';
import { withLimit } from '../src/points/withLimit';

const DRAFT_LIMIT_MS = 30_000;

const DraftSchema = z.object({
  drafts: z.array(
    z.object({
      title: z.string().min(1),
      summary: z.string().min(1),
      question: z.string().min(1),
      options: z.array(z.string().min(1)).min(3).max(4),
      answerIndex: z.number().int().min(0),
    }),
  ),
});

const DRAFT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    drafts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 4 },
          answerIndex: { type: 'integer', minimum: 0 },
        },
        required: ['title', 'summary', 'question', 'options', 'answerIndex'],
      },
    },
  },
  required: ['drafts'],
} as const;

const DRAFT_PROMPT = `You help write a civic quiz from a real city council agenda.
Read the agenda text the user pasted. For each substantive consent or non-consent
item (skip call to order, minutes, public appearances rules, adjournment, and
purely procedural headers), draft:

- title: a short plain title (keep the agenda item code when present, e.g. 7B8)
- summary: exactly three plain-language sentences. Use only facts in the agenda
  text. Do not invent numbers, dates, places, or outcomes.
- question: one multiple-choice question a resident could answer from the summary
- options: three or four short answer strings
- answerIndex: zero-based index of the correct option

Return JSON only matching the schema. Prefer about three strong items if the
agenda is long; never invent agenda content that is not in the text.`;

async function main(): Promise<void> {
  const agendaPath = process.argv[2];
  if (!agendaPath) {
    console.error('Usage: npx tsx --env-file-if-exists=.env scripts/generate-council.ts <agenda.txt>');
    console.error('Prints drafts only. Do not auto-write council.json; paste checked items by hand.');
    process.exit(1);
  }

  requireEnv('GEMINI_API_KEY');
  const agendaText = await readFile(agendaPath, 'utf8');
  if (!agendaText.trim()) {
    console.error(`Agenda file is empty: ${agendaPath}`);
    process.exit(1);
  }

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  const interaction = await withLimit(
    ai.interactions.create({
      model: env.GEMINI_MODEL,
      input: [
        {
          type: 'user_input',
          content: [
            { type: 'text', text: DRAFT_PROMPT },
            { type: 'text', text: agendaText },
          ],
        },
      ],
      response_format: { type: 'text', mime_type: 'application/json', schema: DRAFT_JSON_SCHEMA },
    }),
    DRAFT_LIMIT_MS,
  );

  const text =
    typeof (interaction as { output_text?: string }).output_text === 'string'
      ? (interaction as { output_text: string }).output_text
      : JSON.stringify(interaction);

  const parsed = DraftSchema.parse(JSON.parse(text));
  for (const draft of parsed.drafts) {
    if (draft.answerIndex < 0 || draft.answerIndex >= draft.options.length) {
      throw new Error(`Draft "${draft.title}" has answerIndex out of range.`);
    }
  }

  console.log('=== DRAFTS ONLY — check against the official agenda, then paste into council.json ===');
  console.log('=== This script never writes council.json ===');
  console.log(JSON.stringify(parsed.drafts, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
