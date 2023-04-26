import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const app = express();

// using all middlewares :::;
app.use(express.static(path.join(path.resolve(), "./public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

mongoose
  .connect(
    "mongodb+srv://ritikrex:eV24xWz7AyW4P7B@cluster0.yx3ucng.mongodb.net/?retryWrites=true&w=majority",
    { dbName: "backend" }
  )
  .then((success) => {
    console.log("database connected successfully !!!");
  })
  .catch((error) => {
    console.log("error in connecting to database:::", error);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

const isAuthenticatedHandler = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decode = jwt.verify(token, "djklfdjaslkdjfjfsj");
    req.user = await User.findById(decode._id);
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticatedHandler, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.redirect("/register");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.render("login", { message: "Password is Incorrect!!!", email });

  const token = jwt.sign({ _id: user._id }, "djklfdjaslkdjfjfsj");

  res.cookie("token", token, {
    expires: new Date(Date.now() + 60 * 1000),
    httpOnly: true,
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ _id: user._id }, "djklfdjaslkdjfjfsj");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.listen(1000, () => {
  console.log("server is listen on 1000");
});
