const router = require("express").Router();
const { spawn } = require("child_process");
const uuid = require("uuid").v4;
const axios = require("axios").default;
const metrics = require("./metrics");
const terminal = require("./terminal");
const map = require("../map");

let port = process.env.SANDBOX;
const threshold = process.env.THRESHOLD;

router.use("/metrics", metrics);
router.use("/terminal", terminal);

router.post("/", (req, res) => {
  const id = uuid();
  const terminal = port++;

  const process = spawn("nuc", ["start", "--id", id, "--port", terminal], {
    detached: true,
  });

  if (map.size > threshold) {
    const sandbox = [...map.values()].sort((a, b) =>
      a.create > b.create ? -1 : 1
    )[0];
    const { id, process } = sandbox;

    map.delete(id);
    console.log(`Stop process with ${id} due to threshold`);
    process.kill("SIGKILL");
  }

  process.stdout.on("data", () => {
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
        map.set(id, { id, process, terminal, openapi, created: Date.now() });
        res.json({ id });

        setTimeout(() => {
          if (!process.killed) {
            map.delete(id);
            console.log(`Stop process with ${id} by scheduler`);
            process.kill("SIGKILL");
          }
        }, 10 * 60 * 1000);
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

router.all("/:id*", (req, res) => {
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
    transformResponse: (x) => x,
  })
    .then(({ headers, status, data }) =>
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
