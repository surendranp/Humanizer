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

// More advanced synonym replacement to reduce AI-like wording
const synonyms = {
    "happy": ["joyful", "pleased", "delighted"],
    "sad": ["unhappy", "downhearted", "sorrowful"],
    "difficult": ["challenging", "tough", "complex"],
    "important": ["vital", "crucial", "significant"],
    // Add more synonyms as needed
};

const replaceSynonyms = (text) => {
    return text.split(' ').map(word => {
        const lowerWord = word.toLowerCase();
        if (synonyms[lowerWord]) {
            const replacementList = synonyms[lowerWord];
            return replacementList[Math.floor(Math.random() * replacementList.length)];
        }
        return word;
    }).join(' ');
};

// Detecting AI-like patterns and neutralizing them
const detectAndNeutralizeAIPatterns = (inputText) => {
    const aiPatterns = [
        /Furthermore,/g,
        /In conclusion,/g,
        /Firstly,/g,
        /Secondly,/g,
        /Overall,/g,
        /Therefore,/g,
        /highly advanced/g,
        /In addition to this,/g,
        /research-based/g
    ];

    let neutralizedText = inputText;
    aiPatterns.forEach((pattern) => {
        neutralizedText = neutralizedText.replace(pattern, '');
    });

    return neutralizedText;
};

// Sentence restructuring that mimics natural human variation
const restructureSentence = (text) => {
    let sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);  // Split text into sentences
    return sentences.map(sentence => {
        return sentence
            .replace(/This study shows/g, "What we see here is that")
            .replace(/is essential/g, "is quite important")
            .replace(/Furthermore,/g, "Also,")
            .replace(/It is recommended/g, "I'd recommend")
            .replace(/In conclusion,/g, "All things considered,");
    }).join(' ');
};

// Add Human-Like Variations
const addPersonalTouches = (text) => {
    const personalPhrases = [
        "To be honest, it seems like...",
        "You know what? I'd say that...",
        "Honestly, have you ever wondered..."
    ];
    const randomPhrase = personalPhrases[Math.floor(Math.random() * personalPhrases.length)];
    return `${randomPhrase} ${text}`;
};

// Advanced text humanization function
const humanizeTextLocally = (inputText) => {
    let neutralizedText = detectAndNeutralizeAIPatterns(inputText);  // Step 1: Neutralize AI patterns
    neutralizedText = replaceSynonyms(neutralizedText);  // Step 2: Replace common AI words with human synonyms
    neutralizedText = restructureSentence(neutralizedText);  // Step 3: Restructure sentences
    neutralizedText = addPersonalTouches(neutralizedText);  // Step 4: Add informal tone
    return neutralizedText;
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
                content: `Refine this text to sound natural and undetectable by AI detection tools. Ensure it flows like human writing without triggering AI flags:\n\n${inputText}`
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
        // Step 1: Apply local humanization
        let humanizedText = humanizeTextLocally(inputText);

        // Step 2: Send the text to OpenAI for minimal adjustments
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
