const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const register=async(req,res)=>{
  const {email}=req.body
  const findexists=await usermodel.find({email})
  if(findexists==''){
    const data=await usermodel.create(req.body)
    res.json({userdetail:data});
  }
  else{
    res.json({message:'failed'});
  }
};

const login=async(req,res)=>{
  const {email,password}=req.body
  const data=await usermodel.findOne({email,password})
  if(data=='' || !data){
    res.json({message:'failed'});
  }
  else{
    res.json({userdetail:data});
  }
};

const userSchema = new Schema({
    name :{
        type:String,
        required:true,
    },
    email: {
        type: String,
        required: true,
    },
    mobileNumber:{
        type:String,
        required:true,
    },
    options: {
        type:String,
        enum: ["student", "teacher"]
    },

});

userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model("User", userSchema);

