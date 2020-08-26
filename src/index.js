//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

/**
 * Returns the appropriate client for the provided access token.
 */
function getClient() {
  const { AZURE_PERSONAL_ACCESS_TOKEN, GITHUB_TOKEN } = process.env;

  if (AZURE_PERSONAL_ACCESS_TOKEN) {
    return require("./AzureDevOpsClient");
  }

  if (GITHUB_TOKEN) {
    return require("./GitHubClient");
  }

  throw "No access token was set";
}

/**
 * Submits a code review with suggestions with specified diff.
 * @param {string} diff
 */
function suggest(diff) {
  const { makeReview } = getClient();
  return makeReview(diff);
}

module.exports = suggest;
