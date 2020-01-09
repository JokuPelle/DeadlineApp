const express = require("express");
const router = express.Router();

//Models
const List = require("../models/Deadline").list;
const Deadline = require("../models/Deadline").deadline;

function makeid() {
    let result = "";
    let bytes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let byteslength = bytes.length;
    for (let i=0; i < 6; i++) {
        result += bytes.charAt(Math.floor(Math.random() * byteslength));
    }
    return result;
}

// @route GET deadline/newlist
// @desc  Create a new list
router.get("/newlist", (req, res) => {
    let newid = makeid();
    List.findOne({"theid": newid})
        .then(foundlist => {
            if (foundlist) {
                console.log("same list found! Shit!");
                res.json({success: false});
            } else {
                console.log("no same list! Great!");
                const newList = new List({
                    "theid": newid
                });
                newList.save().then(list => res.json({success: true, list}));
            }
        })
});

// @route POST deadline/create
// @desc  Create a new deadline, gets list id and deadline info
router.post("/create", (req, res) => {
    const newdeadline = new Deadline({
        "title": req.body.title,
        "info": req.body.info
    });
    List.findOneAndUpdate({"theid": req.body.listid}, {$push: {"objects": newdeadline}})
        .then(() => res.json({success: true}));
})
module.exports = router;