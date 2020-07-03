const React = require("react");
const gatsby = jest.requireActual("gatsby");

const graphql = require("../src/graphql");
const { useStaticQuery, StaticQuery } = require("../src/static-query");

module.exports = {
  ...gatsby,
  graphql,
  Link: jest.fn().mockImplementation(
    // these props are invalid for an `a` tag
    ({
      activeClassName,
      activeStyle,
      getProps,
      innerRef,
      partiallyActive,
      ref,
      replace,
      to,
      ...rest
    }) =>
      React.createElement("a", {
        ...rest,
        href: to,
      })
  ),
  StaticQuery,
  useStaticQuery,
};
