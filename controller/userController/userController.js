const userSchema = require('../../model/userSchema')

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
      res.render('user/login',{title:"Login",alertMessage:req.flash('alert'),user:req.session.user})
    }catch(error){
      console.log(`error while rendering user login ${error}`);
    }
  }





  //-------------verify Login details--------------






  const loginPost =async(req,res) => {
    try{

        const checkUser = await userSchema.findOne({email:req.body.email,password:req.body.password})

      if(!checkUser){
        req.flash('alert','Invalid username or password')
        res.redirect('/login')
      }else{
        req.session.user=checkUser.email
        res.redirect('/')
      }

    }catch(err){

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
        // password: await bcrypt.hash(req.body.password, 10),
        password:req.body.password,
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




  
  module.exports={
    user,
    login,
    loginPost,
    signup,
    signupPost,
    logout
  }