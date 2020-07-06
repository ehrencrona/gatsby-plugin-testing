# Gatsby Unit Testing Plugin

This plugin allows unit testing of Gatsby components that depend on GraphQL queries.

## The problem

Gatsby components that use data from GraphQL (which is most of them) cannot easily be unit tested. The [Gatsby documentation](https://www.gatsbyjs.org/docs/unit-testing/) suggests breaking components into two parts: a pure component without any queries and a surrounding component that only handles the query. Only the pure component can be tested.

This is not only awkward for your component code but it also makes it impossible to unit test that your components are receiving the GraphQL data they expect or that the GraphQL query is of the correct format.

## The solution

Gatsby Unit Testing Plugin stores your query data when you build your project. It will then be available to components on later test runs.

Because data is stored when you run `gatsby build` or `gatsby develop`, these are the steps to start testing:

1. Add the `gatsby-plugin-testing` to your project
2. Run `gatsby build` or `gatsby develop`
3. Run your tests

If you modify the queries of your components, you must rerun `gatsby build` since your tests will otherwise use query results that reflect the previous queries.

### Add the `gatsby-plugin-testing` to your project

To start unit testing, install the plugin using `yarn add --dev gatsby-plugin-testing` or `npm install --only=dev gatsby-plugin-testing`

Add the plugin to your `gatsby-config.js`:

```
module.exports = {
  ...
  plugins: [
    ...
    "gatsby-plugin-testing"
  ]
}
```

Then create a file called `__mocks__/gatsby.js` in your project containing a single line:

```
export * from "gatsby-plugin-testing/__mocks__/gatsby"
```

### Run gatsby build

Now run `gatsby build` or `gatsby develop` in your project. You should see

```
[gatsby-plugin-testing] stored static queries
```

somewhere in the build output. If you don't, check that you have completed all previous steps.

When running `gatsby develop`, you will see this output repeated every time your queries change.

The queries will be stored in a file `.testing-static-queries.json`. This file does not need to be checked in so you can add it to your `.gitignore`.

### Run your tests

Unit testing components with static queries should now "just work". If you have not yet set up tests in your project, configure Jest as described in [the Gatsby unit testing documentation](https://www.gatsbyjs.org/docs/unit-testing/).

You can also run your tests in watch mode. If you change a query, your tests will re-run automatically with the most recent data.

Watch mode requires leaving `gatsby develop` running. In other words, first start `gatsby develop`, then open a new terminal window and launch your tests there in watch mode.

## Static queries

No code modifications should be necessary to test components with [static queries](https://www.gatsbyjs.org/docs/static-query/). Let's look at the Image component from the Gatsby starter project:

```
() => {
  const data = useStaticQuery(graphql`
    query {
      placeholderImage: file(relativePath: { eq: "gatsby-astronaut.png" }) {
        childImageSharp {
          fluid(maxWidth: 300) {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  `)

  return <Img fluid={data.placeholderImage.childImageSharp.fluid} />
}
```

The following test will unit test this component for you

```
import React from "react"
import renderer from "react-test-renderer"
import Image from "../image"

describe("Image", () => {
  it("renders correctly", () => {
    const tree = renderer
      .create(<Image />)
      .toJSON()

      expect(tree).toMatchSnapshot()
  })
})
```

The same goes for static queries using the `StaticQuery` component.

## Page queries

Testing a [page query with variables](https://www.gatsbyjs.org/docs/page-query/#how-to-add-query-variables-to-a-page-query) involves only one additional step; you must specify which specific page you're testing.

Consider the following page rendering markdown:

```
export const query = graphql`
  query Markdown($id: String) {
    markdownRemark(id: { eq: $id }) {
      id
      frontmatter {
        title
      }
    }
  }
`

const MarkdownPage = ({data}) => {
  return (
    <Layout>
      <h1>{data.markdownRemark.frontmatter.title}</h1>
    </Layout>
  )
}
```

To write a unit test for it, import `getPageQueryData` from `gatsby-plugin-testing` and pass it to the component as query data.

It takes a single parameter, which is the path of the page you're testing. Assuming you have a `my-first-page.md` file that is displayed by the above page on the URL `/my-first-page`, the following code will render it:

```
import { getPageQueryData } from "gatsby-plugin-testing"

describe("MarkdownPage", () => {
  it("renders", async () => {
    const tree = renderer
      .create(<MarkdownPage data={await getPageQueryData("my-first-page")} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
```

Note that `getPageQueryData` is an async function so you must call `await`.

## Snapshots

For some components it may be a problem that the Graph QL data is "live". If you're testing a page displaying
the latest blog post, the test will fail every time you publish a new post.

To "freeze" the Graph QL data of your test, you can snapshot it. If you wrap a test with `withQuerySnapshot`, it
will snapshot the Graph QL data when you first run the test. On subsequent runs, the test will use the snapshotted data instead of the query results in Gatsby.

```
  import { withQuerySnapshot } from "gatsby-plugin-testing"

  it('renders', withQuerySnapshot(() => {
      ...
      expect(component).toMatchSnapshot()
    })
  )
```

This concept is similar to snapshots in Jest, except that the data serves as input to your code rather than being its output.

Beyond freezing data to make tests more stable, it also enables them to run without a `gatsby build`, which can be useful in a CI environment.

Snapshots are stored together with Jest snapshots in files called `__snapshots__/<your test name>.gql.json`.

To update the snapshots to the current data you have three options:

- delete the snapshots manually and run the tests
- set the environment variable `UPDATE_GQL` to `true` and run the tests. On Linux and Macs you'd run `UPDATE_GQL=true jest` (replace "jest" by whatever command you use to run your tests, e.g. `yarn test`).
- run tests in watch mode and press "g". This will update all GraphQL snapshots.

For snapshots to work you need to configure the following in your [Jest configuration](https://jestjs.io/docs/en/configuration). It can be found either in a file called `jest.config.js` in your project root or under the key `jest` in your `package.json`

```
  watchPathIgnorePatterns: ["\\.gql\\.json$"],
  watchPlugins: ["gatsby-plugin-testing/jest-plugin"],
```

The first line makes Jest watchers not trigger when snapshots are updated. The second line adds the "g" option to Jest when you run in watch mode.

# Contact

Problems? Suggestions? Feel free to open a Github issue or contact me at andreas.ehrencrona@velik.it
