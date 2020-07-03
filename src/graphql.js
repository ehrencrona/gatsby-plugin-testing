/**
 * Mock for the graphql tag function.
 * @returns a GraphQLQuery
 */
const graphql = (strs, ...vars) => {
  let queryString = strs[0];

  for (let i = 0; i < vars.length; i++) {
    queryString = queryString + vars[i] + strs[i];
  }

  return new GraphQLQuery({
    queryString,
    componentPath: getCallingComponentPath(new Error()),
  });
};

function getCallingComponentPath(error) {
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

class GraphQLQuery {
  constructor({ queryString, componentPath }) {
    this.queryString = queryString;
    this.componentPath = componentPath;
  }
}

module.exports = graphql;
graphql.GraphQLQuery = GraphQLQuery;
