import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dataService } from './dataService.js';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/api/sales', async (req, res) => {
  try {
    const data = await dataService.getSalesData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

app.post('/api/insights', async (req, res) => {
  const { metrics, dataSummary, model } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API Key not configured on server.' });
  }

  try {
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
    
    // Improved JSON parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON. Response was: " + text);
    }
    const cleaned = jsonMatch[0];
    res.json(JSON.parse(cleaned));
  } catch (error) {
    console.error('Gemini Error:', error);
    const errorMessage = error.errorDetails?.[0]?.message || error.message || 'Failed to generate insights';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`Insight Server running at http://localhost:${port}`);
});
