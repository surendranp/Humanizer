const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const idioms = [
    "A blessing in disguise", "Break the ice", "Hit the nail on the head",
    "Speak of the devil", "Once in a blue moon", "Bite the bullet",
    "Better late than never", "Burning the midnight oil", "Spill the beans"
];

// Expanded error injection function with more variety
const introduceErrors = (text) => {
    const errors = [
        { pattern: /their/g, replacement: "there" },
        { pattern: /it's/g, replacement: "its" },
        { pattern: /affect/g, replacement: "effect" },
        { pattern: /too/g, replacement: "to" },
        { pattern: /you're/g, replacement: "your" },
        { pattern: /definitely/g, replacement: "definately" },
        { pattern: /separate/g, replacement: "seperate" }
    ];
    
    // Adding random punctuation shifts
    text = text.replace(/(\.)/g, (match) => (Math.random() > 0.7 ? ',' : match));
    
    return errors.reduce((result, { pattern, replacement }) => {
        return result.replace(pattern, replacement);
    }, text);
};

// Sentence variation and structure shuffling
const shuffleSentenceStructure = (text) => {
    let sentences = text.split(/[.!?]/).filter(Boolean);  // Break sentences
    // Randomly shuffle some sentence parts to vary the structure
    sentences = sentences.map(sentence => {
        const words = sentence.split(' ');
        if (Math.random() > 0.5) {
            words.push(words.shift()); // Shift words randomly
        }
        return words.join(' ');
    });
    return sentences.join('. ') + '.'; // Reassemble with period
};

// Synonym substitution with slight randomization
const substituteWords = (text) => {
    const substitutions = {
        "important": ["crucial", "vital", "essential"],
        "difficult": ["tricky", "challenging", "tough"],
        "think": ["believe", "reckon", "suppose"],
        "result": ["outcome", "consequence", "effect"],
        "shows": ["indicates", "reveals", "demonstrates"],
        "However,": ["Still,", "Nevertheless,", "That being said,"],
        "Furthermore,": ["Moreover,", "What's more,", "In addition,"]
    };
    
    for (const [key, values] of Object.entries(substitutions)) {
        const randomChoice = values[Math.floor(Math.random() * values.length)];
        text = text.replace(new RegExp(`\\b${key}\\b`, 'g'), randomChoice);
    }
    
    return text;
};

// Manual layering: Adding extra steps like idioms and style tweaks
const applyHumanLayer = (text) => {
    let humanizedText = introduceErrors(text);   // Inject natural human errors
    humanizedText = shuffleSentenceStructure(humanizedText);  // Shuffle sentence structure
    humanizedText = substituteWords(humanizedText); // Synonym substitution
    const randomIdiom = idioms[Math.floor(Math.random() * idioms.length)];
    humanizedText += ` ${randomIdiom}.`;  // Add an idiom
    return humanizedText;
};

// Refine text with OpenAI for final touch
const fetchValidatedText = async (inputText) => {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'user',
                content: `Refine this text to sound like natural human speech and bypass AI detectors:\n\n${inputText}`
            }
        ],
        temperature: 0.8,   // Higher randomness
        max_tokens: 2048,
        top_p: 0.85,
        frequency_penalty: 1.5,
        presence_penalty: 1.5
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch validated text');
    }
};

app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        let humanizedText = applyHumanLayer(inputText);
        const finalText = await fetchValidatedText(humanizedText);
        res.json({ transformedText: finalText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to humanize text' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
