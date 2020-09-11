//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// @ts-check

/**
 * @typedef {import("parse-diff").Change} Change
 * @typedef {import("parse-diff").Chunk} Chunk
 * @typedef {import("parse-diff").File} File
 * @typedef {{
     path: string;
     position: number;
     line: number;
     line_length: number;
     side: "LEFT" | "RIGHT";
     start_line?: number;
     start_side?: "LEFT" | "RIGHT";
     body: string;
   }} Comment
 */

/**
 * @template T
 * @param {T[]} array
 * @param {(item: T) => boolean} callback
 * @returns {number}
 */
function findLastIndex(array, callback) {
  return array.reduce(
    (previous, c, index) => (callback(c) ? index : previous),
    -1
  );
}

/**
 * Trims context from specified changes.
 * @param {Change[]} changes
 * @returns {[Change[], number, number]}
 */
function trimContext(changes) {
  if (changes.length === 0) {
    return [changes, 0, 0];
  }

  const start = Math.max(
    changes.findIndex((c) => c.type !== "normal"),
    0
  );
  const end = findLastIndex(changes, (c) => c.type !== "normal") + 1;
  return [changes.slice(start, end), start, changes.length - end];
}

/**
 * Creates a comment that can be submitted to GitHub.
 * @param {string} file
 * @param {Chunk} chunk
 * @returns {Comment}
 */
function makeComment(file, { changes, oldStart, oldLines }) {
  const [trimmedChanges, startContext, endContext] = trimContext(changes);
  const line = oldStart + oldLines - endContext - 1;
  const startLine = oldStart + startContext;
  const lastMarkedLine = findLastIndex(trimmedChanges, (c) => c.type !== "add");
  return {
    path: file.split("\\").join("/"),
    line,
    line_length:
      lastMarkedLine >= 0 ? trimmedChanges[lastMarkedLine].content.length : 0,
    side: "RIGHT",
    ...(startLine !== line
      ? {
          start_line: startLine,
          start_side: "RIGHT",
        }
      : undefined),
    body: [
      "```suggestion",
      trimmedChanges
        .filter((line) => line.type !== "del")
        .map((line) => line.content.slice(1))
        .join("\n"),
      "```",
      "",
    ].join("\n"),
    // @ts-ignore `position` is not required if using `comfort-fade`
    position: undefined,
  };
}

/**
 * Creates suggestions with specified diff.
 * @param {string} diff
 * @returns {Comment[]}
 */
function makeComments(diff) {
  const files = require("parse-diff")(diff);
  if (files.length <= 0) {
    return [];
  }

  const { trimQuotes } = require("./Helpers");
  return files.reduce(
    /** @type {(comments: Comment[], file: File) => Comment[]} */
    (comments, file) => {
      const { chunks, from, to } = file;
      if (chunks.length === 0 || !to || !from) {
        return comments;
      }
      return chunks.reduce((comments, chunk) => {
        comments.push(makeComment(to === "-" ? trimQuotes(from) : to, chunk));
        return comments;
      }, comments);
    },
    []
  );
}

module.exports["makeComment"] = makeComment;
module.exports["makeComments"] = makeComments;
