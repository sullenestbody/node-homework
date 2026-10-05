const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "sample-files", "sample.txt");

// Create sample.txt programmatically
fs.writeFile(filePath, "Hello, async world!", "utf8", (err) => {
  if (err) {
    console.log("File write failed:", err.message);
    return;
  }

  // 1. Callback style
  fs.readFile(filePath, "utf8", (err, content) => {
    if (err) {
      console.log("File read failed:", err.message);
      return;
    }

    console.log("Callback:", content);

    runPromiseExample();
  });
});

/*
Callback hell happens when several asynchronous callbacks are nested
inside each other. This can make code difficult to read and maintain.

Example:

fs.readFile("file1.txt", "utf8", (err, data1) => {
  fs.readFile("file2.txt", "utf8", (err, data2) => {
    fs.readFile("file3.txt", "utf8", (err, data3) => {
      console.log(data1, data2, data3);
    });
  });
});
*/

// Convert callback-based fs.readFile into a Promise
function readFilePromise(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (err, content) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(content);
    });
  });
}

// 2. Promise style
function runPromiseExample() {
  readFilePromise(filePath)
    .then((content) => {
      console.log("Promise:", content);
      runAsyncAwaitExample();
    })
    .catch((err) => {
      console.log("Promise read failed:", err.message);
    });
}

// 3. Async/await style
async function runAsyncAwaitExample() {
  try {
    const content = await readFilePromise(filePath);
    console.log("Async/Await:", content);
  } catch (err) {
    console.log("Async/await read failed:", err.message);
  }
}
