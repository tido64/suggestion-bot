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
function makeOctokit(options) {
  const { Octokit } = require("@octokit/rest");
  return new Octokit(options);
}

/**
 * Submits a code review with suggestions with specified diff and options.
 * @param {string} diff
 * @param {Options?} options
 */
function makeReview(diff, options) {
  const parse = require("parse-diff");
  const files = parse(diff);
  if (files.length <= 0) {
    return Promise.resolve();
  }

  const comments = files.reduce((comments, file) => {
    const { chunks, to } = file;
    if (chunks.length === 0) {
      return comments;
    }
    return chunks.reduce((comments, chunk) => {
      comments.push(makeComment(to, chunk));
      return comments;
    }, comments);
  }, []);
  if (comments.length === 0) {
    return Promise.resolve();
  }

  const { GITHUB_REPOSITORY, GITHUB_TOKEN } = process.env;
  const [owner, repo] = GITHUB_REPOSITORY.split("/");
  const review = {
    accept: "application/vnd.github.comfort-fade-preview+json",
    owner,
    repo,
    pull_number: getPullRequestNumber(),
    event: "COMMENT",
    comments,
  };
  return makeOctokit({ auth: GITHUB_TOKEN, ...options })
    .pulls.createReview(review)
    .catch((e) => {
      console.error(e);
      console.dir(review, undefined, { depth: null });
    });
}

module.exports = {
  makeComment,
  makeReview,
};
