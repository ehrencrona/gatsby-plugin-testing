
/**
 * Returns the file of the code that generated the specified error.
 */
function getCallingFile(error) {
  const lineRegex = /\((.*):\d+:\d+\)/;

  const matches = error.stack
    .split("\n")
    .map((line) => line.match(lineRegex))
    .map((match) => match && match[1])
    .filter((match) => !!match);

  // line 0 is the function the error was constructed in, we want the caller on line 1
  if (matches[1]) {
    return matches[1];
  } else {
    throw new Error(`Unexpected stack trace format: ${error.stack}`);
  }
}

module.exports = { getCallingFile };
