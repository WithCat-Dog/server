const express = require('express');
const multer = require('multer');
const path = require('path');
const AWS =require('aws-sdk');
const multerS3 = require('multer-s3');
const { isLoggedIn } = require('./middlewares');

const db = require('../models/db')();
const connection = db.init();

const router = express.Router();



// 게시물 목록 불러오기
router.get('/postList', async(req, res, next) => {
    const listingSql = "SELECT p.index, p.pId, p.title, p.targetDate, p.content, p.time, i.imgIndex, i.url, p.closed, COUNT(CASE WHEN p.index=a.postIndex THEN 1 END) AS applyers_cnt FROM post p, postImgs i, apply a WHERE p.index=i.postIdx GROUP BY p.index";

    try {
        connection.query(listingSql, [], (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "게시물 불러오기 오류" });
            }
            else {
                if (result.length == 0)
                    return res.json({ success: true, data:[], message: "No Posts" });
                else {
                    console.log(result);
                    return res.json({ success : true, data: result })
                }  
            }
        })
    }
    catch (err) {
        console.log(err);
        return next(err);
    }
});


AWS.config.update({
    accessKeyId : process.env.S3_ACCESS_KEY_ID,
    secretAccessKey : process.env.S3_SECRET_ACCESS_KEY,
    region : 'ap-northeast-2',
});
const upload = multer({
    storage : multerS3({
        s3 : new AWS.S3(),
        bucket : 'mungnyang-bucket',    
        // acl: 'public-read',
        // contentType:req.file.mimetype,
        contentType : multerS3.AUTO_CONTENT_TYPE,
        key(req,file,cb){
            cb(null, `image/${Date.now()}_${Math.floor(Math.random() * 10)}_${path.basename(file.originalname)}`);
        },
    }),
    limits : { fileSize : 5*1024*1024},
});

/*
router.post('/img', isLoggedIn, upload.single('img'), (req,res)=>{
    try{
        console.log(req.file);
        res.json( {success : true, url : req.file.location });
    }
    catch(err){
        console.log(err);
    }
})
*/

router.post('/img', upload.single('imgs'), (req,res)=>{
    console.log("들어옴");
    try{
        console.log(req.file);
        //console.log(req.files, req.body);
        //const urls = [];
        //urls[0]=req.file.location;
        var url = req.file.location;
        // for(i=0;i<5;i++){
        //     if(req.files[i]!=null){
        //         console.log(i+"번 있음");
        //         urls[i]=req.files[i].location;
        //     }
        // }
        console.log("성공!!!!")
        return res.json({success : true, data : req.file.location, message : '성공'})
    }
    catch(err){
        console.log(err);
        res.json({success:false, message : err})
    }
})


const uploadPost = multer();

// 게시물 업로드
router.post('/contents',uploadPost.none(),(req,res)=>{
    console.log("들어옴");
    const { pId, urls, title, content, time, targetDate } = req.body;
    try{
        console.log("들어옴");
        console.log(pId, urls, title, targetDate, content, time);
        const uploadPost = "INSERT INTO post (pId,title,targetDate,content,time,closed) VALUES(?,?,?,?,?,?)";
        connection.query(uploadPost, [pId,title,targetDate,content,time,0],async(err,result)=>{
            try{
                console.log(result);
                console.log("게시글 번호 : "+result.affectedRows); //게시글 번호
                const uploadImgs = "INSERT INTO postImgs (postIdx, url) VALUES (?,?)";
                connection.query(uploadImgs, [result.insertId,urls], (err,result2)=>{
                    try{
                        console.log("업로드 성공");
                    }
                    catch(err){
                        console.log("이미지 업로드 mysql 오류");
                        return res.json({success : false, message : '게시글 업로드는 성공, 이미지 업로드 실패'});
                    }
                })
                // console.log('이미지 수 : '+urls.length);
                // for(i=0;i<urls.length;i++){
                //     console.log(i+"번째 이미지 "+urls[i]+" 업로드 시도");
                //     connection.query(uploadImgs, [ result.insertId, urls[i] ],(err,result)=>{
                //         try{
                //             console.log("업로드 성공");
                //         }
                //         catch(err){
                //             console.log('이미지 업로드 mysql 오류');
                //             res.json({success : false, message : '게시글은 업로드 성공, 이미지 업로드 실패'});
                //         }
                //     })
                // }
                return res.json({success : true, message : pId+"님의 게시글과 이미지 업로드 성공"});
            }catch(err){
                console.log("mysql 오류");
                console.log(err);
                res.json({success : false, message : '게시글과 이미지 업로드 모두 실패'});
            }
        })
    }
    catch(err){
        console.log(err);
    }
});

// 게시물 수정
router.post('/update', (req,res) => {
    const {index, newcontent} = req.body;
    try {
        const updatePost = "UPDATE post SET post.content=? WHERE post.index=?";
        connection.query(updatePost, [newcontent, index], async(err, result)=>{
            if (err) {
                console.log(err);
                return res.json({ success : false, message : "수정 실패" });
            }
            return res.json({ success: true, message: "수정 성공" });
        })
    } catch (err) {
        console.log(err);
    }
});

// 게시물 삭제
router.post('/delete', (req, res) => {
    const { index } = req.body;
    try {
        const deleteSql = "DELETE FROM post p WHERE p.index=?";
        connection.query(deleteSql, index, (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "삭제 오류" });
            }
            console.log(index+"번 게시물 삭제");
            return res.json({ success: true, message: index+"번 게시물 삭제 성공" });
        });
    } catch (err) {
        console.log(err);
    }
});

router.post('/detailInfo', async(req,res,next)=>{
    const {id} = req.body;
    try{
        const infoSql = "select nickname, url from user join myPet on user.id=myPet.mId join petImgs on myPet.index=petImgs.petIdx where id=?";
        connection.query(infoSql,[id],(err,result)=>{
            if(err){
                console.log(err);
            }
            else{
                if(result.length==0){
                    console.log("이미지 없음");
                    connection.query("select nickname from user where id=?",[id],(err,result2)=>{
                        if(err) {
                            console.log(err);
                        }
                        else {
                            return res.json({success : true, data:{nickname:result2[0].nickname, url:undefined}});
                        }
                    })
                }
                else{
                    console.log("결과 : "+result[0].nickname);
                    return res.json({success : true, data:{nickname:result[0].nickname, url:result[0].url}})
                }

            }
        })
    }catch(err){
        console.log(err);
        return res.json({success : false});
    }
});

// 내가 쓴 글이게? 아니게?
router.get('/', (req, res) => {
    const {index, id} = req.body;

    try {
        connection.query("SELECT pId FROM post WHERE post.index=?", index, (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "글 작성자 확인 오류" });
            }
            console.log("글 작성자 : "+result[0].pId);
            if (result[0].pId == id)
                return res.json({ success: true, message: "지원자 보기" });

            else {  // 내가 얘한테 지원 해봤게? 안 해봤게?
                console.log("글 작성자 아님");
                // return res.json({ success: true, message: "작성자 아님" });
                connection.query("SELECT * FROM apply WHERE postIndex=? AND aId=?", [index, id], (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.json({ success: false, message: "펫시터 지원 여부 확인 오류" });
                    }
                    else {
                        if (result.length != 0) { // 지원한 적 있음
                            console.log(result);
                            return res.json({ success: true, message: "이미 지원했어요", data: result });
                        }
                        else {
                            consolg.log(result);
                            return res.json({ success: true, message: "지원할게요!", data: result });
                        }
                    }
                })
            }
        })
    } catch (err) {
        console.log(err);
    }
});

// 내 게시물들 불러오기
router.post('/myPosts', (req,res) => {
    const { pId } = req.body;    // 현재 접속 중인 유저 아이디
    
    try {
        connection.query("SELECT * FROM post join postImgs on post.index=postImgs.postIdx WHERE post.pId=?", pId, (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "내 게시물들 불러오기 오류" });
            }
            else {
                if (result.length == 0) {
                    console.log("게시물 쓴 적 없음");
                    return res.json({ success: true, message: "작성한 게시물이 없습니다.", data: {} });
                }
                else {
                    for (i = 0; i < result.length; i++)
                        console.log(pId+"님의 "+(i+1)+"번째 게시물 [index: "+result[i].index+", title: "+result[i].title);
                    return res.json({ success: true, message: "내 게시물 불러오기 성공!", data: result });
                }
            }
        })
    } catch (err) {
        console.log(err);
    }
});


module.exports = router;