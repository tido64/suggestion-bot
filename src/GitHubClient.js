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
 * @param {Options} [options]
 */
function makeReview(diff, options) {
  const { makeComments } = require("./makeComments");
  const comments = makeComments(diff);
  if (comments.length === 0) {
    return Promise.resolve();
  }

  const { c } = require("./Helpers");

  const { GITHUB_REPOSITORY, GITHUB_TOKEN } = process.env;
  const [owner, repo] = GITHUB_REPOSITORY.split("/");
  const review = {
    accept: "application/vnd.github.comfort-fade-preview+json",
    owner,
    repo,
    pull_number: getPullRequestNumber(),
    event: c("COMMENT"),
    comments,
  };
  return makeOctokit({ auth: GITHUB_TOKEN, ...options })
    .pulls.createReview(review)
    .catch((e) => {
      console.error(e);
      console.dir(review, { depth: null });
    });
}

module.exports["makeReview"] = makeReview;
