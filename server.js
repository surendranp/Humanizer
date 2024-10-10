const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
}));

app.use(bodyParser.json());

// Serve the static files (like index.html, CSS, and JS)
app.use(express.static('public'));

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Function to estimate the number of tokens based on input text length
const estimateTokens = (inputText) => {
    const wordCount = inputText.split(/\s+/).length;
    return Math.min(Math.ceil(wordCount * 1.33), 2048);
};

// Synonym Replacement
const synonyms = {
    "happy": "joyful",
    "sad": "unhappy",
    "difficult": "challenging",
    // Add more synonyms as needed
};

const replaceSynonyms = (text) => {
    return text.split(' ').map(word => synonyms[word.toLowerCase()] || word).join(' ');
};

// Sentence Restructuring
const restructureSentence = (text) => {
    // Example: Reorder sentences naturally by focusing on rephrasing common sentence structures.
    return text
        .replace(/This gym offers/g, "At this gym, you'll find")
        .replace(/At the end of the day,/g, "In the end,")
        .replace(/Furthermore,/g, "Also,");
};

// Add Personal Touches
const addPersonalTouches = (text) => {
    const personalPhrases = [
        "I mean, it's pretty clear that...",
        "You know what? I've noticed that...",
        "Honestly, have you ever thought about how..."
    ];
    const randomPhrase = personalPhrases[Math.floor(Math.random() * personalPhrases.length)];
    return `${randomPhrase} ${text}`;
};

// Stronger pre-processing to humanize locally
const humanizeTextLocally = (inputText) => {
    let modifiedText = replaceSynonyms(inputText);
    modifiedText = restructureSentence(modifiedText);
    modifiedText = addPersonalTouches(modifiedText);
    return modifiedText;
};

// Function to validate and refine text via OpenAI API
const fetchValidatedText = async (inputText) => {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const maxTokens = estimateTokens(inputText);

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'user',
                content: `Lightly refine this text to sound more natural without adding AI-like patterns. Focus on polishing, not rephrasing entirely:\n\n${inputText}`
            }
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
        top_p: 0.9,
        frequency_penalty: 1.5,
        presence_penalty: 1.2
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch validated text from OpenAI API');
    }
};

// API route to handle text transformation
app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        // First, apply strong local humanization
        let humanizedText = humanizeTextLocally(inputText);

        // Then, send the text to OpenAI for minimal adjustments
        const finalText = await fetchValidatedText(humanizedText);
        res.json({ transformedText: finalText });
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
