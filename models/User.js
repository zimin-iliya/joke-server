const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username:{type:String, required:true, min:4 ,unique:true},
    password:{type:String, required:true, min:6},
    email:{type:String, required:true, unique:true},
    avatar:{type:String, default:"https://i.imgur.com/6VBx3io.png"},
},
{timestamps:true}
);

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;