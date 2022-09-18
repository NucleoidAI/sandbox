const router = require("express").Router();
const { spawn } = require("child_process");
const uuid = require("uuid").v4;
const axios = require("axios").default;
const metrics = require("./metrics");
const terminal = require("./terminal");
const map = require("../map");
const express = require("express");

let port = process.env.SANDBOX;
const limit = process.env.LIMIT;
let count = 0;

router.use("/metrics", metrics);
router.use("/terminal", express.text({ type: "*/*" }), terminal);

router.post("/", (req, res) => {
  const id = uuid();
  const terminal = port++;

  const process = spawn("nuc", ["start", "--id", id, "--port", terminal], {
    detached: true,
  });

  if (count > limit) {
    const sandbox = [...map.values()].sort((a, b) =>
      a.create > b.create ? -1 : 1
    )[0];
    const { id, process } = sandbox;

    count--;
    map.delete(id);
    console.log(`Stop process with ${id}`);
    process.kill("SIGKILL");
  }

  process.stdout.on("data", async () => {
    const openapi = port++;

    axios
      .post(`http://localhost:${terminal}/openapi`, {
        ...req.body,
        action: "start",
        port: openapi,
        prefix: `/sandbox/${id}`,
      })
      .then(() => {
        console.log(
          `Start process with ${id} - terminal: ${terminal}, openapi: ${openapi}`
        );
        count++;
        map.set(id, { id, process, terminal, openapi, created: Date.now() });
        res.json({ id });
      })
      .catch((err) => res.status(500).send(err));
  });

  process.on("exit", (code) => {
    if (code && !res.writableEnded) {
      res.status(500).json({
        message: "Problem occurred during spawning",
      });
    }
  });
});

router.all("/:id*", async (req, res) => {
  const { id } = req.params;
  const { method, body, url } = req;

  const sandbox = map.get(id);

  if (!sandbox) {
    res.status(404).end();
    return;
  }

  const { openapi } = sandbox;

  axios({
    method,
    url: `http://localhost:${openapi}/sandbox${url}`,
    data: body,
  })
    .then(({ status, headers, data }) =>
      res.set(headers).status(status).send(data)
    )
    .catch((err) => {
      if (err.response) {
        const { status, headers, data } = err.response;
        res.set(headers).status(status).send(data);
      } else {
        res.status(500).json({
          message: err.message,
        });
      }
    });
});

module.exports = router;
