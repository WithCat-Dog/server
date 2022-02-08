const mysql = require('mysql');

module.exports = ()=>{
    return {
        init : ()=>{
            return mysql.createConnection({
                host : 'mungnyangdb.ccmxiwd7rqpg.us-east-2.rds.amazonaws.com',
                port : '3306',
                user : 'seoyoung',
                password : 'mungnyang',
                database : 'mungnyangdb'
            })
        },

        test_open : (con)=>{
            con.connect( (err)=>{
                if(err){
                    console.log('mysql connection error : ' + err);
                }else{
                    console.info('mysql is connected successfully.');
                }
            })
        }
    }
}