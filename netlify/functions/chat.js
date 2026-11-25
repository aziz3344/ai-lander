exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message } = JSON.parse(event.body);
    if (!message || message.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Empty message" }) };
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: "You are a smart, helpful, and engaging AI assistant. Reply naturally and concisely in the exact same language the user writes in (English, Arabic, Darija, French, etc.). Keep answers short (2-3 sentences max) and engaging."
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ reply: "Error: " + (data.error?.message || response.status) })
      };
    }

    const aiReply = data.choices?.[0]?.message?.content || "Could you rephrase that?";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: aiReply })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "Connection error, please try again." })
    };
  }
};
