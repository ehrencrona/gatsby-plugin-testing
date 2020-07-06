const { getCallingFile } = require("./stack-util");

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
    componentPath: getCallingFile(new Error()),
  });
};

class GraphQLQuery {
  constructor({ queryString, componentPath }) {
    this.queryString = queryString;
    this.componentPath = componentPath;
  }
}

module.exports = graphql;
graphql.GraphQLQuery = GraphQLQuery;
