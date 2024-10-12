const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const natural = require('natural');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Custom idioms and informal phrases
const idioms = [
    "hit the nail on the head", "bite the bullet", "cut to the chase", 
    "under the weather", "break the ice", "let the cat out of the bag",
    "burn the midnight oil", "the ball is in your court", "back to the drawing board"
];

// Function to insert idioms
const insertRandomIdiom = (text) => {
    const randomIdiom = idioms[Math.floor(Math.random() * idioms.length)];
    const sentences = text.split(/(?<=[.!?])\s+/);
    const insertionIndex = Math.floor(Math.random() * sentences.length);
    sentences[insertionIndex] = `${randomIdiom}. ${sentences[insertionIndex]}`;
    return sentences.join(' ');
};

// Function to introduce human-like errors
const introduceHumanErrors = (text) => {
    const errors = [
        { regex: /its/g, replacement: "it's" },
        { regex: /their/g, replacement: "thier" },
        { regex: /to/g, replacement: "too" },
        { regex: /your/g, replacement: "you're" },
        { regex: /there/g, replacement: "they're" },
    ];
    
    // Random spacing errors
    text = text.replace(/([.,!?;])/g, ' $1'); // space before punctuation

    // Introduce random errors
    errors.forEach(error => {
        text = text.replace(error.regex, error.replacement);
    });
    
    // Randomly insert additional spacing errors
    return text.replace(/(\w)(?=\s)/g, '$1  '); // add extra spaces after words
};

// Aggressive paraphrasing function
const aggressiveParaphrase = (text) => {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const rephrased = sentences.map(sentence => {
        const words = sentence.split(/\s+/);
        const transformationType = Math.random() < 0.5 ? 'split' : 'merge';
        
        if (transformationType === 'split' && words.length > 6) {
            const midPoint = Math.floor(words.length / 2);
            return words.slice(0, midPoint).join(' ') + '... ' + words.slice(midPoint).join(' ');
        } else {
            return words.reverse().join(' '); // Reverse words as another form of paraphrasing
        }
    });
    return rephrased.join(' ');
};

// Function to fetch refined text from OpenAI
const fetchValidatedText = async (inputText, temperature = 0.9, top_p = 0.95) => {
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
                content: `Make this text sound more natural and informal while including idioms:\n\n${inputText}`
            }
        ],
        max_tokens: 2000,
        temperature, 
        top_p,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch validated text from OpenAI API');
    }
};

// Token similarity check
const calculateAiHumanScore = (originalText, transformedText) => {
    const originalWords = originalText.split(/\s+/);
    const transformedWords = transformedText.split(/\s+/);

    const commonWords = originalWords.filter(word => transformedWords.includes(word));
    const similarityRatio = commonWords.length / originalWords.length;

    const aiGeneratedPercentage = similarityRatio * 100;
    const humanizedPercentage = 100 - aiGeneratedPercentage;

    return {
        aiGeneratedPercentage: aiGeneratedPercentage.toFixed(2),
        humanizedPercentage: humanizedPercentage.toFixed(2),
    };
};

// API route to handle text transformation and scoring
app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        // Step 1: Insert custom idioms and informal phrases
        let humanizedText = insertRandomIdiom(inputText);

        // Step 2: Aggressive paraphrasing and sentence restructuring
        humanizedText = aggressiveParaphrase(humanizedText);

        // Step 3: Introduce human errors and noise
        humanizedText = introduceHumanErrors(humanizedText);

        // Step 4: Fetch validated text from OpenAI
        const finalText = await fetchValidatedText(humanizedText);
        
        // Step 5: Calculate AI and humanized content ratio
        const { aiGeneratedPercentage, humanizedPercentage } = calculateAiHumanScore(inputText, finalText);

        res.json({
            transformedText: finalText,
            aiGeneratedPercentage,
            humanizedPercentage
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to humanize text' });
    }
});

// Serve the index.html at the root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
