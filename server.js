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

// Synonym replacement using WordNet and improved dictionary
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

// Sentence simplification with improved sentence merging
const simplifySentences = (text) => {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    return sentences.map((sentence, idx) => {
        const isLong = sentence.split(/\s+/).length > 20;
        const isShort = sentence.split(/\s+/).length < 5; // Shorter sentence threshold
        if (isLong) {
            // Break long sentences
            const midPoint = Math.floor(sentence.length / 2);
            return sentence.slice(0, midPoint) + '. ' + sentence.slice(midPoint);
        } else if (isShort && idx > 0) {
            // Merge short sentences with the previous one
            return sentences[idx - 1] + ' ' + sentence;
        } else {
            return sentence;
        }
    }).join(' ');
};

// Function to generate tone variations
const generateToneVariations = (text, tone = 'casual') => {
    const toneVariations = {
        casual: [
            'In short,', 'Honestly,', 'Let me tell you,', 'You see,', 'To wrap it up,', 'So,', 'Anyway,',
            'By the way,', 'As I said,', 'Well,', 'Basically,', 'In my opinion,', 'You know,', 'I guess,',
            'For sure,', 'Just saying,', 'Seriously,', 'No doubt,', 'As I mentioned earlier,'
        ],
        formal: [
            'In conclusion,', 'Therefore,', 'However,', 'In summary,', 'Hence,', 'As a result,', 'To clarify,',
            'It should be noted that', 'To illustrate,', 'Thus,', 'For instance,', 'In my view,', 'Accordingly,',
            'Moreover,', 'Notably,', 'Consequently,', 'For that reason,', 'In light of this,', 'Similarly,'
        ],
        technical: [
            'From a technical perspective,', 'In technical terms,', 'Based on empirical data,', 'Statistically speaking,',
            'According to the analysis,', 'From a research standpoint,', 'Given the available data,', 'The evidence suggests,',
            'In a similar vein,', 'From a scientific point of view,', 'Theoretically,', 'Practically speaking,', 'In terms of metrics,',
            'Considering the algorithm,', 'Given the scope of the problem,', 'In computational terms,'
        ]
    };

    const selectedTonePhrases = toneVariations[tone] || toneVariations.casual; // Default to casual tone if undefined

    // Randomly insert tone phrases at the beginning of some sentences
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/);
    for (let i = 0; i < sentences.length; i++) {
        if (Math.random() < 0.2) { // 20% chance of adding a tone phrase
            const randomPhrase = selectedTonePhrases[Math.floor(Math.random() * selectedTonePhrases.length)];
            sentences[i] = randomPhrase + ' ' + sentences[i].trim();
        }
    }

    return sentences.join(' ');
};

// Simulate minor human-like errors
const addHumanErrors = (text) => {
    // Introduce minor punctuation issues or common typos that are later "fixed"
    return text.replace(/its/g, "it's")
               .replace(/therefore/g, "therefor")
               .replace(/their/g, "thier") // Example of common typo
               .replace(/and/g, "an");    // Another subtle mistake
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

// Final local humanization function (with improvements)
const humanizeTextLocally = async (inputText, tone = 'casual') => {
    let neutralizedText = detectAndNeutralizeAIPatterns(inputText);  // Neutralize AI patterns
    neutralizedText = await replaceSynonymsWithWordNet(neutralizedText);  // Synonym replacement using WordNet
    neutralizedText = simplifySentences(neutralizedText);  // Sentence simplification
    neutralizedText = generateToneVariations(neutralizedText, tone);  // Tone adjustment (with 50 variations)
    neutralizedText = addHumanErrors(neutralizedText);  // Add minor human-like errors
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
        temperature: 0.85,  // Increased temperature for more creative responses
        top_p: 0.9,         // Encourage more diverse output
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
    const { inputText, tone = 'casual' } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        // Step 1: Apply local humanization with WordNet and sentence simplification
        let humanizedText = await humanizeTextLocally(inputText, tone);

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
