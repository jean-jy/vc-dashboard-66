import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  try {
    const { metrics, dataSummary, model } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Key not configured on server.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });

    const prompt = `
      Analyze this sales dashboard data summary and provide 3 brief, high-impact business insights:
      - One ALERT (potential risk or problem)
      - One OPPORTUNITY (possible growth area)
      - One SUGGESTION (actionable next step)

      METRICS:
      - Total Revenue: ${metrics.revenue}
      - Total Orders: ${metrics.orders}
      - Total Profit: ${metrics.profit}
      - AOV: ${metrics.aov}
      
      DATA CONTEXT (Last 10 records):
      ${JSON.stringify(dataSummary)}

      Return ONLY a JSON object exactly like this:
      {
        "alert": "...",
        "opportunity": "...",
        "suggestion": "..."
      }
      Maximum 15 words per insight.
    `;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON.");
    }
    const cleaned = jsonMatch[0];
    return NextResponse.json(JSON.parse(cleaned));
  } catch (error) {
    console.error('Gemini Error:', error);
    const errorMessage = error.errorDetails?.[0]?.message || error.message || 'Failed to generate insights';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
