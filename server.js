const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Function to estimate tokens
const estimateTokens = (inputText) => {
    const wordCount = inputText.split(/\s+/).length;
    return Math.min(Math.ceil(wordCount * 1.33), 2048);
};

// Profiles for varied voice and errors
const profiles = [
    {
        name: "Casual Writer",
        style: "slightly informal",
        commonErrors: ["its vs it's", "run-on sentences", "minor grammatical errors"],
        fillerWords: ["you know", "basically", "kind of", "well"]
    },
    {
        name: "Academic Writer",
        style: "formal, academic",
        commonErrors: ["complex sentence structures", "occasional passive voice", "long-winded explanations"],
        fillerWords: ["moreover", "in addition", "thus", "furthermore"]
    },
    {
        name: "Conversationalist",
        style: "informal and chatty",
        commonErrors: ["shortened words", "slang", "missing punctuation"],
        fillerWords: ["like", "honestly", "seriously", "totally"]
    }
];

// Idioms and informal phrases
const idioms = [
    "the ball is in your court", "bite the bullet", "break the ice", 
    "hit the nail on the head", "let the cat out of the bag", 
    "spill the beans", "under the weather"
];

// Function to apply human-like errors and variability
const applyProfile = (text, profile) => {
    let newText = text;
    const { commonErrors, fillerWords } = profile;

    // Introduce common writing errors
    commonErrors.forEach(error => {
        newText = newText.replace(new RegExp(error, 'g'), (match) => {
            if (Math.random() < 0.2) {
                return match + " (typo)";
            }
            return match;
        });
    });

    // Add filler words randomly
    newText = newText.replace(/\b(\w+\s?\w+)\b/g, (match) => {
        if (Math.random() < 0.15) {
            return match + " " + fillerWords[Math.floor(Math.random() * fillerWords.length)];
        }
        return match;
    });

    // Add random idioms
    newText = newText.replace(/\b(\w+\s?\w+)\b/g, (match) => {
        if (Math.random() < 0.1) {
            return match + " " + idioms[Math.floor(Math.random() * idioms.length)];
        }
        return match;
    });

    return newText;
};

// Function to shuffle sentences
const shuffleSentences = (text) => {
    const sentences = text.split(/(?<=\.|\?|\!)\s+/);

    for (let i = sentences.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
    }

    return sentences.join(' ');
};

// Function to fetch text from OpenAI API
const fetchValidatedText = async (inputText) => {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: inputText }],
        max_tokens: estimateTokens(inputText),
        temperature: 0.9,  // High creativity
        top_p: 0.9,
        frequency_penalty: 0.6,
        presence_penalty: 0.5
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error fetching from OpenAI:', error.message);
        throw new Error('Failed to fetch validated text');
    }
};

// Main API route
app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        // Apply random profile
        const profile = profiles[Math.floor(Math.random() * profiles.length)];
        console.log(`Applying profile: ${profile.name}`);

        let humanizedText = applyProfile(inputText, profile);  // Apply errors and filler words
        humanizedText = shuffleSentences(humanizedText);  // Shuffle sentence order

        // Perform multiple passes with OpenAI API
        let finalText = await fetchValidatedText(humanizedText);
        finalText = await fetchValidatedText(finalText);  // Another pass for refining

        res.json({ transformedText: finalText });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to humanize text' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
