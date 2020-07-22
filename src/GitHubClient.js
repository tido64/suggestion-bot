//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

/** @typedef {{ auth: string; }} Options */

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
  const context = Math.max(
    changes.findIndex((line) => line.type !== "normal"),
    0
  );
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
        .slice(context, changes.length - context)
        .filter((line) => line.type !== "del")
        .map((line) => line.content.slice(1))
        .join("\n"),
      "```",
      "",
    ].join("\n"),
  };
}

/**
 * Creates an Octokit instance.
 * @param {Options} options
 * @returns {import("@octokit/rest").Octokit}
 */
function makeGitHubClient(options) {
  const { Octokit } = require("@octokit/rest");
  return new Octokit(options);
}

/**
 * Submits a code review with suggestions with specified diff and client.
 * @param {string} diff
 * @param {(options: Options) => import("@octokit/rest").Octokit} makeClient
 */
function makeReview(diff, makeClient = makeGitHubClient) {
  const parse = require("parse-diff");
  const files = parse(diff);
  if (files.length <= 0) {
    return process.exit(0);
  }

  const { GITHUB_REPOSITORY, GITHUB_TOKEN } = process.env;

  const octokit = makeClient({ auth: GITHUB_TOKEN });

  const [owner, repo] = GITHUB_REPOSITORY.split("/");
  const review = {
    accept: "application/vnd.github.comfort-fade-preview+json",
    owner,
    repo,
    pull_number: makeClient === makeGitHubClient ? getPullRequestNumber() : 0,
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

module.exports = {
  makeComment,
  makeReview,
};
