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

// Synonym replacement with deeper synonym variation using WordNet
const replaceSynonymsWithWordNet = async (text) => {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        const lowerWord = words[i].toLowerCase();
        await wordnet.lookup(lowerWord, (results) => {
            if (results.length > 0 && results[0].synonyms.length > 0) {
                // Randomly pick a deeper synonym from multiple results
                const synonyms = results.map(res => res.synonyms).flat();
                if (synonyms.length > 0) {
                    words[i] = synonyms[Math.floor(Math.random() * synonyms.length)];
                }
            }
        });
    }
    return words.join(' ');
};

// Randomize sentence order and inject human-like variations
const shuffleAndVarySentences = (text) => {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);

    // Shuffle sentence order randomly
    for (let i = sentences.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
    }

    return sentences.map((sentence, idx) => {
        const isLong = sentence.split(/\s+/).length > 20;
        const isShort = sentence.split(/\s+/).length < 5;

        // Randomly break or combine sentences
        if (isLong) {
            const midPoint = Math.floor(sentence.length / 2);
            return sentence.slice(0, midPoint) + '. ' + sentence.slice(midPoint);
        } else if (isShort && idx > 0) {
            return sentences[idx - 1] + ' ' + sentence;
        } else {
            return sentence;
        }
    }).join(' ');
};

// Randomly insert punctuation errors and minor human-like edits
const introduceHumanErrors = (text) => {
    return text.replace(/its/g, "it's")
               .replace(/therefore/g, "therefor")
               .replace(/their/g, "thier")
               .replace(/and/g, "an")
               .replace(/too/g, "to")
               .replace(/your/g, "you’re");
};

// Add diverse tone shifts and randomly inserted filler phrases
const addToneShifts = (text) => {
    const tones = [
        'To be honest,', 'Let me tell you,', 'In short,', 'No joke,', 'Not gonna lie,', 'Here’s the deal,', 
        'Honestly speaking,', 'Let’s be real,', 'Straight up,', 'On the other hand,', 'But,', 'Anyway,',
        'To wrap up,', 'As you can see,', 'All things considered,', 'At the end of the day,', 'Frankly,'
    ];
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);

    return sentences.map((sentence, idx) => {
        if (Math.random() < 0.3) {
            const randomTone = tones[Math.floor(Math.random() * tones.length)];
            return randomTone + ' ' + sentence;
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
        { pattern: /Secondly,/g, replacement: "Next," },
        { pattern: /Overall,/g, replacement: "All in all," },
        { pattern: /Therefore,/g, replacement: "Thus," }
    ];

    let neutralizedText = inputText;
    aiPatterns.forEach(({ pattern, replacement }) => {
        neutralizedText = neutralizedText.replace(pattern, replacement);
    });

    return neutralizedText;
};

// Humanize text locally by breaking patterns and adding randomness
const humanizeTextLocally = async (inputText) => {
    let neutralizedText = detectAndNeutralizeAIPatterns(inputText);  // Neutralize AI patterns
    neutralizedText = await replaceSynonymsWithWordNet(neutralizedText);  // Synonym replacement using WordNet
    neutralizedText = shuffleAndVarySentences(neutralizedText);  // Sentence shuffling and pattern variation
    neutralizedText = addToneShifts(neutralizedText);  // Tone shifts
    neutralizedText = introduceHumanErrors(neutralizedText);  // Add minor human-like errors
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
        temperature: 0.9,  // Increased temperature for more diverse responses
        top_p: 0.95,       // Encourage even more diverse output
        frequency_penalty: 0.7,  // Penalize repetitions
        presence_penalty: 0.6
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
