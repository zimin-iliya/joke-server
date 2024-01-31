const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const JokesSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    username: String,
    author: { type: Schema.Types.ObjectId, ref: "User" },
    userId: String,
  },
  {
    timestamps: true,
  }
);

const JokesModel = mongoose.model("Jokes", JokesSchema);

module.exports = JokesModel;
