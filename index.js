const express = require("express");
const app = express();
const port = 8080;

const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "static")));

app.listen(port, () => {
    console.log(`listening to thee port ${port}`);
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/", (req, res) => {
    res.render("base.ejs");
});

