import { getCommentary } from "../lib/groq.js";

export default async function handler(req, res) {
  try {
    console.log("REQ BODY:", req.body);

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const { fen } = body;

    if (!fen || fen.trim() === "") {
      return res.status(400).json({ text: "No FEN provided" });
    }

    const query = `chess position FEN ${fen} middlegame plans`;

    console.log("SEARCH QUERY:", query);

    // 🔎 SERP SEARCH
    const serp = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY}`
    ).then(r => r.json());

    let extraContext = "";

    if (serp.organic_results && serp.organic_results.length > 0) {
      // pick random result
      const random =
        serp.organic_results[
          Math.floor(Math.random() * serp.organic_results.length)
        ];

      console.log("SELECTED RESULT:", random.title);

      // add snippet
      extraContext += `\nSearch snippet: ${random.snippet}\n`;

      // try fetching page text safely
      try {
        const page = await fetch(random.link, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        const html = await page.text();

        // crude text extraction
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 2000);

        extraContext += `\nPage context: ${text}\n`;
      } catch (err) {
        console.log("Page fetch failed, using snippet only");
      }
    }

    // 🧠 combine for LLM
    const finalPrompt = `
You are a chess coach.

Position FEN:
${fen}

Search context:
${extraContext}

Give practical middlegame plans, candidate moves, and ideas.
`;

    const commentary = await getCommentary(finalPrompt);

    res.status(200).json({ text: commentary });

  } catch (e) {
    console.error("ANALYZE ERROR:", e);
    res.status(500).json({
      text: "Engine temporarily unavailable, but the position looks interesting!"
    });
  }
}
