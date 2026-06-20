import json
import re

def srt_time_to_seconds(t_str):
    # Format: 00:00:11,340
    h, m, s_ms = t_str.split(':')
    s, ms = s_ms.split(',')
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0

def parse_srt(srt_path):
    content = open(srt_path, 'r', encoding='utf-8').read()
    # Normalize line endings
    content = content.replace('\r\n', '\n')
    blocks = content.strip().split('\n\n')
    parsed_blocks = []
    
    for b in blocks:
        lines = b.strip().split('\n')
        if len(lines) >= 3:
            num = lines[0]
            time_line = lines[1]
            text = " ".join(lines[2:])
            
            match = re.match(r"(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})", time_line)
            if match:
                start_t = srt_time_to_seconds(match.group(1))
                end_t = srt_time_to_seconds(match.group(2))
                parsed_blocks.append({
                    "start": start_t,
                    "end": end_t,
                    "text": text,
                    "words": text.split()
                })
    return parsed_blocks

def fix_transcript(json_path, srt_path, output_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    srt_blocks = parse_srt(srt_path)
    
    # We want to match json words to srt blocks
    # A word belongs to an srt block if its start/end is near the block's start/end.
    # To be safe, we can iterate through the SRT blocks sequentially and match the words.
    json_words = data["words"]
    
    # Filter out instrumental / filler words if they are not in the SRT
    # but we need to keep their positions in the JSON if they are separate.
    # Let's align srt block words to the json words.
    current_json_idx = 0
    
    for block in srt_blocks:
        b_start = block["start"]
        b_end = block["end"]
        srt_words = block["words"]
        
        # Find JSON words that fall inside [b_start - 0.5, b_end + 0.5]
        matched_json_indices = []
        for idx in range(current_json_idx, len(json_words)):
            w = json_words[idx]
            w_clean = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()…?"\']', '', w["word"].lower()).strip()
            # If it's music or hmm filler at the beginning/between lines, skip it
            if w_clean in ["music", "hmm"] and not any(sw.lower() == w_clean for sw in srt_words):
                continue
            
            # Check if this word overlaps with the block timeframe
            if w["start"] >= b_start - 1.0 and w["start"] <= b_end + 1.0:
                matched_json_indices.append(idx)
            elif w["start"] > b_end + 1.0:
                break
                
        # If we matched some words, let's align them
        if len(matched_json_indices) == len(srt_words):
            for s_w, j_idx in zip(srt_words, matched_json_indices):
                json_words[j_idx]["word"] = s_w
            current_json_idx = matched_json_indices[-1] + 1
        else:
            print(f"Warning: Word count mismatch for block: {block['text']}. SRT count: {len(srt_words)}, JSON count: {len(matched_json_indices)}")
            # Fallback: align one by one if counts differ, or just map sequentially
            if len(matched_json_indices) > 0:
                # Map as many as possible
                min_len = min(len(srt_words), len(matched_json_indices))
                for idx in range(min_len):
                    json_words[matched_json_indices[idx]]["word"] = srt_words[idx]
                current_json_idx = matched_json_indices[-1] + 1
                
    # Update full_text in the json
    # Join all words that are not music/hmm fillers into a clean full_text or keep the whole thing
    data["full_text"] = " ".join([w["word"] for w in json_words])
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print("Transcript spelling typos corrected successfully!")

if __name__ == "__main__":
    fix_transcript(
        "Lyrics/weight_transcript.json",
        "Lyrics/weight_subs.srt",
        "Lyrics/weight_transcript.json"
    )
