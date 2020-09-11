//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// @ts-check

/**
 * Coerces number/string literals to literal types.
 * @template {number | string} T
 * @param {T} v
 * @return {T}
 */
function c(v) {
  return v;
}

/**
 * Concatenates specified strings.
 * @param {string[]} strings
 * @returns {string}
 */
function concatStrings(...strings) {
  return strings.concat("").join("\n");
}

/**
 * Trims specified string for wrapping quotation marks.
 * @param {string} p
 * @returns {string}
 */
function trimQuotes(p) {
  if (
    (p.startsWith('"') && p.endsWith('"')) ||
    (p.startsWith("'") && p.endsWith("'"))
  ) {
    return p.slice(1, p.length - 1);
  }
  return p;
}

module.exports["c"] = c;
module.exports["concatStrings"] = concatStrings;
module.exports["trimQuotes"] = trimQuotes;
