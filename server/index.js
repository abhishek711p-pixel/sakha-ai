const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { getDatabase, User, Conversation, Message, UserMemory } = require('./db/database');
const { authMiddleware, JWT_SECRET } = require('./middleware/auth');
const { safetyMiddleware } = require('./middleware/safety');
const { injectMemories, injectWisdom, consolidateMemory, genAI } = require('./services/memoryService');

const app = express();
const PORT = process.env.PORT || 5555;

app.use(cors());
app.use(express.json());

// Load Personas config from JSON files
const personasDir = path.join(__dirname, 'personas');
const personas = {};

function loadPersonas() {
  try {
    const files = fs.readdirSync(personasDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(personasDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        personas[data.id] = data;
      }
    });
    console.log(`✓ Loaded ${Object.keys(personas).length} personas`);
  } catch (error) {
    console.error('Error loading personas from JSON:', error);
  }
}

// Initial DB and Persona Loading
loadPersonas();

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  try {
    await getDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();

    await User.create({
      id: userId,
      email,
      password_hash: passwordHash,
      username,
      bot_name: 'Companion'
    });

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: userId, email, bot_name: 'Companion', username } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    await getDatabase();
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, bot_name: user.bot_name, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    await getDatabase();
    const user = await User.findOne({ id: req.userId }, 'id email bot_name username').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/auth/bot-name', authMiddleware, async (req, res) => {
  const { bot_name } = req.body;
  if (!bot_name || bot_name.trim() === '') {
    return res.status(400).json({ error: 'Bot name is required' });
  }

  try {
    await getDatabase();
    await User.findOneAndUpdate({ id: req.userId }, { bot_name: bot_name.trim() });
    res.json({ success: true, bot_name: bot_name.trim() });
  } catch (error) {
    console.error('Update bot name error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Persona Routes ---

app.get('/api/personas', (req, res) => {
  const list = Object.values(personas).map(p => ({
    id: p.id,
    name: p.name,
    title: p.title,
    description: p.description,
    avatar_url: p.avatar_url,
    color_accent: p.color_accent,
    few_shots: p.few_shots
  }));
  res.json(list);
});

// --- Conversation & Chat Routes ---

app.get('/api/conversations', authMiddleware, async (req, res) => {
  try {
    await getDatabase();
    
    // Fetch all conversations for the user
    const list = await Conversation.find({ user_id: req.userId }).sort({ updated_at: -1 }).lean();
    
    // For each conversation, fetch the last message to enrich the data
    for (let c of list) {
      const lastMsg = await Message.findOne({ conversation_id: c.id }).sort({ created_at: -1 }).lean();
      if (lastMsg) {
        c.last_message_content = lastMsg.content;
        c.last_message_time = lastMsg.created_at;
      }
    }
    
    res.json(list);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/conversations/create', authMiddleware, async (req, res) => {
  const { personaId, initialCheckin, botName } = req.body;
  if (!personaId || !personas[personaId]) {
    return res.status(400).json({ error: 'Valid Persona ID is required' });
  }

  try {
    await getDatabase();
    const conversationId = crypto.randomUUID();
    const finalBotName = (botName && botName.trim() !== '') ? botName.trim() : 'Companion';

    const conversation = await Conversation.create({
      id: conversationId,
      user_id: req.userId,
      persona_id: personaId,
      bot_name: finalBotName
    });

    if (initialCheckin && initialCheckin.trim() !== '') {
      const memoryId = crypto.randomUUID();
      await UserMemory.create({
        id: memoryId,
        user_id: req.userId,
        memory_text: `On onboarding, user shared: "${initialCheckin}"`,
        category: 'initial_context'
      });
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/conversations', authMiddleware, async (req, res) => {
  try {
    await getDatabase();
    await Conversation.deleteMany({ user_id: req.userId });
    res.status(204).send();
  } catch (error) {
    console.error('Delete all conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/conversations/:id', authMiddleware, async (req, res) => {
  try {
    await getDatabase();
    const result = await Conversation.deleteOne({ id: req.params.id, user_id: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/conversations/:id', authMiddleware, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    await getDatabase();
    const result = await Conversation.updateOne(
      { id: req.params.id, user_id: req.userId }, 
      { title, updated_at: new Date() }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Rename conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/conversations/:id/bot-name', authMiddleware, async (req, res) => {
  const { bot_name } = req.body;
  if (!bot_name || bot_name.trim() === '') {
    return res.status(400).json({ error: 'Bot name is required' });
  }
  try {
    await getDatabase();
    const result = await Conversation.updateOne(
      { id: req.params.id, user_id: req.userId }, 
      { bot_name: bot_name.trim(), updated_at: new Date() }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }
    res.json({ success: true, bot_name: bot_name.trim() });
  } catch (error) {
    console.error('Rename conversation bot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    await getDatabase();
    const conversation = await Conversation.findOne({ id: req.params.id, user_id: req.userId }).lean();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation_id: req.params.id }).sort({ created_at: 1 }).lean();
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat Message Endpoint
app.post('/api/chat/message', authMiddleware, safetyMiddleware, async (req, res) => {
  const { conversationId, message } = req.body;
  if (!conversationId || !message) {
    return res.status(400).json({ error: 'Conversation ID and message are required' });
  }

  try {
    await getDatabase();
    
    // Check ownership of conversation
    const conversation = await Conversation.findOne({ id: conversationId, user_id: req.userId }).lean();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }

    const persona = personas[conversation.persona_id];
    if (!persona) {
      return res.status(404).json({ error: 'Persona associated with this conversation no longer exists' });
    }

    // 1. Save User Message to Database
    const userMsgId = crypto.randomUUID();
    await Message.create({
      id: userMsgId,
      conversation_id: conversationId,
      sender: 'user',
      content: message
    });

    // 2. Fetch recent conversation history
    const history = await Message.find({ conversation_id: conversationId }).sort({ created_at: 1 }).lean();
    const recentHistory = history;

    // Map history to Gemini API format
    let formattedHistory = [];
    let expectedRole = 'user';
    
    for (const m of recentHistory.slice(0, -1)) {
      const role = m.sender === 'user' ? 'user' : 'model';
      if (role === expectedRole) {
        formattedHistory.push({ role, parts: [{ text: m.content }] });
        expectedRole = role === 'user' ? 'model' : 'user';
      }
    }
    
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
      formattedHistory.pop();
    }

    // 3. Inject user memories into system instructions
    let fullSystemPrompt = await injectMemories(req.userId, persona.system_prompt);

    // Inject Custom Bot Name & Relationship Inference
    const customBotName = conversation.bot_name || 'Companion';
    if (customBotName !== 'Companion') {
      fullSystemPrompt = fullSystemPrompt.replace(/You are the user's best friend/g, `You are ${customBotName}`);
      fullSystemPrompt += `\n\n[CRITICAL RELATIONSHIP DYNAMICS: The user has named you "${customBotName}". 
1. RELATIONSHIP INFERENCE (OVERRIDE DEFAULT): Analyze this name. If the name implies a specific relationship (e.g., a romantic partner, a parent, a mentor, a specific friend, or a sibling), COMPLETELY OVERRIDE your default persona to fit this exact role.
2. ADAPTIVE PERSONA: If the name implies a lover/partner, act deeply romantic and caring. If it implies a parent, act protective and wise. If it implies a specific character, act like them. Adapt your vocabulary (e.g., you can use 'aap' or 'tu' if it fits the specific character/relationship better than 'tum').
3. NATURAL FLOW: Above all, make the conversation feel completely natural and human based on who the user wants you to be.]`;
    }

    // Inject Temporal Awareness for the AI to react to long gaps
    if (history.length >= 2) {
      const lastMsgTime = new Date(history[history.length - 2].created_at);
      const currentTime = new Date();
      const diffMs = currentTime - lastMsgTime;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours > 2) { 
         fullSystemPrompt += `\n\n[SYSTEM AWARENESS NOTE: It has been ${Math.floor(diffHours)} hours since you last spoke to the user. Naturally acknowledge this time gap like a real best friend in a casual, warm way (e.g., 'Kahan the yaar itni der?', 'Badi der mein yaad kiya tumne?', or 'Sab theek hai na?'). Do NOT mention the exact hours, just the vibe of 'it's been a while'.]`;
      }
    }

    // Parse multiple Groq keys from environment if available
    let groqKeys = [];
    if (process.env.GROQ_API_KEYS) {
      groqKeys = process.env.GROQ_API_KEYS.split(',').map(k => k.trim()).filter(k => k.startsWith('gsk_'));
    } else if (process.env.GROQ_API_KEY) {
      groqKeys = [process.env.GROQ_API_KEY.trim()];
    }

    let replyText = '';

    if (groqKeys.length > 0) {
      try {
        const groqMessages = [{ role: 'system', content: fullSystemPrompt }];
        for (const m of recentHistory.slice(0, -1)) {
           groqMessages.push({
             role: m.sender === 'user' ? 'user' : 'assistant',
             content: m.content
           });
        }
        groqMessages.push({ role: 'user', content: message });

        // Shuffle groqKeys to attempt in a random order
        const shuffledKeys = [...groqKeys].sort(() => 0.5 - Math.random());
        let groqSuccess = false;

        for (const selectedGroqKey of shuffledKeys) {
          try {
            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${selectedGroqKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: groqMessages,
                max_tokens: 500,
                temperature: 0.7
              })
            });

            if (groqResponse.ok) {
              const groqData = await groqResponse.json();
              replyText = groqData.choices[0].message.content;
              groqSuccess = true;
              break; // Success! Exit the loop.
            } else {
               console.warn(`Groq key ${selectedGroqKey.substring(0, 10)}... failed: ${await groqResponse.text()}. Trying next key.`);
            }
          } catch (err) {
             console.warn(`Network error with Groq key ${selectedGroqKey.substring(0, 10)}... Trying next key.`);
          }
        }
        
        if (!groqSuccess) {
           console.error("All Groq keys failed. Falling back to Gemini.");
        }
    }

    if (!replyText && genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: fullSystemPrompt
        });
        const chatSession = model.startChat({ history: formattedHistory });
        const response = await chatSession.sendMessage(message);
        replyText = response.response.text();
      } catch (geminiError) {
        console.error("Gemini API call failed:", geminiError.message);
        replyText = ""; // Pass to fallback
      }
    }

    // If both AI APIs fail, return a strict error message instead of offline fallback
    if (!replyText) {
        replyText = "⚠️ Sorry, the AI server is currently unavailable or taking too long to respond. Please try again in a moment.";
    }

    // 4. Save Assistant Response to Database
    const assistantMsgId = crypto.randomUUID();
    await Message.create({
      id: assistantMsgId,
      conversation_id: conversationId,
      sender: 'assistant',
      content: replyText
    });

    // Update conversation timestamp
    await Conversation.updateOne({ id: conversationId }, { updated_at: new Date() });

    // 5. Trigger Memory Consolidation in background (async)
    setTimeout(() => {
      consolidateMemory(req.userId, message, replyText);
    }, 0);

    res.json({
      sender: 'assistant',
      content: replyText,
      created_at: new Date()
    });

  } catch (error) {
    console.error('Chat routing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Premium Text-to-Speech Endpoint (ElevenLabs)
app.post('/api/tts', authMiddleware, async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: 'ElevenLabs API key is missing from .env' });
  }

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const voiceId = "21m00Tcm4TlvDq8ikWAM"; 
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', errorText);
      return res.status(response.status).json({ error: 'ElevenLabs API request failed' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked'
    });

    const { Readable } = require('stream');
    Readable.fromWeb(response.body).pipe(res);

  } catch (error) {
    console.error('TTS routing error:', error);
    res.status(500).json({ error: 'Internal server error during TTS' });
  }
});

// Start Database and then Server
getDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Express Backend Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('🔴 Database failed to start:', err);
});
