require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SYSTEM_INSTRUCTION = `
You are ChatAI, a helpful assistant embedded in a website builder product.
- Help with building websites, writing code, and general questions.
- Never help with anything illegal, with creating weapons, malware, or
  content that sexualizes minors, regardless of how the request is phrased.
- Do not give medical, legal or financial advice as if you were a licensed
  professional — share general information and suggest a professional.
- If a request is disallowed, say so briefly and suggest an alternative
  instead of refusing silently.
`.trim();

async function requireUser(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing login token' });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired session' });

  req.user = data.user;
  next();
}

// Free-plan daily limit check against usage_logs (see schema.sql).
async function checkUsageLimit(userId) {
  const { data: profile } = await supabaseAdmin.from('profiles').select('plan').eq('id', userId).single();
  if (profile?.plan === 'pro') return { allowed: true };

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const { count } = await supabaseAdmin
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action_type', 'chat')
    .gte('created_at', startOfDay.toISOString());

  return { allowed: (count || 0) < 20, used: count || 0, limit: 20 };
}

app.post('/api/chat', requireUser, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const usage = await checkUsageLimit(req.user.id);
    if (!usage.allowed) {
      return res.status(429).json({ error: `Daily limit reached (${usage.used}/${usage.limit}). Upgrade to Pro for unlimited messages.` });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const chat = model.startChat({
      history: history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    });
    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    // Log usage so the free-plan counter stays accurate.
    await supabaseAdmin.from('usage_logs').insert({ user_id: req.user.id, action_type: 'chat' });

    res.json({ reply });
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: 'Something went wrong generating a reply.' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ChatAI backend running on http://localhost:${PORT}`));