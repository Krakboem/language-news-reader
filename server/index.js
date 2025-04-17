const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

// ✅ CORS setup for local frontend
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.options('/api/article', cors(corsOptions));
app.use(express.json());

// ✅ Test route
app.get('/api/test', (req, res) => {
  res.send('Backend is working!');
});

// ✅ Fetch list of 5 articles from NewsAPI
app.post('/api/article', async (req, res) => {
  const { language, topic } = req.body;
  const apiKey = process.env.NEWS_API_KEY;

  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: topic,
        language: language,
        pageSize: 5,
        sortBy: 'relevancy',
        apiKey: apiKey,
      },
    });

    const articles = response.data.articles;

    if (!articles || articles.length === 0) {
      return res.status(404).json({ error: 'No articles found.' });
    }

    res.json(
      articles.map(article => ({
        title: article.title,
        content: article.content || article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        description: article.description,
      }))
    );
  } catch (error) {
    console.error('❌ Error fetching article:', error.message);
    res.status(500).json({ error: 'Failed to fetch article.' });
  }
});

// ✅ Extract full article using axios + jsdom + @mozilla/readability
app.post('/api/full-article', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing article URL' });
  }

  console.log("🔍 Fetching and parsing:", url);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
    });

    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      console.error("⚠️ Readability couldn't extract content.");
      return res.status(500).json({ error: 'Failed to extract article content.' });
    }

    console.log("✅ Article extracted:", article.title);

    res.json({
      title: article.title,
      content: article.content, // full HTML
    });
  } catch (error) {
    console.error("❌ Extraction error:", error.message);
    res.status(500).json({ error: 'Server error while extracting article.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
