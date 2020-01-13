const express = require("express");
const uuidv4 = require("uuid/v4");
const nodeMailer = require("nodemailer");
const router = express.Router();

//Models
const List = require("../models/Deadline").list;
const Deadline = require("../models/Deadline").deadline;

/*function makeid() {
    let result = "";
    let bytes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let byteslength = bytes.length;
    for (let i=0; i < 6; i++) {
        result += bytes.charAt(Math.floor(Math.random() * byteslength));
    }
    return result;
}*/

/// @route GET deadline/sendemail
// @desc  Send email
router.post("/load", (req, res) => {
    List.findOne({"theid": req.body.listid})
        .then(foundlist => {
            if (!foundlist) {
                res.status(404).json({success: false, message: "No list found by id"});
            } else {
                res.json({success: true, message: "list found!", foundlist});
            }
        })
})

// @route GET deadline/sendemail
// @desc  Send email
router.post("/sendemail", (req, res) => {
    let transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "pelle.apiservice@gmail.com",
            pass: "clownworld"
        }
    });
    let mailOptions = {
        to: "jousimies2@gmail.com",
        subject: "Test subject",
        body: "Hello there guys"
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("message %s sent: %s", info.messageId, info.response);
    });
    res.json({success: true, message: "message sent"});
})

// @route GET deadline/newlist
// @desc  Create a new list
router.post("/getlist", (req, res) => {
    List.findOne({"theid": req.body.listid})
        .then(foundlist => {
            if (foundlist) {
                res.json({success: true, foundlist});
            } else {
                res.status(404).json({success: false, message: "List not found!"});
            }
        })
});

// @route POST deadline/create
// @desc  Create a new deadline, gets list id and deadline info
router.post("/create", (req, res) => {
    let searchId;
    if (!req.body.listid) {
        console.log("No listid given");
        searchId = 0000000000;
    } else {
        searchId = req.body.listid;
    }
    List.findOne({"theid": searchId}, (err, thelist) => {
        if (err) {
            res.status(404).json({success: false, message: "Error with finding list"});
        }
        // No list found by id, create new list
        if (!thelist) {
            console.log("Let's create a new list!");
            const newList = new List({
                "theid": uuidv4()
            });
            newList.save().then(list => {
                // Add new deadline to the list
                list.updateOne({
                    $push: {"objects": new Deadline({
                        "number": list.next_id,
                        "title": req.body.title,
                        "info": req.body.info
                    })},
                    "next_id": list.next_id + 1
                }, (err, raw) => {
                    if (err) {
                        res.status(404).json({success: false, message: "Error with updating list"});
                    } else {
                        res.json({success: true, message: "New list created with post", list});
                    }
                })
            })
        // List was found
        } else {
            console.log("Let's add to an existing list");
            // Add new deadline to the list
            thelist.updateOne({
                $push: {"objects": new Deadline({
                    "number": thelist.next_id,
                    "title": req.body.title,
                    "info": req.body.info
                })},
                "next_id": thelist.next_id + 1
            }, (err, raw) => {
                if (err) {
                    res.status(404).json({success: false, message: "Error with updating list"});
                } else {
                    res.json({success: true, message: "New list created with post", thelist});
                }
            })
        }
    })
});

module.exports = router;