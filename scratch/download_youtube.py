import os
import sys
import subprocess
import static_ffmpeg

def main():
    # Add static-ffmpeg paths to os.environ['PATH'] so yt-dlp can find ffmpeg
    static_ffmpeg.add_paths()
    print("Ffmpeg path added:", os.environ.get("PATH", "")[:200] + "...")
    
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/watch?v=L3Dp4oGkn3k"
    output_path = "public/youtube-video.mp4"
    
    # Remove existing file if present
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
            print(f"Removed old {output_path}")
        except Exception as e:
            print(f"Error removing old file: {e}")
            
    print(f"Downloading 1-minute segment of {url} to {output_path}...")
    
    cmd = [
        "yt-dlp",
        "-f", "18",  # 360p mp4 (safe, light and compatible)
        "--download-sections", "*00:00:00-00:01:00",
        "--force-overwrites",
        url,
        "-o", output_path
    ]
    
    try:
        res = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("Success!")
        print(res.stdout)
    except subprocess.CalledProcessError as e:
        print("Error downloading video:")
        print(e.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
