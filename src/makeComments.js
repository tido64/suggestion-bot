//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

/**
 * @typedef {{
     path: string;
     position: undefined;
     line: number;
     side: "LEFT" | "RIGHT";
     start_line?: number;
     start_side?: "LEFT" | "RIGHT";
     body: string;
   }} Comment
 */

/**
 * Trims context from specified changes.
 * @param {import('parse-diff').Change[]} changes
 * @returns {[import('parse-diff').Change[], number, number]}
 */
function trimContext(changes) {
  if (changes.length === 0) {
    return [changes, 0, 0];
  }

  const start = Math.max(
    changes.findIndex((c) => c.type !== "normal"),
    0
  );
  const end =
    changes.reduce(
      (previous, c, index) => (c.type !== "normal" ? index : previous),
      0
    ) + 1;
  return [changes.slice(start, end), start, changes.length - end];
}

/**
 * Creates a comment that can be submitted to GitHub.
 * @param {string} file
 * @param {import('parse-diff').Chunk} chunk
 * @returns {Comment}
 */
function makeComment(file, { changes, oldStart, oldLines }) {
  const [trimmedChanges, startContext, endContext] = trimContext(changes);
  const line = oldStart + oldLines - endContext - 1;
  const startLine = oldStart + startContext;
  return {
    path: file.split("\\").join("/"),
    position: undefined,
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
      trimmedChanges
        .filter((line) => line.type !== "del")
        .map((line) => line.content.slice(1))
        .join("\n"),
      "```",
      "",
    ].join("\n"),
  };
}

/**
 * Creates suggestions with specified diff.
 * @param {string} diff
 * @returns {Comment[]}
 */
function makeComments(diff) {
  const parse = require("parse-diff");
  const files = parse(diff);
  if (files.length <= 0) {
    return [];
  }

  const { trimQuotes } = require("./Helpers");
  return files.reduce(
    (comments, file) => {
      const { chunks, from, to } = file;
      if (chunks.length === 0) {
        return comments;
      }
      return chunks.reduce((comments, chunk) => {
        comments.push(makeComment(to === "-" ? trimQuotes(from) : to, chunk));
        return comments;
      }, comments);
    },
    /** @type {Comment} */ []
  );
}

module.exports["makeComment"] = makeComment;
module.exports["makeComments"] = makeComments;
