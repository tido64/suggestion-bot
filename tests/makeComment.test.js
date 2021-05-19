//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// @ts-check

const parse = require("parse-diff");
const { concatStrings } = require("../src/Helpers");

/**
 * @param  {...string} diff
 * @returns {[string, import("parse-diff").Chunk]}
 */
function extractChunk(...diff) {
  const { chunks, to } = parse(concatStrings(...diff))[0];
  return [to || "", chunks[0]];
}

describe("makeComment", () => {
  const { makeComment } = require("../src/makeComments");

  test("adds line", () => {
    const [to, chunk] = extractChunk(
      "diff --git a/src/Graphics/TextureAllocator.gl.h b/src/Graphics/TextureAllocator.gl.h",
      "index 25ee722d..f17e3c88 100644",
      "--- a/src/Graphics/TextureAllocator.gl.h",
      "+++ b/src/Graphics/TextureAllocator.gl.h",
      "@@ -21 +21,2 @@ namespace rainbow::graphics::gl",
      "+        [[maybe_unused, nodiscard]]",
      "         auto max_size() const noexcept -> size_t override;"
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Graphics/TextureAllocator.gl.h",
      line: 20,
      line_length: 58,
      side: "RIGHT",
      body: concatStrings(
        "```suggestion",
        "        [[maybe_unused, nodiscard]]",
        "        auto max_size() const noexcept -> size_t override;",
        "```"
      ),
    });
  });

  test("removes line", () => {
    const [to, chunk] = extractChunk(
      "diff --git a/src/Graphics/TextureAllocator.gl.h b/src/Graphics/TextureAllocator.gl.h",
      "index 25ee722d..f17e3c88 100644",
      "--- a/src/Graphics/TextureAllocator.gl.h",
      "+++ b/src/Graphics/TextureAllocator.gl.h",
      "@@ -21 +21,2 @@ namespace rainbow::graphics::gl",
      "-        [[maybe_unused, nodiscard]]",
      "-        auto max_size() const noexcept -> size_t override;"
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Graphics/TextureAllocator.gl.h",
      line: 22,
      line_length: 58,
      side: "RIGHT",
      start_line: 21,
      start_side: "RIGHT",
      body: concatStrings("```suggestion", "```"),
    });
  });

  test("single line change with context", () => {
    const [to, chunk] = extractChunk(
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
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Common/Algorithm.h",
      line: 136,
      line_length: 61,
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
      "diff --git a/src/Common/Algorithm.h b/src/Common/Algorithm.h",
      "index d30d6e11..d138ef04 100644",
      "--- a/src/Common/Algorithm.h",
      "+++ b/src/Common/Algorithm.h",
      "@@ -136 +137 @@ namespace rainbow",
      "-    void quick_erase(T &container, typename T::iterator pos)",
      "+    void quick_erase(T& container, typename T::iterator pos)"
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Common/Algorithm.h",
      line: 136,
      line_length: 61,
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
      "diff --git a/src/Graphics/TextureAllocator.gl.h b/src/Graphics/TextureAllocator.gl.h",
      "index 25ee722d..f17e3c88 100644",
      "--- a/src/Graphics/TextureAllocator.gl.h",
      "+++ b/src/Graphics/TextureAllocator.gl.h",
      "@@ -21 +21,2 @@ namespace rainbow::graphics::gl",
      "-        [[maybe_unused, nodiscard]] auto max_size() const noexcept -> size_t override;",
      "+        [[maybe_unused, nodiscard]] auto max_size() const noexcept",
      "+            -> size_t override;"
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Graphics/TextureAllocator.gl.h",
      line: 21,
      line_length: 87,
      side: "RIGHT",
      body: concatStrings(
        "```suggestion",
        "        [[maybe_unused, nodiscard]] auto max_size() const noexcept",
        "            -> size_t override;",
        "```"
      ),
    });
  });

  test("change on last line with context", () => {
    const [to, chunk] = extractChunk(
      "--- example/windows/ReactTestAppTests/pch.cpp	(before formatting)",
      "+++ example/windows/ReactTestAppTests/pch.cpp	(after formatting)",
      "@@ -2,4 +2,5 @@",
      " ",
      ` #include "pch.h"`,
      " ",
      "-// When you are using pre-compiled headers, this source file is necessary for compilation to succeed.",
      "+// When you are using pre-compiled headers, this source file is necessary for compilation to",
      "+// succeed."
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "example/windows/ReactTestAppTests/pch.cpp",
      line: 5,
      line_length: 102,
      side: "RIGHT",
      body: concatStrings(
        "```suggestion",
        "// When you are using pre-compiled headers, this source file is necessary for compilation to",
        "// succeed.",
        "```"
      ),
    });
  });

  test("concatenate lines", () => {
    const [to, chunk] = extractChunk(
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
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Graphics/VertexArray.h",
      line: 56,
      line_length: 10,
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

  test("move lines down", () => {
    const [to, chunk] = extractChunk(
      "diff --git a/src/Config.cpp b/src/Config.cpp",
      "index d0a84e17..c73dd760 100644",
      "--- a/src/Config.cpp",
      "+++ b/src/Config.cpp",
      "@@ -12,11 +12,11 @@",
      " ",
      " #include <panini/panini.hpp>",
      " ",
      `-#include "FileSystem/FileSystem.h"`,
      ` #include "Common/Algorithm.h"`,
      ` #include "Common/Data.h"`,
      ` #include "Common/Logging.h"`,
      ` #include "FileSystem/File.h"`,
      `+#include "FileSystem/FileSystem.h"`,
      " ",
      " using namespace std::literals::string_view_literals;",
      " "
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Config.cpp",
      line: 19,
      line_length: 29,
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

  test("move lines up", () => {
    const [to, chunk] = extractChunk(
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
    );
    expect(makeComment(to, chunk)).toEqual({
      path: "src/Config.cpp",
      line: 19,
      line_length: 30,
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
