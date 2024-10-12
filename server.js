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

// List of idioms and informal phrases
const idioms = [
    "It's a piece of cake",
    "Break the ice",
    "Hit the nail on the head",
    "Bite the bullet",
    "Let the cat out of the bag",
    // Add more idioms as needed
];

// Function to randomly incorporate idioms and informal phrases
const incorporateIdioms = (text) => {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    return sentences.map(sentence => {
        if (Math.random() < 0.2) { // 20% chance to add an idiom
            const randomIdiom = idioms[Math.floor(Math.random() * idioms.length)];
            return sentence + " " + randomIdiom;
        }
        return sentence;
    }).join(' ');
};

// Randomly introduce human-like errors
const introduceHumanErrors = (text) => {
    return text.replace(/its/g, "it's")
               .replace(/therefore/g, "therefor")
               .replace(/an/g, "and")
               .replace(/the best/g, "the bestest")
               .replace(/\b(?<!\S)\w{4}\b/g, (match) => {
                   return Math.random() < 0.3 ? match.split('').reverse().join('') : match; // 30% chance to reverse 4-letter words
               });
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

// Adjust sentence lengths randomly
const randomLengthAdjustment = (text) => {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    return sentences.map(sentence => {
        const addWords = Math.floor(Math.random() * 4); // Randomly add 0-3 words
        const additionalWords = " and maybe even just a little bit more".split(' ').slice(0, addWords).join(' ');
        return sentence + additionalWords;
    }).join(' ');
};

// Adjust the tone of the text
const adjustTone = (text) => {
    const tones = [
        "Honestly, ", "I gotta say, ", "Let me be real with you, ", "No kidding, ", "In my opinion, "
    ];
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    return sentences.map((sentence, idx) => {
        if (Math.random() < 0.2) { // 20% chance to adjust tone
            const randomTone = tones[Math.floor(Math.random() * tones.length)];
            return randomTone + sentence;
        }
        return sentence;
    }).join(' ');
};

// AI pattern detection and neutralization
const detectAndNeutralizeAIPatterns = (inputText) => {
    const aiPatterns = [
        { pattern: /Furthermore,/g, replacement: "Moreover," },
        { pattern: /In conclusion,/g, replacement: "To wrap up," },
        { pattern: /Firstly,/g, replacement: "First of all," },
        { pattern: /Secondly,/g, replacement: "Secondly," },
        { pattern: /Overall,/g, replacement: "All in all," },
        { pattern: /Therefore,/g, replacement: "Thus," }
    ];

    let neutralizedText = inputText;
    aiPatterns.forEach(({ pattern, replacement }) => {
        neutralizedText = neutralizedText.replace(pattern, replacement);
    });

    return neutralizedText;
};

// Local humanization function with deeper variations
const humanizeTextLocally = async (inputText) => {
    let neutralizedText = detectAndNeutralizeAIPatterns(inputText);  // Neutralize AI patterns
    neutralizedText = await replaceSynonymsWithWordNet(neutralizedText);  // Synonym replacement using WordNet
    neutralizedText = incorporateIdioms(neutralizedText);  // Add idioms
    neutralizedText = introduceHumanErrors(neutralizedText);  // Add minor human-like errors
    neutralizedText = randomLengthAdjustment(neutralizedText);  // Adjust sentence lengths
    neutralizedText = adjustTone(neutralizedText);  // Tone adjustments
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
        top_p: 0.95,         // Encourage more diverse output
        frequency_penalty: 0.5,  // Penalize repetitions
        presence_penalty: 0.3
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
        // Step 1: Apply local humanization with WordNet and deep sentence variation
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
