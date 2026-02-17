import { getCommentary } from "../lib/groq.js";

export default async function handler(req, res) {
  try {
    console.log("REQ BODY:", req.body);

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const { fen } = body;

    if (!fen) {
      return res.status(400).json({ text: "No FEN provided" });
    }

    // Build search-style context from FEN
    const query = `chess position FEN ${fen} middlegame plans`;

    console.log("SEARCH QUERY:", query);

    // ✅ Correct function name
    const commentary = await getCommentary(query);

    res.status(200).json({ text: commentary });

  } catch (e) {
    console.error("ANALYZE ERROR:", e);
    res.status(500).json({
      text: "Engine temporarily unavailable, but the position looks interesting!"
    });
  }
}
