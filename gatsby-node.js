const { store } = require("gatsby/dist/redux");
const { storeStaticQueries } = require("./src/static-query");
const whenQuiet = require("./src/when-quiet");

const debounceInterval = 200;

async function storeStaticQueriesFromState({ reporter, parentSpan }) {
  const activity = reporter.activityTimer(`[testing] stored static queries`, {
    parentSpan,
  });

  activity.start();

  const staticQueries = store.getState().staticQueryComponents;

  if (staticQueries && staticQueries.size) {
    await storeStaticQueries(staticQueries);
  } else if (!staticQueries) {
    reporter.error(
      `Could not find static queries in store. This might mean gatsby-plugin-testing is out of date.`
    );
  } else {
    reporter.warn(`No static queries found.`);
  }

  activity.end();
}

function watchForChanges({ reporter, parentSpan }) {
  const onQueryRun = whenQuiet(storeStaticQueriesFromState, debounceInterval);

  store.subscribe(async () => {
    if (store.getState().lastAction.type == "PAGE_QUERY_RUN") {
      onQueryRun({ reporter, parentSpan, state: store.getState() });
    }
  });
}

const isGatsbyBuild = process.env.NODE_ENV == "production";

if (isGatsbyBuild) {
  // during gatsby build, we only want to write once.
  exports.onPreBuild = storeStaticQueriesFromState;
} else {
  // during gatsby develop, onPreBuild is not available and anyway
  // we want to write every time there is a change
  exports.onPostBootstrap = watchForChanges;
}
