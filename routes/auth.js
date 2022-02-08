const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { Route53RecoveryCluster } = require('aws-sdk');
const router = express.Router();

const db = require('../models/db')();
const connection = db.init();

db.test_open(connection);


// ID 중복 체크
router.post('/checkId', (req,res)=>{
    const id = req.body.id;
    const sqlSearch = "SELECT * from user WHERE id=?";
    connection.query(sqlSearch, id, (err,result)=>{
        if(err){
            console.log(err);
        }
        else{
            if (result.length==0){
                console.log('ID 사용 가능');
                return res.json({ success : true });
            }
            else return res.json({ success : false});
        }
    })
});

// 회원가입
router.post('/join', async(req,res,next)=>{
    try{
        const { id, pw, name, nickname, tel, email , sex, age, residence, experience, license, type, size} =req.body;
        console.log(id);
        const sqlSearch = "SELECT * from user WHERE id=?";
        connection.query(sqlSearch, id, async(err,result)=>{
            if(err){
                console.log(err);
                return res.json({ success : false, message : "회원가입 실패"})
            }
            else{
                console.log(result);
                if (result.length !=0){ 
                    console.log('이미 존재하는 id');
                    return res.json({success : false, message : "이미 존재하는 id"});
                }
                const hash = await bcrypt.hash(pw, 12);
                const sqlJoin = "INSERT INTO user (id, pw, name, nickname, tel, email) VALUES (?,?,?,?,?,?)";
                connection.query(sqlJoin, [id,hash,name,nickname,tel,email], (err,result)=>{
                    if(err) {
                        console.log(err);
                        return res.json({success : false, message : "데이터베이스 저장 오류"});
                    }
                    else{
                        console.log('회원가입 성공');
                        const sitterInfoInsert = "INSERT INTO petSitter VALUES (?,?,?,?,?,?,?,?)";
                        connection.query(sitterInfoInsert, [id, sex, age, residence, experience, license, type, size], (err,resut)=>{
                            if(err){
                                console.log(err);
                                const deleteUserInfo = "DELETE FROM user WHERE id=?";
                                connection.query(deleteUserInfo, id,(err,resut)=> {console.log(result)});
                                return res.json({success:false, message : '펫시터 정보 저장 실패'});
                            }
                            console.log('펫시터 정보 저장 성공');
                            return res.json({success : true, message : '회원가입 및 펫시터 정보 저장 성공'});
                        })
                    }
                })
            }
        })
    } catch(err){
        console.log(err);
        return next(err);
    }
});

// 로그인
router.post ('/login', async(req,res,next)=>{
    passport.authenticate('local', { session : false }, (authError, user, info)=>{
        if(authError){ // 서버 에러
            console.log(authError);
            return next(authError);
        }
        if(!user){ // 로그인 실패
            console.log('회원이 아닙니다.');
            return res.json({success : false , message : info.message });
        }
        return req.login(user, { session : false }, (loginError)=>{ // 로그인 성공
            if(loginError){
                console.log(loginError);
                return next(loginError);
            }
            // const token = jwt.sign(
            //     {id : user.id}, process.env.JWT_SECRET, {expiresIn : "10m"}
            // );
            // console.log('로그인 성공');
            // console.log(user.id);
            // console.log(token);
            // res.cookie("loginToken", token, {maxAge : 60*1000*10});
            
            // res.cookie("loginToken", user.id, user.id,{maxAge : 60*1000*10});
            return res.json({ success : true, message : "로그인 성공", cookie:user.id});
        });
    })(req,res,next);
});

// 로그아웃
router.get('/logout', (req,res)=>{
    try{
        console.log('로그아웃');
        res.clearCookie("loginToken");
        req.logout();
        req.session.destroy();
        return res.status(205).json({ success: true, message: "로그아웃 성공" });
    }
    catch(err){
        return res.json({success : false, message : "로그아웃 실패"})
    }
})

router.post('/getNickname', (req,res)=>{
    try{
        const {id} = req.body;
        console.log("id : "+id);
        connection.query("select nickname from user where id=?", id, (err,result)=>{
            if(err){
                console.log(err);
                return res.json({success : false});
            }
            else {
                console.log(result[0].nickname);
                return res.json({success : true, data : result[0].nickname});
            }
        })
    }catch(err) {
        console.log("err");
    }
})



module.exports = router;