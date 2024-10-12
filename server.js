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

// Synonym replacement dictionary (expanded for better coverage)
const synonyms = {
    "happy": ["joyful", "pleased", "content", "delighted"],
    "sad": ["unhappy", "downhearted", "sorrowful", "dejected"],
    "difficult": ["challenging", "tough", "hard"],
    "important": ["crucial", "vital", "significant", "essential"],
    // Add more synonyms as needed
};

// Context-aware synonym replacement (with WordNet integration)
const replaceSynonymsContextually = async (text) => {
    let words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        let lowerWord = words[i].toLowerCase();
        if (synonyms[lowerWord]) {
            let replacementList = synonyms[lowerWord];
            words[i] = replacementList[Math.floor(Math.random() * replacementList.length)];
        } else {
            // Fetch synonym from WordNet for more advanced replacement
            await wordnet.lookup(lowerWord, (results) => {
                if (results.length > 0) {
                    words[i] = results[0].synonyms[0] || words[i];
                }
            });
        }
    }
    return words.join(' ');
};

// AI pattern detection and neutralization (with better replacements)
const detectAndNeutralizeAIPatterns = (inputText) => {
    const aiPatterns = [
        { pattern: /Furthermore,/g, replacement: "Additionally," },
        { pattern: /In conclusion,/g, replacement: "To wrap things up," },
        { pattern: /Firstly,/g, replacement: "To start with," },
        { pattern: /Secondly,/g, replacement: "Next," },
        { pattern: /Overall,/g, replacement: "All in all," },
        { pattern: /Therefore,/g, replacement: "Thus," },
        { pattern: /research-based/g, replacement: "evidence-backed" },
        { pattern: /It is recommended that/g, replacement: "I suggest that" },
        // Add more patterns as needed
    ];

    let neutralizedText = inputText;
    aiPatterns.forEach(({ pattern, replacement }) => {
        neutralizedText = neutralizedText.replace(pattern, replacement);
    });

    return neutralizedText;
};

// Sentence restructuring (improving sentence flow)
const restructureSentence = (text) => {
    let sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    return sentences.map(sentence => {
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

// Add personal touch for informality
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

// Humanize text locally
const humanizeTextLocally = async (inputText) => {
    let neutralizedText = detectAndNeutralizeAIPatterns(inputText);  // Neutralize AI patterns
    neutralizedText = await replaceSynonymsContextually(neutralizedText);  // Contextual synonym replacement
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
        temperature: 1.0,  // Increased temperature for more creative responses
        top_p: 1.0,         // Encourage more diverse output
        frequency_penalty: 0.5,  // Penalize repetitions
        presence_penalty: 0.5
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
        let humanizedText = await humanizeTextLocally(inputText);

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
