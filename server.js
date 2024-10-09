const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Serve the static files (like index.html, CSS, and JS)
app.use(express.static('public')); // Add this to serve static files

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Function to estimate the number of tokens based on the input text length
function estimateTokens(inputText) {
    const wordCount = inputText.split(/\s+/).length;
    // Approximate number of tokens is roughly 1.33x the word count
    return Math.min(Math.ceil(wordCount * 1.33), 2048);  // Ensure it doesn't exceed OpenAI's max token limit
}

// Function to handle the OpenAI API request with retries
async function fetchHumanizedText(inputText) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const maxTokens = estimateTokens(inputText); // Estimate max tokens dynamically based on input text

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'user', content: `Rewrite the following text in a human-like manner, maintaining the full length but ensuring it is plagiarism-free and undetectable by AI detectors:\n\n${inputText}` }
        ],
        max_tokens: maxTokens,  // Dynamically set max_tokens based on input size
        temperature: 0.7,       // Adjust creativity/risk of the text
        top_p: 0.95,            // Ensure diversity in the output
        frequency_penalty: 0.5, // Penalize repetitive phrases
        presence_penalty: 0.5   // Encourage new topics
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch humanized text from OpenAI API');
    }
}

// API route to handle text transformation
app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    try {
        const transformedText = await fetchHumanizedText(inputText);
        res.json({ transformedText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to humanize text' });
    }
});

// Serve the index.html at root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
