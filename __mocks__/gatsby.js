const React = require("react");
const gatsby = jest.requireActual("gatsby");

import graphql from "../src/graphql";
import {  useStaticQuery, StaticQuery } from '../src/static-query'

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
