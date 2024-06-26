//--------------------------------- user Home page Render ------------------------------

const home = (req, res) => {
    try {
      // req.flash('alert','welcome to home')
      res.render('user/home',{title:"home",alertMessage:req.flash('alert'),user:req.session.user})
    } catch (error) {
      console.log(`error while rendering user page ${error}`)
    }
  }


  

  module.exports={
    home,
  
  }