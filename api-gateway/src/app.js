const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const registerRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API Gateway is running'
  });
});

registerRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
