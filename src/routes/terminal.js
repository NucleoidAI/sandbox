const express = require("express");
const map = require("../map");
const router = express.Router();
const axios = require("axios").default;
const nucleoid = require("../nucleoid");
const port = require("../port");

router.post("/:id", express.text({ type: "*/*" }), async (req, res) => {
  const { id } = req.params;
  const { body } = req;

  const sandbox = map.get(id);

  let terminal;

  if (!sandbox) {
    terminal = port.inc();
    await nucleoid.start(id, { terminal });
  } else {
    terminal = sandbox.terminal;
  }

  axios
    .post(`http://localhost:${terminal}`, body)
    .then(({ status, headers, data }) =>
      res.set(headers).status(status).send(data)
    )
    .catch((err) => {
      if (err.response) {
        const { headers, status, data } = err.response;
        res.set(headers).status(status).send(data);
      } else {
        res.status(500).json({
          message: err.message,
        });
      }
    });
});

router.all("/:id/*", (req, res) => {
  const { id } = req.params;
  const { method, body, url } = req;

  const sandbox = map.get(id);

  if (!sandbox) {
    res.status(404).end();
    return;
  }

  const { terminal } = sandbox;

  axios({
    method,
    url: `http://localhost:${terminal}/${url
      .substring(1)
      .split("/")
      .slice(1)
      .join("/")}`,
    data: body,
  })
    .then(({ headers, status, data }) =>
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
