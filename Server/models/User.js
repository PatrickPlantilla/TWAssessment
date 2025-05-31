const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  signupDate: { type: Date, default: Date.now },
  latestWeightDate: { type: Date, default: Date.now },
  weights: [{
    date: { type: Date, default: Date.now },
    weight: { type: Number, required: true }
  }]
});

module.exports = mongoose.model('User', UserSchema);