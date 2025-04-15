const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

// ✅ Safe and specific CORS setup
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.options('/api/article', cors(corsOptions));
app.use(express.json());

// ❌ Remove this in production (shows your secret key)
// console.log("🔍 Loaded env:", process.env.NEWS_API_KEY);

app.get('/api/test', (req, res) => {
  res.send('Backend is working!');
});

app.post('/api/article', async (req, res) => {
  const { language, topic } = req.body;
  const apiKey = process.env.NEWS_API_KEY;

  // ❌ Optional: remove or keep based on your needs
  // console.log("📥 Request received - Language:", language, "Topic:", topic);
  // console.log("🔑 Using NewsAPI key:", apiKey);

  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: topic,
        language: language,
        pageSize: 1,
        sortBy: 'relevancy',
        apiKey: apiKey,
      },
    });

    const article = response.data.articles[0];
    if (!article) {
      return res.status(404).json({ error: 'No article found.' });
    }

    res.json({
      title: article.title,
      content: article.content || article.description,
      url: article.url,
      source: article.source.name,
    });

  } catch (error) {
    console.error('❌ Error fetching article:', error.message);
    res.status(500).json({ error: 'Failed to fetch article.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
