#!/usr/bin/env node

//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

const { program } = require("commander");
program
  .version(require("./package.json").version)
  .description("submit code reviews with suggestions based on your diffs")
  .option("-m, --message <msg>", "use the specified message as the PR comment")
  .argument("[diff]", "the diff to create suggestions from")
  .addHelpText(
    "after",
    [
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

const suggest = require("./src/index");
if (process.stdin.isTTY) {
  const { [0]: diff } = program.parse(process.argv).args;
  if (diff) {
    suggest(diff, program.opts());
  } else {
    program.help();
  }
} else {
  let data = "";
  const stdin = process.openStdin();
  stdin.setEncoding("utf8");
  stdin.on("data", (chunk) => {
    data += chunk;
  });
  stdin.on("end", () => suggest(data, program.parse(process.argv).opts()));
}
