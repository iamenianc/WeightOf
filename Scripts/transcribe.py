#!/usr/bin/env python3
import json
import sys
import whisper
from pathlib import Path

def transcribe_with_timestamps(mp3_path: str, output_json: str = None) -> dict:
    """Transcribe MP3 and return word-by-word timestamps."""

    mp3_file = Path(mp3_path)
    if not mp3_file.exists():
        raise FileNotFoundError(f"{mp3_path} not found")

    # Load model (small is faster, base/medium for better accuracy)
    print(f"Loading Whisper model...", file=sys.stderr)
    model = whisper.load_model("base", device="cpu")  # Use "cuda" if GPU available, "xpu" for Intel Arc

    # Transcribe with verbose output to get timing info
    print(f"Transcribing {mp3_file.name}...", file=sys.stderr)
    result = model.transcribe(str(mp3_file), language="en", verbose=False)

    # Extract word-level timestamps from segments
    words_data = []
    for segment in result["segments"]:
        text = segment["text"].strip()
        segment_start = segment["start"]
        segment_end = segment["end"]

        # Split into words
        words = text.split()
        if not words:
            continue

        # Distribute timing across words linearly
        segment_duration = segment_end - segment_start
        avg_word_duration = segment_duration / len(words)

        for i, word in enumerate(words):
            word_start = segment_start + (i * avg_word_duration)
            word_end = word_start + avg_word_duration

            words_data.append({
                "word": word,
                "start": round(word_start, 3),
                "end": round(word_end, 3),
                "duration": round(word_end - word_start, 3)
            })

    output = {
        "file": mp3_file.name,
        "duration": result.get("duration", 0),
        "language": result.get("language", "en"),
        "full_text": result["text"],
        "words": words_data
    }

    # Save to JSON if path provided
    if output_json:
        output_file = Path(output_json)
        output_file.write_text(json.dumps(output, indent=2))
        print(f"Saved to {output_file}", file=sys.stderr)

    return output

if __name__ == "__main__":
    mp3_path = sys.argv[1] if len(sys.argv) > 1 else "weight.mp3"
    output_path = sys.argv[2] if len(sys.argv) > 2 else mp3_path.replace(".mp3", "_transcript.json")

    result = transcribe_with_timestamps(mp3_path, output_path)
    print(json.dumps(result, indent=2))
