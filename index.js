//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

/**
 * Returns the pull request number of the current build.
 * @returns {number}
 */
function getPullRequestNumber() {
  const fs = require("fs");
  const e = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  return e.pull_request.number;
}

/**
 * Creates a comment that can be submitted to GitHub.
 * @param {string} file
 * @param {{
     changes: ({ type: "add" | "del" | "normal"; content: string; })[];
     oldStart: number;
     oldLines: number;
   }} chunk
 * @returns {{
     path: string;
     line: number;
     side: "LEFT" | "RIGHT";
     start_line?: number;
     start_side?: "LEFT" | "RIGHT";
     body: string;
   }}
 */
function makeComment(file, { changes, oldStart, oldLines }) {
  const context =
    changes.reduce(
      (count, line) => (line.type === "normal" ? count + 1 : count),
      0
    ) / 2;
  const line = oldStart + oldLines - context - 1;
  const startLine = oldStart + context;
  return {
    path: file,
    line,
    side: "RIGHT",
    ...(startLine !== line
      ? {
          start_line: startLine,
          start_side: "RIGHT",
        }
      : undefined),
    body: [
      "```suggestion",
      changes
        .filter((line) => line.type === "add")
        .map((line) => line.content.slice(1))
        .join("\n"),
      "```",
      "",
    ].join("\n"),
  };
}

/**
 * Submits a code review with suggestions with specified diff.
 * @param {string} diff
 */
function suggest(diff) {
  const parse = require("parse-diff");
  const files = parse(diff);
  if (files.length <= 0) {
    return process.exit(0);
  }

  const { GITHUB_REPOSITORY, GITHUB_TOKEN } = process.env;

  const { Octokit } = require("@octokit/rest");
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  const [owner, repo] = GITHUB_REPOSITORY.split("/");
  const review = {
    accept: "application/vnd.github.comfort-fade-preview+json",
    owner,
    repo,
    pull_number: getPullRequestNumber(),
    event: "COMMENT",
    comments: files.reduce((comments, file) => {
      const { chunks, to } = file;
      return chunks.reduce((comments, chunk) => {
        comments.push(makeComment(to, chunk));
        return comments;
      }, comments);
    }, []),
  };
  octokit.pulls.createReview(review).catch((e) => {
    console.error(e);
    console.dir(review, undefined, { depth: null });
    return process.exit(1);
  });
}

module.exports = suggest;
