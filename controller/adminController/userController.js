

const user = (req,res)=>{
    try {
        res.render('admin/user',{title:'Customer',alertMessage:req.flash('alert')})
    } catch (error) {
        console.log(`error while loading user in admin ${error}`);
    }
}

module.exports ={
    user
}