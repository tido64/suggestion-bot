//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// @ts-check

/** @typedef {{ auth: string; }} Options */

/**
 * Returns the pull request number of the current build.
 * @param {string} eventPath Path of the file with the complete webhook event payload.
 * @returns {number}
 */
function getPullRequestNumber(eventPath) {
  const fs = require("fs");
  const e = JSON.parse(fs.readFileSync(eventPath, "utf8"));
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
 * Trims comment for fields not defined in DraftPullRequestReviewThread.
 *
 * GitHub type checks the payload sent to it and fails the request if there are
 * unknown fields.
 *
 * @param {import("./makeComments").Comment} comment
 * @returns {Omit<import("./makeComments").Comment, "line_length">}
 */
// eslint-disable-next-line no-unused-vars
function trimComment({ line_length, ...rest }) {
  return rest;
}

/**
 * Submits a code review with suggestions with specified diff and options.
 * @param {string} diff
 * @param {Options} [options]
 */
function makeReview(diff, options) {
  const { GITHUB_EVENT_PATH, GITHUB_REPOSITORY, GITHUB_TOKEN } = process.env;
  if (!GITHUB_EVENT_PATH || !GITHUB_REPOSITORY || !GITHUB_TOKEN) {
    if (!GITHUB_TOKEN) {
      console.error("`GITHUB_TOKEN` must be set to your GitHub access token");
    }
    if (!GITHUB_EVENT_PATH) {
      console.error(
        "`GITHUB_EVENT_PATH` should've been defined by GitHub Actions"
      );
    }
    if (!GITHUB_REPOSITORY) {
      console.error(
        "`GITHUB_REPOSITORY` should've been defined by GitHub Actions"
      );
    }
    return Promise.reject(
      new Error("One or several environment variables are missing")
    );
  }

  const { makeComments } = require("./makeComments");
  const comments = makeComments(diff);
  if (comments.length === 0) {
    return Promise.resolve();
  }

  const { c } = require("./Helpers");

  const [owner, repo] = GITHUB_REPOSITORY.split("/");
  const review = {
    accept: "application/vnd.github.comfort-fade-preview+json",
    owner,
    repo,
    pull_number: getPullRequestNumber(GITHUB_EVENT_PATH),
    event: c("COMMENT"),
    comments: comments.map(trimComment),
  };
  return makeOctokit({ auth: GITHUB_TOKEN, ...options })
    .pulls.createReview(review)
    .catch((e) => {
      console.error(e);
      console.dir(review, { depth: null });
    });
}

module.exports["makeReview"] = makeReview;
