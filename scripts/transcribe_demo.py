import sys
import wave

import numpy as np
import whisper


def load_wav_mono_16k(path: str) -> np.ndarray:
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        channels = w.getnchannels()
        sampwidth = w.getsampwidth()
        raw = w.readframes(n)

    if sampwidth == 2:
        audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    elif sampwidth == 4:
        audio = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        raise ValueError(f"unsupported sample width: {sampwidth}")

    if channels > 1:
        audio = audio.reshape(-1, channels).mean(axis=1)

    if sr != 16000:
        new_len = int(len(audio) * 16000 / sr)
        audio = np.interp(
            np.linspace(0, len(audio), new_len, endpoint=False),
            np.arange(len(audio)),
            audio,
        ).astype(np.float32)

    return audio


audio_path = sys.argv[1] if len(sys.argv) > 1 else "public/audio/demo/demo-2.wav"
model = whisper.load_model("base")
audio = load_wav_mono_16k(audio_path)
result = model.transcribe(audio, word_timestamps=True, verbose=False)

print("FULL TEXT:")
print(result["text"])
print("\n--- SEGMENTS ---")
for s in result["segments"]:
    print(f"[{s['start']:.2f}-{s['end']:.2f}] {s['text'].strip()}")

print("\n--- ALL WORDS ---")
ts_lines = ["export const DEMO_TIMED_WORDS = ["]
for seg in result["segments"]:
    if "words" in seg:
        for w in seg["words"]:
            print(f"{w['start']:.3f}\t{w['end']:.3f}\t{w['word']}")
            word = w["word"].strip().replace("FinCAST", "FinCast").replace("\\", "\\\\").replace('"', '\\"')
            ts_lines.append(f'  {{ word: "{word}", start: {w["start"]:.3f}, end: {w["end"]:.3f} }},')
ts_lines.append("] as const;")
with open("src/components/demo/demoAudioWords.ts", "w", encoding="utf-8") as f:
    f.write("// Auto-generated from demo-2.wav via scripts/transcribe_demo.py\n\n")
    f.write("\n".join(ts_lines))
    f.write("\n")
print("\nWrote src/components/demo/demoAudioWords.ts")
