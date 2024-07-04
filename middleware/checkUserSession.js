const userSchema = require('../model/userSchema')

async function checkUser (req, res, next) {
  try {
    if (req.session.user) {
      const userDetails = await userSchema.findById(req.session.user)
      if (userDetails && userDetails.isActive) {
        next()
      } else {
        req.session.user = ''
        req.flash('alert','Your account has been temporarily blocked by the admin')
        res.redirect('/login')
      }
    } else {
      next()
    }
  } catch (err) {
    console.log(`error in checkuser is blocked  ${err}`)
  }
}

module.exports = checkUser