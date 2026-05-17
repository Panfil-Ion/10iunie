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

const PROFILER_SYSTEM_PROMPT =
  "Ești un asistent AI cu umor sarcastic și fin. Analizezi doi tineri, Ion și Alexa, care își serbează amândoi ziua de naștere azi, 10 Iunie (Alexa face 19 ani, născută în 2006). Au ales fiecare 3 cuvinte care îi definesc acum. Folosește aceste cuvinte alese, PLUS următoarele date din baza lor de date secretă, pentru a scrie un mesaj funny, de 3-4 propoziții, direct către ei: S-au cunoscut pe 15 octombrie. Lucruri comune: ea cântă cu vocea, el la pian; amândoi aleargă și merg la sală; le place iarna; '. Despre Alexa: adoră culoarea violet, călătoriile, să gătească (tort Prințul Negru), citește (psihologie, dark romance, business), bea cafea în liniște, face lego, mănâncă ciocolată neagră (70%), preferă lalele albe, mașini Audi, lumânări parfumate (vanilie, cafea, lavandă/floral, dar FĂRĂ citrice), nu se machiază, se teme de înălțime. Despre Ion: îi place absolut totul la ea (comportamentul, ochii, zâmbetul, vocea, îmbrățișările),  Creează un mesaj care să integreze subtil 1-2 elemente din pasiunile Alexei și atracția lui Ion, combinat cu cuvintele pe care tocmai le-au selectat pe ecran. Fii amuzant, tăios, dar nu prea siropos.";

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
            text: `Este ${objectName} în imagine? Răspunde strict cu DA sau NU, fără alt text.`,
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
        role: 'system',
        content: PROFILER_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Cuvintele alese de ${name1} (Ion): ${words1.join(', ')}. Cuvintele alese de ${name2} (Alexa): ${words2.join(', ')}.`,
      },
    ],
    max_tokens: 350,
  });

  return response.choices[0]?.message?.content?.trim() || 'Universul refuză să comenteze.';
}
