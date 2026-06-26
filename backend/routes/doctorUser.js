const express = require("express");
const router = express.Router();
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const checkDocAuth = require("../middleware/check-docAuth");

const DoctorUser = require('../models/doctorUser');
const User = require('../models/user');
const checkAuth = require("../middleware/check-auth");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp"
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid mime type");
    if (isValid) {
      error = null;
    }
    cb(error, path.join(__dirname, "../images"));
  },
  filename: (req, file, cb) => {
    const name = file.originalname.toLowerCase().split(' ').join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + '-' + Date.now() + '.' + ext);
  }
});

const upload = multer({ storage: storage });

router.post("/doctorSignup", upload.single("image"), (req,res,next)=>{

  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      let profilePicUrl = "";
      if (req.file) {
        profilePicUrl = req.protocol + "://" + req.get("host") + "/images/" + req.file.filename;
      }
      const doctorUser = new DoctorUser({
        name : req.body.name,
        contact : req.body.contact,
        docId : req.body.docId,
        email : req.body.email,
        password : hash,
        profilePic: profilePicUrl
      });

      doctorUser.save()
        .then(result =>{
          res.status(201).json({
            message : 'Doctor Account created!',
            result: result
          });
        })

        .catch(err =>{
          res.status(500).json({
            error :err
          });
        });
    })

});


router.post("/doctorLogin" , async (req, res ,  next)=>{
  try {
    const user = await DoctorUser.findOne({email: req.body.email});
    if(!user){
      return res.status(401).json({
        message: "Auth failed"
      });
    }
    const result = await bcrypt.compare(req.body.password, user.password);
    if(!result){
      return res.status(401).json({
        message: "Auth failed"
      });
    }
    const token = jwt.sign(
      {email: user.email , userId : user._id, name:user.name, contact:user.contact , docId:user.docId} ,
      'this_is_the_webToken_secret_key' ,
      { expiresIn : "1h"}
    );
    return res.status(200).json({
      token: token,
      expiresIn: 3600,
      name: user.name,
      email: user.email,
      contact: user.contact,
      docId: user.docId,
    });
  } catch (err) {
    return res.status(401).json({
      message: "Auth failed"
    });
  }
})

router.get("/getDoctorUserData",(req,res,next)=>{
  DoctorUser.find().then(documents=>{
    res.status(200).json({
      message : 'Doctor added sucessfully',
      doctors :documents
    });
  });
});

router.get("/:id",(req,res,next)=>{
  DoctorUser.findById(req.params.id).then(doctor =>{
    if(doctor){
      res.status(200).json(doctor);
    }else{
      res.status(200).json({message:'doctor not found'});
    }
  });
});

router.put("/:id", upload.single("image"), (req,res,next)=>{
  bcrypt.hash(req.body.password, 10)
  .then(hash => {
    let profilePicUrl = req.body.profilePic || "";
    if (req.file) {
      profilePicUrl = req.protocol + "://" + req.get("host") + "/images/" + req.file.filename;
    }

    const doctor = new DoctorUser({
      _id: req.params.id,
      name: req.body.name,
      email: req.body.email,
      contact: req.body.contact,
      password: hash,
      docId: req.body.docId,
      profilePic: profilePicUrl
    });

  DoctorUser.updateOne({_id: req.params.id}, doctor)
  .then(result => {
    console.log(result);
    res.status(200).json({message : "Update doctor Successful !"});
  })
  .catch(err =>{
    res.status(500).json({
      error :err
    });
  });
});
});

router.delete("/:id", checkAuth, async (req, res, next) => {
  try {
    const requestingUser = await User.findById(req.userData.userId);
    if (!requestingUser || requestingUser.role !== 'Pharmacist') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const result = await DoctorUser.deleteOne({ _id: req.params.id });
    console.log(result);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Doctor profile not found!' });
    }
    res.status(200).json({ message: 'doctor deleted!' });
  } catch (err) {
    console.error('Delete doctor error:', err);
    res.status(500).json({ error: err, message: 'Failed to delete doctor account' });
  }
});

router.get("/shoppingcart",(req,res,next)=>{

  console.log("sdfkjashdfjh");
});


module.exports = router;
