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

// Serve the static files
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
};

// Function for synonym replacement
const replaceSynonyms = (text) => {
    return text.split(' ').map(word => {
        return synonyms[word.toLowerCase()] || word;
    }).join(' ');
};

// Sentence Restructuring
const restructureSentence = (text) => {
    return text.replace(/(\w+)\s(\w+)/g, '$2 $1'); // Example of switching the first two words
};

// Add Personal Touches
const addPersonalTouches = (text) => {
    const personalPhrases = [
        "You know, it's like when you think about it...",
        "Isn't it amazing how...",
        "By the way, have you ever noticed..."
    ];
    const randomPhrase = personalPhrases[Math.floor(Math.random() * personalPhrases.length)];
    return `${randomPhrase} ${text}`;
};

// Function to handle OpenAI API request with retries
const fetchHumanizedText = async (inputText) => {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const maxTokens = estimateTokens(inputText); 

    // Apply strategies
    let modifiedText = replaceSynonyms(inputText);
    modifiedText = restructureSentence(modifiedText);
    modifiedText = addPersonalTouches(modifiedText);

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
            { 
                role: 'user', 
                content: `Rewrite the following text in a human-like manner, ensuring it is plagiarism-free and minimizing any AI-like traits:\n\n${modifiedText}` 
            }
        ],
        max_tokens: maxTokens, 
        temperature: 0.2,      // Lower temperature for more deterministic output
        top_p: 0.9,            // Slightly increased for more variety
        frequency_penalty: 1.5, // Increase penalty to discourage repetitive phrases
        presence_penalty: 1.5   // Encourage diversity in output
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch humanized text from OpenAI API');
    }
};

// API route to handle text transformation
app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        const transformedText = await fetchHumanizedText(inputText);
        res.json({ transformedText });
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
