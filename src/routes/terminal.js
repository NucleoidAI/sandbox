const express = require("express");
const map = require("../map");

const axios = require("axios").default;
const nucleoid = require("../nucleoid");
const port = require("../port");

const router = express.Router();

router.post("/:sessionId", express.text({ type: "*/*" }), async (req, res) => {
  const { sessionId } = req.params;
  const { body } = req;

  const session = map.get(sessionId);

  let terminal;

  if (!session) {
    terminal = port.inc();
    await nucleoid.start(sessionId, { terminal });
  } else {
    terminal = session.terminal;
  }

  axios
    .post(`http://localhost:${terminal}`, body, {
      headers: req.headers,
    })
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

router.all("/:sessionId/*", (req, res) => {
  const { sessionId } = req.params;
  const { method, body, url } = req;

  const instance = map.get(sessionId);

  if (!instance) {
    res.status(404).end();
    return;
  }

  const { terminal } = instance;

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
