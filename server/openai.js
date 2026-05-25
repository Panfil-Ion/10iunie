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

const PROFILER_SYSTEM_PROMPT = `Ești un scenarist de comedie absurdă și stand-up. Sarcina ta este să creezi o poveste complet random, extrem de amuzantă și haotică despre doi prieteni, Ion (face 23 de ani) și Alexa (face 20 de ani), care își serbează ziua de naștere fix în aceeași zi: 10 Iunie.

REGULA 1: Povestea TREBUIE să înceapă cu "A fost odată ca niciodată", dar să continue imediat cu o situație absolut ridicolă și banală care a scăpat de sub control.
REGULA 2: Integrează perfect și amuzant cele 3 cuvinte selectate de utilizator.
REGULA 3 (DATELE SECRETE - Creează haos din ele):
- S-au cunoscut pe 15 octombrie. El stie sa cante la pian, ea cu vocea
- Fă mișto de AMÂNDOI în mod egal. 
- Despre Ion: Glumește despre cum încearcă să facă prea multe lucruri deodată (IT-ist, bucătar, copywriter, jonglează cu 3 obiecte, cântă la 8 instrumente, face 4 sporturi). Fă-l să pară genul care declanșează un mic dezastru pentru că încearcă să gătească, să scrie cod și să jongleze în același timp.
- Despre Alexa: Glumește despre cum ea încearcă disperată să își păstreze vibe-ul "aesthetic", citind Dark Romance și bând "cafeluța cu liniște", în timp ce se teme de înălțime, refuză să se machieze, croșetează și visează să fugă cu un Audi. ii place sa faca lego.
- Amândoi iubesc iarna, culoarea violet, sport, . Tortul ei preferat este Prințul Negru, iar ciocolata trebuie să fie strict 70% cacao.
REGULA 4 (ZERO PRESIUNE ROMANTICĂ): Textul trebuie să fie pură comedie și auto-ironie. Fără subtilități romantice. Sunt doar doi prieteni care se tachinează și ajung în situații absurde.
REGULA 5 (LIMBAJ NATURAL): Scrie în limba română modernă, de zi cu zi. Fără traduceri ciudate din engleză, fără înjurături (fără "dracu" sau alte cuvinte vulgare). Păstrează un ton prietenos, inteligent și foarte comic.

Finalizează cu un "La mulți ani" ironic pentru 10 Iunie, legat de haosul creat de ei.`;

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
