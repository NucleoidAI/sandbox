const express = require("express");
const cors = require("cors");
const terminal = require("./routes/terminal");
const redirect = require("./routes/redirect");
const openapi = require("./routes/openapi");
const metrics = require("./routes/metrics");

const app = express();

app.use(express.json());
app.use(cors());
app.use(openapi);
app.use(terminal);
app.use(redirect);
app.use(metrics);
app.use("*", (req, res) => res.status(404).end());
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => res.status(500).send(err));

module.exports = app;
