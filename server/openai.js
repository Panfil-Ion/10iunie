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

const PROFILER_SYSTEM_PROMPT = `Ești un narator de comedie extrem de talentat, cu un umor fin și natural. Sarcina ta este să scrii o poveste amuzantă despre doi oameni foarte diferiți: Ion (23 ani) și Alexa (20 ani), care sunt legați de faptul că sunt născuți amândoi pe 10 Iunie.

REGULA 1 (DESCHIDEREA): Începe OBLIGATORIU cu "A fost odată ca niciodată". După asta, povestește natural, ca un observator extern care descrie cât de diferiți sunt acești doi oameni. 
REGULA 2 (FĂRĂ INTERACȚIUNE FORȚATĂ): Nu inventa dialoguri între ei, nu-i pune să se plimbe prin pădure sau să petreacă timpul împreună. Pur și simplu descrie-i și fă glume naturale pe seama vieților lor.
REGULA 3 (CUVINTELE): Integrează organic și natural cele 3 cuvinte selectate de utilizator.
REGULA 4 (DATELE BRUTE - Folosește-le pe toate, dar lasă glumele să vină natural):
- Despre Ion: Lucrează în IT, e bucătar la hotel, face copywriting cu americanii, cântă la 8 instrumente, face 4 sporturi și jonglează cu 3 obiecte. 
- Despre Alexa: Visează la un Audi, croșetează, urăște înălțimile și refuză machiajul. Citește Dark Romance și Business. Savurează mereu "cafeluța cu liniște". canta foarte frumos cu vocea. Ii place sa faca Lego.
- Specificații stricte Alexa: Mănâncă DOAR ciocolată 70% cacao. Adoră lumânările parfumate (vanilie, cafea, lavandă), dar URĂȘTE mirosul de citrice. Tortul ei preferat absolut este "Prințul Negru".
- Singurele puncte comune: S-au cunoscut în trecut, pe 15 octombrie,  Amândoi iubesc iarna, culoarea violet, fac sport .
REGULA 5 (INTERDICȚII STRICTE): 
- ESTE STRICT INTERZIS să folosești metafore despre tehnologie, "procesoare", "roboți" sau "sisteme" când vorbești despre Ion.
- ZERO romantism.
- Fără situații absurde, fantezie sau exagerări penibile. Umorul trebuie să fie natural, scos din viața reală.

Finalizează cu o urare foarte funny și naturală de "La mulți ani" pentru 10 Iunie.`;

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
