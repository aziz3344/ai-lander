let cachedModel = null;

async function getWorkingModel(apiKey) {
  if (cachedModel) return cachedModel;

  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { "Authorization": `Bearer ${apiKey}` }
  });
  const data = await res.json();

  if (!res.ok || !data.data) {
    throw new Error(data.error?.message || "Cannot fetch models");
  }

  const chatModels = data.data
    .map(m => m.id)
    .filter(id => !/whisper|tts|guard|embed|audio|speech|orpheus|playai/i.test(id));

  cachedModel =
    chatModels.find(id => /llama-4|llama-3|llama/i.test(id)) ||
    chatModels.find(id => /qwen|gemma|deepseek|mixtral|gpt/i.test(id)) ||
    chatModels[0];

  if (!cachedModel) {
    throw new Error("No chat models available on this Groq account");
  }

  return cachedModel;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message } = JSON.parse(event.body);
    if (!message || message.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Empty message" }) };
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = await getWorkingModel(apiKey);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
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
      cachedModel = null;
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
