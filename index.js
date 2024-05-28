const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const MONGO_URL = 'mongodb://127.0.0.1:27017/EvolveGuru';
const Register = require("./models/register.js");
const path = require("path");
const methodOverride = require("method-override");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ejsMate = require("ejs-mate"); 
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const User = require("./models/userModel.js");
const passwordReset = require("./models/passwordReset.js");
const { saveRedirectUrl, isLoggedIn } = require("./middleware.js");
require("dotenv").config();
const Cookies = require('cookies');

const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
      }
  });
  

const jwt = require("jsonwebtoken");
const port = 8008;

const JWT_SECRET = "hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe";



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "static")));

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());



main().then(() => {
    console.log("connected to DB");
})
.catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
}


const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};


app.get("/", (req, res) => {
    res.render("base.ejs");
});

app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.all("*", (req,res,next) => {
//     next(new ExpressError(404,"page not found"));
// });

app.use((err, req, res, next) => {
    let { statusCode=500, message="Something went wrong" } = err;
    res.status(statusCode).render("Error.ejs", { message });
});




app.get("/login", (req, res) => {
    res.render("login.ejs");
});



app.post("/login", saveRedirectUrl, passport.authenticate("local", { failureRedirect: '/login', failureFlash: true }), async(req, res) => {
    req.flash("success", "Welcome back to EvolveGuru! You are logged in! ");
    let redirectUrl = res.locals.redirectUrl || "/";
    res.redirect(redirectUrl);
});


// app.get("/logout", (req, res, next) => {
//     req.logout((err) => {
//         if(err) {
//             next(err);
//         }
//         req.flash("success", "You are logged Out");
//         res.redirect("/register");
//     });
// });




app.get("/forgot", (req, res) => {
    res.render("forgot_pass.ejs");
});


app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.post("/register", wrapAsync(async (req, res) => {
    try {
        let {name, email, password,mobileNumber,options} = req.body;
        const newUser = new User({name, email,mobileNumber,options});
        const registeredUser = await User.register(newUser, password);
        await registeredUser.save();
        req.login(registeredUser, (err) => {
            if(err) {
                return next(err);
            }
            req.flash("success", "Welcome to EvolveGuru!");
            res.render("base.ejs");              
        });      
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/register");
    }
}));


app.post("/register/new", async (req, res) => {
    const {name,password,email,mobileNumber,options}=req.body;
   
    try {
            console.log("Hello");
            const newRegister = new Register({name,password,email,mobileNumber,options});
            await newRegister.save();
            res.redirect("/login");
        } catch (err) {
            console.error(err); 
            res.status(500).send("Error during registration. Please try again."); 
        }
});







app.post("/popup", (req, res) => {
    res.render("pop_up.ejs");
});

app.get("/about", (req, res) => {
    res.render("about.ejs");
});



app.post("/forgot", async (req, res) => {
    const { email } = req.body;
    const cookies = new Cookies(req, res);
    cookies.set("email", email);
    const otp = Math.floor(1000 + Math.random() * 9000);
    try {
      const UserExist = await Register.findOne({ email });
  
      if (!UserExist) {
        return res.status(404).send("User Not Exists!!");
      }
  
      const previousOTP = await passwordReset.findOne({ email: UserExist.email });
  
      if (previousOTP) {
        await passwordReset.findOneAndUpdate({ email: UserExist.email }, { otp: otp });
      } else {
        const passwordResetData = new passwordReset({ email: UserExist.email, otp: otp });
        await passwordResetData.save();
      }
  
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: UserExist.email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}`
      };
  
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ message: 'Failed to send OTP' });
        } else {
          console.log('Email sent: ' + info.response);
          res.render("verifyOtp.ejs")
          setTimeout(async () => {
            await passwordReset.deleteOne({ email: UserExist.email, otp: otp });
            console.log('OTP record deleted after 1 minute');
          }, 60000);
        }
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).send("An error occurred while processing your request.");
    }
  });
  
// app.get("/reset-password/:id/:token", async (req,res) => {
//     const {id, token} = req.params;
    
// });
app.post("/verifyOTP", async (req, res) => {
    const otp = req.body.OTP;
    const cookies = new Cookies(req, res);
    const email = cookies.get('email'); 
    if (!email) {
        return res.status(400).json({ message: 'Email not found in cookies' });
    }
    try {
        const otpDoc = await passwordReset.findOne({ email: email, otp: otp });
        
        if (!otpDoc) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        await passwordReset.deleteOne({ _id: otpDoc._id });
        res.render("changePassword.ejs");
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post("/resetPassword", async (req, res) => {
    const newPassword = req.body.password;
    const cookies = new Cookies(req, res);
    const email = cookies.get('email'); // Assuming 'email' is the key used to store the email in cookies

    if (!email) {
        return res.status(400).json({ message: 'Email not found in cookies' });
    }

    console.log(req.body,newPassword);

    try {
        const exist = await Register.findOne({ email: email });

        if (exist) {
            await Register.updateOne(
                { email: email },
                { $set: { password: newPassword } }
            );
        }  
        // res.status(200).json({ status: "success", message: "Password reset successfully" });
        cookies.set("email", "");
        res.redirect("/login");
    } catch (error) {
        console.error("Failed to reset password:", error);
        res.status(500).json({ message: "Failed to reset password" });
    }
});

app.listen(port, () => {
    console.log(`listening to thee port ${port}`);
});

    














// const express = require("express");
// const app = express.app();
// const User = require("../models/userModel.js");
// const wrapAsync = require("../utils/wrapAsync.js");
// // const passport = require("passport");
// const { saveRedirectUrl } = require("../middleware.js");







