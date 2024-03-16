#!/usr/bin/env node
require("yargs")
  .scriptName("sandbox")
  .command({
    command: "start",
    desc: "Start sandbox",
    builder: (yargs) =>
      yargs
        .option("port", {
          describe: "Set port for the sandbox",
        })
        .option("threshold", {
          describe: "Set threshold for the sandbox",
        }),
    handler: () => require("./server"),
  })
  .demandCommand()
  .argv.toString();
