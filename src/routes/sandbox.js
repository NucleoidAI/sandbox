const router = require("express").Router();
const { spawn } = require("child_process");
const uuid = require("uuid").v4;
const axios = require("axios").default;

let port = 4000;
const map = {};

router.post("/", async (req, res) => {
  const id = uuid(); //.replaceAll("-", "");
  const terminal = port++;

  const nuc = spawn("nuc", ["start", "--id", id, "--port", terminal], {
    shell: true,
  });

  nuc.stdout.on("data", async () => {
    const openapi = port++;
    map[id] = openapi;

    axios
      .post(`http://localhost:${terminal}/openapi`, {
        ...req.body,
        action: "start",
        port: openapi,
        prefix: `/sandbox/${id}`,
      })
      .then(() => res.json({ id }))
      .catch((err) => res.status(500).send(err));
  });

  nuc.stderr.on("data", (data) => {
    res.status(500).send(data);
  });
});

const redirect = async (req, res) => {
  const { id } = req.params;
  const { method, body, url } = req;

  const port = map[id];

  if (!port) {
    res.status(404).end();
    return;
  }

  axios({
    method,
    url: `http://localhost:${port}${url}`,
    data: body,
  })
    .then(({ status, headers, data }) => {
      res.set(headers).status(status).send(data);
    })
    .catch((err) => {
      const { status, headers, data } = err.response;
      res.set(headers).status(status).send(data);
    });
};

router.all("/:id", redirect);
router.all("/:id/*", redirect);

module.exports = router;
