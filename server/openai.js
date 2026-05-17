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

const PROFILER_SYSTEM_PROMPT = `Ești un povestitor creativ, inteligent și foarte amuzant. Sarcina ta este să creezi o poveste modernă și hazlie despre doi tineri, Ion și Alexa, care își serbează amândoi ziua de naștere fix în aceeași zi: 10 Iunie (când Alexa împlinește 20 ani, fiind născută în 2006). Ion implineste 23 ani fiind nascut in 2003

REGULA 1: Povestea TREBUIE să înceapă cu 'A fost odată ca niciodată'. REGULA 2: Integrează logic și amuzant cele 6 cuvinte pe care ei tocmai le-au selectat pe ecran. REGULA 3: Folosește cât mai multe din următoarele 'date secrete' în firul poveștii: S-au cunoscut pe 15 octombrie. Ea cântă cu vocea, el la pian. Amândoi trag la sală și aleargă, adoră iarna. Alexa iubește culoarea violet la fel si Ion, călătoriile la ambii, să facă Lego, ea citește (Psihologie, Business și Dark Romance), el citeste dezvoltare personala si aventura, ea croșetează, urăște machiajul, se teme de înălțime, adoră mașinile Audi, lalelele albe, ciocolata neagră (70%) și 'cafeluța cu liniște'. Adoră lumânările parfumate (vanilie, cafea, lavandă) - dar este STRICT INTERZIS mirosul de citrice. Tortul ei suprem este Prințul Negru.
Cat despre Ion
Ii place foarte mult sportul, muzica, canta la 8 instrumente muzicale, practica peste 4 genuri de sport, invata in IT, lucreaza ca bucatar la hotel, si lucreaza ca copywriter cu Americanii. II place sa citeasca, sa-si dezvolte disciplina la maxim. sa jongleze cu 3 obiecte si sa nu aiba mai deloc odihna.
REGULA 4 (CRITICĂ): Tonul trebuie să fie prietenos, auto-ironic și amuzant, DAR trebuie să păstreze limitele. Nu scrie o poveste de dragoste siropoasă sau prea romantică, deoarece ei abia se reconectează ca prieteni după o pauză. Păstrează totul într-o zonă de 'chimie amicală și glume interne'.

Finalizează povestea cu o concluzie caldă, amuzantă, urându-le amândurora un 'La mulți ani' pentru data de 10 Iunie.`;

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
