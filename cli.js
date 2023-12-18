#!/usr/bin/env node

//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

const path = require("node:path");
const { parseArgs } = require("node:util");

function printHelp() {
  console.log(
    [
      `Usage: ${path.basename(__filename)} [options] [diff]`,
      "",
      "Submit code reviews with suggestions based on your diffs",
      "",
      "Arguments:",
      "  diff                 the diff to create suggestions from",
      "",
      "Options:",
      "  -h, --help           display help for command",
      "  -v, --version        output the version number",
      "  -m, --message <msg>  use the specified message as the PR comment",
      "  -f, --fail           fail if comments could not be posted",
      "",
      "Examples:",
      "  # Submit current changes as suggestions",
      '  GITHUB_TOKEN=<secret> suggestion-bot "$(git diff)"',
      "",
      "  # Alternatively, pipe to suggestion-bot",
      "  # to avoid escape character issues",
      "  git diff | GITHUB_TOKEN=<secret> suggestion-bot",
      "",
      "If your CI is hosted by Azure DevOps, replace `GITHUB_TOKEN` with `AZURE_PERSONAL_ACCESS_TOKEN`.",
    ].join("\n")
  );
}

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    help: {
      type: "boolean",
      short: "h",
    },
    version: {
      type: "boolean",
      short: "v",
    },
    message: {
      type: "string",
      short: "m",
    },
    fail: {
      type: "boolean",
      short: "f",
    },
  },
  allowPositionals: true,
});

if (values.help) {
  printHelp();
} else if (values.version) {
  const { name, version } = require("./package.json");
  console.log(name, version);
} else {
  const suggest = require("./src/index");
  if (process.stdin.isTTY) {
    const diff = positionals[0];
    if (diff) {
      suggest(diff, values);
    } else {
      printHelp();
    }
  } else {
    let data = "";
    const stdin = process.openStdin();
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    stdin.on("end", () => suggest(data, values));
  }
}
