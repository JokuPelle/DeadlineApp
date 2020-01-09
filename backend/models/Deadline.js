const mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema(
    {
        "number": Number,
        "title": {type: String, required: true},
        "info": String,
        "date": { type: Date, default: Date.now()},
        "severity": {type: Number, required: true, default: 3}
    }
);

const listSchema = new mongoose.Schema(
    {
        "theid": String,
        "objects": [deadlineSchema]
    }
)

module.exports = {
    list: mongoose.model("List", listSchema),
    deadline: mongoose.model("Deadline", deadlineSchema)
}