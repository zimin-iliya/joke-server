const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");

const User = require("./models/User");
const Jokes = require("./models/Jokes");
const auth = require("./middleware/usersMiddleware");

require("dotenv").config();

const app = express();

const upload = multer({ storage: multer.memoryStorage() });

const supabaseUrl = "https://ewokwacjsoqeghdxcwrt.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const password = process.env.PASSWORD;

const salt = bcrypt.genSaltSync(10);
const secret = "secret";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(
  `mongodb+srv://blog:${password}@blog.fz13thm.mongodb.net/?retryWrites=true&w=majority`
);

app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
      email,
    });
    res.json(userDoc);
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: err });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  if (!userDoc) {
    res.status(401).json({ message: "Wrong username or password" });
    return;
  }
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    jwt.sign({ username, userId: userDoc._id }, secret, (err, token) => {
      if (err) {
        res.status(500).json({ message: "Error signing token" });
      } else {
        res.cookie("token", token).json({ id: userDoc._id, username });
      }
    });
  } else {
    res.status(401).json({ message: "You are not logged in" });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token").json({ message: "You are logged out" });
});

app.get("/jokes", async (req, res) => {
  try {
    const jokeDoc = await Jokes.find();
    res.json(jokeDoc);
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: err });
  }
});



app.get("/profile", auth, (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, secret, (err, info) => {
    if (err) {
      res.status(401).json({ message: "You are not logged in" });
    } else {
      res.json(info);
    }
  });
});

app.get("/avatars", async (req, res) => {
  try {
    const { data, error } = await supabase.storage.from("avatar").list("", {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(error.message);
    }
    const avatarData = [];
    await Promise.all(
      data.map(async (item) => {
        const avatarUrl = await supabase.storage
          .from(`/avatar`)
          .getPublicUrl(item.name);
        avatarData.push(avatarUrl);
      })
    );
    res.json(avatarData);
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: err });
  }
});

app.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    const userId = req.user.userId;
    const username = (req.user.username).toLowerCase();
    const { data, error } = await supabase.storage
      .from("avatar")
      .upload(`${userId}.jpg`, req.file.buffer, {
        cacheControl: "600",
        upsert: true,
      });
    if (error) {
      throw new Error(error.message);
    }
    res.json(data);
    updated = await User.findByIdAndUpdate(
      userId,
      {
        avatar: `https://ewokwacjsoqeghdxcwrt.supabase.co/storage/v1/object/public/${data.fullPath}`,
      },
      { new: true }
    );
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: err });
  }
});

app.get("/jokes/me", auth, async (req, res) => {
  const decodedToken = req.user.username;
  console.log("this is decodedToken", decodedToken);
  try {
    const jokeDoc = await Jokes.find({ username: decodedToken });
    res.json(jokeDoc);
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: err });
  }
});

app.post("/create", auth, upload.none(), async (req, res) => {
  const { title, content, username } = req.body;
  const userId = req.user.userId;

  console.log("this is req.user", JSON.stringify(req.user));
  try {
    const jokeDoc = await Jokes.create({
      title,
      content,
      username,
      userId,
    });
    console.log(req.body);
    console.log(jokeDoc);
    res.json(jokeDoc);
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: err });
  }
});

app.delete("/jokes/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const jokeDoc = await Jokes.findByIdAndDelete(id);
    res.json(jokeDoc);
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: err });
  }
});

app.get("/jokes/:id", auth, async (req, res) => {
  const { id } = req.params;
  console.log("this is id", id);
  try {
    const jokeDoc = await Jokes.findById(id);
    res.json(jokeDoc);
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: err });
  }
});

app.put("/jokes/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  console.log("this is id", id, content);
  try {
    const jokeDoc = await Jokes.findByIdAndUpdate(id, { content });
    res.json(jokeDoc);
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: err });
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
