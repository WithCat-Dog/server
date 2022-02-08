const passport = require('passport');
const mysql = require('mysql');
const local = require('./localStrategy');

const db = require('../models/db')();
const connection = db.init();

db.test_open(connection);

module.exports = ()=>{
    
    local();
}