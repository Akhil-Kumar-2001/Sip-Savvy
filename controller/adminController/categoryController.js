const category=(req,res)=>{
        try {
            res.render('admin/category',{title:'Category',alertMessage:req.flash('alert')})
        } catch (error) {
            console.log(`error while rendering category ${error}`);
        }
}


module.exports = {
    category
}