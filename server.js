require('dotenv').config();

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Expanded list of idioms and informal phrases
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
    "A stitch in time saves nine",
    "When pigs fly",
    "Under the weather",
    "Piece of cake",           // New idioms
    "The ball is in your court",
    "The best of both worlds",
    "A dime a dozen",
    "Let the cat out of the bag",
    "Barking up the wrong tree"
];

// Function to introduce random spelling/grammar errors
const introduceErrors = (text) => {
    const errors = [
        { pattern: /their/g, replacement: "there" },
        { pattern: /it's/g, replacement: "its" },
        { pattern: /affect/g, replacement: "effect" },
        { pattern: /too/g, replacement: "to" },
        { pattern: /lose/g, replacement: "loose" },
        { pattern: /your/g, replacement: "you're" },
        { pattern: /then/g, replacement: "than" },
        { pattern: /definitely/g, replacement: "definately" },  // New errors
        { pattern: /separate/g, replacement: "seperate" },
        { pattern: /occasionally/g, replacement: "occassionally" },
        { pattern: /received/g, replacement: "recieved" },
        { pattern: /believe/g, replacement: "beleive" }
    ];
    return errors.reduce((result, { pattern, replacement }) => result.replace(pattern, replacement), text);
};

// Function to add slight conversational filler
const addFillerWords = (text) => {
    const fillers = [
       "you know,", "well,", "basically,", "to be honest,", "like I said,", 
        "I guess,", "sort of,", "actually,", "you see,", "just saying,", // New fillers
        "I mean,", "kind of,", "right?"
    ];
    const sentences = text.split('.');
    return sentences.map(sentence => {
        if (Math.random() < 0.35) {
            const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
            return `${randomFiller} ${sentence}`;
        }
        return sentence;
    }).join('. ');
};

// More aggressive sentence randomization
const adjustSentenceStructure = (text) => {
    let sentences = text.split('.');
    sentences = sentences.map(sentence => {
        if (Math.random() > 0.6) {
            return sentence + '. ' + sentences[Math.floor(Math.random() * sentences.length)];  // Insert random sentences from other parts of the text
        }
        if (sentence.length > 15 && Math.random() < 0.5) {
            return sentence.slice(0, sentence.length / 2) + '. ' + sentence.slice(sentence.length / 2);  // Split long sentences
        }
        return sentence;
    });
    return sentences.join('. ');
};

// Insert idioms and informal phrases at random positions
const addIdiomsAndPhrases = (text) => {
    const randomIdiom = idioms[Math.floor(Math.random() * idioms.length)];
    const sentences = text.split('.');
    const insertIndex = Math.floor(Math.random() * sentences.length);
    sentences.splice(insertIndex, 0, randomIdiom);
    return sentences.join('. ');
};

// Stronger paraphrasing with more variability
const aggressiveParaphrase = (text) => {
    return text
        .replace(/important/g, "crucial")
        .replace(/difficult/g, "challenging")
        .replace(/think/g, "believe")
        .replace(/result/g, "outcome")
        .replace(/shows/g, "demonstrates")
        .replace(/However,/g, "Nonetheless,")
        .replace(/Furthermore,/g, "Moreover,")
        .replace(/Moreover,/g, "In addition,")
        .replace(/benefits/g, "advantages")
        .replace(/utilize/g, "use")
        .replace(/obtain/g, "get")
        .replace(/start/g, "begin")
        .replace(/end/g, "conclude")
        .replace(/suggest/g, "propose")
        .replace(/happy/g, "content")
        .replace(/sad/g, "unhappy");
};
// Function to split long input text into smaller chunks
const splitIntoChunks = (text, chunkSize) => {
    const words = text.split(/\s+/);
    let chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
};

// Function to process each chunk and concatenate the final result
const processInChunks = async (inputText) => {
    const chunks = splitIntoChunks(inputText, 150); // Split into chunks of 150 words
    let finalResult = '';

    for (const chunk of chunks) {
        let chunkHumanized = humanizeTextLocally(chunk);  // Humanize locally first
        let refinedChunk = await fetchValidatedText(chunkHumanized);  // Refine with OpenAI
        finalResult += ' ' + refinedChunk;  // Concatenate the results
    }

    return finalResult.trim();
};
// Applying all transformations for humanization
const humanizeTextLocally = (inputText) => {
    let text = introduceErrors(inputText);            // Step 1: Introduce random errors
    text = addFillerWords(text);                      // Step 2: Add conversational fillers
    text = adjustSentenceStructure(text);             // Step 3: Randomize sentence structure
    text = aggressiveParaphrase(text);                // Step 4: Aggressively paraphrase content
    text = addIdiomsAndPhrases(text);                 // Step 5: Insert idioms and phrases
    return text;
};

// OpenAI API function for final refinements with corrected randomness
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
                content: `Refine this text to sound as if it was written by a human, with randomness, slight imperfections, and informal tone. Ensure it is undetectable by AI content detection tools. Add variability:\n\n${inputText}`
            }
        ],
        max_tokens: 2048,
        temperature: Math.random() * 0.5 + 0.7,  // Vary temperature between 0.7 and 1.2 for more creativity
        top_p: Math.min(Math.random() * 0.4 + 0.6, 1),  // Corrected: Ensure top_p never exceeds 1
        frequency_penalty: 1.5,                  // Encourage variability in words
        presence_penalty: 1.7                    // Reduce consistent patterns
    };

    try {
        const response = await axios.post(url, requestData, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch validated text');
    }
};

// Function to calculate AI-generated content percentage
const calculateAIGeneratedPercentage = (originalText, humanizedText) => {
    const originalWords = originalText.split(/\s+/);
    const humanizedWords = humanizedText.split(/\s+/);
    let unchangedWords = 0;

    // Count how many words remained the same
    for (let i = 0; i < Math.min(originalWords.length, humanizedWords.length); i++) {
        if (originalWords[i] === humanizedWords[i]) {
            unchangedWords++;
        }
    }

    // Calculate percentage of AI-generated (unchanged) content
    const aiGeneratedPercentage = (unchangedWords / originalWords.length) * 100;
    return aiGeneratedPercentage.toFixed(2); // Return a percentage with 2 decimal places
};

app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        let humanizedText = humanizeTextLocally(inputText);
        const finalText = await fetchValidatedText(humanizedText);

        // Calculate AI-generated and humanized content percentages
        const aiGeneratedPercentage = calculateAIGeneratedPercentage(inputText, finalText);
        const humanizedPercentage = (100 - aiGeneratedPercentage).toFixed(2);

        res.json({ 
            transformedText: finalText,
            aiGeneratedPercentage,
            humanizedPercentage
        });
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
