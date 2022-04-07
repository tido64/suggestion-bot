//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// @ts-check

/** @typedef {{ auth?: string; fail?: boolean; message?: string; }} Options */

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
 * @param {Options=} options
 * @returns {Promise<void>}
 */
async function suggest(diff, options = {}) {
  const { makeReview } = getClient();
  try {
    await makeReview(diff, {
      ...options,
      message:
        options.message ||
        "Changes were made (e.g. by formatters, linters, etc.) in the following files:",
    });
  } catch (_) {
    process.exit(1);
  }
}

module.exports = suggest;
