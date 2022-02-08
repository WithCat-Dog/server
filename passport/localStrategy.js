const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const db = require('../models/db')();
const connection = db.init();

db.test_open(connection);

module.exports = ()=>{
    passport.use( new LocalStrategy({
        usernameField : 'id',
        passwordField : 'pw',
    }, async(id, pw, done)=>{
        try{
            console.log('*******passport / local ' , id, pw);
            const searchId= "SELECT * from user WHERE id=?";
            connection.query(searchId, id, async(err,exUser)=>{
                if(err) console.log(err);
                else{
                    console.log('exUser : '+ exUser.length);
                    console.log(exUser);
                    if(exUser.length!=0){
                        console.log("로그인 ID : " +exUser[0].id);
                        const result = await bcrypt.compare(pw,exUser[0].pw);
                        
                        if (result){
                            done(null, exUser[0]);
                        }
                        else{
                            done(null, false, {message : '비밀번호가 일치하지 않습니다.'} );
                        }
                    }else{
                        done(null, false, { message : '가입되지 않은 회원입니다.'});
                    }
                }
            })
        }catch(err){
            console.log(err);
            done(err);
        }
    }))
}