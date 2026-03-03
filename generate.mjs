import https from "https";
import fs from "fs";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error("❌ No API key"); process.exit(1); }

const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
  timeZone: "America/Chicago",
});

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
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

const PROMPT = `Today is ${TODAY}.

Write exactly ONE sentence for a website called "Pyoba"

The sentence is a precise, unsentimental observation about human nature, psychology, work, relationships, ambition, or how the world actually operates. It should feel like something everyone secretly knows but has never heard stated plainly.

Rules:
- Exactly one sentence. No more.
- Not motivational. Not inspirational. Not advice.
- No clichés, no metaphors involving weather or seasons, no "life is" constructions.
- The tone is calm, exact, slightly cold. Like a surgeon who is also a philosopher.
- Between 12 and 30 words.
- Do not start with "I", "We", "You", or "The truth is".
- Do not use the word "always", "never", "everyone", or "nobody".
- It should feel like it was discovered, not written.
- Return ONLY the sentence. No quotes. No punctuation beyond the sentence itself. No preamble.`;

const truth = await callClaude(PROMPT);
console.log(`✅ Truth: "${truth}"`);

function escape(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

const dateStr = new Date().toLocaleDateString("en-US", {
  month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago"
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pyoba — One True Thing</title>
  <meta name="description" content="One true thing, every day.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=Courier+Prime&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--ink:#0a0a0a;--paper:#f5f0e8;--accent:#8b0000;--mono:'Courier Prime',monospace;--serif:'Cormorant Garamond',Georgia,serif}
    html,body{height:100%;background:var(--ink);color:var(--paper);font-family:var(--serif);overflow:hidden}
    body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:0.6}
    body::after{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.55) 100%);pointer-events:none;z-index:0}
    .frame{position:fixed;inset:28px;border:1px solid rgba(245,240,232,0.08);pointer-events:none;z-index:2}
    .container{position:relative;z-index:1;height:100vh;display:grid;grid-template-rows:1fr auto;padding:52px 64px}
    .main{display:flex;align-items:center;justify-content:center}
    .truth{max-width:820px;text-align:center}
    .truth__mark{font-family:var(--serif);font-size:clamp(80px,18vw,160px);font-weight:300;font-style:italic;color:var(--accent);line-height:0.6;display:block;margin-bottom:32px;opacity:0;animation:rise 1.2s cubic-bezier(0.16,1,0.3,1) 0.2s forwards}
    .truth__text{font-size:clamp(22px,3.2vw,42px);font-weight:300;line-height:1.45;letter-spacing:0.01em;color:var(--paper);opacity:0;animation:rise 1.4s cubic-bezier(0.16,1,0.3,1) 0.5s forwards}
    .footer{display:flex;justify-content:space-between;align-items:flex-end;opacity:0;animation:rise 1s ease 1.4s forwards}
    .footer__logo{font-family:var(--mono);font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(245,240,232,0.3)}
    .footer__logo span{color:var(--accent)}
    .footer__date{font-family:var(--mono);font-size:11px;letter-spacing:0.15em;color:rgba(245,240,232,0.25);text-align:right}
    .entry-num{display:block;color:rgba(245,240,232,0.12);font-size:10px;margin-top:4px}
    @keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:600px){.container{padding:32px 28px}.frame{inset:16px}}
  </style>
</head>
<body>
  <div class="frame"></div>
  <div class="container">
    <div class="main">
      <div class="truth">
        <span class="truth__mark">&ldquo;</span>
        <p class="truth__text">${escape(truth)}</p>
      </div>
    </div>
    <footer class="footer">
      <div class="footer__logo">py<span>o</span>ba</div>
      <span class="entry-num"></span>
  </footer>
  </div>
</body>
</html>`;

fs.writeFileSync("index.html", html);
console.log("📄 index.html written");
