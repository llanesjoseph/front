'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting the most likely incident location based on a description of the incident.
 *
 * - suggestIncidentLocation - A function that accepts an incident description and returns a suggested location.
 * - SuggestIncidentLocationInput - The input type for the suggestIncidentLocation function.
 * - SuggestIncidentLocationOutput - The return type for the suggestIncidentLocation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestIncidentLocationInputSchema = z.object({
  incidentDescription: z.string().describe('A description of the incident.'),
});
export type SuggestIncidentLocationInput = z.infer<typeof SuggestIncidentLocationInputSchema>;

const SuggestIncidentLocationOutputSchema = z.object({
  suggestedLocation: z.string().describe('The AI-suggested location for the incident.'),
});
export type SuggestIncidentLocationOutput = z.infer<typeof SuggestIncidentLocationOutputSchema>;

export async function suggestIncidentLocation(input: SuggestIncidentLocationInput): Promise<SuggestIncidentLocationOutput> {
  return suggestIncidentLocationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestIncidentLocationPrompt',
  input: {schema: SuggestIncidentLocationInputSchema},
  output: {schema: SuggestIncidentLocationOutputSchema},
  prompt: `Based on the incident description: {{{incidentDescription}}}, what is the most likely location for this incident?  Return only the location name.`,
});

const suggestIncidentLocationFlow = ai.defineFlow(
  {
    name: 'suggestIncidentLocationFlow',
    inputSchema: SuggestIncidentLocationInputSchema,
    outputSchema: SuggestIncidentLocationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
