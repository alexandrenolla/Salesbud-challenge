// Prompt for outcome detection from uploaded transcript
export const OUTCOME_DETECTION_PROMPT = `Analyze the sales meeting transcript below and determine the outcome.

TRANSCRIPT:
{transcript}

SIGNS OF WON SALE:
- Client requests proposal/contract
- Scheduling of concrete next steps
- Client expresses clear interest in moving forward
- Discussion of implementation/onboarding

SIGNS OF LOST SALE:
- Client says they will "think about it" without commitment
- Unresolved objections
- Client mentions competitors as preference
- Request to send material "by email" without follow-up

Respond ONLY with valid JSON:
{
  "outcome": "won" or "lost",
  "confidence": "high", "medium" or "low",
  "reason": "brief justification"
}

IMPORTANT: Always respond in Brazilian Portuguese (pt-br), without additional explanations.`;
