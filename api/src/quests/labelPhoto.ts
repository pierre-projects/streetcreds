// Labels a street-problem photo with Gemini. Sarah's POST /reports calls this.
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import { CATEGORIES, SEVERITIES } from '../../../shared/constants';
import type { Category, Severity } from '../../../shared/types';
import { env, requireEnv } from '../lib/env';
import { ApiError } from '../lib/errors';
import { withLimit } from '../points/withLimit';
import { photoBucket, s3 } from './s3';

// A Gemini 3 model thinks before it answers, and with a photo that alone can pass 12 s. Thinking is
// set to low below, and the wait stays under the Lambda's 29 s, which also covers the S3 read.
const LABEL_LIMIT_MS = 20_000;

const LabelSchema = z.object({
  isStreetProblem: z.boolean(),
  category: z.enum(CATEGORIES as unknown as [Category, ...Category[]]),
  severity: z.enum(SEVERITIES as unknown as [Severity, ...Severity[]]),
  // The API ignores maxLength in the schema, so a longer sentence is cut here, not refused:
  // refusing it turned a good label into label_failed.
  description: z.string().transform((text) => (text.length > 140 ? text.slice(0, 139).trimEnd() + '…' : text)),
});

export type PhotoLabel = z.infer<typeof LabelSchema>;

const LABEL_JSON_SCHEMA = {
  type: 'object',
  properties: {
    isStreetProblem: { type: 'boolean' },
    category: { type: 'string', enum: [...CATEGORIES] },
    severity: { type: 'string', enum: [...SEVERITIES] },
    description: { type: 'string' },
  },
  required: ['isStreetProblem', 'category', 'severity', 'description'],
} as const;

const LABEL_PROMPT = `You are checking a photo sent to a city street-problem reporting game.
Decide whether it shows a problem in a public street, sidewalk or public space
that a city public works department could fix. A photo of a printed picture or
a screen showing such a problem counts.

Return JSON only.
- isStreetProblem: false if no such problem is visible (selfies, food, indoor
  scenes, pets, blank or unreadable photos).
- category: pothole (holes, cracks, broken road surface); streetlight (broken,
  leaning or dark streetlight or traffic signal); graffiti; blocked-sidewalk
  (a sidewalk blocked or made unusable by objects, plants, vehicles, scooters
  or damage); other (any other public street problem, such as dumped trash, a
  damaged sign or flooding).
- severity: low (cosmetic); medium (an inconvenience, or likely to get worse);
  high (a safety hazard right now).
- description: one plain sentence, at most 140 characters, describing only what
  is visible. Do not guess the location. Do not describe people, faces or
  license plates.
If isStreetProblem is false, use category "other", severity "low" and say in
the description what the photo shows instead.`;

async function streamToBase64(body: { transformToString: (encoding: string) => Promise<string> }): Promise<string> {
  return body.transformToString('base64');
}

/** Labels a JPEG already held as base64. Used by labelPhoto and by the label-photos script. */
export async function labelJpegBase64(base64Jpeg: string): Promise<PhotoLabel> {
  requireEnv('GEMINI_API_KEY');
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  try {
    const interaction = await withLimit(
      ai.interactions.create({
        model: env.GEMINI_MODEL,
        // The prompt and the photo go inside one `user_input` step. Sent as a bare list of content
        // parts, the API answers 400: "'image' is not supported for 'input[1].type' in v1".
        input: [
          {
            type: 'user_input',
            content: [
              { type: 'text', text: LABEL_PROMPT },
              { type: 'image', data: base64Jpeg, mime_type: 'image/jpeg' },
            ],
          },
        ],
        response_format: { type: 'text', mime_type: 'application/json', schema: LABEL_JSON_SCHEMA },
        // Sorting one photo into five categories needs little thought, and less thought is faster.
        generation_config: { thinking_level: 'low' },
      }),
      LABEL_LIMIT_MS,
    );
    const text =
      typeof (interaction as { output_text?: string }).output_text === 'string'
        ? (interaction as { output_text: string }).output_text
        : JSON.stringify(interaction);
    return LabelSchema.parse(JSON.parse(text));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logLabelFailure('gemini', error);
    throw new ApiError('label_failed');
  }
}

/**
 * One log line saying why labeling failed, since the player only ever sees `label_failed`.
 * It holds the error's name, status and a short message. Long runs of base64 are cut out, so the
 * photo can never end up in a log.
 */
function logLabelFailure(where: 'gemini' | 's3', error: unknown): void {
  const status = (error as { status?: unknown } | null)?.status;
  const message = (error instanceof Error ? error.message : String(error))
    .replace(/[A-Za-z0-9+/=]{80,}/g, '(data)')
    .slice(0, 300);
  console.error(
    JSON.stringify({
      level: 'error',
      where: `labelPhoto.${where}`,
      name: error instanceof Error ? error.name : 'Error',
      ...(typeof status === 'number' ? { status } : {}),
      message,
    }),
  );
}

export async function labelPhoto(photoKey: string): Promise<PhotoLabel> {
  try {
    const object = await s3.send(new GetObjectCommand({ Bucket: photoBucket(), Key: photoKey }));
    if (!object.Body) throw new ApiError('label_failed');
    const base64Jpeg = await streamToBase64(object.Body as { transformToString: (encoding: string) => Promise<string> });
    return await labelJpegBase64(base64Jpeg);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logLabelFailure('s3', error);
    throw new ApiError('label_failed');
  }
}
