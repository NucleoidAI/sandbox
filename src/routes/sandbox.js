const router = require("express").Router();
const { spawn } = require("child_process");
const uuid = require("uuid").v4;
const axios = require("axios").default;
const metrics = require("./metrics");
const terminal = require("./terminal");

let count = 0;
let port = 4000;
const map = new Map();

router.use("/metrics", metrics);
router.use("/terminal", terminal);

router.post("/", async (req, res) => {
  const id = uuid();
  const terminal = port++;

  const process = spawn("nuc", ["start", "--id", id, "--port", terminal], {
    shell: true,
  });

  if (count > 10) {
    const sandbox = [...map.values()].sort((a, b) =>
      a.create > b.create ? -1 : 1
    )[0];
    const { id, process } = sandbox;

    count--;
    map.delete(id);
    process.kill();
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
        count++;
        map.set(id, { id, process, terminal, openapi, created: Date.now() });
        res.json({ id });
      })
      .catch((err) => res.status(500).send(err));
  });

  process.on("exit", (code) => {
    if (code) {
      res.status(500).json({
        message: "Problem occurred during spawning",
      });
    }
  });
});

const redirect = async (req, res) => {
  const { id } = req.params;
  const { method, body, url } = req;

  const sandbox = map.get(id);
  const { openapi } = sandbox;

  if (!sandbox) {
    res.status(404).end();
    return;
  }

  axios({
    method,
    url: `http://localhost:${openapi}${url}`,
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
