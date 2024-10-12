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

// Function to estimate the number of tokens based on input text length
const estimateTokens = (inputText) => {
    const wordCount = inputText.split(/\s+/).length;
    return Math.min(Math.ceil(wordCount * 1.33), 2048);
};

// Synonym replacement with WordNet
const replaceSynonymsWithWordNet = async (text) => {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        const lowerWord = words[i].toLowerCase();
        await wordnet.lookup(lowerWord, (results) => {
            if (results.length > 0 && results[0].synonyms.length > 0) {
                // Randomly pick a synonym
                const synonyms = results[0].synonyms;
                if (synonyms.length > 0) {
                    words[i] = synonyms[Math.floor(Math.random() * synonyms.length)];
                }
            }
        });
    }
    return words.join(' ');
};

// Multi-layer paraphrasing for randomization
const multiLayerParaphrasing = async (text) => {
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
                content: `Paraphrase this text to make it more human-like and less detectable:\n\n${text}`
            }
        ],
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: estimateTokens(text),
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error during paraphrasing:', error.message);
        throw new Error('Paraphrasing failed');
    }
};

// Sentence Fragmentation
const fragmentSentences = (text) => {
    return text.replace(/([a-z0-9])(\. )([A-Z])/g, '$1. $2$3'); // Adds breaks between sentences
};

// Voice Shifting
const shiftVoiceRandomly = (text) => {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    return sentences.map(sentence => {
        if (Math.random() < 0.5) {
            // Change some sentences to passive voice
            return sentence.replace(/(\w+)(\s\w+)+/, "$2 was $1");
        }
        return sentence;
    }).join(' ');
};

// API route to handle text transformation
app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        // Step 1: Paraphrase the input text with OpenAI
        let paraphrasedText = await multiLayerParaphrasing(inputText);

        // Step 2: Replace synonyms using WordNet
        let synonymReplacedText = await replaceSynonymsWithWordNet(paraphrasedText);

        // Step 3: Fragment sentences randomly
        let fragmentedText = fragmentSentences(synonymReplacedText);

        // Step 4: Shift voice between active and passive
        let shiftedVoiceText = shiftVoiceRandomly(fragmentedText);

        // Step 5: Send the final output
        res.json({ transformedText: shiftedVoiceText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to humanize text' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
