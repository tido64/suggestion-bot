//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
"use strict";

jest.mock("fs");

const { makeReview } = require("../src/GitHubClient");
const { concatStrings } = require("../src/Helpers");

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

const FIXTURE_PIPED = concatStrings(
  `--- "src/GitHubClient.js"      2020-07-26 20:24:35.497737700 +0200`,
  "+++ -   2020-07-26 20:25:43.893994400 +0200",
  "@@ -92,7 +92,7 @@",
  "       return comments;",
  "     }",
  "     return chunks.reduce((comments, chunk) => {",
  "-      comments.push(makeComment(to === '-' ? from : to, chunk));",
  `+      comments.push(makeComment(to === "-" ? from : to, chunk));`,
  "       return comments;",
  "     }, comments);",
  "   }, []);"
);

const FIXTURE_PIPED_WINDOWS = concatStrings(
  `--- "src\\GitHubClient.js"      2020-07-26 20:24:35.497737700 +0200`,
  "+++ -   2020-07-26 20:25:43.893994400 +0200",
  "@@ -92,7 +92,7 @@",
  "       return comments;",
  "     }",
  "     return chunks.reduce((comments, chunk) => {",
  "-      comments.push(makeComment(to === '-' ? from : to, chunk));",
  `+      comments.push(makeComment(to === "-" ? from : to, chunk));`,
  "       return comments;",
  "     }, comments);",
  "   }, []);"
);

const FIXTURE_PIPED_PAYLOAD = {
  accept: "application/vnd.github.comfort-fade-preview+json",
  owner: "tido64",
  repo: "suggestion-bot",
  pull_number: 0,
  event: "COMMENT",
  comments: [
    {
      path: "src/GitHubClient.js",
      line: 95,
      side: "RIGHT",
      body: concatStrings(
        "```suggestion",
        `      comments.push(makeComment(to === "-" ? from : to, chunk));`,
        "```"
      ),
    },
  ],
};

const FIXTURE_UNIDIFF = concatStrings(
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
  " #ifdef USE_VERTEX_ARRAY_OBJECT"
);

const FIXTURE_UNIDIFF_PAYLOAD = {
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
      body: concatStrings(
        "```suggestion",
        "        [[maybe_unused, nodiscard]] auto max_size() const noexcept",
        "            -> size_t override;",
        "```"
      ),
    },
    {
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
    },
  ],
};

describe("suggest", () => {
  const { GITHUB_EVENT_PATH, GITHUB_REPOSITORY } = process.env;

  beforeEach(() => {
    const { env } = process;
    env.GITHUB_EVENT_PATH = "/github/workflow/event.json";
    env.GITHUB_REPOSITORY = "tido64/suggestion-bot";
    require("fs").__setMockFiles({
      "/github/workflow/event.json": '{ "pull_request": { "number": 0 } }',
    });
  });

  afterEach(() => {
    const { env } = process;
    env.GITHUB_EVENT_PATH = GITHUB_EVENT_PATH;
    env.GITHUB_REPOSITORY = GITHUB_REPOSITORY;
  });

  test("skips invalid diffs", async () => {
    let payload = undefined;
    const createReview = (review) => {
      payload = review;
      return Promise.resolve();
    };

    await makeReview("", { createReview });
    expect(payload).toBeUndefined();

    await makeReview(
      "diff --git a/src/Graphics/TextureAllocator.gl.h b/src/Graphics/TextureAllocator.gl.h",
      { createReview }
    );
    expect(payload).toBeUndefined();
  });

  test("supports unified diffs", async () => {
    let payload = undefined;
    await makeReview(FIXTURE_UNIDIFF, {
      createReview: (review) => {
        payload = review;
        return Promise.resolve();
      },
    });
    expect(payload).toEqual(FIXTURE_UNIDIFF_PAYLOAD);
  });

  test("supports piped diffs", async () => {
    let payload = undefined;
    const createReview = (review) => {
      payload = review;
      return Promise.resolve();
    };

    await makeReview(FIXTURE_PIPED, { createReview });
    expect(payload).toEqual(FIXTURE_PIPED_PAYLOAD);

    await makeReview(FIXTURE_PIPED_WINDOWS, { createReview });
    expect(payload).toEqual(FIXTURE_PIPED_PAYLOAD);
  });

  test("dumps the payload on failure", async () => {
    const dirSpy = jest.spyOn(global.console, "dir").mockImplementation();
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    await makeReview(FIXTURE_UNIDIFF, {
      createReview: () => Promise.reject("test"),
    });

    expect(errorSpy).toHaveBeenCalledWith("test");
    expect(dirSpy).toHaveBeenCalledWith(FIXTURE_UNIDIFF_PAYLOAD, {
      depth: null,
    });

    dirSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
