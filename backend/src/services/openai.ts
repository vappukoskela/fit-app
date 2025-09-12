import { OpenAI } from 'openai';

console.log('API Key:', process.env.TEST_API_KEY); // Debugging line to check if the API key is loaded  

const openai = new OpenAI({
  apiKey: process.env.TEST_API_KEY,
});

// Example usage
export async function getChatResponse(prompt: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content;
}