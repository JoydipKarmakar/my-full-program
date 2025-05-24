// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend script loaded!');

    // Get references to the main elements
    const playlistUrlInput = document.getElementById('playlistUrlInput');
    const downloadButton = document.getElementById('downloadButton');
    const statusArea = document.getElementById('statusArea');

    // Get references to progress bar elements
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');

    // Initially hide the progress bar area (handled by CSS class, but good to ensure)
    progressBarContainer.classList.add('progress-hidden');
    progressText.classList.add('progress-hidden');


    if (downloadButton && playlistUrlInput && statusArea && progressBarContainer && progressBarFill && progressText) {
        downloadButton.addEventListener('click', async () => {
            const playlistUrl = playlistUrlInput.value.trim(); // Get input value and remove whitespace

            if (playlistUrl === '') {
                statusArea.innerHTML = '<p style="color: orange;">Please enter a playlist URL!</p>';
                // Hide progress bar if it was shown from a previous attempt
                progressBarContainer.classList.add('progress-hidden');
                progressText.classList.add('progress-hidden');
                return; // Stop if input is empty
            }

            // --- Start Download Process ---
            // Show and reset progress bar
            progressBarContainer.classList.remove('progress-hidden');
            progressText.classList.remove('progress-hidden');
            progressBarFill.style.width = '0%';
            progressText.textContent = '0%'; // Start text at 0%

            // Update status area and disable button
            statusArea.innerHTML = '<p>Sending download request to backend...</p>';
            downloadButton.disabled = true;
            downloadButton.textContent = 'Processing...'; // Button text indicates waiting

            try {
                const backendUrl = 'http://localhost:5000/download'; // <-- Flask backend URL and endpoint

                // Update progress text while waiting for fetch
                progressText.textContent = 'Connecting to backend...';

                const response = await fetch(backendUrl, {
                    method: 'POST', // Use POST method to send data
                    headers: {
                        'Content-Type': 'application/json', // Tell the backend we're sending JSON
                    },
                    body: JSON.stringify({ playlist_url: playlistUrl }), // Convert the data to a JSON string
                });

                // Update progress text once response is received (before checking status)
                // Note: The bar won't move during the download with this backend setup.
                // It will jump to 100% upon receiving the final response.
                progressText.textContent = 'Backend processing complete, receiving response...';


                if (!response.ok) {
                    // Attempt to read error message from backend if available
                    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                // Parse the JSON response from the backend
                const data = await response.json();

                // --- Download Successful ---
                // Update progress bar to 100%
                progressBarFill.style.width = '100%';
                progressText.textContent = '100% Complete!';

                // Display success message
                statusArea.innerHTML = `<p>${data.message}</p>`;

                // Hide the progress bar after a delay
                setTimeout(() => {
                    progressBarContainer.classList.add('progress-hidden');
                    progressText.classList.add('progress-hidden');
                }, 5000); // Hide after 5 seconds

            } catch (error) {
                // --- Download Failed ---
                console.error('Error during download request:', error);

                // Reset progress bar or indicate error state
                progressBarFill.style.width = '0%'; // Reset fill on error
                progressText.textContent = 'Error!'; // Indicate error in text

                // Display error message
                statusArea.innerHTML = `<p style="color: red;">Error: ${error.message || 'Could not connect to backend or process request.'}</p>`;

                 // Hide the progress bar after a delay
                setTimeout(() => {
                    progressBarContainer.classList.add('progress-hidden');
                    progressText.classList.add('progress-hidden');
                }, 5000); // Hide after 5 seconds


            } finally {
                // --- Always runs after try/catch ---
                downloadButton.disabled = false;
                downloadButton.textContent = 'Start Download'; // Reset button text
            }
        });
    } else {
        console.error('One or more required elements not found in the HTML!');
    }
});
