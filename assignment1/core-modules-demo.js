const os = require("os");
const path = require("path");
const fs = require("fs");

console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());

const joinedPath = path.join(__dirname, "sample-files", "folder", "file.txt");
console.log("Joined path:", joinedPath);

const demoFile = path.join(__dirname, "sample-files", "demo.txt");

async function run() {
  try {
    await fs.promises.writeFile(demoFile, "Hello from fs.promises!", "utf8");

    const content = await fs.promises.readFile(demoFile, "utf8");

    console.log("fs.promises read:", content);
  } catch (err) {
    console.log("File operation failed:", err.message);
  }
}

run();
