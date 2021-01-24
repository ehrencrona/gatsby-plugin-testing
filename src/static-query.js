// cannot use import keyword in any file called by gatsby-node for whatever reason
const { writeFile, existsSync, readFileSync } = require("fs");
const { relative, join, sep } = require("path");
const { promisify } = require("util");
const { GraphQLQuery } = require("./graphql");
const { overrideWithSnapshotData } = require("./query-snapshot");

const asyncWriteFile = promisify(writeFile);

const staticQueryFileName = ".testing-static-queries.json";

/**
 * The mocked useStaticQuery hook. Uses the static queries stored during the build to retrieve query data.
 */
function useStaticQuery(query) {
  if (!(query instanceof GraphQLQuery)) {
    throw new Error(
      `useStaticQuery expects to be passed a graphql\`...\` object. Got: ${query}`
    );
  }

  return overrideWithSnapshotData(
    () =>
      getQueryResult(getQueryHashForComponentPath(query.componentPath)).data,
    makeRelative(query.componentPath)
  );
}

/**
 * The mocked StaticQuery component.
 */
const StaticQuery = ({ render, query }) => {
  expectQuery(query);

  const queryData = overrideWithSnapshotData(
    () =>
      getQueryResult(getQueryHashForComponentPath(query.componentPath)).data,
    makeRelative(query.componentPath)
  );

  return render(queryData);
};

async function storeStaticQueries(staticQueries) {
  await asyncWriteFile(
    staticQueryFileName,
    JSON.stringify(objectFromEntries(staticQueries))
  );
}

/**
 * This is Object.fromEntries, which is not available in Node 10
 */
function objectFromEntries(arr) {
  return Object.assign({}, ...Array.from(arr, ([k, v]) => ({ [k]: v })));
}

// unfortunately, we need this function to be synchronous, since useStaticQuery is
function readStaticQueries() {
  if (existsSync(staticQueryFileName)) {
    return JSON.parse(readFileSync(staticQueryFileName));
  } else {
    throw new Error(
      `Could not find stored static queries. Have you run \`gatsby build\` with gatsby-plugin-testing configured?`
    );
  }
}

function getQueryHashForComponentPath(componentPath) {
  const components = Object.values(readStaticQueries());
  
	// on windows, componentPath has backward slashes but the query hash forward slashes
  const normalizedPath = sep == "\\" ? componentPath.replace(/\\/g, "/") : componentPath;
  const component = components.find((c) => c.componentPath == normalizedPath);

  if (!component) {
    throw new Error(
      `While getting static query data: Did not find component ${normalizedPath}, only: ${components
        .map((c) => c.componentPath)
        .join("\n")}\nDo you need to re-run gatsby build?`
    );
  }

  return component.hash;
}

function getQueryResult(hash) {
  const queryDataFileNameLegacy = join("public", "static", "d", `${hash}.json`);
  // Gatsby ^v2.24.33
  const queryDataFileName = join("public", "page-data", "sq", "d", `${hash}.json`);

  if (existsSync(queryDataFileNameLegacy)) {
    return JSON.parse(readFileSync(queryDataFileNameLegacy));
  }
  else if (existsSync(queryDataFileName)) {
    return JSON.parse(readFileSync(queryDataFileName));
  } else {
    if (existsSync("public")) {
      throw new Error(
        `Cannot find ${queryDataFileName}. The stored query data seem to be out of sync with the build. Delete ${staticQueryFileName} and run "gatsby clean" and "gatsby build".`
      );
    } else {
      throw new Error(
        `You need to run "gatsby build" or "gatsby develop" for query data to be available.`
      );
    }
  }
}

function expectQuery(query) {
  if (!(query instanceof GraphQLQuery)) {
    throw new Error(
      `useStaticQuery expects to be passed a graphql\`...\` object. Got: ${query}`
    );
  }
}

function makeRelative(path) {
  return relative(".", path);
}

module.exports = {
  useStaticQuery,
  StaticQuery,
  storeStaticQueries,
  readStaticQueries,
};
