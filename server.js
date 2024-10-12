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

// Custom idiom and informal phrase list
const idioms = [
    "hit the nail on the head", "bite the bullet", "cut to the chase", 
    "under the weather", "break the ice", "let the cat out of the bag"
];

// Randomly select an idiom or phrase to insert
const insertRandomIdiom = (text) => {
    const randomIdiom = idioms[Math.floor(Math.random() * idioms.length)];
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    const insertionIndex = Math.floor(Math.random() * sentences.length);
    sentences[insertionIndex] = `${randomIdiom}. ${sentences[insertionIndex]}`;
    return sentences.join(' ');
};

// Introduce human-like errors
const introduceHumanErrors = (text) => {
    return text.replace(/its/g, "it's")
               .replace(/their/g, "thier")
               .replace(/to/g, "too")
               .replace(/you're/g, "your")
               .replace(/there/g, "they're")
               .replace(/and/g, "an");
};

// Random length adjustments
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

// Aggressive paraphrasing using WordNet
const replaceSynonymsWithWordNet = async (text) => {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        const lowerWord = words[i].toLowerCase();
        await wordnet.lookup(lowerWord, (results) => {
            if (results.length > 0 && results[0].synonyms.length > 0) {
                words[i] = results[0].synonyms[Math.floor(Math.random() * results[0].synonyms.length)];
            }
        });
    }
    return words.join(' ');
};

// OpenAI API call for further validation and variability
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
                content: `Please make this text sound natural, informal, with idioms and random sentence lengths:\n\n${inputText}`
            }
        ],
        max_tokens: 2000,
        temperature: 0.9,  // Increased for creativity
        top_p: 0.95,       // Encouraging diversity in the response
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

        // Step 2: Apply local humanization with WordNet and deep sentence variation
        humanizedText = await replaceSynonymsWithWordNet(humanizedText);
        humanizedText = introduceHumanErrors(humanizedText);
        humanizedText = adjustSentenceLengths(humanizedText);

        // Step 3: Send the text to OpenAI for further adjustments
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
