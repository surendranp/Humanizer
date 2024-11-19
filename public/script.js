const outputs = []; // Array to store generated outputs
let currentPage = 0; // Track current page
const outputsPerPage = 1; // Number of outputs per page
const wordLimit = 500; // Set the word limit to 500
let isEditMode = false; // To toggle between edit mode and read-only mode

document.getElementById('submitBtn').addEventListener('click', async function () {
    const inputText = document.getElementById('inputText').value;

    // Calculate word count
    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

    // Check if word count exceeds 500
    if (wordCount > wordLimit) {
        document.getElementById('wordLimitMessage').style.display = 'block'; // Show the message
        return; // Stop further execution if the word count is over 500
    } else {
        document.getElementById('wordLimitMessage').style.display = 'none'; // Hide the message when within limit
    }

    if (!inputText.trim()) {
        showAlert('Please enter some text.', 'danger'); // Show alert instead of alert()
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

        // Hide loader and display output
        document.getElementById('loader').style.display = 'none';

        // Store the output with percentages
        outputs.push({
            transformedText: data.transformedText,
            aiGeneratedPercentage: data.aiGeneratedPercentage,
            humanizedPercentage: data.humanizedPercentage
        });
        currentPage = outputs.length - 1; // Set to the last generated output

        // Display the latest output
        displayOutput();

        // Update output word count and percentages
        const outputWordCount = data.transformedText.trim().split(/\s+/).length;
        document.getElementById('outputWordCount').innerText = `Output Word Count: ${outputWordCount}`;
        document.getElementById('aiGeneratedPercentage').innerText = `AI-generated content: ${data.aiGeneratedPercentage}%`;
        document.getElementById('humanizedPercentage').innerText = `Humanized content: ${data.humanizedPercentage}%`;

        // Show pagination controls
        updatePaginationControls();

    } catch (error) {
        console.error('Error:', error);
        showAlert('Error occurred while humanizing the text. Please try again.', 'danger');
        document.getElementById('loader').style.display = 'none'; // Hide the loader on error
    }
});

// Function to show Bootstrap alerts
function showAlert(message, type) {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
    alertContainer.role = 'alert';
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Set styles to center the alert
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '50%';
    alertContainer.style.left = '50%';
    alertContainer.style.transform = 'translate(-50%, -50%)';
    alertContainer.style.zIndex = '1050'; // Ensure it's above other content
    alertContainer.style.width = '400px';  // Width set to 300 pixels
    alertContainer.style.height = '200px'; // Height set to 100 pixels
    alertContainer.style.overflow = 'hidden'; // Prevent overflow of text
    alertContainer.style.display = 'flex'; // Use flexbox to center text
    alertContainer.style.fontSize='24px';
    alertContainer.style.alignItems = 'center'; // Vertically center
    alertContainer.style.justifyContent = 'center'; // Horizontally center
    alertContainer.style.backgroundColor = '#000000a2'; // Set your desired background color here
    alertContainer.style.color = '#fff'; // Optional: Set text color to white for better contrast

    document.body.appendChild(alertContainer); // Append the alert to the body

    // Automatically remove the alert after 3 seconds
    setTimeout(() => {
        $(alertContainer).alert('close');
    }, 3000);
}


// Display the current output based on the current page
function displayOutput() {
    const outputContainer = document.getElementById('humanizedText');
    const currentOutput = outputs[currentPage];

    if (currentOutput) {
        outputContainer.value = currentOutput.transformedText;

        // Update word count for the currently displayed output
        const outputWordCount = currentOutput.transformedText.trim().split(/\s+/).length;
        document.getElementById('outputWordCount').innerText = `Output Word Count: ${outputWordCount}`;
        document.getElementById('aiGeneratedPercentage').innerText = `AI-generated content: ${currentOutput.aiGeneratedPercentage}%`;
        document.getElementById('humanizedPercentage').innerText = `Humanized content: ${currentOutput.humanizedPercentage}%`;

        // Toggle edit mode
        outputContainer.readOnly = !isEditMode;
        document.getElementById('editBtn').style.display = isEditMode ? 'none' : 'inline';
        document.getElementById('updateBtn').style.display = isEditMode ? 'inline' : 'none';
    } else {
        outputContainer.value = 'No outputs generated yet.';
    }
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

// Toggle edit mode
document.getElementById('editBtn').addEventListener('click', () => {
    isEditMode = true;
    displayOutput();
});

// Save the edited content
document.getElementById('updateBtn').addEventListener('click', () => {
    const outputContainer = document.getElementById('humanizedText');
    outputs[currentPage].transformedText = outputContainer.value; // Update the stored output

    isEditMode = false;
    displayOutput();
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

// Add event listener for input changes to update word count dynamically
document.getElementById('inputText').addEventListener('input', function () {
    const inputText = this.value;
    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    document.getElementById('wordCount').innerText = `Input Word Count: ${wordCount}`;

    // Check word limit on input change
    if (wordCount > wordLimit) {
        document.getElementById('wordLimitMessage').style.display = 'block';
    } else {
        document.getElementById('wordLimitMessage').style.display = 'none';
    }
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
    document.getElementById('wordCount').innerText = 'Input Word Count: 0'; // Reset input word count

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
    copyMessage.style.display = 'inline'; // Show the message
    copyMessage.classList.remove('hide');
    copyMessage.classList.add('show');

    // Hide the message after 1.5 seconds
    setTimeout(() => {
        copyMessage.style.display = 'none'; // Hide after 1.5 seconds
    }, 1500);
});

// =============================================
const textInput = document.getElementById("textInput");
const wordCountDisplay = document.getElementById("wordCount");

// Function to calculate and update word count
const updateWordCount = () => {
    const text = textInput.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    wordCountDisplay.textContent = `Word Count: ${wordCount}`;
};

// Update word count on input and paste events
textInput.addEventListener("input", updateWordCount);
textInput.addEventListener("paste", () => {
    setTimeout(updateWordCount, 0); // Delay to ensure pasted content is included
});

document.getElementById("convertButton").addEventListener("click", async () => {
    const text = textInput.value;
    const voice = document.getElementById("voiceSelect").value;

    // Check if text is provided
    if (!text.trim()) {
        alert("Please enter some text!");
        return;
    }

    // Check if word count exceeds 1000
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 1000) {
        alert("Please enter below 1000 words.");
        return;
    }

    try {
        const response = await fetch("/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice }),
        });

        const result = await response.json();

        if (result.success) {
            const audioLink = document.getElementById("audioLink");
            const filename = result.filename;

            if (filename) {
                // Update download link
                audioLink.href = filename;
                audioLink.download = filename.split('/').pop();

                // Display download link and audio preview
                document.getElementById("downloadLink").style.display = "block";
                const audioPlayer = document.getElementById("audioPlayer");
                audioPlayer.src = filename;
                audioPlayer.style.display = "block";
                audioPlayer.play(); // Auto-play the audio
            } else {
                alert("Failed to retrieve the filename.");
            }
        } else {
            alert("Failed to convert text to speech. Please try again.");
        }
    } catch (error) {
        console.error(error);
        alert("An error occurred. Please try again.");
    }
});
