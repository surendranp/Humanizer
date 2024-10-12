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

// Custom idioms and informal phrases
const idiomsAndPhrases = [
    "hit the nail on the head", "a dime a dozen", "spill the beans", 
    "piece of cake", "off the hook", "in the nick of time", "bent out of shape"
];

// Function to randomly select an idiom or phrase
const injectIdioms = (text) => {
    const randomIndex = Math.floor(Math.random() * idiomsAndPhrases.length);
    const idiom = idiomsAndPhrases[randomIndex];
    const sentences = text.split('. ');
    const randomSentenceIndex = Math.floor(Math.random() * sentences.length);
    sentences[randomSentenceIndex] = `${idiom}, ${sentences[randomSentenceIndex]}`;
    return sentences.join('. ');
};

// Function to introduce human-like errors
const introduceErrors = (text) => {
    return text.replace(/its/g, "it's")
               .replace(/there/g, "their")
               .replace(/and/g, "an")
               .replace(/to/g, "too")
               .replace(/your/g, "you're");
};

// Function to vary sentence length
const varySentenceLength = (text) => {
    const sentences = text.split('. ');
    return sentences.map((sentence) => {
        if (sentence.length > 20) {
            const mid = Math.floor(sentence.length / 2);
            return sentence.slice(0, mid) + '. ' + sentence.slice(mid);
        }
        return sentence;
    }).join('. ');
};

// Function to aggressively paraphrase using WordNet
const aggressiveParaphrase = async (text) => {
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

// Adjust API parameters for more creative outputs
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
                content: `Please refine this text to sound more natural and human-like, making it undetectable by AI detection tools:\n\n${inputText}`
            }
        ],
        max_tokens: 2048,
        temperature: 0.9, // Increased randomness for creative responses
        top_p: 0.95,      // Diverse outputs
        frequency_penalty: 0.6, // Discourage repetition
        presence_penalty: 0.5   // Encourage diverse topics
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch validated text from OpenAI API');
    }
};

// Humanize text with custom modifications
const humanizeTextLocally = async (inputText) => {
    let modifiedText = injectIdioms(inputText);  // Add idioms and phrases
    modifiedText = introduceErrors(modifiedText);  // Add human-like errors
    modifiedText = varySentenceLength(modifiedText);  // Vary sentence length
    modifiedText = await aggressiveParaphrase(modifiedText);  // Aggressive paraphrasing
    return modifiedText;
};

// API route to handle text transformation
app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        // Step 1: Apply local humanization techniques
        let humanizedText = await humanizeTextLocally(inputText);

        // Step 2: Send to OpenAI for further validation and refinement
        const finalText = await fetchValidatedText(humanizedText);
        res.json({ transformedText: finalText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to humanize text' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
