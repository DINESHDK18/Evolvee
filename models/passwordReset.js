const mongoose = require("mongoose");

const passwordReset = new mongoose.Schema({
  email: {
    type: String,
    require: true,
  },
  otp: {
    type: Number,
    require: true,
  },
});

module.exports = mongoose.model("passwordReset", passwordReset);
