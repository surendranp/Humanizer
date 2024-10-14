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
    const outputContainer = document.getElementById('humanizedText');
    const outputText = outputs.length > 0 ? outputs[currentPage] : 'No outputs generated yet.';
    outputContainer.value = outputText;

    // Update word count for current page
    const wordCount = outputText.trim().split(/\s+/).length;
    document.getElementById('outputWordCount').innerText = `Output Word Count: ${wordCount}`;
}

// Update pagination controls
function updatePaginationControls() {
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.style.display = 'flex';

    document.getElementById('prevPage').disabled = currentPage === 0;
    document.getElementById('nextPage').disabled = currentPage >= outputs.length - 1;
}

// Copy to clipboard with animation
document.getElementById('copyBtn').addEventListener('click', function () {
    const humanizedText = document.getElementById('humanizedText');
    humanizedText.select();
    document.execCommand('copy');

    // Show the copy message with animation
    const copyMessage = document.getElementById('copyMessage');
    copyMessage.style.display = 'inline';
    copyMessage.classList.add('show');
    
    setTimeout(() => {
        copyMessage.classList.add('hide');
    }, 1000); // Hide after 1 second

    setTimeout(() => {
        copyMessage.style.display = 'none';
        copyMessage.classList.remove('show', 'hide');
    }, 1500); // Fully hide after animation
});

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
