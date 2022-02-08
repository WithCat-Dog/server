const express = require('express');
const mysql = require('mysql');

const router = express.Router();

const db = require('../models/db')();
const connection = db.init();

db.test_open(connection);

router.get('/', (req,res,next)=>{
    console.log('들어옴');
    return res.send('Hello');
})

module.exports = router;