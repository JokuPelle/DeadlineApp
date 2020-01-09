const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();

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

const port = 8080;
app.listen(port, () => console.log(`server started on port ${port}`));

