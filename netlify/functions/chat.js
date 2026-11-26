exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message } = JSON.parse(event.body);
    if (!message || message.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Empty message" }) };
    }

    const apiKey = process.env.TENCENT_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ reply: "Error: TENCENT_API_KEY is missing in Netlify settings." })
      };
    }

    const model = "hy4-flash";

    const response = await fetch("https://tokenhub-intl.tencentcloudmaas.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        reasoning_effort: "no_think",
        stream: false,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: "You are a smart, helpful, and engaging AI assistant. Reply naturally and concisely in the exact same language the user writes in (English, Arabic, Darija, Amazigh, French, etc.). Keep answers short (2-3 sentences max) and engaging."
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ reply: "Error (" + model + "): " + (data.error?.message || response.status) })
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
      body: JSON.stringify({ reply: "Error: " + error.message })
    };
  }
};
