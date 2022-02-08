const express = require('express');
const multer = require('multer');
const { isLoggedIn } = require('./middlewares');
const nodemailer = require('nodemailer');
const { route } = require('./page');

const db = require('../models/db')();
const connection = db.init();

const router = express.Router();

let transporter = nodemailer.createTransport({
    service : 'gmail',
    host : 'smtp.gmail.com',
    port : 587,
    secure : false,
    auth : {
        user : 'lion00000010@gmail.com',
        pass : 'asd36987!!'
    }
});   

// 메일 보내기
router.post('/sendmail', async(req,res)=>{
    try{
        const { owner, sitter } = req.body;
        console.log("sender : "+owner+", receiver : "+sitter);
        connection.query("select email from user where nickname=?",owner, async(err,result)=>{
            if(err) {
                console.log(err);
                return res.json({success:false});
            }
            else{
                if(result.length!=0){
                    console.log(result);
                    console.log("펫주인 메일 주소 : "+result[0].email);
                    const ownerMail = result[0].email;
                    connection.query("select email from user where nickname=?",sitter, async(err,result2)=>{
                        if(err) {
                            console.log(err);
                            return res.json({success:false});
                        }
                        else{
                            console.log("펫시터 이메일 주소 : "+result2[0].email);
                            const sitterMail = result2[0].email;
                            let info = await transporter.sendMail({
                                from : `Seoyoung <lion00000010@gmail.com>`,
                                to : ownerMail,
                                subject : '이메일 테스트',
                                text : owner+"님 안녕하세요, "+sitter+"님과 연락을 원하시면 "+sitterMail+"로 메일을 보내세요.",
                                // html : `<b>${generatedAuthNumber}</b>`
                            });
                            console.log("매세지 정보 : "+info.messageId);
                            return res.json({success: true, message:'메일 전송 완료'})
                        }
                    })
                }
                else{
                    console.log("결과 없음");
                }
            }
        })
    }catch(err){
        console.log(err);
    }
});

//글 작성자의 닉네임 가져오기
router.post('/getOwnerNickname', (req,res)=>{
    try{
        const {postIndex} = req.body;
        connection.query("select distinct(nickname) from post join user on post.pId=user.id where post.index=?",[postIndex],(err,result)=>{
            console.log("결과 : "+result[0].nickname);
            console.log(postIndex+"번 게시글 작성자의 닉네임 : "+result[0].nickname);
            return res.json({success : true, data : result[0].nickname});
        })
    }catch(err){
        console.log(err);
    }
})

// 지원하기 버튼 눌렀을 때
router.post('/apply', (req, res) => {
    const {index, id} = req.body;   // 이때 id -> 현재 접속 중인 유저
    console.log("index : "+index + "id"+id);
    connection.query("select * from apply where aId=? and postIndex=?", [id,index], (err,result)=>{
        if(err) {
            console.log(err);
        }
        else {  
            if(result.length != 0) {
                return res.json({success : false, message : "이미 지원한 구인글입니다!"});
            }
            else {
                const applyingSql = "INSERT INTO apply (postIndex, aId) VALUES (?, ?)";

                try {
                    connection.query(applyingSql, [index, id], (err, result2) => {
                        if (err) {
                            console.log(err);
                            return res.json({ success: false, message: "펫시터 지원 오류" });
                        }
                        return res.json({ success: true, message: "펫시터로 지원 성공" });
                    })
                } catch (err) {
                    console.log(err);
                }
            }
        }
    })
});


// 지원자 목록 불러오기
router.post('/showList', (req, res) => {
    const { postIndex } = req.body;
    //const applyerSql = "select * from petSitter join petImgs on petSitter.userId=petImgs.ownerId join user on petSitter.userId=user.id where petSitter.userId IN (select aId from apply where postIndex=?)";
    const applyerSql = "SELECT p.userId, u.nickname, pi.url, p.sex, p.age, p.residence, p.experience, p.license, p.type, p.size FROM petSitter p LEFT OUTER JOIN petImgs pi ON p.userId=pi.ownerId LEFT OUTER JOIN user u ON p.userId=u.id WHERE p.userId IN (SELECT aId FROM apply WHERE postIndex=?)";
    
    try {
        connection.query(applyerSql, postIndex, (err, result) => {
            if (err) {
                console.log(err);
            }
            else {
                if (result.length == 0) {
                    console.log("지원자 없음");
                    return res.json({ success: true, message: "지원자가 없습니다." });
                }
                else {
                    console.log("총 지원자 "+result.length+"명");
                    return res.json({ success: true, data: result});
                }
            }
        })
    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "오류" });
    }
});


// 지원자 목록에서 -> 확정하기 버튼 눌렀을 때
router.post('/close', (req, res) => {
    const { index } = req.body;
    const closeSql = "UPDATE post SET closed=? WHERE post.index=?";

    try {
        connection.query(closeSql, [1, index], (err, result) => {
            if (err)
                return res.json({ success: false, message: "펫시터 확정 오류" });
            console.log(index+"번 게시물 펫시터 확정! 이제 지원이 불가합니다");
            return res.json({ success: true, message: "펫시터 확정, 이제 지원이 불가합니다." });
        })
    } catch (err) {
        console.log(err);
    }
});


module.exports = router;