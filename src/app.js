const express = require("express");
const cors = require("cors");
const terminal = require("./routes/terminal");
const api = require("./routes/api");
const openapi = require("./routes/openapi");
const metrics = require("./routes/metrics");
const morgan = require("morgan");

const app = express();

app.use(morgan("tiny"));
app.use(express.json());
app.use(cors());
app.use("/openapi", openapi);
app.use("/terminal", terminal);
app.use(api);
app.use(metrics);
app.use("*", (req, res) => res.status(404).end());
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => res.status(500).send(err));

module.exports = app;
