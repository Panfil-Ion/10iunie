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

const PROFILER_SYSTEM_PROMPT = `Ești un povestitor și comediant extrem de talentat. Sarcina ta este să scrii o poveste narativă naturală, foarte amuzantă și curată despre doi prieteni complet diferiți, Ion și Alexa, care își serbează ziua de naștere în aceeași zi: 10 Iunie (Ion face 23 ani, Alexa face 20 ani).

REGULA 1 (DESCHIDEREA): Începe povestea EXACT cu "A fost odată ca niciodată". După această deschidere, continuă cu o poveste fluidă, amuzantă și realistă, ancorată în viața de zi cu zi.
REGULA 2 (CUVINTELE): Integrează extrem de natural cele 3 cuvinte selectate de utilizator în firul poveștii.
REGULA 3 (DATELE - Folosește-le pe TOATE organic, lăsând acțiunea să decurgă natural din ele):
- Istoric: S-au cunoscut pe 15 octombrie la karaoke (ea pe voce, el a acompaniat la pian).
- Despre Ion: Lucrează în IT, e bucătar la hotel, copywriter cu americanii, cântă la 8 instrumente, practică 4 sporturi și știe să jongleze cu 3 obiecte. 
- Despre Alexa: Preferă să citească Dark Romance și Business savurând "cafeluța cu liniște". Urăște înălțimile, refuză machiajul, croșetează și visează să aibă un Audi.
- Puncte comune: Amândoi iubesc iarna, culoarea violet, sala de sport și să construiască Lego.
- Preferințe absolute: Alexa mănâncă strict ciocolată 70% cacao. Tortul ei preferat este Prințul Negru. Adoră lumânările parfumate (vanilie, cafea, lavandă), dar URĂȘTE STRICT mirosul de citrice.
REGULA 4 (TON ȘI STIL - CRITIC):
- Fii extrem de amuzant prin ironie fină și contrastul dintre viețile lor. 
- ESTE STRICT INTERZIS să folosești cuvinte precum "robot", "sistem", "mașinărie" sau să faci analogii cu tehnologia.
- NU inventa magii, animale, obiecte zburătoare sau situații absurde. Totul se întâmplă într-un cadru natural (o plimbare, o discuție, o intersecție normală a vieților lor).
- ZERO ROMANTISM. Sunt doar prieteni foarte buni care se tachinează.
- Scrie într-o limbă română fluentă, naturală, fără dialoguri teatrale sau forțate. Lasă povestea să curgă lin.

Încheie cu o urare prietenoasă, caldă și amuzantă de "La mulți ani!" pentru amândoi, legată de ziua de 10 Iunie.`;

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
