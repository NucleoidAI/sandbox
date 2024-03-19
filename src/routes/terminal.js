const express = require("express");
const map = require("../map");

const axios = require("axios").default;
const nucleoid = require("../nucleoid");
const port = require("../port");

const router = express.Router();

router.post("/:sessionId", express.text({ type: "*/*" }), async (req, res) => {
  const { sessionId } = req.params;
  const { body } = req;

  const sandbox = map.get(sessionId);

  let terminal;

  if (!sandbox) {
    terminal = port.inc();
    await nucleoid.start(sessionId, { terminal });
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

module.exports = router;
