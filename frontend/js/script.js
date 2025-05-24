// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend script loaded!');

    // Get references to the elements
    const playlistUrlInput = document.getElementById('playlistUrlInput');
    const downloadButton = document.getElementById('downloadButton');
    const statusArea = document.getElementById('statusArea');

    // Add event listener to the button
    if (downloadButton && playlistUrlInput && statusArea) {
        downloadButton.addEventListener('click', async () => {
            const playlistUrl = playlistUrlInput.value.trim(); // Get input value and remove whitespace

            if (playlistUrl === '') {
                statusArea.innerHTML = '<p style="color: orange;">Please enter a playlist URL!</p>';
                return; // Stop if input is empty
            }

            // Display a loading message and disable button
            statusArea.innerHTML = '<p>Sending download request to backend...</p>';
            downloadButton.disabled = true;
            downloadButton.textContent = 'Downloading...';

            try {
                // Send the playlist URL to the backend using fetch API
                // Make sure the URL matches where your Flask backend is running
                const backendUrl = 'http://localhost:5000/download'; // <-- Flask backend URL and endpoint

                const response = await fetch(backendUrl, {
                    method: 'POST', // Use POST method to send data
                    headers: {
                        'Content-Type': 'application/json', // Tell the backend we're sending JSON
                    },
                    body: JSON.stringify({ playlist_url: playlistUrl }), // Convert the data to a JSON string
                });

                // Check if the request was successful (status code 200-299)
                if (!response.ok) {
                    // Attempt to read error message from backend if available
                    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                // Parse the JSON response from the backend
                const data = await response.json();

                // Display the response in the status area
                statusArea.innerHTML = `<p>${data.message}</p>`;

            } catch (error) {
                // Handle any errors during the fetch request or backend processing
                console.error('Error during download request:', error);
                statusArea.innerHTML = `<p style="color: red;">Error: ${error.message || 'Could not connect to backend or process request.'}</p>`;
            } finally {
                // Re-enable the button after the request is complete (success or failure)
                downloadButton.disabled = false;
                downloadButton.textContent = 'Start Download';
            }
        });
    } else {
        console.error('One or more required elements not found in the HTML!');
    }
});
