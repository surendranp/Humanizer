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
    return Math.min(Math.ceil(wordCount * 1.33), 2048); // Ensure it doesn't exceed OpenAI's max token limit
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

// Enhanced Sentence Restructuring
const restructureSentence = (text) => {
    // Add more complex restructuring if needed
    return text.split('. ').map(sentence => {
        const words = sentence.split(' ');
        if (words.length > 1) {
            // Swap first and last word of each sentence
            [words[0], words[words.length - 1]] = [words[words.length - 1], words[0]];
        }
        return words.join(' ');
    }).join('. ');
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

// Function to handle the OpenAI API request with retries
const fetchHumanizedText = async (inputText) => {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const maxTokens = estimateTokens(inputText); // Estimate max tokens dynamically based on input text

    // Apply strategies
    let modifiedText = replaceSynonyms(inputText);
    modifiedText = restructureSentence(modifiedText);
    modifiedText = addPersonalTouches(modifiedText);

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
            { 
                role: 'user', 
                content: `Rewrite the following text in a highly human-like manner, ensuring it is plagiarism-free and undetectable by AI detectors. Focus on maintaining a natural style while minimizing any AI-like content:\n\n${modifiedText}` 
            }
        ],
        max_tokens: maxTokens, // Dynamically set max_tokens based on input size
        temperature: 0.35,      // Lowered temperature to further reduce randomness
        top_p: 0.85,            // Adjusted for a tighter probability spread
        frequency_penalty: 1.5, // Increased to penalize repetitive phrases more aggressively
        presence_penalty: 1.0    // Encourage more diversity in the output
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
