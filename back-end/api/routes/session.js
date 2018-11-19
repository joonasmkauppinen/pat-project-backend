const express = require('express');
const router = express.Router();
const db = require('../../db');
const md5 = require('md5');

const md7 = (i) => {
  return md5(i + process.env.SALT_1) + md5(process.env.SALT_2 + i + process.env.SALT_3 + i);
}

router.get('/login', (req,res,next) => {

  let response = { success : 0 }

  if ( typeof req.query.username == 'undefined' || typeof req.query.password == 'undefined' ) {
    res.status(200).json({ success: 0, error: 'username and password is required'});
  }else{

    const username = req.query.username;
    const password = req.query.password;

    db.query("SELECT userID FROM users WHERE `userName`=? AND `userPassword`='" + md7(password) + "' LIMIT 1", [username], (e,r,f) => {
      if (r.length == 1 ) {

        const token = md7( Math.floor((Math.random() * 10000) + 1) + username + Math.floor((Math.random() * 10000) + 1) + username );
        const userID = r[0].userID;
        const timestampNow = Math.floor(Date.now() / 1000);

        db.query("INSERT INTO `sessions` SET sessionUserLID=" + userID + ", sessionStartTime="+timestampNow+", sessionLastActive="+timestampNow+", sessionToken='"+token+"', sessionIP='"+req.connection.remoteAddress+"'", (e,r,f) => {
            if ( e == null ) {
              response.success = 1;
              response.session_id = r.insertId;
              response.token = token;
              res.status(200).json((response));
            }
        });

      }else{
        res.status(500).json((response));
      }
      
    });  

  }

});


router.get('/logout', (req,res,next) => {
  
    let response = { success : 0 }
  
    if ( typeof req.query.session_id == 'undefined' || typeof req.query.token == 'undefined' ) {
      res.status(200).json({ success: 0, error: '`session_id` and `token` are required'});
    }else{
  
      const session_id = req.query.session_id;
      const token = req.query.token;
  
      db.query("SELECT sessionID FROM sessions WHERE `sessionID`=? AND `sessionToken`=? LIMIT 1", [session_id, token], (e,r,f) => {
        console.log(e);
        if (r.length == 1 ) {
  
          db.query("DELETE FROM `sessions` WHERE `sessionID`=? AND sessionToken=? LIMIT 1", [session_id, token], (e,r,f) => {
              if ( e == null ) {
                response.success = 1;
                res.status(200).json((response));
              }
          });
  
        }else{
          res.status(500).json((response));
        }
        
      });  
  
    }
  
  });


module.exports = router;