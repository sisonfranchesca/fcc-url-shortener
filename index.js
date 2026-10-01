require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Body parsing middleware (Crucial for freeCodeCamp POST tests)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Storage mapping
const urlDatabase = {};
let idCounter = 1;

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // 1. Validate http/https structure using standard Regex
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  if (!originalUrl || !urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // 2. Parse domain hostname for dns.lookup
  let hostname;
  try {
    const parsedUrl = new URL(originalUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }
    hostname = parsedUrl.hostname;
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // 3. DNS Lookup Check
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL is already saved
    for (const [short, url] of Object.entries(urlDatabase)) {
      if (url === originalUrl) {
        return res.json({
          original_url: originalUrl,
          short_url: Number(short)
        });
      }
    }

    // Store new mapping
    const shortUrl = idCounter++;
    urlDatabase[shortUrl] = originalUrl;

    return res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    return res.redirect(originalUrl);
  } else {
    return res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});