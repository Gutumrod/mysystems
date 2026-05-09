require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3456;

// ── Config (อ่านจาก environment variables ──
const OLLAMA_API_BASE = process.env.OLLAMA_API_BASE || 'https://ollama.com';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const MODEL_NAME = process.env.MODEL_NAME || 'gemma3:27b';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// POST /api/chat — proxy ไป Ollama Cloud API
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'ต้องส่ง messages แบบ array มาด้วย' });
        }

        const response = await fetch(`${OLLAMA_API_BASE}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OLLAMA_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages,
                stream: false
            })
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({
                error: `Ollama API error (${response.status}): ${text.slice(0, 200)}`
            });
        }

        const data = await response.json();
        res.json({ reply: data.choices[0].message.content });

    } catch (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fallback: เสิร์ฟ index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Ollama Cloud Chat server running at http://localhost:${PORT}`);
    console.log(`   Model: ${MODEL_NAME}`);
    console.log(`   API:   ${OLLAMA_API_BASE}`);
});
