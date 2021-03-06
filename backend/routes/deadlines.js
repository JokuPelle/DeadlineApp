const express = require("express");
const uuidv4 = require("uuid/v4");
const nodeMailer = require("nodemailer");
const router = express.Router();

//Models
const List = require("../models/Deadline").list;
const Deadline = require("../models/Deadline").deadline;

// @route POST deadline/verifyurl
// @desc  verify listid given in url
router.post("/verifyurl", (req, res) => {
    List.findOne({"theid": req.body.urlid}, (err, foundlist) => {
        if (err) {
            res.status(500).json({success: false, message: "error in find"})
        } else if (!foundlist) {
            res.status(404).json({success: false, message: "couldnt find list"})
        } else {
            res.json({success: true, message: "id matched existing list"})
        }
    })
})

// @route POST deadline/delete
// @desc  delete deadline, needs listid, number
router.post("/delete", (req, res) => {
    List.updateOne({"theid": req.body.listid}, {
        $pull: {
            objects: { number: req.body.number }
        }
    }, (err) => {
        if (err) {
            console.log(err);
            res.json({success: false, message: "couldnt delete"})
        } else {
            res.json({success: true, message: "deleted!"});
        }
    })
})

// @route POST deadline/complete
// @desc  toggle deadline completion needs listid, completed, number
router.post("/complete", (req, res) => {
    List.updateOne({"theid": req.body.listid, "objects.number": req.body.number}, {
        $set: {
            "objects.$.completed": req.body.completed
        }
    }, (err) => {
        if (err) {
            console.log(err);
            res.json({success: false, message: "couldnt change completion"})
        } else {
            res.json({success: true, message: "completed/uncompleted"});
        }
    })
})

// @route POST deadline/update
// @desc  update deadline, needs listid, number, title, info, priority, date
router.post("/update", (req, res) => {
    List.updateOne({"theid": req.body.listid, "objects.number": req.body.number}, {
        $set: {
            "objects.$.title": req.body.title,
            "objects.$.info": req.body.info,
            "objects.$.priority": req.body.priority,
            "objects.$.date": req.body.date,
            "objects.$.x": req.body.x,
            "objects.$.y": req.body.y
        }
    }, (err) => {
        if (err) {
            console.log(err);
            res.json({success: false, message: "couldnt update"})
        } else {
            res.json({success: true, message: "updated!"});
        }
    })
})

// @route POST deadline/newid
// @desc  create a new id for the list, needs listid
router.post("/newid", (req, res) => {
    List.findOne({"theid": req.body.listid})
        .then(foundlist => {
            if (!foundlist) {
                res.status(404).json({success: false, message: "No list found by id"});
            // Making a new id for list
            } else {
                const newid = uuidv4();
                foundlist.updateOne({
                    "theid": newid
                }, (err, raw) => {
                    if (err) {
                        res.status(404).json({success: false, message: "Error with updating list id"});
                    } else {
                        res.json({success: true, message: "List id was updated", newId: newid});
                    }
                })
            }
        })
})

// @route POST deadline/load
// @desc  load list, maybe later through cookie, needs listid
router.post("/load", (req, res) => {
    let loadbatch = 0;
    if (req.body.loadbatch) loadbatch = req.body.loadbatch;
    List.findOne({"theid": req.body.listid})
        .then(foundlist => {
            if (!foundlist) {
                res.status(404).json({success: false, message: "No list found by id"});
            } else {
                if (req.body.sortbydate) {
                    res.json({
                        success: true,
                        message: "list found!",
                        listid: foundlist.theid,
                        objects: foundlist.objects.sort(function(a, b){
                            return(a.date - b.date)}).slice(loadbatch,loadbatch+40)});
                } else {
                    res.json({
                        success: true,
                        message: "list found!",
                        listid: foundlist.theid,
                        objects: foundlist.objects.sort(function(a, b) {
                            return(a.priority - b.priority)}).slice(loadbatch,loadbatch+40)});
                }
            }
        })
})

// @route POST deadline/sendemail
// @desc  Send email, needs email, listid
router.post("/sendemail", (req, res) => {
    console.log("lets send email");
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
        subject: "Your QuickList id",
        text: `Hello there!\n
        Your Quicklist list id is ${req.body.listid}\n
        You can either copy and paste this id to your login page or you can also login to your list with this link:\n
        https://qlist.ddns.net/${req.body.listid}`
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (error) {
            console.log(error);
            res.status(404).json({success: false, message: "Failed to send message"});
        } else {
            console.log("message %s sent: %s", info.messageId, info.response);
            res.json({success: true, message: "message sent"});
        }
    });
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
                "theid": req.body.listid
            });
            newList.save().then(list => {
                // Add new deadline to the list
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