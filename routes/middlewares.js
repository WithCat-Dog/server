exports.isLoggedIn = (req,res,next)=>{
    if(req.cookies.loginToken){ // 로그인 되어있는 상태
        next();
    }
    else{
        res.status(403).send('로그인 필요');
    }
}

exports.isNotLoggedIn = (req,res,next)=>{
    if(!req.cookies.loginToken){    // 로그인 안 되어있는 상태
        next();
    }
    else{
        res.status(403).send('이미 로그인된 상태');
    }
}