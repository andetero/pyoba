import https from "https";
import fs from "fs";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error("❌ No API key"); process.exit(1); }

// Puzzle number: days since launch (March 6, 2026)
const LAUNCH = new Date("2026-03-06T00:00:00-06:00");
const NOW = new Date();
const PUZZLE_ID = Math.floor((NOW - LAUNCH) / (1000 * 60 * 60 * 24)) + 1;

const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
  timeZone: "America/Chicago",
});

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed.content[0].text.trim());
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const PROMPT = `Today is ${TODAY}. You are generating puzzle #${PUZZLE_ID} for GIST, a daily word game.

In GIST, a paragraph is hidden. Players guess the ONE WORD that captures its essence. Each wrong guess reveals one more sentence of the paragraph as a clue. There are 5 sentences total, revealed one by one.

Your job: create a puzzle. Choose a concept, emotion, phenomenon, or idea as the answer word. Write a 5-sentence paragraph that describes it without ever saying the word. The paragraph should be beautifully written — like an encyclopedia crossed with a prose poem.

Rules:
- The answer must be a single common English word (not a proper noun, not a phrase)
- The paragraph must NOT contain the answer word or obvious synonyms
- Sentence 1 should be the hardest clue (most abstract/indirect)
- Sentence 5 should be the most revealing (someone could guess from it alone)
- The paragraph should feel like elegant, precise writing — not a riddle
- Pick varied topics across different domains: emotions, social phenomena, physical experiences, abstract concepts, human behaviors, etc.
- Also provide 3-5 "close" words that are near-synonyms (a player guessing these gets a yellow result)

Return ONLY valid JSON, no markdown, exactly this format:
{
  "answer": "loneliness",
  "sentences": [
    "It can exist in the middle of a crowd, invisible to everyone including the person experiencing it.",
    "Philosophers have argued it is the fundamental condition of consciousness — the irreducible gap between any two minds.",
    "Children rarely feel it; the capacity seems to develop alongside self-awareness.",
    "It is distinct from solitude, which is chosen, and from isolation, which is imposed.",
    "The word comes from 'lone' — the state of being the only one of its kind in a particular place."
  ],
  "close": ["isolation", "solitude", "alienation", "emptiness"]
}`;

console.log(`🧩 Generating GIST puzzle #${PUZZLE_ID}...`);
const raw = await callClaude(PROMPT);

let puzzle;
try {
  puzzle = JSON.parse(raw.replace(/```json|```/g, "").trim());
} catch(e) {
  console.error("❌ Failed to parse puzzle JSON:", raw);
  process.exit(1);
}

puzzle.id = PUZZLE_ID;
console.log(`✅ Answer: "${puzzle.answer}"`);
console.log(`📝 Sentences: ${puzzle.sentences.length}`);

// Read template and inject puzzle data
const template = fs.readFileSync("template.html", "utf8");
const output = template.replace(
  "__PUZZLE_DATA__",
  JSON.stringify(puzzle)
);

fs.writeFileSync("index.html", output);
console.log(`📄 index.html written for puzzle #${PUZZLE_ID}`);
