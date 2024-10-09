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

    // Send the input text to the backend for humanization
    const response = await fetch('http://localhost:3000/humanize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputText })
    });

    const data = await response.json();

    // Hide loader
    document.getElementById('loader').style.display = 'none';

    // Display the transformed text
    document.getElementById('humanizedText').innerText = data.transformedText;

    // Calculate and display output word count
    const outputWordCount = data.transformedText.trim().split(/\s+/).length;
    document.getElementById('outputWordCount').innerText = `Output Word Count: ${outputWordCount}`;
    document.getElementById('retryBtn').style.display = 'inline';
});

document.getElementById('retryBtn').addEventListener('click', async function () {
    const inputText = document.getElementById('inputText').value;

    // Show loader
    document.getElementById('loader').style.display = 'block';
    document.getElementById('humanizedText').innerText = ''; // Clear previous output
    document.getElementById('outputWordCount').innerText = 'Output Word Count: 0'; // Reset output word count

    const response = await fetch('http://localhost:3000/humanize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputText })
    });

    const data = await response.json();

    // Hide loader
    document.getElementById('loader').style.display = 'none';

    // Display the transformed text
    document.getElementById('humanizedText').innerText = data.transformedText;

    // Calculate and display output word count
    const outputWordCount = data.transformedText.trim().split(/\s+/).length;
    document.getElementById('outputWordCount').innerText = `Output Word Count: ${outputWordCount}`;
});

// Clear button functionality
document.getElementById('clearBtn').addEventListener('click', function () {
    document.getElementById('inputText').value = '';  // Clear the text area
    document.getElementById('humanizedText').innerText = 'Your transformed text will appear here...'; // Reset transformed text
    document.getElementById('outputWordCount').innerText = 'Output Word Count: 0'; // Reset output word count
    document.getElementById('wordCount').innerText = 'Word Count: 0';  // Reset input word count
    document.getElementById('retryBtn').style.display = 'none';  // Hide the retry button
});
