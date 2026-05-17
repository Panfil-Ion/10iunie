import OpenAI from 'openai';

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function verifyObjectInImage(base64, objectName) {
  const openai = getClient();
  const imageUrl = base64.startsWith('data:')
    ? base64
    : `data:image/jpeg;base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Este un ${objectName} în imagine? Răspunde strict cu DA sau NU, fără alt text.`,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'low' },
          },
        ],
      },
    ],
    max_tokens: 10,
  });

  const text = (response.choices[0]?.message?.content || 'NU').trim().toUpperCase();
  return text.includes('DA') ? 'DA' : 'NU';
}

export async function generateProfilerAnalysis(name1, words1, name2, words2) {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `Fă o scurtă analiză sarcastică, extrem de amuzantă, în 2-3 propoziții, a acestor două persoane de ziua lor, pe baza cuvintelor: ${name1} (${words1.join(', ')}) vs ${name2} (${words2.join(', ')}). Scrie în română.`,
      },
    ],
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content?.trim() || 'Universul refuză să comenteze.';
}
