const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000; // Use the port from environment variables for hosting

// Middleware setup
app.use(cors({
    origin: '*', // Allow all origins
    methods: 'GET,POST,PUT,DELETE,OPTIONS', // Allow specific methods
    allowedHeaders: 'Content-Type,Authorization', // Allow specific headers
}));

app.use(bodyParser.json());

// Serve the static files (like index.html, CSS, and JS)
app.use(express.static('public')); // Serve static files from the 'public' directory

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Function to estimate the number of tokens based on the input text length
const estimateTokens = (inputText) => {
    const wordCount = inputText.split(/\s+/).length;
    // Approximate number of tokens is roughly 1.33x the word count
    return Math.min(Math.ceil(wordCount * 1.33), 1024); // Limit to 1024 tokens
};

// Synonym Replacement
const synonyms = {
    "happy": "joyful",
    "sad": "unhappy",
    "difficult": "challenging",
    // Add more synonyms as needed
};

// Function for synonym replacement
const replaceSynonyms = (text) => {
    return text.split(' ').map(word => {
        return synonyms[word.toLowerCase()] || word;
    }).join(' ');
};

// Sentence Restructuring (Minimal rephrasing to ensure mostly human content)
const restructureSentence = (text) => {
    return text.replace(/(\w+)\s(\w+)/g, '$2 $1'); // Simple example: switches the first two words
};

// Add Personal Touches (Manual touch that doesn't involve AI)
const addPersonalTouches = (text) => {
    const personalPhrases = [
        "You know, it's like when you think about it...",
        "Isn't it amazing how...",
        "By the way, have you ever noticed..."
    ];
    const randomPhrase = personalPhrases[Math.floor(Math.random() * personalPhrases.length)];
    return `${randomPhrase} ${text}`;
};

// Randomized Variations
const commonVariations = [
    "This might resonate with you.",
    "You might find this interesting.",
    "Here's something to ponder."
];

// Change Tone and Style (Manual adjustments to reduce AI's influence)
const adjustTone = (text) => {
    if (text.includes('urgent')) {
        return text.replace('urgent', 'really important');
    }
    return text;
};

// Contextual Understanding (Apply non-AI based context fixes)
const contextualModification = (text) => {
    if (text.includes('disappointed')) {
        return text.replace('disappointed', 'a bit let down');
    }
    return text;
};

// Preprocess the input to make it more human-like before sending to AI
const preprocessText = (inputText) => {
    let modifiedText = replaceSynonyms(inputText);
    modifiedText = restructureSentence(modifiedText);
    modifiedText = addPersonalTouches(modifiedText);
    modifiedText = adjustTone(modifiedText);
    modifiedText = contextualModification(modifiedText);

    // Append a random variation (manual)
    const randomVariation = commonVariations[Math.floor(Math.random() * commonVariations.length)];
    modifiedText += ` ${randomVariation}`;

    return modifiedText;
};

// Function to handle minimal OpenAI API usage
const fetchHumanizedText = async (inputText) => {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const maxTokens = Math.floor(estimateTokens(inputText) * 0.05); // Use only 5% of token limit

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
            { 
                role: 'user', 
                content: `Slightly refine this text for better readability, ensuring minimal change:\n\n${inputText}` 
            }
        ],
        max_tokens: maxTokens,  // Limit tokens to only make minor adjustments (5% AI)
        temperature: 0.5,       // Neutral temperature, less creativity
        top_p: 0.9,             // Favor most likely choices, but still some diversity
        frequency_penalty: 0.8, // Strong penalty to prevent AI-like repetitiveness
        presence_penalty: 0.6   // Mild presence penalty to encourage variety but minimize change
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
        // Preprocess the text manually to minimize AI usage
        const preprocessedText = preprocessText(inputText);

        // Use the OpenAI API to do minor adjustments (5% AI content)
        const finalText = await fetchHumanizedText(preprocessedText);
        res.json({ transformedText: finalText });
    } catch (error) {
        console.error('Error:', error);  // Log the error more explicitly
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
