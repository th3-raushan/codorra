const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const verifyRouter = require('./routes/verify.routes');
const authRouter= require('./routes/authRoutes');
const historyRouter= require('./routes/historyRoutes');
const errorHandler= require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: "https://codorra-client.onrender.com",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.text());
app.use(morgan('dev'));

app.use('/api/verify', verifyRouter);
app.use('/api/auth', authRouter);
app.use('/api/history', historyRouter);

// Global error handler (must be after all routes)
app.use(errorHandler);

module.exports = app;