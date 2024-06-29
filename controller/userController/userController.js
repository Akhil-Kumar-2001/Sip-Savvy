const bcrypt = require('bcrypt')
const userSchema = require('../../model/userSchema')
const passport=require('passport')
const auth=require('../../service/googleAuth')



//-------------first home route--------------

const user  = (req,res)=>{
  try{
    res.redirect('/home')
  }catch(err){
    console.log(`Error on rendering first home page ${err}`)
  }
}


//--------------------------------- user login page Render ------------------------------

  const login =(req,res) => {
    try{
      if(req.session.user){
        res.redirect('/home')
      }else{

        res.render('user/login',{title:"Login",alertMessage:req.flash('alert'),user:req.session.user})
      }
    }catch(error){
      console.log(`error while rendering user login ${error}`);
    }
  }





  //-------------verify Login details--------------






  const loginPost =async(req,res) => {
    try{

      const email = await userSchema.findOne({email:req.body.email})

      if(email){

        if(!email.isActive){
          req.flash('alert', 'User access is blocked by admin')
          res.redirect('/login')
        }else{
          const password = await bcrypt.compare(req.body.password,email.password)
  
          if (email && password) {
            req.session.user = email.id
            res.redirect('/home')
          } else {
            req.flash('alert', 'Invalid credentails')
            res.redirect('/login')
          }
        }

      }else {
          req.flash('alert', 'Couldnt find user')
          res.redirect('/login')
        }
    

      //   const checkUser = await userSchema.findOne({email:req.body.email,password:req.body.password})

      // if(!checkUser){
      //   req.flash('alert','Invalid username or password')
      //   res.redirect('/login')
      // }else{
      //   req.session.user=checkUser.email
      //   res.redirect('/')
      // }

    }catch(err){
        console.log(`error while login in ${err}`);
    }
  }





//---------------Render sighnup page-------------------






   const signup =(req,res) =>{
    try {
      res.render('user/signup',{title:"sighup",alertMessage:req.flash('alert'),user:req.session.user})
    } catch (error) {
      console.log( `error while sighup`);
    }
   }





//-------------Getting details from user---------------





   const signupPost = async(req,res) => {
    try {
      const details = {
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 10),
        // password:req.body.password,
        phone: req.body.phone
      }

        const checkUser = await userSchema.find({email:req.body.email})
        if(checkUser.length==0){

          userSchema.insertMany(details).then((result)=>{
            console.log(result);
          }).catch((err)=>{
            console.log(`user not found ${err}`);
          })
          console.log("new user");
        }else{
          req.flash('alert','user already exist')
          console.log("user already exist");
        }

        res.redirect('/login')
   }catch(error){
      console.log(`error during signup post ${error}`);
   }
  }
   






//--------------------------------------- User logout -----------------------------------

const logout = (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.log(err)
      }
    })
    res.redirect('/')
  } catch (error) {
    console.log(`error while logout user ${error}`)
  }
}





const googleAuth = (req, res) => {
  try {
    passport.authenticate('google', {
      scope: ['email', 'profile']
    })(req, res);
  } catch (err) {
    console.error(`Error on Google authentication: ${err}`);
  }
};

// Google auth callback from the auth service
const googleAuthCallback = (req, res, next) => {
  try {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error(`Error on Google auth callback: ${err}`);
        return next(err);
      }
      if (!user) {
        return res.redirect('/login');
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error(`Error logging in user: ${err}`);
          return next(err);
        }
        // Store the user ID in the session
        req.session.user = user.id;
        return res.redirect('/home');
      });
    })(req, res, next);
  } catch (err) {
    console.error(`Error on Google callback: ${err}`);
    next(err); // Make sure to call next with the error
  }
};

  
  module.exports={
    user,
    login,
    loginPost,
    signup,
    signupPost,
    logout,
    googleAuth,
    googleAuthCallback
  }