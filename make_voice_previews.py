# Generates short "hear my voice" preview clips for the demo + hub.
# Output: demo\voices\<voice-id>.mp3  (run from the mydevkits-site folder)
import asyncio, os, sys
try:
    import edge_tts
except ImportError:
    sys.exit("edge-tts is not installed. Run:  pip install edge-tts")

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo", "voices")
os.makedirs(OUT, exist_ok=True)

VOICES = {
 "en-US-AvaMultilingualNeural": "Hi, I'm Ava. Pick me, and this is exactly how your videos will sound.",
 "en-US-AndrewMultilingualNeural": "Hey there, I'm Andrew. Your story, told in this voice.",
 "en-US-EmmaMultilingualNeural": "Hello, I'm Emma. I'll narrate your videos just like this.",
 "en-US-BrianMultilingualNeural": "Hi, I'm Brian. Smooth, clear, and ready to tell your story.",
 "en-US-AndrewNeural": "Hi, I'm Andrew. This is how your narration will sound.",
 "en-US-BrianNeural": "Hey, Brian here. Casual and easygoing, just like this.",
 "en-US-GuyNeural": "Hello, I'm Guy. A little deeper, a little more serious.",
 "en-US-AriaNeural": "Hi, I'm Aria. Warm and welcoming, every single time.",
 "en-US-JennyNeural": "Hi there, I'm Jenny. Friendly and bright, like this.",
 "en-US-MichelleNeural": "Hello, I'm Michelle. Calm, steady, and easy to listen to.",
 "en-GB-RyanNeural": "Hello, I'm Ryan. Your videos, with a British accent.",
 "en-GB-SoniaNeural": "Hello, I'm Sonia. Rather nice to meet you.",
 "en-AU-WilliamNeural": "G'day, I'm William. Your story with an Australian touch.",
}

async def make(voice, text):
    path = os.path.join(OUT, voice + ".mp3")
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        print("  skip", voice, "(already made)")
        return
    for attempt in range(5):
        try:
            await edge_tts.Communicate(text, voice).save(path)
            if os.path.getsize(path) > 1000:
                print("  ok  ", voice)
                return
            raise RuntimeError("empty file")
        except Exception as e:
            if attempt == 4:
                print("  FAIL", voice, "-", e)
            else:
                await asyncio.sleep(2)

async def main():
    print("Generating voice previews into", OUT)
    for v, t in VOICES.items():
        await make(v, t)
    print("Done. Run DEPLOY_SITE.bat to put them on the website.")

asyncio.run(main())
