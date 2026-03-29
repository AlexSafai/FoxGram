// Simple Vercel serverless function to return posts from data.json
const path = require('path');
const data = require(path.join(__dirname, '..', 'data.json'));

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(data));
};
