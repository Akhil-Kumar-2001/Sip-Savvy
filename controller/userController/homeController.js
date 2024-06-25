//--------------------------------- user Home page Render ------------------------------

const home = (req, res) => {
    try {
      res.render('user/home',{title:"home"})
    } catch (error) {
      console.log(`error while rendering user page ${error}`)
    }
  }


  

  module.exports={
    home,
  
  }