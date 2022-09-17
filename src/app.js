const express = require("express");
const cors = require("cors");
const app = express();

const sandbox = require("./routes/sandbox");
const metrics = require("./routes/metrics");

app.use(express.json());
app.use(cors());
app.use("/sandbox", sandbox);
app.use("/sandbox/metrics", metrics);

module.exports = app;
