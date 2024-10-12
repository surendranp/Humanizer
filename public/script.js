const baseUrl = window.location.origin;

document.getElementById('submitBtn').addEventListener('click', async function () {
    const inputText = document.getElementById('inputText').value;

    if (!inputText.trim()) {
        alert('Please enter some text.');
        return;
    }

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

document.getElementById('retryBtn').addEventListener('click', async function () {
    const inputText = document.getElementById('inputText').value;

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
