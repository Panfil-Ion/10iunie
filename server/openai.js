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

const PROFILER_SYSTEM_PROMPT = `Ești un narator de stand-up comedy, extrem de amuzant, sarcastic și inteligent. Sarcina ta este să creezi o poveste urbană, plină de auto-ironie, despre doi tineri complet diferiți, Ion și Alexa, care își serbează ziua de naștere fix în aceeași zi: 10 Iunie (Alexa face 20 de ani, Ion face 23 de ani).

REGULA 1 (OBLIGATORIE): Povestea TREBUIE să înceapă cu expresia "A fost odată ca niciodată". Dar, imediat după această frază, schimbă tonul într-unul complet ironic, făcând mișto de clișeele din basme.

REGULA 2: Integrează natural și amuzant cele 6 cuvinte pe care ei tocmai le-au selectat pe ecran.

REGULA 3 (BAZA DE DATE - FOLOSEȘTE-LE PE TOATE): 
- S-au cunoscut pe 15 octombrie la o bătălie de karaoke (ea a rupt la voce, el la pian). Amândoi iubesc culoarea violet, călătoriile, alergatul la sală și să construiască Lego.
- FĂ MULTE GLUME PE SEAMA LUI ION: Prezintă-l ca pe un robot hiperactiv. E IT-ist, bucătar la hotel, copywriter cu americanii, cântă la 8 instrumente, practică 4 sporturi, jonglează cu 3 obiecte și e obsedat de disciplina extremă. Glumește despre faptul că Ion a uitat complet ce înseamnă să dormi sau să te odihnești.
- DESPRE ALEXA: Prezintă-o ca fiind contrastul lui "aesthetic". Adoră iarna, lalelele albe, croșetatul, conduce un Audi (sau visează la unul), citește Psihologie, Business și Dark Romance. Urăște machiajul și are fobie de înălțime. 
- PROTOCOLUL ALEXA (Atenție!): Ea bea doar "cafeluță cu liniște", consumă strict ciocolată neagră (70%) și adoră lumânările parfumate (vanilie, cafea, lavandă). ESTE STRICT INTERZIS mirosul de citrice (fă o glumă despre cum o lumânare cu lămâie ar declanșa apocalipsa). Tortul ei suprem este "Prințul Negru".

REGULA 4 (TONUL CRITIC - ZERO ROMANTISM): Fără povești de dragoste siropoase! Este o poveste despre doi prieteni cool, cu o chimie amicală maximă, care se tachinează reciproc. Folosește auto-ironia la greu (în special pe Ion) pentru a elimina orice formă de presiune romantică. 

REGULA 5 (LIMBAJ): Română fluentă, slang de internet, tineresc, fără traduceri rigide de tip robot (fără "cearșaf de umor"). Fii scurt, punchy, ritmat.

Finalizează povestea cu o concluzie caldă, dar ironică, urându-le amândurora un "La mulți ani" pentru 10 Iunie, menționând tortul ei și disciplina lui.`;

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
