interface LlmMessage {
  role: "system" | "user";
  content: string;
}

export async function maybeGenerateWithLlm(messages: LlmMessage[]): Promise<string | undefined> {
  const apiKey = process.env.GROQ_API_KEY ?? process.env.LLM_API_KEY;

  if (!apiKey) return undefined;

  return callGroq(messages, apiKey);
}

async function callGroq(messages: LlmMessage[], apiKey: string): Promise<string | undefined> {
  const model = process.env.GROQ_MODEL ?? process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.25,
      max_completion_tokens: 900
    })
  });

  if (!response.ok) throw new Error(`Groq request failed with ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content;
}
