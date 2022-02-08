const express = require('express');
const router = express.Router();

const db = require('../models/db')();
const connection = db.init();

db.test_open(connection);



router.post('/petSitter', async(req, res) => {
    try {
        console.log("나가?");
        console.log(req.body);
        const { oid, onickname, otype, osize, osex, oage, oexperience, olicense } = req.body; // 프론트에서 넘겨받은 정보
        const owner = [{oid, onickname, otype, osize, osex, oage, oexperience, olicense}];
        //var ooage=oage.split("대")[0];
        //console.log(ooage);
        
        //var newage=parseInt(oage.split("대")[0]);
        
        // if(oage>=20 && oage<30) newage=20;
        // else if (oage>=30 && oage <40) newage=30;
        // else if (oage>=40) newage=40;
        newage = oage;
        console.log("age : "+newage+"s");

        var message = "";
        var matched = 0;
        var sitterResult = null;
        var ownerSql = "";

        const sitterSql = "SELECT id, nickname, residence, type, size, sex, age, experience, license FROM user, petSitter WHERE type=? AND size=? AND sex=? AND age BETWEEN ? AND ? AND experience=? AND license=? AND id=userId";
        connection.query(sitterSql, [otype, osize, osex, newage-1, newage+9, oexperience, olicense], (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "오류"});
            }
            // 오류 X
            console.log(result.length);
            if (result.length != 0) {   // 모든 조건을 충족하는 펫시터 존재
                sitterResult = result;
                matched = sitterResult.length;
                message = "모든 조건 만족하는 펫시터 : "+matched+" 명";
                ownerSql = "SELECT id, nickname, type, size, sex, age, experience, license FROM user, petSitter WHERE id=? AND nickname=? AND type=? AND size=? AND sex=? AND age BETWEEN ? AND ? AND experience=? AND license=?";
                return res.json({ success: true, matched: matched, message: message, owner: owner, sitter: sitterResult });
            }
            else {  // 모든 조건을 충족하는 펫시터는 없음
                if (olicense == 1) {
                    console.log("차선의 펫시터 찾아보기 - 자격증 없이!");
                    connection.query(sitterSql, [otype, osize, osex, newage-1, newage+9, oexperience, 0], (err, result) => {
                        if (err)    // 오류
                            return res.json({ success: false, message: "오류" });
                        // 오류 X
                        if (result.length != 0) { // 그나마 충족하는 펫시터 존재
                            sitterResult = result;
                            matched = sitterResult.length;
                            console.log(matched);
                            message = "자격증 여부를 제외하고 모든 조건이 맞는 펫시터 : "+matched+" 명";
                            ownerSql = "SELECT id, nickname, type, size, sex, age, experience, license FROM user, petSitter WHERE id=? AND nickname=? AND type=? AND size=? AND sex=? AND age BETWEEN ? AND ? AND experience=?";
                            return res.json({ success: true, matched: matched, message: message, owner: owner, sitter: sitterResult });
                        }
                        else
                            return res.json({ success: true, message: "No data!" });
                    });
                }
                else // olicense = 0;
                    return res.json({ success: true, message: "No data!" });
                    
            }
        });

    } catch (err) {
        console.log(err);
    }
});



module.exports = router;