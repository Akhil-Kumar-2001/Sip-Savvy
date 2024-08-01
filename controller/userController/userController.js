const bcrypt = require('bcrypt')
const userSchema = require('../../model/userSchema')
const walletSchema = require('../../model/walletSchema')
const passport = require('passport')
const auth = require('../../service/googleAuth')
const generateOTP = require('../../service/genearateOTP')
const mailSender = require('../../service/emailSender')
const { v4: uuidv4 } = require('uuid')


//-------------first home route--------------

const user = (req, res) => {
  try {
    res.redirect('/home')
  } catch (err) {
    console.log(`Error on rendering first home page ${err}`)
  }
}


//--------------------------------- user login page Render ------------------------------

const login = (req, res) => {
  try {
    if (req.session.user) {
      res.redirect('/home')
    } else {

      res.render('user/login', { title: "Login", alertMessage: req.flash('alert'), user: req.session.user })
    }
  } catch (error) {
    console.log(`error while rendering user login ${error}`);
  }
}





//-------------verify Login details--------------






const loginPost = async (req, res) => {
  try {

    const email = await userSchema.findOne({ email: req.body.email })

    if (email) {

      if (!email.isActive) {
        req.flash('alert', 'User access is blocked by admin')
        res.redirect('/login')
      } else {
        const password = await bcrypt.compare(req.body.password, email.password)

        if (email && password) {

          req.session.user = email.id
          res.redirect('/home')
        } else {
          req.flash('alert', 'Invalid credentails')
          res.redirect('/login')
        }
      }

    } else {
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

  } catch (err) {
    console.log(`error while login in ${err}`);
  }
}





//---------------Render sighnup page-------------------






const signup = (req, res) => {
  try {
    res.render('user/signup', { title: "sighup", alertMessage: req.flash('alert'), user: req.session.user })
  } catch (error) {
    console.log(`error while sighup`);
  }
}





//-------------Getting details from user---------------





const signupPost = async (req, res) => {
  try {

    const {name,email,password,phone,confirmPassword,referralCodeInput} = req.body;

     // Server-side validation to ensure all fields are filled
     if (!name || !email || !phone || !password || !confirmPassword) {
      req.flash('alert', 'All fields are required');
      return res.redirect('/signup');
  }

  

    // Function to generate a referral code
    function createReferralCode() {
      return uuidv4().slice(0, 8); // Generate a short referral code
  }
     const referralCode = createReferralCode();
     console.log(referralCode);

     
   // Look up if the provided referral code belongs to any existing user
   let referredBy = null;
   console.log(referralCodeInput)
   if (referralCodeInput) {
       const referringUser = await userSchema.findOne({ referralCode: referralCodeInput });
       if (referringUser) {
           referredBy = referringUser._id; // Use the referring user's ID
       }
   }

    const details = {
      name: req.body.name,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 10),
      phone: req.body.phone,
      referralCode: referralCode,
      referredBy: referredBy
    }

    const checkUser = await userSchema.find({ email: req.body.email })
    if (checkUser.length == 0) {

      const otp = generateOTP();
      req.session.otp = otp
      mailSender(otp, req.body.email)
      req.session.name = req.body.name
      req.session.email = req.body.email
      req.session.password = await bcrypt.hash(req.body.password, 10)
      req.session.phone = req.body.phone,
      req.session.referralCode = referralCode,
      req.session.referredBy = referredBy

      res.redirect('/OTP')


      // userSchema.insertMany(details).then((result)=>{
      //   console.log(result);
      // }).catch((err)=>{
      //   console.log(`user not found ${err}`);
      // })
      console.log("new user");
    } else {
      req.flash('alert', 'user already exist')
      console.log("user already exist");
      res.redirect('/login')
    }

  } catch (error) {
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



const getOTPPage = (req, res) => {
  try {

    res.render('user/otpPage', { title: "OTP", 
        email: req.session.email,
        otpTime: req.session.otpTime,
        user: req.session.user,
        alertMessage: req.flash('alert') })

  } catch (err) {
      console.log(`error while rendering the OTP page ${error}`)
  }
}


const otpPost = async (req, res) => {
  try {
    
    const OTPArray = req.body.otp
    const OTP = Number(OTPArray.join(""))
    // const details = {
    //   name: req.session.name,
    //   email: req.session.email,
    //   password: req.session.password,
    //   phone: req.session.phone
    // }

    if (Number(req.session.otp) === OTP) {

      const newUser = new userSchema({
        name: req.session.name,
        email: req.session.email,
        password: req.session.password,
        phone: req.session.phone,
        referralCode: req.session.referralCode,
        referredBy: req.session.referredBy
      })

      await newUser.save()

      // Add the Reward to the the referal code owner

      if (newUser.referredBy) {
        const referringUserWallet = await walletSchema.findOne({ userID: newUser.referredBy });
        if (referringUserWallet) {
            referringUserWallet.balance += 100;
            
            await referringUserWallet.save();
        }else{
            const newWallet =new walletSchema({
                userID:newUser.referredBy,
                balance:100
            })
            await newWallet.save()
        }
    }

      req.session.user = newUser.id
        req.flash('alert', 'registration successful')
      res.redirect('/home')
    }else{
      req.flash('alert','Invalid OTP')
      res.redirect('/OTP')
    }
  } catch (err) {
      console.log(`error while verifying the otp ${err}`)
  }
}



//-------------------------------------- Otp Resent ---------------------------------

const otpResend = (req, res) => {
  try {
    const otp = generateOTP()
    mailSender(otp, req.session.email)
    req.session.otp = otp
    req.session.otpTime = Date.now()

    req.flash('alert', 'OTP resent successfully')
    res.redirect('/OTP')
  } catch (error) {
    console.log(`Error while resending OTP: ${error}`)
    req.flash('error', 'Failed to resend OTP. Please try again later.')
    res.redirect('/signup')
  }
}


module.exports = {
  user,
  login,
  loginPost,
  signup,
  signupPost,
  logout,
  googleAuth,
  googleAuthCallback,
  getOTPPage,
  otpPost,
  otpResend
}