const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Custom idioms and informal phrases
const idioms = [
    "A blessing in disguise",
    "Break the ice",
    "Hit the nail on the head",
    "Speak of the devil",
    "Once in a blue moon",
    "Bite the bullet",
    "Better late than never",
    "Burning the midnight oil",
    "Spill the beans",
];

// Function to introduce random spelling/grammar errors
const introduceErrors = (text) => {
    const errors = [
        { pattern: /their/g, replacement: "there" },
        { pattern: /it's/g, replacement: "its" },
        { pattern: /affect/g, replacement: "effect" },
        { pattern: /too/g, replacement: "to" },
        { pattern: /lose/g, replacement: "loose" }
    ];
    return errors.reduce((result, { pattern, replacement }) => result.replace(pattern, replacement), text);
};

// Introduce random sentence length variations
const adjustSentenceLength = (text) => {
    let sentences = text.split('.');
    sentences = sentences.map(sentence => {
        if (Math.random() > 0.5) return sentence + ', ' + sentence;  // Combine sentences randomly
        return sentence;
    });
    return sentences.join('. ');
};

// Insert idioms and informal phrases
const addIdiomsAndPhrases = (text) => {
    const randomIdiom = idioms[Math.floor(Math.random() * idioms.length)];
    return `${text} ${randomIdiom}.`;
};

// Aggressively paraphrase content with increased variability
const aggressiveParaphrase = (text) => {
    return text
        .replace(/important/g, "vital")
        .replace(/difficult/g, "tough")
        .replace(/think/g, "reckon")
        .replace(/result/g, "consequence")
        .replace(/shows/g, "demonstrates")
        .replace(/However,/g, "Still,")
        .replace(/Furthermore,/g, "Besides that,");
};

// Stronger humanization logic with idioms, paraphrasing, and errors
const humanizeTextLocally = (inputText) => {
    let text = introduceErrors(inputText);            // Step 1: Introduce errors
    text = adjustSentenceLength(text);                // Step 2: Vary sentence lengths
    text = aggressiveParaphrase(text);                // Step 3: Aggressive paraphrasing
    text = addIdiomsAndPhrases(text);                 // Step 4: Add idioms and phrases
    return text;
};

// OpenAI API function for final refinements
const fetchValidatedText = async (inputText) => {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const maxTokens = 2048;

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'user',
                content: `Refine this text to sound more like natural human speech without adding detectable AI-like patterns. Ensure variability and human-like flaws:\n\n${inputText}`
            }
        ],
        max_tokens: maxTokens,
        temperature: 0.75,  // More variability
        top_p: 0.85,
        frequency_penalty: 1.7,  // Encourage more sentence variety
        presence_penalty: 1.7    // Reduce AI presence in the final output
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch validated text');
    }
};

app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        let humanizedText = humanizeTextLocally(inputText);
        const finalText = await fetchValidatedText(humanizedText);
        res.json({ transformedText: finalText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to humanize text' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
