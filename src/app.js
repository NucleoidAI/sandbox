const express = require("express");
const cors = require("cors");
const app = express();

const sandbox = require("./routes/sandbox");

app.use(express.json());
app.use(cors());
app.use(sandbox);

module.exports = app;
