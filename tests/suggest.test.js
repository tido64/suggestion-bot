//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
"use strict";

jest.mock("fs");

const { concatStrings } = require("../src/Helpers");

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

const FIXTURE_PIPED_ADO_ITERATION_CHANGES = {
  changeEntries: [
    {
      changeTrackingId: 1,
      item: { path: "/src/GitHubClient.js" },
    },
  ],
};

const FIXTURE_PIPED_ADO_PAYLOAD = [
  {
    comments: [
      {
        content:
          '```suggestion\n      comments.push(makeComment(to === "-" ? from : to, chunk));\n```\n',
        commentType: 1,
      },
    ],
    status: 1,
    threadContext: {
      filePath: "src/GitHubClient.js",
      rightFileEnd: { line: 95, offset: 65 },
      rightFileStart: { line: 95, offset: 1 },
    },
    pullRequestThreadContext: {
      changeTrackingId: 1,
      iterationContext: {
        firstComparingIteration: 1,
        secondComparingIteration: 1,
      },
    },
  },
];

const FIXTURE_PIPED_GH_PAYLOAD = {
  accept: "application/vnd.github.comfort-fade-preview+json",
  owner: "tido64",
  repo: "suggestion-bot",
  pull_number: 0,
  event: "COMMENT",
  comments: [
    {
      path: "src/GitHubClient.js",
      line: 95,
      line_length: 65,
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

const FIXTURE_UNIDIFF_ADO_ITERATION_CHANGES = {
  changeEntries: [
    {
      changeTrackingId: 1,
      item: { path: "/src/Graphics/TextureAllocator.gl.h" },
    },
    {
      changeTrackingId: 2,
      item: { path: "/src/Graphics/VertexArray.h" },
    },
  ],
};

const FIXTURE_UNIDIFF_ADO_PAYLOAD = [
  {
    comments: [
      {
        content:
          "```suggestion\n        [[maybe_unused, nodiscard]] auto max_size() const noexcept\n            -> size_t override;\n```\n",
        commentType: 1,
      },
    ],
    status: 1,
    threadContext: {
      filePath: "src/Graphics/TextureAllocator.gl.h",
      rightFileEnd: { line: 22, offset: 59 },
      rightFileStart: { line: 21, offset: 1 },
    },
    pullRequestThreadContext: {
      changeTrackingId: 1,
      iterationContext: {
        firstComparingIteration: 1,
        secondComparingIteration: 1,
      },
    },
  },
  {
    comments: [
      {
        content:
          "```suggestion\n        explicit operator bool() const { return static_cast<bool>(array_); }\n```\n",
        commentType: 1,
      },
    ],
    status: 1,
    threadContext: {
      filePath: "src/Graphics/VertexArray.h",
      rightFileEnd: { line: 56, offset: 10 },
      rightFileStart: { line: 53, offset: 1 },
    },
    pullRequestThreadContext: {
      changeTrackingId: 2,
      iterationContext: {
        firstComparingIteration: 1,
        secondComparingIteration: 1,
      },
    },
  },
];

const FIXTURE_UNIDIFF_GH_PAYLOAD = {
  accept: "application/vnd.github.comfort-fade-preview+json",
  owner: "tido64",
  repo: "suggestion-bot",
  pull_number: 0,
  event: "COMMENT",
  comments: [
    {
      path: "src/Graphics/TextureAllocator.gl.h",
      line: 22,
      line_length: 59,
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
      line_length: 10,
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

describe("AzureDevOpsClient", () => {
  const { makeReview } = require("../src/AzureDevOpsClient");

  const {
    AZURE_PERSONAL_ACCESS_TOKEN: ACCESS_TOKEN,
    BUILD_REPOSITORY_ID: REPOSITORY_ID,
    SYSTEM_PULLREQUEST_PULLREQUESTID: PULL_REQUEST_ID,
    SYSTEM_TEAMFOUNDATIONCOLLECTIONURI: SERVER_URL,
    SYSTEM_TEAMPROJECTID: PROJECT_ID,
  } = process.env;

  beforeAll(() => {
    const { env } = process;
    env["AZURE_PERSONAL_ACCESS_TOKEN"] = "access-token";
    env["BUILD_REPOSITORY_ID"] = "suggestion-bot";
    env["SYSTEM_PULLREQUEST_PULLREQUESTID"] = "13";
    env["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"] =
      "https://dev.azure.com/fabrikamfiber";
    env["SYSTEM_TEAMPROJECTID"] = "tido64";
  });

  afterAll(() => {
    const { env } = process;
    env["AZURE_PERSONAL_ACCESS_TOKEN"] = ACCESS_TOKEN;
    env["BUILD_REPOSITORY_ID"] = REPOSITORY_ID;
    env["SYSTEM_PULLREQUEST_PULLREQUESTID"] = PULL_REQUEST_ID;
    env["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"] = SERVER_URL;
    env["SYSTEM_TEAMPROJECTID"] = PROJECT_ID;
  });

  test("fetches environment variables", async () => {
    let azureAccessToken = "";
    let buildRepositoryId = "";
    let prPullRequestId = "";
    let projectId = "";
    let tfCollectionUri = "";

    await makeReview(FIXTURE_UNIDIFF, {
      createThread: () => Promise.resolve(),
      getPullRequestIterationChanges: () =>
        Promise.resolve(FIXTURE_UNIDIFF_ADO_ITERATION_CHANGES),
      getPullRequestIterations: (repositoryId, pullRequestId, project) => {
        buildRepositoryId = repositoryId;
        prPullRequestId = pullRequestId;
        projectId = project;
        return Promise.resolve([{ id: 1 }]);
      },
      setAuthToken: (authToken) => {
        azureAccessToken = authToken;
      },
      setServerUrl: (serverUrl) => {
        tfCollectionUri = serverUrl;
      },
    });

    const { env } = process;
    expect(azureAccessToken).toBe(env["AZURE_PERSONAL_ACCESS_TOKEN"]);
    expect(buildRepositoryId).toBe(env["BUILD_REPOSITORY_ID"]);
    expect(prPullRequestId).toBe(env["SYSTEM_PULLREQUEST_PULLREQUESTID"] | 0);
    expect(projectId).toBe(env["SYSTEM_TEAMPROJECTID"]);
    expect(tfCollectionUri).toBe(env["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"]);
  });

  test("skips invalid diffs", async () => {
    let payload = undefined;
    const createThread = (review) => {
      payload = review;
      return Promise.resolve();
    };

    await makeReview("", { createThread });
    expect(payload).toBeUndefined();

    await makeReview(
      "diff --git a/src/Graphics/TextureAllocator.gl.h b/src/Graphics/TextureAllocator.gl.h",
      { createThread }
    );
    expect(payload).toBeUndefined();
  });

  test("supports unified diffs", async () => {
    let payloads = [];
    await makeReview(FIXTURE_UNIDIFF, {
      createThread: (review) => {
        payloads.push(review);
        return Promise.resolve();
      },
      getPullRequestIterationChanges: () =>
        Promise.resolve(FIXTURE_UNIDIFF_ADO_ITERATION_CHANGES),
    });
    expect(payloads).toEqual(FIXTURE_UNIDIFF_ADO_PAYLOAD);
  });

  test("supports piped diffs", async () => {
    let payload = [];
    const mocks = {
      createThread: (review) => {
        payload.push(review);
        return Promise.resolve();
      },
      getPullRequestIterationChanges: () =>
        Promise.resolve(FIXTURE_PIPED_ADO_ITERATION_CHANGES),
    };

    await makeReview(FIXTURE_PIPED, mocks);
    expect(payload).toEqual(FIXTURE_PIPED_ADO_PAYLOAD);

    payload = [];

    await makeReview(FIXTURE_PIPED_WINDOWS, mocks);
    expect(payload).toEqual(FIXTURE_PIPED_ADO_PAYLOAD);
  });

  test("dumps the exception on failure", async () => {
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    await makeReview(FIXTURE_UNIDIFF, {
      createThread: () => Promise.reject("test"),
      getPullRequestIterationChanges: () =>
        Promise.resolve(FIXTURE_UNIDIFF_ADO_ITERATION_CHANGES),
    });

    expect(errorSpy).toHaveBeenCalledWith("test");

    errorSpy.mockRestore();
  });
});

describe("GitHubClient", () => {
  const { makeReview } = require("../src/GitHubClient");

  const { GITHUB_EVENT_PATH, GITHUB_REPOSITORY } = process.env;

  beforeAll(() => {
    const { env } = process;
    env["GITHUB_TOKEN"] = "auth-token";
    env["GITHUB_EVENT_PATH"] = "/github/workflow/event.json";
    env["GITHUB_REPOSITORY"] = "tido64/suggestion-bot";
    require("fs").__setMockFiles({
      "/github/workflow/event.json": '{ "pull_request": { "number": 0 } }',
    });
  });

  afterAll(() => {
    const { env } = process;
    env["GITHUB_EVENT_PATH"] = GITHUB_EVENT_PATH;
    env["GITHUB_REPOSITORY"] = GITHUB_REPOSITORY;
  });

  test("fetches auth token from environment variable", async () => {
    let auth = "";
    await makeReview(FIXTURE_UNIDIFF, {
      createReview: () => Promise.resolve(),
      setAuth: (token) => {
        auth = token;
      },
    });
    expect(auth).toBe(process.env["GITHUB_TOKEN"]);
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
    expect(payload).toEqual(FIXTURE_UNIDIFF_GH_PAYLOAD);
  });

  test("supports piped diffs", async () => {
    let payload = undefined;
    const createReview = (review) => {
      payload = review;
      return Promise.resolve();
    };

    await makeReview(FIXTURE_PIPED, { createReview });
    expect(payload).toEqual(FIXTURE_PIPED_GH_PAYLOAD);

    await makeReview(FIXTURE_PIPED_WINDOWS, { createReview });
    expect(payload).toEqual(FIXTURE_PIPED_GH_PAYLOAD);
  });

  test("dumps the payload on failure", async () => {
    const dirSpy = jest.spyOn(global.console, "dir").mockImplementation();
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    await makeReview(FIXTURE_UNIDIFF, {
      createReview: () => Promise.reject("test"),
    });

    expect(errorSpy).toHaveBeenCalledWith("test");
    expect(dirSpy).toHaveBeenCalledWith(FIXTURE_UNIDIFF_GH_PAYLOAD, {
      depth: null,
    });

    dirSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
