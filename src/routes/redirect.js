const map = require("../map");
const { default: axios } = require("axios");
const express = require("express");

const router = express.Router();

router.all("/", (req, res) => {
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
