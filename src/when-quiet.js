/**
 * Call fn only when there have been no further calls for a certain time period.
 */
function whenQuiet(fn, debounceInterval) {
  let timer;

  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => fn(...args), debounceInterval);
  };
}

module.exports = whenQuiet
