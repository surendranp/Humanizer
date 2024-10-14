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
    "A blessing in disguise", "Break the ice", "Hit the nail on the head", "Speak of the devil", 
    "Once in a blue moon", "Bite the bullet", "Better late than never", "Burning the midnight oil", 
    "Spill the beans", "A stitch in time saves nine", "When pigs fly", "Under the weather", 
    "Piece of cake", "The ball is in your court", "The best of both worlds", "A dime a dozen", 
    "Let the cat out of the bag", "Barking up the wrong tree", "Costs an arm and a leg", 
    "Raining cats and dogs", "Burn bridges", "Catch someone red-handed", "Cut to the chase", 
    "Devil’s advocate", "Fit as a fiddle", "Go down in flames", "It takes two to tango", 
    "On the ball", "Pulling your leg", "The last straw", "Throw in the towel", 
    "Actions speak louder than words", "Hit the books", "Jump the gun", "Miss the boat", 
    "Once bitten, twice shy", "Out of the blue", "Time flies when you’re having fun", 
    "Through thick and thin", "Turn a blind eye", "Under the weather", "You can’t judge a book by its cover"
    // Add more as needed
];

// Expanded list of spelling/grammar errors
const spellingGrammarErrors = [
    { pattern: /their/g, replacement: "there" }, { pattern: /it's/g, replacement: "its" }, 
    { pattern: /affect/g, replacement: "effect" }, { pattern: /too/g, replacement: "to" }, 
    { pattern: /lose/g, replacement: "loose" }, { pattern: /your/g, replacement: "you're" }, 
    { pattern: /then/g, replacement: "than" }, { pattern: /definitely/g, replacement: "definately" },  
    { pattern: /separate/g, replacement: "seperate" }, { pattern: /occasionally/g, replacement: "occassionally" }, 
    { pattern: /received/g, replacement: "recieved" }, { pattern: /believe/g, replacement: "beleive" },
    { pattern: /its/g, replacement: "it's" }, { pattern: /accept/g, replacement: "except" }, 
    { pattern: /advice/g, replacement: "advise" }, { pattern: /allusion/g, replacement: "illusion" }, 
    { pattern: /compliment/g, replacement: "complement" }, { pattern: /elicit/g, replacement: "illicit" }, 
    { pattern: /precede/g, replacement: "proceed" }, { pattern: /principal/g, replacement: "principle" },
    // Add more as needed
];

// Expanded list of conversational fillers
const fillers = [
    "you know,", "well,", "basically,", "to be honest,", "like I said,", 
    "I guess,", "sort of,", "actually,", "you see,", "just saying,", 
    "I mean,", "kind of,", "right?", "in my opinion,", "at the end of the day,", 
    "frankly speaking,", "to be fair,", "in a way,", "honestly,", "seriously,", 
    "as a matter of fact,", "kind of like,", "in reality,", "truth be told,", "believe it or not,"
    // Add more as needed
];

// Expanded list of paraphrasing
const paraphrases = [
    { pattern: /important/g, replacement: "crucial" }, { pattern: /difficult/g, replacement: "challenging" }, 
    { pattern: /think/g, replacement: "believe" }, { pattern: /result/g, replacement: "outcome" }, 
    { pattern: /shows/g, replacement: "demonstrates" }, { pattern: /However,/g, replacement: "Nonetheless," }, 
    { pattern: /Furthermore,/g, replacement: "Moreover," }, { pattern: /Moreover,/g, replacement: "In addition," }, 
    { pattern: /benefits/g, replacement: "advantages" }, { pattern: /utilize/g, replacement: "use" }, 
    { pattern: /obtain/g, replacement: "get" }, { pattern: /start/g, replacement: "begin" }, 
    { pattern: /end/g, replacement: "conclude" }, { pattern: /suggest/g, replacement: "propose" }, 
    { pattern: /happy/g, replacement: "content" }, { pattern: /sad/g, replacement: "unhappy" },
    { pattern: /quickly/g, replacement: "rapidly" }, { pattern: /good/g, replacement: "excellent" }, 
    { pattern: /bad/g, replacement: "poor" }, { pattern: /big/g, replacement: "huge" },
    // Add more as needed
];

// Function to introduce random spelling/grammar errors
const introduceErrors = (text) => {
    return spellingGrammarErrors.reduce((result, { pattern, replacement }) => result.replace(pattern, replacement), text);
};

// Function to add slight conversational filler
const addFillerWords = (text) => {
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
            return sentence + '. ' + sentences[Math.floor(Math.random() * sentences.length)];
        }
        if (sentence.length > 15 && Math.random() < 0.5) {
            return sentence.slice(0, sentence.length / 2) + '. ' + sentence.slice(sentence.length / 2);
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
    return paraphrases.reduce((result, { pattern, replacement }) => result.replace(pattern, replacement), text);
};

// Applying all transformations for humanization
const humanizeTextLocally = (inputText) => {
    let text = introduceErrors(inputText);
    text = addFillerWords(text);
    text = adjustSentenceStructure(text);
    text = aggressiveParaphrase(text);
    text = addIdiomsAndPhrases(text);
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
        temperature: Math.random() * 0.5 + 0.7,
        top_p: Math.min(Math.random() * 0.4 + 0.6, 1),
        frequency_penalty: 1.5,
        presence_penalty: 1.7
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

        res.json({ 
            transformedText: finalText
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
