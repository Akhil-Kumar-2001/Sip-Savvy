const userSchema = require('../../model/userSchema')

//------------------------------------ User page render ---------------------------------



const users = async(req,res)=>{
    try {
            const search = req.query.search || '' 
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;

            const user = await userSchema.find({name:{$regex:search, $options:'i'}})
                        .sort({createdAt:-1})
                        .limit(limit)
                        .skip((page - 1) * limit);   
                        
                        const count = await userSchema.countDocuments({ name: { $regex: search, $options: 'i' } });            
            
            res.render  ('admin/user',{title:'Customer',alertMessage:req.flash('alert'),
                search ,
                user,
                totalPages:Math.ceil(count/limit),
                currentPage:page,
                limit,
                page })

        // res.render('admin/user',{title:'Customer',alertMessage:req.flash('alert')})
    } catch (error) {
        console.log(`error while loading user in admin ${error}`);
    }
}


//------------------------------------ User Status ---------------------------------

const status = async (req,res)=> {

    try {
        
        const {id,status} = req.query;
        const newStatus = !(status === 'true')

        await userSchema.findByIdAndUpdate(id,{isActive: newStatus})
        res.redirect('/admin/users')
    } catch (error) {
        console.log(`error while changing status of user ${error}`)
    }

}

module.exports ={
    users,
    status
}