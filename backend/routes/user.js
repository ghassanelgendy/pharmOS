const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const checkAuth = require("../middleware/check-auth");

router.post("/signup", (req,res,next)=>{
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        name : req.body.name,
        contact : req.body.contact,
        nic : req.body.nic,
        email : req.body.email,
        password : hash,
        role: req.body.role
      });

      user.save()
        .then(result =>{
          res.status(201).json({
            message : 'User created!',
            result: result
          });
        })

        .catch(err =>{
          res.status(500).json({
            error :err
          });
        });
    })

})



router.post("/login" , async (req, res ,  next)=>{
  try {
    const user = await User.findOne({email: req.body.email});
    if(!user){
      return res.status(401).json({
        token: "error",
        expiresIn: "error",
        role: "error",
        message: "Invalid Email (user email not registered)"
      });
    }
    const result = await bcrypt.compare(req.body.password, user.password);
    if(!result){
      return res.status(401).json({
        token: "error",
        expiresIn: "error",
        role: "error",
        message: "Invalid password please try again"
      });
    }
    const token = jwt.sign(
      {email: user.email , userId : user._id } ,
      'this_is_the_webToken_secret_key' ,
      { expiresIn : "1h"}
    );
    return res.status(200).json({
      token: token,
      expiresIn: 3600,
      role: user.role,
      message: "Logged in Successfully"
    });
  } catch (err) {
    return res.status(401).json({
      message: "Auth failed"
    });
  }
})

router.get("/getUserData",(req,res,next)=>{
  User.find().then(documents=>{
    res.status(200).json({
      message : 'supplier added sucessfully',
      users :documents
    });
  });
});


router.get("/:id",(req,res,next)=>{
  User.findById(req.params.id).then(user =>{
    if(user){
      res.status(200).json(user);
    }else{
      res.status(200).json({message:'user not found'});
    }
  });
});

router.put("/:id",(req,res,next)=>{
  bcrypt.hash(req.body.password, 10)
  .then(hash => {
    const user = new User({
      _id: req.body.id,
      name: req.body.name,
      email: req.body.email,
      contact: req.body.contact,
      nic: req.body.nic,
      password: hash,
      role: req.body.role
    });

    User.updateOne({_id: req.params.id}, user)
  .then(result => {
    console.log(result);
    res.status(200).json({message : "Update user Successful !"});
  })
  .catch(err =>{
    res.status(500).json({
    error :err
   });
});

})
});

router.delete("/:id", checkAuth, async (req, res, next) => {
  try {
    const requestingUser = await User.findById(req.userData.userId);
    if (!requestingUser || requestingUser.role !== 'Pharmacist') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const result = await User.deleteOne({ _id: req.params.id });
    console.log(result);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found!' });
    }
    res.status(200).json({ message: 'user deleted!' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: err, message: 'Failed to delete user' });
  }
});





module.exports = router;
