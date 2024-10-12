const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const natural = require('natural');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const wordnet = new natural.WordNet();

// Middleware setup
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
}));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Custom list of idioms and informal phrases
const idioms = [
    "hit the nail on the head", "bite the bullet", "cut to the chase", 
    "under the weather", "break the ice", "let the cat out of the bag",
    "burn the midnight oil", "the ball is in your court", "back to the drawing board"
];

// Randomly insert an idiom into the text
const insertRandomIdiom = (text) => {
    const randomIdiom = idioms[Math.floor(Math.random() * idioms.length)];
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    const insertionIndex = Math.floor(Math.random() * sentences.length);
    sentences[insertionIndex] = `${randomIdiom}. ${sentences[insertionIndex]}`;
    return sentences.join(' ');
};

// Introduce human-like errors and noise (typos, odd spacing)
const introduceHumanErrors = (text) => {
    return text.replace(/its/g, "it's")
               .replace(/their/g, "thier")
               .replace(/to/g, "too")
               .replace(/your/g, "you're")
               .replace(/there/g, "they're")
               .replace(/and/g, "an")
               .replace(/ /g, '  ') // Add extra spaces randomly
               .replace(/,/g, ' , ') // Random space before commas
               .replace(/\. /g, ' . '); // Add irregular spacing after full stops
};

// Aggressive paraphrasing: sentence restructuring
const aggressiveParaphrase = (text) => {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    const rephrased = sentences.map(sentence => {
        const words = sentence.split(/\s+/);
        if (words.length > 5) {
            // Split long sentences or merge short ones
            const splitPoint = Math.floor(words.length / 2);
            return words.slice(0, splitPoint).join(' ') + ', ' + words.slice(splitPoint).join(' ');
        }
        return words.reverse().join(' '); // Reverse word order as an aggressive change
    });
    return rephrased.join('. ');
};

// Adjust sentence length randomly
const adjustSentenceLengths = (text) => {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    return sentences.map(sentence => {
        if (sentence.split(/\s+/).length < 5) {
            return sentence + ' ' + sentence; // Duplicate short sentences
        }
        if (sentence.split(/\s+/).length > 20) {
            return sentence.split(' ').slice(0, 15).join(' ') + '...'; // Truncate long sentences
        }
        return sentence;
    }).join(' ');
};

// OpenAI API call for further refinement
const fetchValidatedText = async (inputText, temperature = 0.85, top_p = 0.9) => {
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
                content: `Please make this text sound natural, informal, with idioms and random sentence lengths:\n\n${inputText}`
            }
        ],
        max_tokens: 2000,
        temperature,  // Increased temperature for variability
        top_p,        // Increase diversity
        frequency_penalty: 0.5,
        presence_penalty: 0.4
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
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
        // Step 1: Insert custom idioms and informal phrases
        let humanizedText = insertRandomIdiom(inputText);

        // Step 2: Aggressive paraphrasing and sentence restructuring
        humanizedText = aggressiveParaphrase(humanizedText);

        // Step 3: Introduce human errors and noise
        humanizedText = introduceHumanErrors(humanizedText);

        // Step 4: Adjust sentence lengths
        humanizedText = adjustSentenceLengths(humanizedText);

        // Step 5: Send the text to OpenAI for further adjustments
        const finalText = await fetchValidatedText(humanizedText, 0.9, 0.95);
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
