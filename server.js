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
];

// Function to introduce random spelling/grammar errors
const introduceErrors = (text) => {
    const errors = [
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
    ];
    return errors.reduce((result, { pattern, replacement }) => result.replace(pattern, replacement), text);
};

// Function to add slight conversational filler
const addFillerWords = (text) => {
    const fillers = [
       "you know,", "well,", "basically,", "to be honest,", "like I said,", 
       "I guess,", "sort of,", "actually,", "you see,", "just saying,", 
       "I mean,", "kind of,", "right?", "in my opinion,", "at the end of the day,", 
       "frankly speaking,", "to be fair,", "in a way,", "honestly,", "seriously,", 
       "as a matter of fact,", "kind of like,", "in reality,", "truth be told,", "believe it or not,"
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
        .replace(/sad/g, "unhappy")
        .replace(/achieve/g, "accomplish")
        .replace(/assist/g, "help")
        .replace(/challenge/g, "dare")
        .replace(/consider/g, "think about")
        .replace(/create/g, "make")
        .replace(/decide/g, "choose")
        .replace(/discover/g, "find out")
        .replace(/discuss/g, "talk about")
        .replace(/experience/g, "go through")
        .replace(/explain/g, "clarify")
        .replace(/explore/g, "investigate")
        .replace(/find/g, "locate")
        .replace(/follow/g, "pursue")
        .replace(/improve/g, "enhance")
        .replace(/include/g, "consist of")
        .replace(/influence/g, "affect")
        .replace(/inquire/g, "ask about")
        .replace(/manage/g, "handle")
        .replace(/maintain/g, "keep up")
        .replace(/notice/g, "observe")
        .replace(/prepare/g, "get ready")
        .replace(/present/g, "show")
        .replace(/produce/g, "generate")
        .replace(/provide/g, "supply")
        .replace(/realize/g, "understand")
        .replace(/recognize/g, "identify")
        .replace(/recommend/g, "suggest")
        .replace(/remind/g, "alert")
        .replace(/resolve/g, "settle")
        .replace(/return/g, "come back")
        .replace(/select/g, "choose")
        .replace(/support/g, "back up")
        .replace(/use/g, "employ")
        .replace(/verify/g, "confirm")
        .replace(/watch/g, "observe")
        .replace(/work/g, "labor")
        .replace(/create/g, "develop")
        .replace(/need/g, "require")
        .replace(/want/g, "desire")
        .replace(/achieve/g, "reach")
        .replace(/establish/g, "set up")
        .replace(/consider/g, "take into account")
        .replace(/analyze/g, "examine")
        .replace(/evaluate/g, "assess")
        .replace(/improve/g, "refine")
        .replace(/show/g, "display")
        .replace(/help/g, "assist")
        .replace(/clarify/g, "explain clearly")
        .replace(/communicate/g, "convey")
        .replace(/decrease/g, "reduce")
        .replace(/determine/g, "decide")
        .replace(/examine/g, "inspect")
        .replace(/introduce/g, "present")
        .replace(/persuade/g, "convince")
        .replace(/propose/g, "suggest")
        .replace(/reduce/g, "lessen")
        .replace(/solve/g, "resolve")
        .replace(/test/g, "trial")
        .replace(/wonder/g, "ponder")
        .replace(/begin/g, "commence")
        .replace(/celebrate/g, "commemorate")
        .replace(/understand/g, "comprehend")
        .replace(/conclude/g, "finish")
        .replace(/confirm/g, "verify")
        .replace(/discuss/g, "converse")
        .replace(/emphasize/g, "stress")
        .replace(/indicate/g, "point out")
        .replace(/maintain/g, "sustain")
        .replace(/observe/g, "witness")
        .replace(/predict/g, "foresee")
        .replace(/recall/g, "remember")
        .replace(/reveal/g, "disclose")
        .replace(/respond/g, "reply")
        .replace(/succeed/g, "thrive")
        .replace(/transform/g, "change")
        .replace(/travel/g, "journey")
        .replace(/treat/g, "handle")
        .replace(/utilize/g, "make use of")
        .replace(/visit/g, "stop by")
        .replace(/express/g, "convey")
        .replace(/generate/g, "create")
        .replace(/employ/g, "use")
        .replace(/seek/g, "look for")
        .replace(/converse/g, "talk")
        .replace(/disclose/g, "reveal")
        .replace(/fulfill/g, "meet")
        .replace(/guide/g, "lead")
        .replace(/launch/g, "initiate")
        .replace(/negotiate/g, "bargain")
        .replace(/overcome/g, "surmount")
        .replace(/participate/g, "take part")
        .replace(/reform/g, "revise")
        .replace(/structure/g, "organize")
        .replace(/advance/g, "progress")
        .replace(/enforce/g, "implement");
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
// Removed since the project only provides humanized content

app.post('/humanize', async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || inputText.trim() === '') {
        return res.status(400).json({ error: 'Input text cannot be empty' });
    }

    try {
        let humanizedText = humanizeTextLocally(inputText);
        const finalText = await fetchValidatedText(humanizedText);

        // Removed AI-generated percentage calculation

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
