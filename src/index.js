//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

/**
 * Submits a code review with suggestions with specified diff.
 * @param {string} diff
 */
function suggest(diff) {
  const { makeReview } = require("./GitHubClient");
  return makeReview(diff);
}

module.exports = suggest;
