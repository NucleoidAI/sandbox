const map = require("../map");
const { default: axios } = require("axios");
const express = require("express");

const router = express.Router();

router.all("/:sessionId*", (req, res) => {
  const { sessionId } = req.params;
  const { method, body, url } = req;

  const session = map.get(sessionId);

  if (!session) {
    res.status(404).end();
    return;
  }

  const { openapi } = session;

  axios({
    method,
    url: `http://localhost:${openapi}/sandbox${url}`,
    data: body,
    transformResponse: (x) => x,
  })
    .then(({ headers, status, data }) =>
      res.set(headers).status(status).send(data)
    )
    .catch(({ response, message }) => {
      if (response) {
        const { headers, status, data } = response;
        res.set(headers).status(status).send(data);
      } else {
        res.status(500).json({ message });
      }
    });
});

module.exports = router;
