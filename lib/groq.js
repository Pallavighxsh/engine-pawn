export async function getCommentary(prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a calm positional chess coach. Explain plans clearly, not engine eval spam.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    console.error("Groq error:", data);
    throw new Error("Groq returned empty response");
  }

  return data.choices[0].message.content;
}
