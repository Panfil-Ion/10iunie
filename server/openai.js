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

const PROFILER_SYSTEM_PROMPT = `Ești un narator extrem de amuzant, creativ și fin observator. Sarcina ta este să creezi o poveste scurtă, naturală și foarte comică despre doi prieteni, Ion și Alexa, care își serbează ziua de naștere în aceeași zi: 10 Iunie (Ion face 23 de ani, Alexa face 20).

REGULA 1: Povestea TREBUIE să înceapă cu "A fost odată ca niciodată", dar să continue imediat cu o situație absolut normală de zi cu zi care devine foarte amuzantă prin simplul dialog și contrastul dintre ei. (FĂRĂ magii, FĂRĂ obiecte zburătoare, FĂRĂ exagerări absurde).
REGULA 2: Integrează perfect și natural cele 3 cuvinte selectate de utilizator.
REGULA 3 (DATELE SECRETE - Integrează-le pe toate organic și cu umor):
- S-au cunoscut pe 15 octombrie.
- Ion: Este în IT, lucrează ca bucătar la hotel, face copywriting cu americanii, cântă la 8 instrumente, practică 4 sporturi și știe să jongleze cu 3 obiecte. 
- Alexa: Vrea să-și păstreze mereu vibe-ul relaxat bând "cafeluța cu liniște", citește Dark Romance și Business. Refuză să se machieze, se teme de înălțime, croșetează și visează să aibă un Audi. poate canta foarte frumos cu vocea. II place sa faca lego
- Puncte comune: Amândoi iubesc iarna, culoarea violet, sportul.
- Preferințe specifice: Tortul suprem al Alexei este "Prințul Negru", iar ciocolata trebuie să fie strict 70% cacao. Adoră lumânările parfumate (vanilie, cafea, lavandă), dar URĂȘTE mirosul de citrice.
REGULA 4 (ZERO PRESIUNE ROMANTICĂ): Fără absolut nicio subtilitate de dragoste. Sunt doar doi prieteni buni, cu vieți complet diferite, care se tachinează reciproc cu foarte mult umor. Fă mișto de amândoi în mod egal și inteligent.
REGULA 5 (LIMBAJ NATURAL): Scrie într-o limbă română fluentă, modernă și de zi cu zi. Păstrează un ton prietenos, inteligent și foarte funny.

Finalizează povestea cu un "La mulți ani" prietenos și auto-ironic pentru 10 Iunie.`;

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
        content: `Cuvintele alese de ${name1}: ${words1.join(', ')}. Cuvintele alese de ${name2}: ${words2.join(', ')}. Scrie povestea completă acum.`,
      },
    ],
    max_tokens: 1200,
  });

  return response.choices[0]?.message?.content?.trim() || 'A fost odată ca niciodată… universul a uitat să scrie restul poveștii. La mulți ani de 10 Iunie!';
}
