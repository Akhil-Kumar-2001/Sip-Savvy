



// function checkUserSession(req,res,next){
//     if(req.session.user){
//         next();
//     }else{
//         res.redirect('/')
//     }
// }


// module.exports = checkUserSession

const userSchema = require('../model/userSchema')

async function isUser (req,res,next){

    try {
        
        if(req.session.user){
            const user = await userSchema.findById(req.session.user);
            if(user.isActive){
                next();
            }else{
                req.session.user ='';
                req.flash('alert','user is blocked by admin')
                res.redirect('/login')
            }
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.log(`user session error ${error}`)
    }
}

module.exports = isUser
