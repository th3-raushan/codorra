const express = require('express');
const verifyController = require('./../controllers/verify.controller');
const router = express.Router();

router
    .route('/')
    .post(verifyController);

module.exports = router;