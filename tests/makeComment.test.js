//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
"use strict";

const parse = require("parse-diff");
const { makeComment } = require("../src/GitHubClient");

function extractChunk(diff) {
  const { chunks, to } = parse(diff)[0];
  return [to, chunks[0]];
}

describe("makeComment", () => {
  test("single line template", () => {
    expect(
      makeComment("test", {
        changes: [],
        oldStart: 0,
        oldLines: 1,
      })
    ).toEqual({
      path: "test",
      line: 0,
      side: "RIGHT",
      body: "```suggestion\n\n```\n",
    });
  });

  test("multi line template", () => {
    expect(
      makeComment("test", {
        changes: [],
        oldStart: 0,
        oldLines: 2,
      })
    ).toEqual({
      path: "test",
      line: 1,
      side: "RIGHT",
      start_line: 0,
      start_side: "RIGHT",
      body: "```suggestion\n\n```\n",
    });
  });

  test("single line change with context", () => {
    const [to, chunk] = extractChunk(
      [
        "diff --git a/src/Common/Algorithm.h b/src/Common/Algorithm.h",
        "index d30d6e11..d138ef04 100644",
        "--- a/src/Common/Algorithm.h",
        "+++ b/src/Common/Algorithm.h",
        "@@ -133,7 +134,7 @@ namespace rainbow",
        `     ///   last element in <paramref name="container"/> and popping it.`,
        "     /// </summary>",
        "     template <typename T>",
        "-    void quick_erase(T &container, typename T::iterator pos)",
        "+    void quick_erase(T& container, typename T::iterator pos)",
        "     {",
        "         std::swap(*pos, container.back());",
        "         container.pop_back();",
      ].join("\n")
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Common/Algorithm.h",
      line: 136,
      side: "RIGHT",
      body: [
        "```suggestion",
        "    void quick_erase(T& container, typename T::iterator pos)",
        "```",
        "",
      ].join("\n"),
    });
  });

  test("single line change without context", () => {
    const [to, chunk] = extractChunk(
      [
        "diff --git a/src/Common/Algorithm.h b/src/Common/Algorithm.h",
        "index d30d6e11..d138ef04 100644",
        "--- a/src/Common/Algorithm.h",
        "+++ b/src/Common/Algorithm.h",
        "@@ -136 +137 @@ namespace rainbow",
        "-    void quick_erase(T &container, typename T::iterator pos)",
        "+    void quick_erase(T& container, typename T::iterator pos)",
      ].join("\n")
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Common/Algorithm.h",
      line: 136,
      side: "RIGHT",
      body: [
        "```suggestion",
        "    void quick_erase(T& container, typename T::iterator pos)",
        "```",
        "",
      ].join("\n"),
    });
  });

  test("moved lines", () => {
    const [to, chunk] = extractChunk(
      [
        "diff --git a/src/Config.cpp b/src/Config.cpp",
        "index d0a84e17..c73dd760 100644",
        "--- a/src/Config.cpp",
        "+++ b/src/Config.cpp",
        "@@ -12,11 +12,11 @@",
        " ",
        " #include <panini/panini.hpp>",
        " ",
        `+#include "Common/Algorithm.h"`,
        ` #include "Common/Data.h"`,
        ` #include "Common/Logging.h"`,
        ` #include "FileSystem/File.h"`,
        ` #include "FileSystem/FileSystem.h"`,
        `-#include "Common/Algorithm.h"`,
        " ",
        " using namespace std::literals::string_view_literals;",
        " ",
      ].join("\n")
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Config.cpp",
      line: 19,
      side: "RIGHT",
      start_line: 15,
      start_side: "RIGHT",
      body: [
        "```suggestion",
        `#include "Common/Algorithm.h"`,
        `#include "Common/Data.h"`,
        `#include "Common/Logging.h"`,
        `#include "FileSystem/File.h"`,
        `#include "FileSystem/FileSystem.h"`,
        "```",
        "",
      ].join("\n"),
    });
  });
});
