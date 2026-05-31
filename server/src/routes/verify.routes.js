const express = require('express');
const verifyController = require('./../controllers/verify.controller');
const { softProtect } = require('../middleware/softAuth');
const router = express.Router();

router
    .route('/')
    .post(softProtect, verifyController);

module.exports = router;