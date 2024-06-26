const { spawn } = require("child_process");
const map = require("./map");

const THRESHOLD = process.env.THRESHOLD;

function start(id, { terminal } = { terminal: 8448 }) {
  return new Promise((resolve, reject) => {
    const process = spawn(
      "nuc",
      ["start", "--silence", "--id", id, "--terminal-port", terminal],
      {
        detached: true, // Use "shell" for Windows
      }
    );

    if (map.get(id)) {
      throw new Error(`Process with ${id} already exists`);
    }

    const instance = { id, process, terminal, created: Date.now() };
    map.set(id, instance);

    process.stdout.on("data", () => {
      console.log(
        `Process with ${id} is started with terminal port ${terminal}`
      );
      resolve(instance);
    });

    process.on("error", () => {
      console.error(`There is an error while spawning for ${id}`);
      reject("Problem occurred during spawning");
    });

    setImmediate(() => {
      if (map.size > THRESHOLD) {
        const first = [...map.values()].sort((a, b) =>
          a.created > b.created ? -1 : 1
        )[0];

        stop(first);
      }
    });

    setTimeout(() => {
      if (!process.killed) {
        map.delete(id);
        console.log(`Stop process with ${id} by scheduler`);
        process.kill("SIGKILL");
      }
    }, 10 * 60 * 1000);
  });
}

function stop({ id, process }) {
  map.delete(id);
  console.log(`Stop process with ${id} due to threshold`);
  process.kill("SIGKILL");
}

module.exports = { start, stop };
