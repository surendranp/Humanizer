const outputs = []; // Array to store generated outputs
let currentPage = 0; // Track current page
const outputsPerPage = 1; // Number of outputs per page

document.getElementById('submitBtn').addEventListener('click', async function () {
    const inputText = document.getElementById('inputText').value;

    if (!inputText.trim()) {
        alert('Please enter some text.');
        return;
    }

    document.getElementById('loader').style.display = 'block';
    document.getElementById('humanizedText').value = ''; // Clear previous output
    document.getElementById('outputWordCount').innerText = 'Output Word Count: 0';
    document.getElementById('aiGeneratedPercentage').innerText = 'AI-generated content: 0%';
    document.getElementById('humanizedPercentage').innerText = 'Humanized content: 0%';

    try {
        const response = await fetch('/humanize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputText })
        });

        if (!response.ok) {
            throw new Error('Failed to humanize text');
        }

        const data = await response.json();
        document.getElementById('loader').style.display = 'none';

        // Store the output
        outputs.push(data.transformedText);
        currentPage = outputs.length - 1; // Set to the last generated output

        // Display the latest output
        displayOutput();

        // Update output word count and percentages
        const outputWordCount = data.transformedText.trim().split(/\s+/).length;
        document.getElementById('outputWordCount').innerText = `Output Word Count: ${outputWordCount}`;
        document.getElementById('aiGeneratedPercentage').innerText = `AI-generated content: ${data.aiGeneratedPercentage}%`;
        document.getElementById('humanizedPercentage').innerText = `Humanized content: ${data.humanizedPercentage}%`;
        document.getElementById('retryBtn').style.display = 'inline';

        // Show pagination controls
        updatePaginationControls();

    } catch (error) {
        console.error('Error:', error);
        alert('Error occurred while humanizing the text. Please try again.');
        document.getElementById('loader').style.display = 'none';
    }
});

// Display the current output based on the current page
function displayOutput() {
    const outputContainer = document.getElementById('humanizedText'); // Use the correct text area ID
    outputContainer.value = outputs.length > 0 ? outputs[currentPage] : 'No outputs generated yet.'; // Set value instead of innerHTML

    // Update word count for the currently displayed output
    const outputWordCount = outputs[currentPage] ? outputs[currentPage].trim().split(/\s+/).length : 0;
    document.getElementById('outputWordCount').innerText = `Output Word Count: ${outputWordCount}`;
}

// Update pagination controls
function updatePaginationControls() {
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.style.display = 'flex';

    // Disable Previous button if on first page
    document.getElementById('prevPage').disabled = currentPage === 0;

    // Disable Next button if on the last output
    document.getElementById('nextPage').disabled = currentPage >= outputs.length - 1;
}

// Previous page button
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        displayOutput();
        updatePaginationControls();
    }
});

// Next page button
document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < outputs.length - 1) {
        currentPage++;
        displayOutput();
        updatePaginationControls();
    }
});

// Add event listener for input changes to update word count dynamically
document.getElementById('inputText').addEventListener('input', function () {
    const inputText = this.value;
    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    document.getElementById('wordCount').innerText = `Word Count: ${wordCount}`;
});

// Clear button functionality
document.getElementById('clearBtn').addEventListener('click', function () {
    // Clear the input text
    document.getElementById('inputText').value = '';
    
    // Clear the output text area
    document.getElementById('humanizedText').value = ''; 

    // Reset word count and percentage displays
    document.getElementById('outputWordCount').innerText = 'Output Word Count: 0';
    document.getElementById('aiGeneratedPercentage').innerText = 'AI-generated content: 0%';
    document.getElementById('humanizedPercentage').innerText = 'Humanized content: 0%';
    document.getElementById('wordCount').innerText = 'Word Count: 0'; // Reset input word count

    // Clear stored outputs
    outputs.length = 0; // Clear the outputs array
    currentPage = 0;    // Reset the current page to 0

    // Hide pagination controls
    document.getElementById('paginationControls').style.display = 'none'; 
});

// Copy functionality
document.getElementById('copyBtn').addEventListener('click', function () {
    const humanizedText = document.getElementById('humanizedText');
    humanizedText.select();
    document.execCommand('copy');

    // Show copy message
    const copyMessage = document.getElementById('copyMessage');
    copyMessage.innerText = 'Copied!';
    copyMessage.style.display = 'inline'; 

    // Animate tick symbol and hide the message after 1.5 seconds
    setTimeout(() => {
        copyMessage.style.display = 'none';
    }, 1500);
});
