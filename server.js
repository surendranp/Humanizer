require('dotenv').config();

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require("fs");
// const path = require("path");
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
    "Piece of cake",
    "The ball is in your court",
    "The best of both worlds",
    "A dime a dozen",
    "Let the cat out of the bag",
    "Barking up the wrong tree",
    "Burn the candle at both ends",
    "By the skin of your teeth",
    "Cry over spilled milk",
    "Don't put all your eggs in one basket",
    "Elvis has left the building",
    "Every cloud has a silver lining",
    "Go the extra mile",
    "Hit the sack",
    "Jump on the bandwagon",
    "Kill two birds with one stone",
    "Last straw",
    "Let sleeping dogs lie",
    "Make a long story short",
    "Miss the boat",
    "No pain, no gain",
    "On the ball",
    "Pull someone's leg",
    "Put all your eggs in one basket",
    "See eye to eye",
    "Throw in the towel",
    "Turn a blind eye",
    "Walk on eggshells",
    "Water under the bridge",
    "Break a leg",
    "Cut to the chase",
    "Easy does it",
    "Feeling under the weather",
    "Give someone the cold shoulder",
    "Hit the books",
    "In the heat of the moment",
    "Jump the gun",
    "Keep your chin up",
    "Let bygones be bygones",
    "Make ends meet",
    "Not playing with a full deck",
    "Off the hook",
    "Out of the blue",
    "Paint the town red",
    "Put your best foot forward",
    "Raining cats and dogs",
    "Run like the wind",
    "Saved by the bell",
    "Slow and steady wins the race",
    "Steal someone's thunder",
    "The elephant in the room",
    "Throw caution to the wind",
    "Under your nose",
    "Up in the air",
    "A penny for your thoughts",
    "Bite off more than you can chew",
    "By hook or by crook",
    "Cry wolf",
    "Don't cry over spilled milk",
    "Fit as a fiddle",
    "Get cold feet",
    "Hit the road",
    "In the same boat",
    "Jack of all trades, master of none",
    "Keep your fingers crossed",
    "Let the chips fall where they may",
    "Make a mountain out of a molehill",
    "Neck and neck",
    "Once bitten, twice shy",
    "Out of the frying pan and into the fire",
    "Penny wise, pound foolish",
    "Read between the lines",
    "Straight from the horse's mouth",
    "The whole nine yards",
    "Throw in the towel",
    "Two peas in a pod",
    "Up the creek without a paddle",
    "Variety is the spice of life",
    "Wipe the slate clean",
    "You can't judge a book by its cover",
    "Your guess is as good as mine",
    "Actions speak louder than words",
    "Beggars can't be choosers",
    "Don't count your chickens before they hatch",
    "Familiarity breeds contempt",
    "Good things come to those who wait",
    "Haste makes waste",
    "If it ain't broke, don't fix it",
    "Judge a man by his actions, not his words",
    "Keep your nose to the grindstone",
    "Look before you leap",
    "Many hands make light work",
    "Necessity is the mother of invention"
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
        { pattern: /definitely/g, replacement: "definately" },
        { pattern: /separate/g, replacement: "seperate" },
        { pattern: /occasionally/g, replacement: "occassionally" },
        { pattern: /received/g, replacement: "recieved" },
        { pattern: /believe/g, replacement: "beleive" },
        { pattern: /accommodate/g, replacement: "accomodate" },
        { pattern: /achieve/g, replacement: "acheive" },
        { pattern: /argument/g, replacement: "arguement" },
        { pattern: /calendar/g, replacement: "calender" },
        { pattern: /collectible/g, replacement: "collectable" },
        { pattern: /conscience/g, replacement: "concience" },
        { pattern: /conscious/g, replacement: "concious" },
        { pattern: /embarrass/g, replacement: "embarass" },
        { pattern: /existence/g, replacement: "existance" },
        { pattern: /experience/g, replacement: "experiance" },
        { pattern: /grateful/g, replacement: "greatful" },
        { pattern: /guarantee/g, replacement: "garantee" },
        { pattern: /harass/g, replacement: "harrass" },
        { pattern: /independent/g, replacement: "independant" },
        { pattern: /judgment/g, replacement: "judgement" },
        { pattern: /millennium/g, replacement: "millenium" },
        { pattern: /mischievous/g, replacement: "mischevious" },
        { pattern: /neighbor/g, replacement: "neighbour" },
        { pattern: /noticeable/g, replacement: "noticable" },
        { pattern: /occasion/g, replacement: "occassion" },
        { pattern: /perseverance/g, replacement: "perseverence" },
        { pattern: /possession/g, replacement: "posession" },
        { pattern: /precede/g, replacement: "preceed" },
        { pattern: /privilege/g, replacement: "priviledge" },
        { pattern: /pronunciation/g, replacement: "pronounciation" },
        { pattern: /publicly/g, replacement: "publically" },
        { pattern: /receive/g, replacement: "recieve" },
        { pattern: /recommend/g, replacement: "reccomend" },
        { pattern: /referred/g, replacement: "refered" },
        { pattern: /relevant/g, replacement: "relevent" },
        { pattern: /restaurant/g, replacement: "restarant" },
        { pattern: /rhythm/g, replacement: "rythm" },
        { pattern: /schedule/g, replacement: "schedual" },
        { pattern: /separate/g, replacement: "seperate" },
        { pattern: /siege/g, replacement: "seige" },
        { pattern: /successful/g, replacement: "succesful" },
        { pattern: /supersede/g, replacement: "supercede" },
        { pattern: /surprise/g, replacement: "suprise" },
        { pattern: /threshold/g, replacement: "threshhold" },
        { pattern: /tomorrow/g, replacement: "tommorow" },
        { pattern: /twelfth/g, replacement: "twelveth" },
        { pattern: /unforeseen/g, replacement: "unforseen" },
        { pattern: /vacuum/g, replacement: "vaccum" },
        { pattern: /weather/g, replacement: "wether" },
        { pattern: /weird/g, replacement: "wierd" },
        { pattern: /wherever/g, replacement: "whereever" },
        { pattern: /writing/g, replacement: "writting" }
    ];
    return errors.reduce((result, { pattern, replacement }) => result.replace(pattern, replacement), text);
};


// Function to add slight conversational filler
const addFillerWords = (text) => {
    const fillers = [
       "you know,", "well,", "basically,", "to be honest,", "like I said,", 
       "I guess,", "sort of,", "actually,", "you see,", "just saying,", 
       "I mean,", "kind of,", "right?", "to be fair,", "honestly,", 
       "if you ask me,", "so,", "anyway,", "you know what I mean?", 
       "let’s be real,", "truth be told,", "the thing is,", "at the end of the day,", 
       "not gonna lie,", "as far as I know,", "technically,", "practically speaking,", 
       "let me tell you,", "for what it’s worth,", "you know what I’m saying?", 
       "I have to say,", "come to think of it,", "frankly,", "to tell the truth,", 
       "if I’m being honest,", "from my perspective,", "in all fairness,", 
       "if we’re being real,", "no offense, but", "as I was saying,", 
       "if I had to guess,", "in my opinion,", "let’s face it,", "now that I think about it,", 
       "for real,", "as far as I can tell,", "if we’re being honest,", "believe it or not,", 
       "just between us,", "to be frank,", "in all honesty,", "let’s be honest,", 
       "seriously,", "if you think about it,", "to be clear,", "no doubt,", 
       "one way or another,", "let’s not forget,", "that being said,", "realistically,", 
       "if I may say so,", "for better or worse,", "from what I’ve seen,", "to put it simply,", 
       "as I understand it,", "if memory serves,", "it’s worth mentioning,", "funny enough,", 
       "if you will,", "to sum up,", "let’s put it this way,", "the way I see it,", 
       "when you think about it,", "needless to say,", "to cut a long story short,", 
       "to make a long story short,", "let’s put it bluntly,", "it’s safe to say,", 
       "so to speak,", "in a way,", "as you might imagine,", "as luck would have it,", 
       "to a certain extent,", "when all is said and done,", "if nothing else,", 
       "in other words,", "to put it another way,", "to a degree,", "it’s kind of like,", 
       "the funny thing is,", "in short,", "the bottom line is,", "at the same time,", 
       "if that makes sense,", "come on,", "you might say,", "some might argue,", 
       "if I were you,", "strictly speaking,", "now,", "you could say,"
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
const processInChunks = async (inputText, keywords) => {
    const chunks = splitIntoChunks(inputText, 150);
    let finalResult = '';

    for (const chunk of chunks) {
        let chunkHumanized = humanizeTextLocally(chunk);
        let refinedChunk = await fetchValidatedText(chunkHumanized, keywords);
        finalResult += ' ' + refinedChunk;
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
const fetchValidatedText = async (inputText,keywords = []) => {
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
                content: `Refine this text to sound natural, professional, and human-like. Ensure AI detection tools find it indistinguishable from human writing. ${
                    keywords.length > 0 ? `Integrate the following keywords naturally into the content, maintaining coherence and flow: ${keywords.join(', ')}.` : ''
                }\n\n${inputText}`
            }
        ],
        max_tokens: 3048,
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
    const { inputText, keywords = [] } = req.body; // Ensure keywords is always an array

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        let humanizedText = humanizeTextLocally(inputText);
        const finalText = await fetchValidatedText(humanizedText, keywords);

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

// ==========================


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

