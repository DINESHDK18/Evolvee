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
const { saveRedirectUrl, isLoggedIn } = require("./middleware.js");



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

app.all("*", (req,res,next) => {
    next(new ExpressError(404,"page not found"));
});

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


// app.post("/register/new", async (req, res) => {
//     const {name,password,email,mobileNumber,options}=req.body;
   
//     try {
//             console.log("Hello");
//             const newRegister = new Register({name,password,email,mobileNumber,options});
//             await newRegister.save();
//             res.redirect("/login");
//         } catch (err) {
//             console.error(err); 
//             res.status(500).send("Error during registration. Please try again."); 
//         }
// });







app.post("/popup", (req, res) => {
    res.render("pop_up.ejs");
});

app.get("/about", (req, res) => {
    res.render("about.ejs");
});



app.post("/forgot", async(req, res) => {
    const {email} = req.body;
    try {
        const oldUser = await Register.findOne({ email });
        if(!oldUser){
            return res.send("User Not Exists!!");
        }
        const secret = JWT_SECRET + oldUser.password;
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
            expiresIn: "5m",
        });
        const link = `http://localhost:8008/reset-password/${oldUser._id}/${token}`;
        console.log(link);
    } catch (error) {
        
    }
});

app.get("/reset-password/:id/:token", async (req,res) => {
    const {id, token} = req.params;
    console.log(req.params);
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







