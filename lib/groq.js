import { getCommentary } from "../lib/groq.js";

async function runSearch(query) {
  // --- try SERP API first ---
  try {
    const r = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY}`
    );

    const data = await r.json();

    if (data.organic_results?.length) {
      console.log("SerpAPI success");
      return data.organic_results
        .slice(0, 5)
        .map(r => r.snippet)
        .join("\n");
    }

    throw new Error("SerpAPI empty");
  } catch (e) {
    console.log("SerpAPI failed → fallback to SearchAPI");

    try {
      const r2 = await fetch(
        `https://www.searchapi.io/api/v1/search?q=${encodeURIComponent(query)}&engine=google&api_key=${process.env.SEARCHAPI_KEY}`
      );

      const data2 = await r2.json();

      if (data2.organic_results?.length) {
        console.log("SearchAPI success");
        return data2.organic_results
          .slice(0, 5)
          .map(r => r.snippet)
          .join("\n");
      }
    } catch (err) {
      console.log("SearchAPI also failed");
    }
  }

  return "";
}

export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const { fen } = body;

    if (!fen) {
      return res.status(400).json({ text: "No FEN provided" });
    }

    const query = `chess position FEN ${fen} middlegame plans`;

    // 🔎 run search with fallback
    const context = await runSearch(query);

    // 🧠 send to groq
    const commentary = await getCommentary(
      context ? `${query}\n\nContext:\n${context}` : query
    );

    res.status(200).json({ text: commentary });

  } catch (e) {
    console.error("ANALYZE ERROR:", e);
    res.status(500).json({
      text: "Engine temporarily unavailable, but the position looks interesting!"
    });
  }
}
