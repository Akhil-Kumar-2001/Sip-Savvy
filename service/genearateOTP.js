const otpGenerator = require('otp-generator')

const generateOTP = ()=>{
    const OTP =otpGenerator.generate(6,{
        lowerCaseAlphabets:false,
        upperCaseAlphabets:false,
        specialChars:false
    })
    return OTP;
}


module.exports =generateOTP