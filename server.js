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
                const synonyms = results[0].synonyms;
                if (synonyms.length > 0) {
                    words[i] = synonyms[Math.floor(Math.random() * synonyms.length)];
                }
            }
        });
    }
    return words.join(' ');
};

// Custom idioms and informal phrases
const idiomsAndPhrases = [
    "It's a piece of cake",
    "Break a leg",
    "Hit the nail on the head",
    "Bite the bullet",
    "Let the cat out of the bag",
    "Kick the bucket",
    "Burning the midnight oil",
    "Under the weather",
    "Cut to the chase",
    "Throw in the towel",
];

// Aggressive Paraphrasing with idioms and variations
const aggressiveParaphrasing = async (text) => {
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
                content: `Make this text sound more natural and less detectable:\n\n${text}\n\nUse idioms and informal phrases where appropriate.`
            }
        ],
        temperature: 0.9,
        top_p: 0.95,
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

// Introduce human-like errors
const introduceHumanErrors = (text) => {
    const errors = [
        { pattern: /\bthere\b/g, replacement: 'their' },
        { pattern: /\bdefinitely\b/g, replacement: 'definately' },
        { pattern: /\bthe\b/g, replacement: 'da' },
        { pattern: /\byou\b/g, replacement: 'u' },
        { pattern: /\band\b/g, replacement: '&' },
    ];
    let modifiedText = text;
    errors.forEach(({ pattern, replacement }) => {
        modifiedText = modifiedText.replace(pattern, replacement);
    });
    return modifiedText;
};

// Randomly shuffle and adjust sentence lengths
const adjustSentenceLength = (text) => {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    const adjustedSentences = sentences.map(sentence => {
        const words = sentence.split(' ');
        const lengthVariation = Math.floor(Math.random() * 5) - 2; // Adjust length between -2 to +2
        if (lengthVariation > 0) {
            // Add random words to lengthen the sentence
            for (let i = 0; i < lengthVariation; i++) {
                words.push('really'); // Simple filler word
            }
        } else if (lengthVariation < 0 && words.length > 1) {
            // Shorten the sentence
            return words.slice(0, Math.max(words.length + lengthVariation, 1)).join(' ');
        }
        return words.join(' ');
    });
    return adjustedSentences.join(' ');
};

// Voice Shifting
const shiftVoiceRandomly = (text) => {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    return sentences.map(sentence => {
        if (Math.random() < 0.5) {
            // Change some sentences to passive voice
            const words = sentence.split(' ');
            if (words.length > 1) {
                return `${words[words.length - 1]} was ${words[0]}`; // Simple transformation for demo
            }
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
        // Step 1: Paraphrase the input text aggressively
        let paraphrasedText = await aggressiveParaphrasing(inputText);

        // Step 2: Replace synonyms using WordNet
        let synonymReplacedText = await replaceSynonymsWithWordNet(paraphrasedText);

        // Step 3: Introduce human-like errors
        let errorIntroducedText = introduceHumanErrors(synonymReplacedText);

        // Step 4: Adjust sentence lengths
        let lengthAdjustedText = adjustSentenceLength(errorIntroducedText);

        // Step 5: Shift voice between active and passive
        let shiftedVoiceText = shiftVoiceRandomly(lengthAdjustedText);

        // Step 6: Add custom idioms and informal phrases
        const randomIdiom = idiomsAndPhrases[Math.floor(Math.random() * idiomsAndPhrases.length)];
        const finalText = `${shiftedVoiceText} Also, just to add, ${randomIdiom}.`; // Incorporate idiom into the final output

        // Step 7: Send the final output
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
