const outputs = []; // Array to store generated outputs
let currentPage = 0; // Track current page

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
        updateWordCount(data.transformedText);
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
    const outputContainer = document.getElementById('humanizedText');
    const currentOutput = outputs.length > 0 ? outputs[currentPage] : 'No outputs generated yet.';
    outputContainer.value = currentOutput;
    updateWordCount(currentOutput); // Update word count when navigating pages
}

// Update the word count dynamically for outputs
function updateWordCount(text) {
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById('outputWordCount').innerText = `Output Word Count: ${wordCount}`;
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

// Copy button functionality with animation
document.getElementById('copyBtn').addEventListener('click', () => {
    const outputText = document.getElementById('humanizedText').value;
    if (outputText.trim()) {
        navigator.clipboard.writeText(outputText).then(() => {
            const copyStatus = document.getElementById('copyStatus');
            copyStatus.style.display = 'inline'; // Show the copied message
            setTimeout(() => {
                copyStatus.style.display = 'none'; // Hide after 2 seconds
            }, 2000);
        }).catch(err => {
            console.error('Error copying text: ', err);
        });
    }
});

// Add event listener for input changes to update word count dynamically
document.getElementById('inputText').addEventListener('input', function () {
    const inputText = this.value;
    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    document.getElementById('wordCount').innerText = `Word Count: ${wordCount}`;
});

document.getElementById('clearBtn').addEventListener('click', function () {
    document.getElementById('inputText').value = '';
    document.getElementById('humanizedText').value = ''; // Clear the text area value
    document.getElementById('outputWordCount').innerText = 'Output Word Count: 0';
    document.getElementById('aiGeneratedPercentage').innerText = 'AI-generated content: 0%';
    document.getElementById('humanizedPercentage').innerText = 'Humanized content: 0%';
    document.getElementById('wordCount').innerText = 'Word Count: 0'; // Reset the word count

    // Clear stored outputs
    outputs.length = 0;
    currentPage = 0; // Reset page to 0
    document.getElementById('paginationControls').style.display = 'none'; // Hide pagination controls
});
