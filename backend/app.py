import yt_dlp
import os
from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all origins (useful for development)

# Define the directory where downloads will be saved
# IMPORTANT: Change this path if you need to save elsewhere on your server
DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')

# Ensure the download directory exists
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)
    print(f"Created download directory: {DOWNLOAD_DIR}")

# --- yt-dlp download logic (adapted) ---

# Hook function to show download progress (prints to server console)
def hook(d):
    if d['status'] == 'finished':
        print('Download complete, now post-processing...')
    elif d['status'] == 'downloading':
        # You could potentially store this status somewhere accessible
        # by another endpoint for the frontend to poll, but for this
        # simple example, it just prints on the server side.
        print(f"Downloading... {d['_percent_str']} completed at {d['_speed_str']}")
    elif d['status'] == 'error':
        print(f"Error during download: {d.get('message', 'Unknown error')}")


# Function to download YouTube playlist
# This function is BLOCKING - it will hold up the server until done
def download_playlist_task(playlist_url):
    # Define the output template relative to the DOWNLOAD_DIR
    output_template = os.path.join(DOWNLOAD_DIR, '%(playlist)s', '%(playlist_index)02d - %(title)s.%(ext)s')

    ydl_opts = {
        'format': 'bestvideo[height<=720]+bestaudio/best',  # Get 720p video with best audio
        'outtmpl': output_template,  # Numbered filenames in the download directory
        'merge_output_format': 'mp4',  # Ensure MP4 format
        'noplaylist': False,  # Download entire playlist
        'progress_hooks': [hook],  # Hook for progress feedback (server console)
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',  # Convert to MP4 if needed
        }],
        'verbose': True, # Add verbose output for debugging on the server console
    }

    print(f"Attempting to download playlist: {playlist_url}")
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([playlist_url])
        print(f"Successfully finished download for: {playlist_url}")
        return True, "Download completed successfully!"
    except Exception as e:
        print(f"An error occurred during download: {e}")
        return False, f"An error occurred during download: {e}"

# --- Flask Routes ---

# Root endpoint (optional, for testing if server is running)
@app.route('/')
def index():
    return "YouTube Playlist Downloader Backend is running!"

# Endpoint to handle download requests
@app.route('/download', methods=['POST'])
def handle_download():
    # Get the JSON data from the request body
    data = request.get_json()

    # Check if 'playlist_url' is in the received data
    if not data or 'playlist_url' not in data:
        print("Received invalid request: Missing playlist_url")
        return jsonify({"message": "Invalid request: 'playlist_url' is required."}), 400 # Bad Request

    playlist_url = data['playlist_url']
    print(f"Received download request for URL: {playlist_url}")

    # --- Execute the download task ---
    # WARNING: This is BLOCKING. For production, run this in a background task.
    success, message = download_playlist_task(playlist_url)
    # --- End of BLOCKING task ---

    if success:
        return jsonify({"message": message}), 200 # OK
    else:
        # Return a 500 Internal Server Error if the download failed
        return jsonify({"message": message}), 500


# --- Run the Flask app ---
if __name__ == '__main__':
    # Run the server on port 5000 (default for Flask)
    # debug=True is useful for development (reloads on code changes)
    app.run(debug=True, port=5000)
