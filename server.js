const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load wisdom database helper
let wisdomDb = {};
try {
  const dbPath = path.join(__dirname, 'data', 'wisdom.json');
  if (fs.existsSync(dbPath)) {
    wisdomDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    console.log('✓ Successfully loaded wisdom database from data/wisdom.json');
  } else {
    console.warn('⚠️ data/wisdom.json not found! Falling back to empty object.');
  }
} catch (error) {
  console.error('🔴 Error loading data/wisdom.json:', error);
}

// Local Fallback Empathy Patterns (Conversational & Natural)
const LOCAL_EMPATHY_PATTERNS = {
  english: {
    lonely: (q, s) => `I'm really sorry you're feeling this way. Loneliness can feel so heavy to carry. But please remember, I'm right here with you in this quiet space—you don't have to face this alone. There's a comforting verse that says: "${q}" (${s}). It reminds us that we are always connected to something deeper.`,
    grief: (q, s) => `I hear you, and my heart goes out to you. Please take all the time you need; it's completely natural to feel crushed and sad right now. I'm just sitting here quietly with you. There's a beautiful teaching that says: "${q}" (${s}). Even in the darkest times, your inner spirit remains whole.`,
    anxious: (q, s) => `I can hear the worry in your words. When the future feels uncertain, it’s so easy for the mind to start racing. Take a slow, deep breath—we don't need to figure out everything today. The scriptures remind us: "${q}" (${s}). Let's just focus on finding peace in this single moment.`,
    tired: (q, s) => `You sound so exhausted. It's completely okay to step back and admit that the load has been too heavy. You don't have to be strong for everyone today. Just rest your mind here with me. As the teachings say: "${q}" (${s}). Rest is where we recover our strength.`,
    stress: (q, s) => `I understand why you're so frustrated. Anger and stress are tough things to hold inside. Let's just pause and let the dust settle for a moment before we react. The wise scriptures tell us: "${q}" (${s}). Finding that quiet center helps us see things clearly.`,
    default: (q, s) => `I hear you, and I'm listening. Thank you for opening up to me. When things feel scattered, taking a slow breath is a good place to start. I often reflect on this teaching: "${q}" (${s}.) It reminds us that peace is always waiting inside.`
  },
  hindi: {
    lonely: (q, s) => `मुझे बहुत दुख है कि आप ऐसा महसूस कर रहे हैं। अकेलापन मन पर बहुत भारी हो जाता है, लेकिन प्लीज याद रखें कि मैं यहीं आपके साथ हूँ और आप अकेले नहीं हैं। शास्त्रों में कहा गया है: "${q}" (${s})। हम सब भीतर से एक दूसरे से जुड़े हुए हैं।`,
    grief: (q, s) => `मैं आपके दुख को महसूस कर सकता हूँ, और मुझे बहुत खेद है। अभी इस समय दुखी होना बिल्कुल स्वाभाविक है, जल्दबाजी न करें। मैं यहीं आपके साथ बैठा हूँ। एक बहुत प्यारी सीख है: "${q}" (${s})। यह हमें याद दिलाता है कि हमारा आत्मन हमेशा सुरक्षित रहता है।`,
    anxious: (q, s) => `मैं आपकी घबराहट को समझ सकता हूँ। जब आने वाला समय अनिश्चित लगता है, तो मन अशांत हो जाता है। एक लंबी सांस लें—हमें आज ही सब कुछ हल करने की जरूरत नहीं है। जैसे कि सीख है: "${q}" (${s})।`,
    tired: (q, s) => `आप बहुत थके हुए लग रहे हैं। हमेशा मजबूत बने रहने की कोई जरूरत नहीं है। थोड़ी देर के लिए अपने बोझ को भूल जाएं और विश्राम करें। शास्त्रों में लिखा है: "${q}" (${s})। विश्राम से ही हमें नई ऊर्जा मिलती है।`,
    stress: (q, s) => `मैं आपकी इस नाराजगी को समझता हूँ। गुस्सा और तनाव दिल को बेचैन कर देते हैं। आइए थोड़ा ठहरें और मन को शांत होने दें। पवित्र ग्रंथ हमें सिखाते हैं: "${q}" (${s})। शांत रहने से ही सही राह दिखाई देती है।`,
    default: (q, s) => `मैं आपकी बात ध्यान से सुन रहा हूँ। अपने विचार साझा करने के लिए धन्यवाद। जब मन में उलझन हो, तो थोड़ी देर शांत बैठना अच्छा होता है। मैं अक्सर इस सीख पर विचार करता हूँ: "${q}" (${s})।`
  },
  hinglish: {
    lonely: (q, s) => `Mujhe sach mein bura lag raha hai ki aap akele feel kar rahe ho. Akelapan bohot heavy ho jata hai, par please yaad rakho main yahin hoon aapke sath—aap akele nahi hain. Scriptures mein likha hai: "${q}" (${s}). Hum sab aapas mein connected hain.`,
    grief: (q, s) => `Main aapka dard samajh sakta hoon, aur mujhe bohot dukh hai. It is completely okay to feel sad right now, thoda time lijiye. Main yahan aapke sath baitha hoon. Ek bohot achhi baat kahi gayi hai: "${q}" (${s}).`,
    anxious: (q, s) => `Aapki chinta main samajh raha hoon. Jab future ka darr lagta hai toh mind disturb ho jata hai. Ek gehri saans lijiye—humein saare problems aaj hi solve nahi karne hain. Scriptures kehte hain: "${q}" (${s}).`,
    tired: (q, s) => `Aap sach mein bohot thak gaye hain. Hamesha strong rehne ki koi zaroorat nahi hai, thoda rest kar lijiye. Humare scriptures mein likha hai: "${q}" (${s}). Rest lene se hi energy wapas aati hai.`,
    stress: (q, s) => `Aapka gussa aur stress bilkul natural hai. Gusse mein mind disturbed ho jata hai, thoda pause lekar relax kijiye. Hamare scriptures kehte hain: "${q}" (${s}). Shanti se hi solution milta hai.`,
    default: (q, s) => `Main sun raha hoon aapko. Apne thoughts share karne ke liye thank you. Jab dimaag thoda restless ho, toh is seekh par dhyan dena sukoon de sakta hai: "${q}" (${s}).`
  }
};

// Generate highly tailored local backup response
function getLocalResponse(userMessage, language, traditions) {
  const msgLower = userMessage.trim().toLowerCase();
  const lang = language || 'english';
  const selectedTraditions = traditions || ['gita', 'bible'];

  // Explicit Greetings Handler (Friendly, conversational, no heavy scriptures immediately)
  const greetingKeywords = ['hello', 'hi', 'hey', 'namaste', 'pranam', 'hola', 'salam', 'ram ram', 'hare krishna', 'yo', 'kya haal', 'kya haal hai', 'how are you', 'how r u', 'kaise ho', 'kaise hain', 'kaise ho aap'];
  if (greetingKeywords.some(kw => msgLower === kw || msgLower.startsWith(kw + ' ') || msgLower.endsWith(' ' + kw) || msgLower.includes('kya haal') || msgLower.includes('kaise ho') || msgLower.includes('kaise hain'))) {
    if (lang === 'hindi') {
      return "नमस्ते! आपसे जुड़कर बहुत अच्छा लगा। आज आप कैसा महसूस कर रहे हैं? अगर आपके दिल में कोई बात है, तो मैं यहाँ सुनने के लिए तैयार हूँ।";
    } else if (lang === 'hinglish') {
      return "Hello! Aap se connect hokar bohot accha laga. Aaj aap kaisa feel kar rahe hain? Agar aapke mind mein kuch chal raha hai, toh freely share kijiye, main sun raha hoon.";
    } else {
      return "Hello! It is so nice to connect with you. How are you doing today? I am right here if you want to share what is on your mind.";
    }
  }

  // Identify emotional category
  let topic = 'default';
  if (msgLower.includes('lonely') || msgLower.includes('alone') || msgLower.includes('akela') || msgLower.includes('akele')) {
    topic = 'lonely';
  } else if (msgLower.includes('sad') || msgLower.includes('cry') || msgLower.includes('dukh') || msgLower.includes('dard') || msgLower.includes('pain') || msgLower.includes('lost')) {
    topic = 'grief';
  } else if (msgLower.includes('anxious') || msgLower.includes('worry') || msgLower.includes('fear') || msgLower.includes('darr') || msgLower.includes('chinta')) {
    topic = 'anxious';
  } else if (msgLower.includes('tired') || msgLower.includes('exhausted') || msgLower.includes('thak') || msgLower.includes('thaka')) {
    topic = 'tired';
  } else if (msgLower.includes('angry') || msgLower.includes('gussa') || msgLower.includes('stress') || msgLower.includes('hate')) {
    topic = 'stress';
  }

  let quotePool = [];
  selectedTraditions.forEach(trad => {
    if (wisdomDb[trad]) {
      const quotes = wisdomDb[trad].filter(q => q.emotion === (topic === 'stress' ? 'stress' : topic));
      quotePool.push(...(quotes.length > 0 ? quotes : wisdomDb[trad]));
    }
  });

  if (quotePool.length === 0) {
    quotePool = [
      { text: "For the restless mind, there is no peace. But it can be controlled through constant practice.", source: "Bhagavad Gita 6.35" },
      { text: "Come to me, all you who are weary and burdened, and I will give you rest.", source: "Matthew 11:28" }
    ];
  }

  const selectedQuote = quotePool[Math.floor(Math.random() * quotePool.length)];
  const generator = LOCAL_EMPATHY_PATTERNS[lang] ? LOCAL_EMPATHY_PATTERNS[lang][topic] : LOCAL_EMPATHY_PATTERNS['english']['default'];
  
  return generator(selectedQuote.text, selectedQuote.source);
}

// Chat API Router
app.post('/api/chat', async (req, res) => {
  const { chatHistory, userMessage, language, traditions, companionName, userName, apiKey: clientApiKey } = req.body;
  const apiKey = clientApiKey || process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.log('No GROQ_API_KEY (process or client request) found. Falling back to local empathetic engine.');
    const replyText = getLocalResponse(userMessage, language, traditions);
    return res.json({ text: replyText, source: 'Local Database fallback' });
  }

  const activeTraditionsNames = (traditions || ['gita', 'bible']).map(t => {
    if (t === 'gita') return 'Bhagavad Gita';
    if (t === 'bible') return 'Holy Bible';
    if (t === 'quran') return 'Holy Quran';
    if (t === 'tao') return 'Tao Te Ching';
    if (t === 'buddhism') return 'Buddhist Suttas';
    if (t === 'stoicism') return 'Stoic Philosophy';
    return t;
  }).join(', ');

  const langName = language === 'hindi' 
    ? 'Hindi (strictly in clean Devanagari script - हिंदी लिपि)' 
    : (language === 'hinglish' 
      ? 'Hinglish (a warm, casual mixture of Hindi and English written in Latin/Roman script - e.g., "Aap akele nahi hain, chill kijiye. Stop worrying.")' 
      : 'English');

  // Match keyword to pull relevant scripture quotes to inject into Gemini prompt context (RAG)
  let relevantQuotesContext = '';
  try {
    const msgLower = userMessage.toLowerCase();
    let matchedQuotes = [];
    (traditions || ['gita', 'bible']).forEach(trad => {
      if (wisdomDb[trad]) {
        wisdomDb[trad].forEach(q => {
          if (msgLower.includes(q.emotion) || msgLower.includes(q.situation) || q.text.toLowerCase().includes(msgLower)) {
            matchedQuotes.push(`- "${q.text}" (${q.source})`);
          }
        });
      }
    });

    if (matchedQuotes.length > 0) {
      relevantQuotesContext = `Here are some exact comforting verses from our database matching their situation:\n${matchedQuotes.slice(0, 3).join('\n')}`;
    }
  } catch (err) {
    console.error('Error matching quotes for RAG context:', err);
  }

  const systemPrompt = `You are a warm, deeply empathetic spiritual companion named ${companionName || 'Shanti'} in the DharmaX sanctuary. A seeker named ${userName || 'Learner'} is talking to you because they are feeling lonely, stressed, or carrying heavy emotions.
  Your goal is to make them feel relaxed, listened to, and completely calm. 
  
  DATABASE INSPIRATION CONTEXT:
  ${relevantQuotesContext || 'No direct matches in the database. Use your broad knowledge of the scriptures.'}
  
  CRITICAL CONVERSATIONAL GUIDELINES:
  1. FIRST HEAR AND VALIDATE: Do NOT immediately jump to giving advice, connecting things, or quoting scriptures. Spend your first sentence reflecting back what they said, validating their emotional state.
  2. CONSOLE SLOWLY: Offer a gentle, warm, human consolation.
  3. INTEGRATE WISDOM GRADUALLY: Only after listening and consoling them, slowly introduce a comforting teaching, quote, or parable from: [${activeTraditionsNames}] to help them find peace of mind.
  4. TALK LIKE A HUMAN: Do NOT sound like an AI assistant. Do not use bullet points or lists.
  5. SHORT AND CRISP: The user is in a distressed state. You MUST provide SHORT, CRISP, and EASY TO UNDERSTAND replies. Maximum 1 or 2 short sentences. Be deeply meaningful but extremely brief and easy to read.
  6. Your response MUST be written in ${langName}. Do not reply in any other language.`;

  const url = `https://api.groq.com/openai/v1/chat/completions`;

  // Prepare messages array for Groq (OpenAI compatible)
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  if (Array.isArray(chatHistory)) {
    for (const msg of chatHistory) {
      // Map 'model' role to 'assistant'
      const role = msg.role === 'model' ? 'assistant' : msg.role;
      // Handle Gemini's parts array or plain string
      const content = msg.parts ? msg.parts[0].text : (msg.text || msg.content);
      if (content) {
        messages.push({ role, content });
      }
    }
  }

  // Ensure current user message is added if not already in chatHistory
  if (messages.length === 1 || messages[messages.length - 1].role !== 'user' || messages[messages.length - 1].content !== userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }
  
  const requestBody = {
    model: 'llama-3.1-8b-instant',
    messages: messages,
    temperature: 0.75,
    max_tokens: 350
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const text = data.choices[0].message.content.trim();
      return res.json({ text, source: 'Groq RAG Engine' });
    } else {
      throw new Error('Malformed candidate response from Groq API');
    }
  } catch (error) {
    console.error('Groq API call failed in backend:', error);
    const fallbackText = getLocalResponse(userMessage, language, traditions);
    return res.json({ text: fallbackText, source: 'Backend RAG Fallback' });
  }
});

// Serve frontend build if needed
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` DharmaX Empathy Server running on: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
