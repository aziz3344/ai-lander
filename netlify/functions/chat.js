exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message } = JSON.parse(event.body);
    if (!message || message.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Empty message" }) };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://netlify.app",
        "X-Title": "AI Chat Prelander"
      },
      body: JSON.stringify({
        models: [
          "meta-llama/llama-3.3-70b-instruct:free",
          "google/gemma-3-27b-it:free",
          "mistralai/mistral-small-3.1-24b-instruct:free"
        ],
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: "You are an engaging, smart, and unfiltered AI assistant. Reply concisely in the exact same language the user writes in. Keep answers short (2-3 sentences max) and intriguing so the user wants to keep chatting."
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ reply: "السيرفر عامر شوية دابا، عاود جرب بعد لحظة..." })
      };
    }

    const aiReply = data.choices?.[0]?.message?.content || "سمح ليا، ما فهمتش مزيان. عاود سولني!";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: aiReply })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "وقع خطأ فـ الاتصال، عاود جرب." })
    };
  }
};
