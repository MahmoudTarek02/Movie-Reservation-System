const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`API Gateway running on http://localhost:${env.port}`);
});
