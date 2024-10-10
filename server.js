const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
}));

app.use(bodyParser.json());

// Serve the static files (like index.html, CSS, and JS)
app.use(express.static('public'));

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Function to estimate the number of tokens based on input text length
const estimateTokens = (inputText) => {
    const wordCount = inputText.split(/\s+/).length;
    return Math.min(Math.ceil(wordCount * 1.33), 2048);
};

// Synonym replacement dictionary
const synonyms = {
    "happy": ["joyful", "pleased", "content", "delighted"],
    "sad": ["unhappy", "downhearted", "sorrowful", "dejected"],
    "difficult": ["challenging", "tough", "hard"],
    "important": ["crucial", "vital", "significant", "essential"],
    // Add more synonyms as needed
};

// Context-aware synonym replacement
const replaceSynonymsContextually = (text) => {
    return text.split(' ').map((word) => {
        const lowerWord = word.toLowerCase();
        // Use a more advanced context check here if needed
        if (synonyms[lowerWord]) {
            const replacementList = synonyms[lowerWord];
            return replacementList[Math.floor(Math.random() * replacementList.length)];
        }
        return word;
    }).join(' ');
};

// AI pattern detection and neutralization
const detectAndNeutralizeAIPatterns = (inputText) => {
    const aiPatterns = [
        /Furthermore,/g,
        /In conclusion,/g,
        /Firstly,/g,
        /Secondly,/g,
        /Overall,/g,
        /Therefore,/g,
        /research-based/g,
        /It is recommended that/g,
        // Add more patterns as needed
    ];

    let neutralizedText = inputText;
    aiPatterns.forEach((pattern) => {
        neutralizedText = neutralizedText.replace(pattern, '');
    });

    return neutralizedText;
};

// Sentence restructuring
const restructureSentence = (text) => {
    let sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    return sentences.map(sentence => {
        // Use varied sentence starters and structures
        const startWords = [
            "Interestingly,",
            "What stands out is that",
            "You might notice that",
            "It's worth mentioning that"
        ];
        const randomStart = startWords[Math.floor(Math.random() * startWords.length)];
        return `${randomStart} ${sentence}`;
    }).join(' ');
};

// Add human-like variations and informal touches
const addPersonalTouches = (text) => {
    const personalPhrases = [
        "Honestly, it seems like...",
        "To be honest, I'd say...",
        "Have you ever thought about...",
        "Let me tell you, it's quite interesting..."
    ];
    const randomPhrase = personalPhrases[Math.floor(Math.random() * personalPhrases.length)];
    return `${randomPhrase} ${text}`;
};

// Advanced text humanization function
const humanizeTextLocally = (inputText) => {
    let neutralizedText = detectAndNeutralizeAIPatterns(inputText);  // Neutralize AI patterns
    neutralizedText = replaceSynonymsContextually(neutralizedText);  // Contextual synonym replacement
    neutralizedText = restructureSentence(neutralizedText);  // Restructure sentences
    neutralizedText = addPersonalTouches(neutralizedText);  // Add informal tone
    return neutralizedText;
};

// Function to validate and refine text via OpenAI API
const fetchValidatedText = async (inputText) => {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const maxTokens = estimateTokens(inputText);

    const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'user',
                content: `Please refine this text to sound more natural and human-like, making it undetectable by AI detection tools:\n\n${inputText}`
            }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
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
        // Step 1: Apply local humanization
        let humanizedText = humanizeTextLocally(inputText);

        // Step 2: Send the text to OpenAI for further adjustments
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
