const { writeFile, readFile } = require("fs");
const { promisify } = require("util");
const path = require("path");
const chalk = require("chalk");
const { mkdirSync } = require("fs");

const asyncWriteFile = promisify(writeFile);
const asyncReadFile = promisify(readFile);

/**
 * Null outside tests, otherwise an object with these keys
 *   isWithSnapshot: Does the current spec use withQuerySnapshot?
 *   snapshot: The content of the current snapshot or undefined if not yet read.
 *   snapshotChanges: Changes that should be written to the snapshot.
 *   snapshotAccesses: Which keys of the snapshot have been accessed.
 *   spec: The current test spec
 */
let current;

const snapsEnvVar = "UPDATE_GQL";

let shouldUpdate =
  process.env[snapsEnvVar] && process.env[snapsEnvVar] != "false";

if (typeof jasmine != "undefined") {
  jasmine.getEnv().addReporter({
    specStarted,
    specDone,
    suiteStarted,
    suiteDone,
  });
}

/** Wrap around a test to use Graph QL snapshots, e.g.
 * 
 * ```
  it('renders', withQuerySnapshot(() => {
      ...
      expect(component).toMatchSnapshot()
    })
  )
  ```
 * This will store the Graph QL data the test requires so that it is available even without running Gatsby.
 */
function withQuerySnapshot(testFn) {
  return async () => {
    current.isWithSnapshot = true;

    if (!current.snapshot) {
      current.snapshot = await readSnapshot(getSnapshotFile(getCurrentSpec()));
      current.snapshotChanges = {};
      current.snapshotAccesses = {};
    }

    await testFn();
  };
}

/**
 * Fetches Graph QL data from a snapshot, if available, or otherwise fetches it from provided fetcher.
 * @param {*} getQueryData Method that can retrieve the Graph QL data. If async, then the whole function is anync. If not, neither is the function.
 * @param {*} key Cache key to store the data under in the snapshot
 */
function overrideWithSnapshotData(getQueryData, key) {
  key = getCurrentSpec(true)?.fullName + ": " + key;

  let queryData;

  if (current && current.isWithSnapshot) {
    queryData = current.snapshot[key];
    current.snapshotAccesses[key] = true;

    if (!queryData || shouldUpdate) {
      try {
        queryData = getQueryData();
      } catch (e) {
        if (queryData) {
          warn(
            `[gatsby-plugin-testing] could not refresh snapshot: ${e.message}`
          );
        } else {
          throw e;
        }
      }

      queryData = after((queryData) => {
        if (
          (!current.snapshot[key] && queryData) ||
          (shouldUpdate && !deepEquals(queryData, current.snapshot[key]))
        ) {
          current.snapshotChanges[key] = queryData;
        }
      }, queryData);
    }
  } else {
    queryData = getQueryData();
  }

  return queryData;
}

/**
 * Toggle whether to force update of snapshots (note that snapshots are always updated if detected to be out-of-date).
 */
function setUpdateSnapshots(update) {
  process.env[snapsEnvVar] = update ? "update" : undefined;
  shouldUpdate = update;
}

function specStarted(spec) {
  current.spec = spec;
}

function specDone() {
  current.isWithSnapshot = false;
}

function suiteStarted(currentSpec) {
  current = {
    isWithSnapshot: false,
    snapshot: undefined,
    snapshotChanges: undefined,
    snapshotAccesses: undefined,
    spec: currentSpec,
  };
}

function suiteDone(currentSpec) {
  if (current && current.snapshot && hasSnapshotChanged()) {
    const snapshotFile = getSnapshotFile(currentSpec);

    writeSnapshot(
      onlyKeysIn(
        { ...current.snapshot, ...current.snapshotChanges },
        current.snapshotAccesses
      ),
      snapshotFile
    );
  }

  current = null;
}

function hasSnapshotChanged() {
  return (
    current.snapshot &&
    (!isObjectEmpty(current.snapshotChanges) ||
      Object.keys(current.snapshotAccesses).length <
        Object.keys(current.snapshot).length)
  );
}

function getSnapshotFile(currentSpec) {
  let file = currentSpec.testPath + ".gql.json";

  const els = file.split(path.sep);

  const dir = [...els.slice(0, els.length - 1), "__snapshots__"].join(path.sep);
  const fileName = els[els.length - 1];

  mkdirSync(dir, { recursive: true });

  return path.join(dir, fileName);
}

async function readSnapshot(testFile) {
  try {
    return JSON.parse(await asyncReadFile(testFile));
  } catch (e) {
    return {};
  }
}

async function writeSnapshot(snapshot, testFile) {
  try {
    await asyncWriteFile(testFile, JSON.stringify(snapshot));

    log(`Updated Graph QL snapshot.`);
  } catch (e) {
    warn(
      `[gatsby-plugin-testing] Failed to write GraphQL snapshot ${testFile}: ${e.message}`
    );
  }
}

function getCurrentSpec(allowEmptyResult) {
  if (!current && !allowEmptyResult) {
    throw new Error(`You seem to be using withQuerySnapshot outside a test.`);
  }

  return current?.spec;
}

function after(fn, valueOrPromise) {
  if (valueOrPromise.then) {
    return valueOrPromise.then((value) => {
      fn(value);
      return value;
    });
  } else {
    fn(valueOrPromise);
    return valueOrPromise;
  }
}

function isObjectEmpty(o) {
  return Object.keys(o).length == 0;
}

function deepEquals(o1, o2) {
  return JSON.stringify(o1) == JSON.stringify(o2);
}

function onlyKeysIn(o1, o2) {
  const result = {};

  for (const key of Object.keys(o2)) {
    result[key] = o1[key];
  }

  return result;
}

function log(str) {
  // when running in jest, the console is wrapped (with a CustomConsole).
  // to avoid jest adding a stacktrace and other stuff we don't want to print,
  // try to access the naked stderr instead.
  if (console._stderr && console._stderr.write) {
    console._stderr.write(chalk.dim(`[gatsby-plugin-testing] ${str}\n`));
  } else {
    console.log(chalk.dim(str));
  }
}

function warn(str) {
  // when running in jest, the console is wrapped (with a CustomConsole).
  // to avoid jest adding a stacktrace and other stuff we don't want to print,
  // try to access the naked stderr instead.
  if (console._stderr && console._stderr.write) {
    console._stderr.write(`[gatsby-plugin-testing] ${chalk.bold.red(str)}\n`);
  } else {
    console.warn(chalk.bold.red(str));
  }
}

module.exports = {
  withQuerySnapshot,
  overrideWithSnapshotData,
  setUpdateSnapshots,
};
