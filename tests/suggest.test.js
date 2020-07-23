//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
"use strict";

const { makeReview } = require("../src/GitHubClient");

/**
 * @typedef {{ auth: string; }} Options
 * @typedef {{
     accept: string;
     owner: string;
     repo: string;
     pull_number: number;
     event: "COMMENT";
     comments: string[];
   }} Review
 */

/**
 * Creates a mock client.
 * @param {(review: Review) => Promise<void>} createReview
 */
function makeMockClient(createReview) {
  return () => ({ pulls: { createReview } });
}

describe("suggest", () => {
  beforeEach(() => {
    const { env } = process;
    env.GITHUB_REPOSITORY = env.GITHUB_REPOSITORY || "tido64/suggestion-bot";
  });

  test("skips invalid diffs", async () => {
    let payload = undefined;
    const createReview = (review) => {
      payload = review;
      return Promise.resolve();
    };

    await makeReview("", makeMockClient(createReview));
    expect(payload).toBeUndefined();

    await makeReview(
      "diff --git a/src/Graphics/TextureAllocator.gl.h b/src/Graphics/TextureAllocator.gl.h",
      makeMockClient(createReview)
    );
    expect(payload).toBeUndefined();
  });

  test("supports unified diffs", async () => {
    let payload = undefined;
    await makeReview(
      [
        "diff --git a/src/Graphics/TextureAllocator.gl.h b/src/Graphics/TextureAllocator.gl.h",
        "index 366b30f7..f17e3c88 100644",
        "--- a/src/Graphics/TextureAllocator.gl.h",
        "+++ b/src/Graphics/TextureAllocator.gl.h",
        "@@ -18,8 +18,8 @@ namespace rainbow::graphics::gl",
        " ",
        "         void destroy(TextureHandle&) override;",
        " ",
        "-        [[maybe_unused, nodiscard]]",
        "-        auto max_size() const noexcept -> size_t override;",
        "+        [[maybe_unused, nodiscard]] auto max_size() const noexcept",
        "+            -> size_t override;",
        " ",
        "         void update(const TextureHandle&,",
        "                     const Image&,",
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
        " #ifdef USE_VERTEX_ARRAY_OBJECT",
      ].join("\n"),
      makeMockClient((review) => {
        payload = review;
        return Promise.resolve();
      })
    );
    expect(payload).toEqual({
      accept: "application/vnd.github.comfort-fade-preview+json",
      owner: "tido64",
      repo: "suggestion-bot",
      pull_number: 0,
      event: "COMMENT",
      comments: [
        {
          path: "src/Graphics/TextureAllocator.gl.h",
          line: 22,
          side: "RIGHT",
          start_line: 21,
          start_side: "RIGHT",
          body: [
            "```suggestion",
            "        [[maybe_unused, nodiscard]] auto max_size() const noexcept",
            "            -> size_t override;",
            "```",
            "",
          ].join("\n"),
        },
        {
          path: "src/Graphics/VertexArray.h",
          line: 56,
          side: "RIGHT",
          start_line: 53,
          start_side: "RIGHT",
          body: [
            "```suggestion",
            "        explicit operator bool() const { return static_cast<bool>(array_); }",
            "```",
            "",
          ].join("\n"),
        },
      ],
    });
  });
});
