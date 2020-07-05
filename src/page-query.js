const { readFile, exists, readdirSync, lstat } = require("fs");
const { join } = require("path");
const { promisify } = require("util");

const asyncExists = promisify(exists);
const asyncLstat = promisify(lstat);
const asyncReadFile = promisify(readFile);

const pageDataPath = `public/page-data`;
const pageDataFileNameWithoutPath = `page-data.json`;

/**
 * Return the result of a page query run by a certain page.
 * Assumes `gatsby build` has been run before.
 * @param {*} pagePath The URL path of the page that performs the query.
 */
export async function getPageQueryData(pagePath) {
  const pageDataFileName = await getPageDataFile(pagePath);

  const pageData = JSON.parse(await asyncReadFile(pageDataFileName));

  return pageDataToQueryData(pageData, pagePath);
}

/**
 * Returns the file `gatsby build` stores the page data in.
 */
async function getPageDataFile(pagePath) {
  const pageDataFileName = join(
    pageDataPath,
    pagePath,
    pageDataFileNameWithoutPath
  );

  if (await asyncExists(pageDataFileName)) {
    return pageDataFileName;
  } else if (!(await asyncExists(pageDataPath))) {
    throw new Error(
      `gatsby-plugin-testing expected the directory ${pageDataPath} to exist, but it did not. Have you run \`gatsby build\`?`
    );
  } else {
    throw new Error(
      `The page path "${pagePath}" page query data was requested for is unknown. Known paths: ${(
        await getSubdirectories(pageDataPath)
      ).join(", ")}`
    );
  }
}

/**
 * Given the page data (that Gatsby stores for a page), return the page query data (the result of the GraphQL query).
 */
function pageDataToQueryData(pageData, pagePath) {
  const pageQueryData = pageData.result && pageData.result.data;

  if (pageQueryData) {
    return pageQueryData;
  } else if (pageData.result) {
    throw new Error(
      `The page query for ${pagePath} was not available. The query was probably invalid. Check the output of gatsby build / develop.`
    );
  } else {
    throw new Error(
      `Expected the page data for ${pagePath} to contain the key result.data, but it did not. Top-level keys: ${Object.keys(
        pageData
      )}.`
    );
  }
}

async function getSubdirectories(path) {
  const fileNames = readdirSync(path);

  return asyncFilter(fileNames, (fileName) =>
    isDirectory(join(path, fileName))
  );
}

async function asyncFilter(list, test) {
  return (
    await Promise.all(list.map(async (item) => (await test(item)) && item))
  ).filter((f) => !!f);
}

async function isDirectory(path) {
  const stat = await asyncLstat(path);

  return stat.isDirectory();
}
