const express = require("express");
const uuidv4 = require("uuid/v4");
const nodeMailer = require("nodemailer");
const router = express.Router();

//Models
const List = require("../models/Deadline").list;
const Deadline = require("../models/Deadline").deadline;

// @route POST deadline/load
// @desc  load list, maybe later through cookie, needs listid
router.post("/load", (req, res) => {
    List.findOne({"theid": req.body.listid})
        .then(foundlist => {
            if (!foundlist) {
                res.status(404).json({success: false, message: "No list found by id"});
            } else {
                if (req.body.sortbydate) {
                    res.json({success: true, message: "list found!", listid: foundlist.theid, objects: foundlist.objects.sort(function(a, b){return(a.date - b.date)}).slice(0,3)});
                } else {
                    res.json({success: true, message: "list found!", listid: foundlist.theid, objects: foundlist.objects});
                }
                //foundlist.objects.sort("number");
            }
        })
})

// @route POST deadline/sendemail
// @desc  Send email, needs email, listid
router.post("/sendemail", (req, res) => {
    let transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.AUTH_USER,
            pass: process.env.AUTH_PASS
        }
    });
    let mailOptions = {
        to: req.body.email,
        subject: "Your list id",
        text: `Hello there user!\n
        Your deadline list id is ${req.body.listid}\n
        You can also go to your list with this link:\n
        ${req.body.listid}`
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("message %s sent: %s", info.messageId, info.response);
    });
    res.json({success: true, message: "message sent"});
})

// @route POST deadline/create
// @desc  Create a new deadline, needs listid, title, info, severity, date
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
                console.log(req.body.priority);
                list.updateOne({
                    $push: {"objects": new Deadline({
                        "number": list.next_id,
                        "title": req.body.title,
                        "info": req.body.info,
                        "priority": req.body.priority,
                        "date":req.body.date
                    })},
                    "next_id": list.next_id + 1
                }, (err, raw) => {
                    if (err) {
                        res.status(404).json({success: false, message: "Error with updating list"});
                    } else {
                        res.json({success: true, message: "New list created with post", newId: newList.theid});
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
                    "info": req.body.info,
                    "priority": req.body.priority,
                    "date":req.body.date
                })},
                "next_id": thelist.next_id + 1
            }, (err, raw) => {
                if (err) {
                    res.status(404).json({success: false, message: "Error with updating list"});
                } else {
                    res.json({success: true, message: "List was updated"});
                }
            })
        }
    })
});

module.exports = router;