const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const verifyRouter = require('./routes/verify.routes');


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.text());
app.use(morgan('dev'));

app.use('/api/verify', verifyRouter);


module.exports = app;