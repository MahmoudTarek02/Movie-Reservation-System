const https = require('https');
const querystring = require('querystring');

const requestJson = (url, options = {}, body) => new Promise((resolve, reject) => {
  const req = https.request(url, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      const parsed = data ? JSON.parse(data) : {};

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const message = parsed.error_description || parsed.error || `OAuth request failed with status ${res.statusCode}`;
        reject(new Error(message));
        return;
      }

      resolve(parsed);
    });
  });

  req.on('error', reject);

  if (body) req.write(body);
  req.end();
});

const postForm = (url, data) => {
  const body = querystring.stringify(data);

  return requestJson(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    },
    body
  );
};

const getJson = (url, accessToken) => requestJson(url, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});

module.exports = {
  getJson,
  postForm
};
