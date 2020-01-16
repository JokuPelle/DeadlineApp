const mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema(
    {
        "number": Number,
        "title": {type: String, required: true},
        "info": String,
        "date": { type: Date, default: Date.now()},
        "priority": { type: Number, default: 3},
        "completed": {type: Boolean, default: false},
        "x": { type: Number, default: Math.random() },
        "y": { type: Number, default: Math.random() }
    }
);

const listSchema = new mongoose.Schema(
    {
        "theid": String,
        "objects": [deadlineSchema],
        "next_id": {type: Number, default: 0}
    }
)

module.exports = {
    list: mongoose.model("List", listSchema),
    deadline: mongoose.model("Deadline", deadlineSchema)
}