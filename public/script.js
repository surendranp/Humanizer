const baseUrl = window.location.origin; // Automatically detect the base URL (localhost in dev, Railway domain in production)

document.getElementById('submitBtn').addEventListener('click', async function () {
    const inputText = document.getElementById('inputText').value;

    if (!inputText.trim()) {
        alert('Please enter some text.');
        return;
    }

    // Calculate input word count
    const inputWordCount = inputText.trim().split(/\s+/).length;
    document.getElementById('wordCount').innerText = `Word Count: ${inputWordCount}`;

    // Show loader
    document.getElementById('loader').style.display = 'block';
    document.getElementById('humanizedText').innerText = ''; // Clear previous output
    document.getElementById('outputWordCount').innerText = 'Output Word Count: 0'; // Reset output word count

    try {
        // Send the input text to the backend for humanization
        const response = await fetch(`${baseUrl}/humanize`, { // Use dynamic URL here
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

        // Hide loader
        document.getElementById('loader').style.display = 'none';

        // Display the transformed text
        document.getElementById('humanizedText').innerText = data.transformedText;

        // Calculate and display output word count
        const outputWordCount = data.transformedText.trim().split(/\s+/).length;
        document.getElementById('outputWordCount').innerText = `Output Word Count: ${outputWordCount}`;
        document.getElementById('retryBtn').style.display = 'inline';

    } catch (error) {
        console.error('Error:', error);
        alert('Error occurred while humanizing the text. Please try again.');
        document.getElementById('loader').style.display = 'none';
    }
});

document.getElementById('retryBtn').addEventListener('click', async function () {
    const inputText = document.getElementById('inputText').value;

    // Show loader
    document.getElementById('loader').style.display = 'block';
    document.getElementById('humanizedText').innerText = ''; // Clear previous output
    document.getElementById('outputWordCount').innerText = 'Output Word Count: 0'; // Reset output word count

    try {
        const response = await fetch(`${baseUrl}/humanize`, { // Use dynamic URL here
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

        // Hide loader
        document.getElementById('loader').style.display = 'none';

        // Display the transformed text
        document.getElementById('humanizedText').innerText = data.transformedText;

        // Calculate and display output word count
        const outputWordCount = data.transformedText.trim().split(/\s+/).length;
        document.getElementById('outputWordCount').innerText = `Output Word Count: ${outputWordCount}`;

    } catch (error) {
        console.error('Error:', error);
        alert('Error occurred while humanizing the text. Please try again.');
        document.getElementById('loader').style.display = 'none';
    }
});

// Clear button functionality
document.getElementById('clearBtn').addEventListener('click', function () {
    document.getElementById('inputText').value = '';  // Clear the text area
    document.getElementById('humanizedText').innerText = 'Your transformed text will appear here...'; // Reset transformed text
    document.getElementById('outputWordCount').innerText = 'Output Word Count: 0'; // Reset output word count
    document.getElementById('wordCount').innerText = 'Word Count: 0';  // Reset input word count
    document.getElementById('retryBtn').style.display = 'none';  // Hide the retry button
});
