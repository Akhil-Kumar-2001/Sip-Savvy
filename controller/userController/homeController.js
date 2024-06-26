
//--------------------------------- user Home page Render ------------------------------

const home = async(req, res) => {
    try {
        res.render('user/home',{title:"home",alertMessage:req.flash('alert'),user:req.session.user})
    } catch (error) {
      console.log(`error while rendering user page ${error}`)
    }
  }


  

  module.exports={
    home,
  
  }