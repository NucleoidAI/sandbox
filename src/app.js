const express = require("express");
const cors = require("cors");
const terminal = require("./routes/terminal");
const redirect = require("./routes/redirect");
const openapi = require("./routes/openapi");
const metrics = require("./routes/metrics");

const app = express();

app.use(express.json());
app.use(cors());
app.use("/:sessionId", terminal);
app.use("/:sessionId/openapi", openapi);
app.use("/:sessionId/*", redirect);
app.use("/metrics", metrics);
app.use("*", (req, res) => res.status(404).end());
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => res.status(500).send(err));

module.exports = app;
