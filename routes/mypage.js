const express = require('express');
const multer = require('multer');
const path = require('path');
const AWS =require('aws-sdk');
const multerS3 = require('multer-s3');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const router = express.Router();

const db = require('../models/db')();
const connection = db.init();

db.test_open(connection);

AWS.config.update({
    accessKeyId : process.env.S3_ACCESS_KEY_ID,
    secretAccessKey : process.env.S3_SECRET_ACCESS_KEY,
    region : 'ap-northeast-2',
});
const upload = multer({
    storage : multerS3({
        s3 : new AWS.S3(),
        bucket : 'mungnyang-bucket',    
        contentType : multerS3.AUTO_CONTENT_TYPE,
        key(req,file,cb){
            cb(null, `petImages/${Date.now()}_${Math.floor(Math.random() * 10)}_${path.basename(file.originalname)}`);
        },
    }),
    limits : { fileSize : 5*1024*1024},
});

// 닉네임 변경
router.post('/changeNickname',(req,res)=>{
    const {id, newNickname} = req.body;
    try{
        const changeNick = "UPDATE user SET `nickname`=? WHERE `id`=?";
        
        connection.query(changeNick, [newNickname, id], async(err,result)=>{
            if(err) {
                console.log(err);
                return res.json({success : false, message : "닉네임 변경 실패"});
            }
            return res.json({success :true, message : "닉네임 변경 성공"});
        })
    }catch(err){
        console.log(err);
        return res.json({success : false, message : "닉네임 변경 실패"})
    }
})

// 전화번호 변경
router.post('/changeTel',(req,res)=>{
    const {id, newTel} = req.body;
    try{
        const changeTel = "UPDATE user SET `tel`=? WHERE `id`=?";

        connection.query(changeTel, [newTel, id], async(err,result)=>{
            if(err){
                console.log(err);
                return res.json({success : false, message : "전화번호 변경 실패"});
            }
            return res.json({success : true, message : '전화번호 변경 성공'});
        })
    }catch(err){
        console.log(err);
        return res.json({success : false, message : "전화번호 변경 실패"});
    }
})

// 내 펫 정보 -> 아래 있는 이미지 업로드까지 같이 하는걸로 변경 (지워도 됨!)
router.post('/registerMypet', async(req, res, next) => {
    try {
        const { id, petName, content } = req.body;

        connection.query("SELECT * FROM myPet WHERE mId=?", id, (err, result) => {
            if (err) {
                console.log(err);
            }
            else {
                if (result.length != 0) {   // 수정하기
                    const sqlModify = "UPDATE myPet SET petName=?, content=? WHERE mId=?";
                    connection.query(sqlModify, [petName, content, id], async(err, result) => {
                        if (err) {
                            console.log(err);
                            return res.json({ success: false, message: "수정 오류" });
                        }
                        return res.json({ success: true, message: "마이펫 정보 수정 성공" });
                    });
                }
                else {  // 새로 등록하기
                    const sqlRegister = "INSERT INTO myPet (mId, petName, content) VALUES (?, ?, ?)";
                    connection.query(sqlRegister, [id, petName, content], async(err, result) => {
                        if (err) {
                            console.log(err);
                            return res.json({ success: false, message: "마이펫 정보 저장 오류"});
                        }
                        else {
                            console.log("마이펫 정보 등록 성공");
                            return res.json({ success: true, message: "마이펫 정보 등록 성공" });
                        }
                    })
                }
            }
        })
    } catch (err) {
        console.log(err);
        return next(err);
    }
});

// 회원 개인정보 불러오기
router.post('/userInfo', async(req, res) => {
    const { id } = req.body;
    const userSql = "SELECT user.name, user.email, user.nickname, user.tel FROM user WHERE user.id=?";

    try {
        connection.query(userSql, id, (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "회원 개인정보 가져오기 오류" });
            }
            console.log("회원 id: "+id+", 이름: "+result[0].name+", 이메일: "+result[0].email+", 닉네임: "+result[0].nickname+", 전화번호: "+result[0].tel);
            return res.json({ success: true, data: result });
        })
    } catch (err) {
        console.log(err);
    }
});

// 펫 정보 전체 불러오기
router.get('/petfriends', async(req, res, next) => {
    try {
        connection.query("select * from petImgs join myPet on petImgs.petIdx=myPet.index join user on myPet.mId=user.id;", [], (err, result) => {
            if (err) {
                console.log(err);
            }
            else {
                if (result.length == 0){
                    console.log("petfriends 결과 없음");
                    return res.json({ success: true, message: "No Pet Data", data:[] });
                }
                else{
                    for(i=0;i<result.length;i++){
                        console.log((i+1)+"번 째 데이터"+result[i].index+" "+result[i].mId+" "+result[i].petName+" "+result[i].content+" "+result[i].url)
                    }
                    return res.json({ success: true, message: "펫 정보 불러오기 성공", data: result});
                }
            }
        })
    }
    catch (err) {
        console.log(err);
        return next(err);
    }
});

// 개인 펫 정보 불러오기
router.post('/myPetInfo', async(req,res)=>{
    try{
        const {id} = req.body;
        console.log("들어옴");
        connection.query("SELECT * FROM petImgs join myPet on petImgs.petIdx=myPet.index WHERE mid=?",[id], async(err,result)=>{
            if(err){
                console.log(err);
                return res.json({success : false});
            }
            else{
                if(result.length==0){
                    return res.json({success : true, data:"0"});
                }
                else{
                    console.log(result);
                    return res.json({success : true, data: result[0]});
                }
            }
        })
    }catch(err){
        console.log(err);
    }
})

// 마이펫 이미지 등록
router.post('/img', upload.single('imgs'), (req,res)=>{
    console.log("드렁옴");
    try{
        console.log(req.file);
        var url = req.file.location;
        console.log("성공!!!!")
        return res.json({success : true, data : req.file.location, message : '성공'})
    }
    catch(err){
        console.log(err);
        res.json({success:false, message : err})
    }
})

const uploadPost = multer();


router.post('/contents',uploadPost.none(),(req,res)=>{
    console.log("들어옴");
    const { mId, urls, petName, type, content} = req.body;
    try{
        console.log("들어옴");
        console.log(mId, urls, petName, type, content);
        connection.query("select * from myPet where mId=?", mId, (err,result)=>{
            if(err){
                console.log(err);
                return res.json({success : false});
            }
            else{
                if(result.length!=0) { //정보 수정
                    const sqlModify = "UPDATE myPet SET petName=?, content=? WHERE mId=?";
                    connection.query(sqlModify, [petName, content, mId], async(err, result) => {
                        if (err) {
                            console.log(err);
                            return res.json({ success: false, message: "수정 오류" });
                        }
                        else{
                            const updateImgs = "update petImgs set url=? where petIdx=?";
                            console.log("회원정보 번호 : "+result.affectedRows);
                            connection.query(updateImgs, [urls,result.affectedRows.index], (err,result2)=>{
                                try{
                                    console.log("마이펫 정보 & 이미지 수정 성공");
                                    return res.json({success : true, data : urls, message : "마이펫 정보,이미지 수정 성공"})
                                }catch(err){
                                    console.log(err);
                                }
                            })
                        }
                        return res.json({ success: true, message: "마이펫 정보 수정 성공" });
                    });
                }
                else{
                    const uploadPost = "INSERT INTO myPet (mId, petName, type, content) VALUES(?,?,?,?)";
                    connection.query(uploadPost, [mId, petName, type, content],async(err,result)=>{
                        try{
                            console.log(result);
                            console.log("게시글 번호 : "+result.affectedRows); //게시글 번호
                            const uploadImgs = "INSERT INTO petImgs (petIdx, url) VALUES (?,?)";
                            connection.query(uploadImgs, [result.insertId,urls], (err,result2)=>{
                                try{
                                    console.log("업로드 성공");
                                }
                                catch(err){
                                    console.log("이미지 업로드 mysql 오류");
                                    return res.json({success : false, message : '마이펫 정보 업로드는 성공, 이미지 업로드 실패'});
                                }
                            })
                            return res.json({success : true, message : mId+"님의 펫 정보와 이미지 업로드 성공"});
                        }catch(err){
                            console.log("mysql 오류");
                            console.log(err);
                            res.json({success : false, message : '펫정보 이미지 업로드 모두 실패'});
                        }
                    })
                }
            }
        })
    }
    catch(err){
        console.log(err);
    }
});

module.exports = router;