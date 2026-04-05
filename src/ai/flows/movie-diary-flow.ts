
'use server';
/**
 * @fileOverview A Genkit flow that generates an AI-powered movie diary entry.
 *
 * - generateMovieDiaryEntry - A function that auto-generates a journal entry after watching a movie.
 * - MovieDiaryInput - The input type for the diary generation.
 * - MovieDiaryOutput - The return type for the diary generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MovieDiaryInputSchema = z.object({
  title: z.string().describe('The title of the movie.'),
  genres: z.array(z.string()).describe('Genres of the movie.'),
  rating: z.number().optional().describe('User rating for the movie.'),
  notes: z.string().optional().describe('User notes about the movie.')
});
export type MovieDiaryInput = z.infer<typeof MovieDiaryInputSchema>;

const MovieDiaryOutputSchema = z.object({
  journalText: z.string().describe('A short, catchy diary entry text reflecting the experience.'),
  summary: z.string().describe('A brief, one-sentence summary of the movie experience.'),
  mood: z.string().describe('The cinematic mood of the film (e.g., Intense, Heartwarming, Gritty).'),
});
export type MovieDiaryOutput = z.infer<typeof MovieDiaryOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateMovieDiaryPrompt',
  input: { schema: MovieDiaryInputSchema },
  output: { schema: MovieDiaryOutputSchema },
  prompt: `You are a sophisticated AI cinematic diarist. Your task is to generate a personal journal entry for a user who just watched a movie.

Movie Details:
- Title: {{{title}}}
- Genres: {{#each genres}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- User Rating: {{{rating}}} Stars
- User Initial Notes: {{{notes}}}

Generate a structured diary entry that includes:
1. A short, engaging "journalText" (e.g., "You watched a thriller today and rated it 4 stars — intense experience!").
2. A brief, one-sentence "summary" of why the movie worked (or didn't) based on the genre and rating.
3. A single word or short phrase for the "mood" of the cinematic experience.

Be evocative, concise, and professional.`,
});

export const movieDiaryFlow = ai.defineFlow(
  {
    name: 'movieDiaryFlow',
    inputSchema: MovieDiaryInputSchema,
    outputSchema: MovieDiaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function generateMovieDiaryEntry(input: MovieDiaryInput): Promise<MovieDiaryOutput> {
  return movieDiaryFlow(input);
}
