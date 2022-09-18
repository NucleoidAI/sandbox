const express = require("express");
const map = require("../map");
const router = express.Router();
const { post } = require("axios").default;

router.post("/:id", (req, res) => {
  const { id } = req.params;
  const { body } = req;

  const sandbox = map.get(id);

  if (!sandbox) {
    res.status(404).end();
    return;
  }

  const { terminal } = sandbox;

  post(`http://localhost:${terminal}`, body)
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
