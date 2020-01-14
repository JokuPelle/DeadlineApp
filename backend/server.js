const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
require("dotenv").config({path: __dirname + "/.env"});
const app = express();

const deadlines = require("./routes/deadlines");

app.use(bodyparser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Home");
});

//Mongo Atlas
const db = require("./config/keys").mongoURI;
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log("Mongoose connected."))
    .catch(err => console.log(err));
mongoose.set('useFindAndModify', false);

//Routes
app.use("/api/deadline", deadlines);

const port = 8080;
app.listen(port, () => console.log(`server started on port ${port}`));

