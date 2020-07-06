const { setUpdateSnapshots } = require("./query-snapshot");

/**
 * Jest watch plugin that allows for forcing update of GraphQL snapshots during watching.
 * Must be manually configured in the project's Jest config using
 * `watchPlugins: ["gatsby-plugin-testing/jest-plugin"]`
 */
class GatsbyTestingJestPlugin {
  apply(jestHooks) {
    jestHooks.onTestRunComplete(() => {
      setUpdateSnapshots(false);
    });
  }

  getUsageInfo() {
    return {
      key: "g",
      prompt: "update GraphQL snapshots",
    };
  }

  async run() {
    setUpdateSnapshots(true);

    return true;
  }
}

module.exports = GatsbyTestingJestPlugin;
