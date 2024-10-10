const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Ensure .env is loaded early

const app = express();
const port = process.env.PORT || 3000; // Use PORT from environment variables for hosting

// Middleware setup
app.use(cors()); // Allow all origins in development
app.use(bodyParser.json());

// Serve the static files (like index.html, CSS, JS)
app.use(express.static('public')); // Serve static files from the 'public' directory

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Function to estimate the number of tokens based on the input text length
const estimateTokens = (inputText) => {
    if (!inputText || typeof inputText !== 'string') return 0; // Sanity check on input
    const wordCount = inputText.trim().split(/\s+/).length;
    return Math.min(Math.ceil(wordCount * 1.33), 2048); // Approximate tokens: 1.33x word count
};

// Function to handle OpenAI API request with retries
const fetchHumanizedText = async (inputText) => {
    if (!OPENAI_API_KEY) throw new Error('OpenAI API key is missing. Ensure it is set in .env.');

    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const maxTokens = estimateTokens(inputText); // Estimate max tokens dynamically based on input text

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'user',
                content: `Rewrite the following text in a human-like manner, maintaining the full length but ensuring it is plagiarism-free and undetectable by AI detectors:\n\n${inputText}`
            }
        ],
        max_tokens: maxTokens, // Dynamically set max_tokens based on input size
        temperature: 0.7,      // Adjust creativity/risk of the text
        top_p: 0.95,           // Ensure diversity in the output
        frequency_penalty: 0.5, // Penalize repetitive phrases
        presence_penalty: 0.5   // Encourage new topics
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error fetching text from OpenAI:', error.response ? error.response.data : error.message);
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
        console.error('Error:', error.message);
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
