//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
"use strict";

const parse = require("parse-diff");
const { makeComment } = require("../src/GitHubClient");
const { concatStrings } = require("../src/Helpers");

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
      concatStrings(
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
        "         container.pop_back();"
      )
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Common/Algorithm.h",
      line: 136,
      side: "RIGHT",
      body: concatStrings(
        "```suggestion",
        "    void quick_erase(T& container, typename T::iterator pos)",
        "```"
      ),
    });
  });

  test("single line change without context", () => {
    const [to, chunk] = extractChunk(
      concatStrings(
        "diff --git a/src/Common/Algorithm.h b/src/Common/Algorithm.h",
        "index d30d6e11..d138ef04 100644",
        "--- a/src/Common/Algorithm.h",
        "+++ b/src/Common/Algorithm.h",
        "@@ -136 +137 @@ namespace rainbow",
        "-    void quick_erase(T &container, typename T::iterator pos)",
        "+    void quick_erase(T& container, typename T::iterator pos)"
      )
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Common/Algorithm.h",
      line: 136,
      side: "RIGHT",
      body: concatStrings(
        "```suggestion",
        "    void quick_erase(T& container, typename T::iterator pos)",
        "```"
      ),
    });
  });

  test("break line", () => {
    const [to, chunk] = extractChunk(
      concatStrings(
        "diff --git a/src/Graphics/TextureAllocator.gl.h b/src/Graphics/TextureAllocator.gl.h",
        "index 25ee722d..f17e3c88 100644",
        "--- a/src/Graphics/TextureAllocator.gl.h",
        "+++ b/src/Graphics/TextureAllocator.gl.h",
        "@@ -21 +21,2 @@ namespace rainbow::graphics::gl",
        "-        [[maybe_unused, nodiscard]] auto max_size() const noexcept -> size_t override;",
        "+        [[maybe_unused, nodiscard]] auto max_size() const noexcept",
        "+            -> size_t override;"
      )
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Graphics/TextureAllocator.gl.h",
      line: 21,
      side: "RIGHT",
      body: concatStrings(
        "```suggestion",
        "        [[maybe_unused, nodiscard]] auto max_size() const noexcept",
        "            -> size_t override;",
        "```"
      ),
    });
  });

  test("concatenate lines", () => {
    const [to, chunk] = extractChunk(
      concatStrings(
        "diff --git a/src/Graphics/VertexArray.h b/src/Graphics/VertexArray.h",
        "index 31e66c01..8bc6fc35 100644",
        "--- a/src/Graphics/VertexArray.h",
        "+++ b/src/Graphics/VertexArray.h",
        "@@ -50,10 +50,7 @@ namespace rainbow::graphics",
        "         /// <summary>",
        "         ///   Returns whether this vertex array object is valid.",
        "         /// </summary>",
        "-        explicit operator bool() const",
        "-        {",
        "-            return static_cast<bool>(array_);",
        "-        }",
        "+        explicit operator bool() const { return static_cast<bool>(array_); }",
        " ",
        "     private:",
        " #ifdef USE_VERTEX_ARRAY_OBJECT"
      )
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Graphics/VertexArray.h",
      line: 56,
      side: "RIGHT",
      start_line: 53,
      start_side: "RIGHT",
      body: concatStrings(
        "```suggestion",
        "        explicit operator bool() const { return static_cast<bool>(array_); }",
        "```"
      ),
    });
  });

  test("moved lines", () => {
    const [to, chunk] = extractChunk(
      concatStrings(
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
        " "
      )
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Config.cpp",
      line: 19,
      side: "RIGHT",
      start_line: 15,
      start_side: "RIGHT",
      body: concatStrings(
        "```suggestion",
        `#include "Common/Algorithm.h"`,
        `#include "Common/Data.h"`,
        `#include "Common/Logging.h"`,
        `#include "FileSystem/File.h"`,
        `#include "FileSystem/FileSystem.h"`,
        "```"
      ),
    });
  });
});
