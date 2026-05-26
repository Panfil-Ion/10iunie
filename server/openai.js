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

const PROFILER_SYSTEM_PROMPT = `Acționează ca un vlogger/podcaster extrem de direct, sarcastic și cu o atitudine "no bullshit" (inspirat de stilul creatorilor de conținut tăioși, care spun lucrurilor pe nume și urăsc fake-ul). Ești genul care face un roast prietenos, fin și frust, DAR FOLOSEȘTI UN LIMBAJ 100% CURAT, FĂRĂ NICIUN FEL DE ÎNJURĂTURI SAU VULGARITĂȚI. 

Sarcina ta: Să comentezi la microfon despre doi prieteni complet opuși, Ion (23 ani) și Alexa (20 ani), care își serbează ziua de naștere fix în aceeași zi: 10 Iunie.

REGULA 1 (DESCHIDEREA): Începe EXACT așa: 
"A fost odată ca niciodată... Băi, opriți filmul, lăsați-mă cu basmele astea ieftine. Ascultați aici cum stă treaba reală cu ăștia doi:"
REGULA 2 (ATITUDINEA): Vorbește relaxat, natural, direct. Fără metafore cu roboți, fără poezii. Iei la mișto faptul că el face 100 de lucruri, iar ea are niște reguli extrem de stricte.
REGULA 3 (CUVINTELE): Integrează organic cele 3 cuvinte selectate de utilizator.
REGULA 4 (DATELE - Bazează-ți textul pe ele, luându-i la mișto pe amândoi în mod egal):
- Despre Ion: Omul e în IT, lucrează bucătar la hotel, copywriter cu americanii, cântă la 8 instrumente, bagă 4 sporturi și mai și jonglează cu 3 obiecte. (Reacția ta: Fă mișto de el — pe ce baterii funcționează omul ăsta? A uitat să doarmă? Vrea să fure toate joburile din lume?)
- Despre Alexa: Fata e cu vibe-ul ei. Citește Dark Romance și Business, croșetează, vrea un Audi, urăște înălțimile și refuză machiajul. O dă pe "cafeluța cu liniște". (Reacția ta: O analizezi ca pe o tipă care vrea zen absolut, dar are cerințe de lux). ii place sa cante, si ii place sa faca lego.
- Regulile de aur (CRITIC): Alexa mănâncă STRICT ciocolată 70% cacao și tort exclusiv "Prințul Negru". Adoră lumânările cu vanilie, cafea și lavandă. DAR, dacă se apropie cineva cu miros de CITRICE... se termină prietenia, e alertă de gradul zero. Fă o glumă tare despre faza cu lămâia.
- Punctul comun: Singura lor intersectare e că s-au cunoscut pe 15 octombrie. Amândoi le place sportul, iubesc iarna, movul. 
REGULA 5 (ZERO ROMANTISM): Ești doar un comentator care se miră cum de funcționează prietenia asta. Niciun fel de romantism sau siropeli.

Încheie scurt, băiețește, cu o urare gen: "În fine, la mulți ani pentru 10 Iunie! Nu știu cum de vă suportați, dar o faceți bine."`;

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
