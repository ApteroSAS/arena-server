// the scrip that will lunch the other nodes
import { Worker } from "worker_threads";
import { Client, Room } from "colyseus.js";
import util from "util";
import blessed from "blessed";

const timer = {
  setTimeout(milliseconds: number, ...args: any) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds, ...args));
  },
};
var minimist = require("minimist");
const argv = minimist(process.argv.slice(2));
console.log(argv);
const options = {
  endpoint: argv.endpoint || process.env.ENDPOINT,
  roomName: argv.room,
  roomId: argv.roomId,
  numClients: argv.numClients || 1,
  scriptFile: argv.script || process.env.scriptFile +".js"
};

// const packageJson = import("../package.json");
const packageJson = { name: "@colyseus/loadtest" };

function displayHelpAndExit() {
  console.log(`${packageJson.name}

Options:
  --endpoint: WebSocket endpoint for all connections (default: ws://localhost:2567)
  --room: room handler name (you can also use --roomId instead to join by id)
  --roomId: room id (specify instead of --room)
  [--numClients]: number of connections to open (default is 1)
  [--delay]: delay to start each connection (in milliseconds)
  [--project]: specify a tsconfig.json file path
  [--reestablishAllDelay]: delay for closing and re-establishing all connections (in milliseconds)
  [--retryFailed]: delay to retry failed connections (in milliseconds)
  [--output]: specify an output file (default to loadtest.log)

Example:
  colyseus-loadtest example/bot.ts --endpoint ws://localhost:2567 --room state_handler`);
  process.exit();
}

//if (argv.help) { displayHelpAndExit(); }
/*
if (!options.scriptFile) {
  console.error("❌ You must specify a script file.");
  console.error("");
  displayHelpAndExit();
}
*/
if (!options.roomName && !options.roomId) {
  console.error(
    "❌ You need to specify a room with either one of the '--room' or '--roomId' options."
  );
  console.error("");
  displayHelpAndExit();
}
/*
if (options.output) {
  logWriter.create(options.output);
  logWriter.write(`@colyseus/loadtest\n${Object.keys(options)
      .filter(key => options[key])
      .map((key) => `${key}: ${options[key]}`).join('\n')}`)
}
*/
//var blessed=require("blessed");
const screen = blessed.screen({ smartCSR: true });

const headerBox = blessed.box({
  label: ` ⚔  ${packageJson.name} ⚔  `,
  top: 0,
  left: 0,
  width: "70%",
  height: "shrink",
  children: [
    blessed.text({
      top: 1,
      left: 1,
      tags: true,
      content: `{yellow-fg}endpoint:{/yellow-fg} ${options.endpoint}`,
    }),
    blessed.text({
      top: 2,
      left: 1,
      tags: true,
      content: `{yellow-fg}room:{/yellow-fg} ${
        options.roomName ?? options.roomId
      }`,
    }),
    blessed.text({
      top: 3,
      left: 1,
      tags: true,
      content: `{yellow-fg}serialization method:{/yellow-fg} ...`,
    }),
    blessed.text({
      top: 4,
      left: 1,
      tags: true,
      content: `{yellow-fg}time elapsed:{/yellow-fg} ...`,
    }),
  ],
  border: { type: "line" },
  style: {
    label: { fg: "cyan" },
    border: { fg: "green" },
  },
});

const currentStats = {
  connected: 0,
  failed: 0,
};

const totalStats = {
  connected: 0,
  failed: 0,
  errors: 0,
};

const successfulConnectionBox = blessed.text({
  top: 2,
  left: 1,
  tags: true,
  content: `{yellow-fg}connected:{/yellow-fg} ${currentStats.connected}`,
});
const failedConnectionBox = blessed.text({
  top: 3,
  left: 1,
  tags: true,
  content: `{yellow-fg}failed:{/yellow-fg} ${currentStats.failed}`,
});

const clientsBox = blessed.box({
  label: " clients ",
  left: "70%",
  width: "30%",
  height: "shrink",
  children: [
    blessed.text({
      top: 1,
      left: 1,
      tags: true,
      content: `{yellow-fg}numClients:{/yellow-fg} ${options.numClients}`,
    }),
    successfulConnectionBox,
    failedConnectionBox,
  ],
  border: { type: "line" },
  tags: true,
  style: {
    label: { fg: "cyan" },
    border: { fg: "green" },
  },
});

const processingBox = blessed.box({
  label: " processing ",
  top: 6,
  left: "70%",
  width: "30%",
  height: "shrink",
  border: { type: "line" },
  children: [
    blessed.text({
      top: 1,
      left: 1,
      tags: true,
      content: `{yellow-fg}memory:{/yellow-fg} ...`,
    }),
    blessed.text({
      top: 2,
      left: 1,
      tags: true,
      content: `{yellow-fg}cpu:{/yellow-fg} ...`,
    }),
    // blessed.text({ top: 1, left: 1, content: `memory: ${process.memoryUsage().heapUsed} / ${process.memoryUsage().heapTotal}` })
  ],
  tags: true,
  style: {
    label: { fg: "cyan" },
    border: { fg: "green" },
  },
});

const networkingBox = blessed.box({
  label: " networking ",
  top: 11,
  left: "70%",
  width: "30%",
  border: { type: "line" },
  children: [
    blessed.text({
      top: 1,
      left: 1,
      tags: true,
      content: `{yellow-fg}bytes received:{/yellow-fg} ...`,
    }),
    blessed.text({
      top: 2,
      left: 1,
      tags: true,
      content: `{yellow-fg}bytes sent:{/yellow-fg} ...`,
    }),
    // blessed.text({ top: 1, left: 1, content: `memory: ${process.memoryUsage().heapUsed} / ${process.memoryUsage().heapTotal}` })
  ],
  tags: true,
  style: {
    label: { fg: "cyan" },
    border: { fg: "green" },
  },
});

const logBox = blessed.box({
  label: " logs ",
  top: 7,
  width: "70%",
  padding: 1,
  border: { type: "line" },
  tags: true,
  style: {
    label: { fg: "cyan" },
    border: { fg: "green" },
  },
  // scroll
  scrollable: true,
  input: true,
  alwaysScroll: true,
  scrollbar: {
    style: {
      bg: "green",
    },
    track: {
      bg: "gray",
    },
  },
  keys: true,
  vi: true,
  mouse: true,
});
screen.key(["escape", "q", "C-c"], (ch, key) => beforeExit("SIGINT")); // Quit on Escape, q, or Control-C.
screen.title = "@colyseus/loadtest";
screen.append(headerBox);
screen.append(clientsBox);
screen.append(logBox);
screen.append(processingBox);
screen.append(networkingBox);
screen.render();

const log = console.log;
const warn = console.warn;
const info = console.info;
const error = console.error;

console.log = function (args) {
  logBox.content =
    args.map((arg) => util.inspect(arg)).join(" ") + "\n" + logBox.content;
  screen.render();
};
console.warn = function (args) {
  logBox.content = `{yellow-fg}${args
    .map((arg) => util.inspect(arg))
    .join(" ")}{/yellow-fg}\n${logBox.content}`;
  screen.render();
};
console.info = function (args) {
  logBox.content = `{blue-fg}${args
    .map((arg) => util.inspect(arg))
    .join(" ")}{/blue-fg}\n${logBox.content}`;
  screen.render();
};
console.error = function (args) {
  totalStats.errors++;
  logBox.content = `{red-fg}${args
    .map((arg) => util.inspect(arg))
    .join(" ")}{/red-fg}\n${logBox.content}`;
  screen.render();
};

process.on("uncaughtException", (e) => {
  error(e);
  process.exit();
});

let isExiting = false;
async function beforeExit(signal: NodeJS.Signals, closeCode: number = 0) {
  log("Writing log file...");

  if (isExiting) {
    return;
  } else {
    isExiting = true;
  }

  const hasError = closeCode > 0;

  /*await logWriter.write(`Finished. Summary:
Successful connections: ${totalStats.connected}
Failed connections: ${totalStats.failed}
Total errors: ${totalStats.errors}`, true /* closing)
*/

  process.exit(hasError ? 1 : 0);
}

// trap process signals
process.once("exit", (code) => beforeExit("SIGINT", code));
["SIGINT", "SIGTERM", "SIGUSR2"].forEach((signal) =>
  process.once(signal as NodeJS.Signals, (signal) => beforeExit(signal))
);

function formatBytes(bytes: any) {
  if (bytes < 1024) {
    return `${bytes} b`;
  } else if (bytes < Math.pow(1024, 2)) {
    return `${(bytes / 1024).toFixed(2)} kb`;
  } else if (bytes < Math.pow(1024, 4)) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}

function elapsedTime(inputSeconds: any) {
  const days = Math.floor(inputSeconds / (60 * 60 * 24));
  const hours = Math.floor((inputSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor(
    ((inputSeconds % (60 * 60 * 24)) % (60 * 60)) / 60
  );
  const seconds = Math.floor(
    ((inputSeconds % (60 * 60 * 24)) % (60 * 60)) % 60
  );

  let ddhhmmss = "";

  if (days > 0) {
    ddhhmmss += days + " day ";
  }
  if (hours > 0) {
    ddhhmmss += hours + " hour ";
  }
  if (minutes > 0) {
    ddhhmmss += minutes + " minutes ";
  }
  if (seconds > 0) {
    ddhhmmss += seconds + " seconds ";
  }

  return ddhhmmss || "...";
}

/**
 * Update memory / cpu usage
 */
const loadTestStartTime = Date.now();
let startTime = process.hrtime();
let startUsage = process.cpuUsage();
let bytesReceived: number = 0;
let bytesSent: number = 0;
setInterval(() => {
  /**
   * Program elapsed time
   */
  const elapsedTimeText = headerBox.children[3] as blessed.Widgets.TextElement;
  elapsedTimeText.content = `{yellow-fg}time elapsed:{/yellow-fg} ${elapsedTime(
    Math.round((Date.now() - loadTestStartTime) / 1000)
  )}`;

  /**
   * Memory / CPU Usage
   */
  const memoryText = processingBox.children[0] as blessed.Widgets.TextElement;
  memoryText.content = `{yellow-fg}memory:{/yellow-fg} ${(
    process.memoryUsage().heapUsed /
    1024 /
    1024
  ).toFixed(2)} MB`;

  var elapTime = process.hrtime(startTime);
  var elapUsage = process.cpuUsage(startUsage);

  var elapTimeMS = elapTime[0] * 1000 + elapTime[1] / 1000000;
  var elapUserMS = elapUsage.user / 1000;
  var elapSystMS = elapUsage.system / 1000;
  var cpuPercent = ((100 * (elapUserMS + elapSystMS)) / elapTimeMS).toFixed(1);

  const cpuText = processingBox.children[1] as blessed.Widgets.TextElement;
  cpuText.content = `{yellow-fg}cpu:{/yellow-fg} ${cpuPercent}%`;

  screen.render();

  startTime = process.hrtime();
  startUsage = process.cpuUsage();

  /**
   * Networking
   */
  const bytesReceivedBox = networkingBox
    .children[0] as blessed.Widgets.TextElement;
  bytesReceivedBox.content = `{yellow-fg}bytes received:{/yellow-fg} ${formatBytes(
    bytesReceived
  )}`;

  const bytesSentBox = networkingBox.children[1] as blessed.Widgets.TextElement;
  bytesSentBox.content = `{yellow-fg}bytes sent:{/yellow-fg} ${formatBytes(
    bytesSent
  )}`;
}, 1000);

function handleError() {
  currentStats.failed++;
  totalStats.failed++;

  failedConnectionBox.content = `{red-fg}failed:{/red-fg} ${currentStats.failed}`;
  screen.render();
}
function _useWorker(filepath: any, endpoint: string, roomName: string) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(filepath, {
      workerData: {
        endpoint: endpoint,
        roomName: roomName,
      },
    });
    //  worker.on('online', () => { console.log('Launching intensive CPU task')})

    worker.on("message", (messageFromWorker: any) => {
      if (messageFromWorker == "join") {
        currentStats.connected++;
        totalStats.connected++;
        successfulConnectionBox.content = `{yellow-fg}connected:{/yellow-fg} ${currentStats.connected}`;
      } else if (messageFromWorker == "error") {
        handleError();
      } else {
        currentStats.connected--;
        successfulConnectionBox.content = `{yellow-fg}connected:{/yellow-fg} ${currentStats.connected}`;
      }

      screen.render();
      return resolve;
    });

    /*
    worker.on("error", reject);
    worker.on("exit", (code: number) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });*/
  });
}

try {
  (async () => {
    // npm test -- --room my_name --numClients 2
    for (var i = 0; i < options.numClients; i++) {
      _useWorker(
        "./test/" + options.scriptFile,
        options.endpoint,
        options.roomName
      );
    }
  })();
} catch (error) {
  console.log("error", error);
}
