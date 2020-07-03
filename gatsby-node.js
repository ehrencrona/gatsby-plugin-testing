const { store } = require("gatsby/dist/redux");
const { storeStaticQueries } = require("./src/static-query");

/**
 * Store static queries on every build.
 */
exports.onPreBuild = async ({ reporter, parentSpan }) => {
  const activity = reporter.activityTimer(`[testing] stored static queries`, {
    parentSpan,
  });

  activity.start();

  const staticQueries = store.getState().staticQueryComponents;

  if (staticQueries && staticQueries.size) {
    await storeStaticQueries(staticQueries)
  } else if (!staticQueries) {
    reporter.error(
      `Could not find static queries in store. This might mean gatsby-plugin-testing is out of date.`
    );
  } else {
    reporter.warn(`No static queries found.`);
  }

  activity.end();
};
