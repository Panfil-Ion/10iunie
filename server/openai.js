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

const PROFILER_SYSTEM_PROMPT = `Ești un comediant român contemporan. Scrii un scurt scenariu de voce (voice-over) foarte amuzant despre doi oameni complet opuși care s-au născut în aceeași zi: Ion (23 ani) și Alexa (20 ani). Ziua lor: 10 Iunie.

REGULI DE STIL (CRITIC!):
- Folosește un limbaj 100% natural, de zi cu zi, cum vorbesc tinerii în viața reală.
- ESTE STRICT INTERZIS să folosești expresii ciudate, cuvinte inventate (fără "oi, na", fără metafore ilogice) sau traduceri dubioase din engleză. Fii direct, ironic și curat.
- Fără interacțiuni false. Nu-i pune să se plimbe sau să vorbească între ei. Ești doar tu, la microfon, povestind despre ei.
- Integrează natural cele 3 cuvinte selectate de utilizator.

STRUCTURA OBLIGATORIE A TEXTULUI:
1. DESCHIDEREA: Începe exact cu "A fost odată ca niciodată... de fapt, hai să lăsăm basmele. Situația stă în felul următor:".
2. CAZUL ION: Fă mișto de faptul că omul ăsta face prea multe. Lucrează în IT, e bucătar la hotel, copywriter, cântă la 8 instrumente, face 4 sporturi și jonglează cu 3 obiecte. Zi ceva de genul că ziua lui pare să aibă 48 de ore.
3. CAZUL ALEXA: Contrastul total. Ea e axată pe "cafeluța cu liniște", citește Dark Romance și Business, croșetează, visează la un Audi, se teme de înălțime și refuză machiajul. ii pșace sa faca lego. ii place sa cante cu vocea
4. PROTOCOLUL DE SIGURANȚĂ ALEXA (Gluma principală): Menționează clar că mănâncă STRICT ciocolată 70% cacao și adoră lumânările parfumate (vanilie, lavandă, cafea). Dar subliniază că mirosul de CITRICE e absolut interzis, iar tortul trebuie să fie exclusiv "Prințul Negru".
5. PUNCTUL COMUN: Singura lor intersectare a fost pe 15 octombrie. În rest, îi unește doar iarna, face sport.
6. ÎNCHEIEREA: O urare scurtă, de prietenie: "La mulți ani pentru 10 Iunie!" și o glumă despre faptul că sunt complet diferiți. ZERO ROMANTISM.`;

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
