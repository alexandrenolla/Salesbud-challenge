// Prompt for Stage 1: Individual extraction from each transcript
export const EXTRACTION_PROMPT = `
You are a specialized sales analyst. Analyze this sales meeting transcript.

TRANSCRIPT:
{transcript}

MEETING OUTCOME: {outcome}

Extract the following information in JSON format:

1. **seller_questions**: List of questions asked by the seller
   - question: question text
   - client_response_length: short/medium/long
   - generated_interest: true/false

2. **engagement_moments**: Moments where the client showed interest
   - quote: exact excerpt
   - indicator: what indicates interest (asked more, requested demo, etc)

3. **objections**: Objections raised by the client
   - objection: objection text
   - seller_response: how the seller responded
   - objection_resolved: true/false

4. **client_pain_points**: Pain points/problems mentioned by the client

5. **buying_signals**: Identified buying signals

Return ONLY valid JSON, without markdown.

IMPORTANT: Always respond in Brazilian Portuguese (pt-br), without additional explanations.
`;

// Prompt for Stage 2: Comparative analysis (won vs lost)
export const COMPARATIVE_ANALYSIS_PROMPT = `
You are a sales strategist. Compare the extracted data from WON vs LOST meetings.

DATA FROM WON MEETINGS:
{won_extractions}

DATA FROM LOST MEETINGS:
{lost_extractions}

Analyze and identify patterns. Return JSON with:

1. **winning_patterns**: What won meetings have in common
   - pattern: pattern description
   - frequency: how many won meetings it appeared in
   - evidence: concrete examples

2. **losing_patterns**: What lost meetings have in common
   - pattern: pattern description
   - frequency: how many lost meetings it appeared in
   - evidence: concrete examples

3. **effective_questions**: Questions that appear more in won meetings
   - question: the question
   - success_rate: % appearance in won vs lost
   - why_it_works: hypothesis of why it works

4. **critical_objections**: Most common objections
   - objection: the objection
   - successful_responses: responses that worked (from won meetings)
   - failed_responses: responses that didn't work (from lost meetings)

5. **engagement_triggers**: What makes the client engage
   - trigger: description
   - how_to_replicate: how to replicate

Return ONLY valid JSON, without markdown.

IMPORTANT: Always respond in Brazilian Portuguese (pt-br), without additional explanations.
`;

// Prompt for Stage 3: Playbook content generation
export const PLAYBOOK_GENERATION_PROMPT = `
You are a sales enablement specialist. Based on the comparative analysis, generate PRACTICAL and ACTIONABLE content for a sales playbook.

COMPARATIVE ANALYSIS:
{comparative_analysis}

Generate playbook content in JSON:

1. **opening_script**: Suggested script for meeting opening
   - script: script text (2-3 paragraphs)
   - key_elements: essential elements to include
   - avoid: what to avoid

2. **discovery_questions**: Top 5 discovery questions
   For each question:
   - question: the question
   - purpose: question objective
   - expected_response: expected response type
   - follow_up: suggested follow-up question
   - timing: when to ask (e.g., "after initial rapport")

3. **objection_handling**: Objection handling guide
   For each common objection:
   - objection: the objection
   - recommended_response: recommended response
   - alternative_response: alternative response
   - what_not_to_say: what NOT to say
   - success_evidence: evidence that it works

4. **engagement_tactics**: Tactics to generate engagement
   - tactic: description
   - when_to_use: ideal situation
   - example: practical example

5. **closing_checklist**: Checklist before attempting to close
   - item: what to verify
   - why: why it's important

6. **red_flags**: Warning signs during the meeting
   - flag: the sign
   - what_it_means: what it indicates
   - how_to_recover: how to try to recover

Return ONLY valid JSON, without markdown.
Content must be specific and based on the analyzed data, NOT generic.

IMPORTANT: Always respond in Brazilian Portuguese (pt-br), without additional explanations.
`;

// Helper to replace placeholders
export function buildPrompt(
  template: string,
  variables: Record<string, string>,
): string {
  let prompt = template;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return prompt;
}
