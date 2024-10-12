const baseUrl = window.location.origin;

document.getElementById('submitBtn').addEventListener('click', async function () {
    const inputText = document.getElementById('inputText').value.trim();

    if (!inputText) {
        alert('Please enter some text.');
        return;
    }

    // Calculate input word count and display it
    const inputWordCount = inputText.split(/\s+/).length;
    document.getElementById('inputWordCount').innerText = `Input Word Count: ${inputWordCount}`;

    document.getElementById('loader').style.display = 'block';
    document.getElementById('humanizedText').innerText = '';
    document.getElementById('outputWordCount').innerText = 'Output Word Count: 0';

    try {
        const response = await fetch(`${baseUrl}/humanize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputText })
        });

        if (!response.ok) {
            throw new Error(`Failed to humanize text. Status: ${response.status}`);
        }

        const data = await response.json();

        document.getElementById('loader').style.display = 'none';
        document.getElementById('humanizedText').innerText = data.transformedText;
        const outputWordCount = data.transformedText.trim().split(/\s+/).length;
        document.getElementById('outputWordCount').innerText = `Output Word Count: ${outputWordCount}`;
        document.getElementById('retryBtn').style.display = 'inline';

    } catch (error) {
        console.error('Error:', error);
        alert(`Error occurred while humanizing the text: ${error.message}`);
        document.getElementById('loader').style.display = 'none';
    }
});
