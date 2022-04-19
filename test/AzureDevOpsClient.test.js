//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// @ts-check

/**
 * @typedef {import("azure-devops-node-api/interfaces/GitInterfaces").GitPullRequestCommentThread} GitPullRequestCommentThread
 */

/**
 * @param {{}} mocks
 * @returns {{}}
 */
function mock(mocks) {
  return mocks;
}

describe("AzureDevOpsClient", () => {
  const {
    FIXTURE_PIPED_ADO_ITERATION_CHANGES,
    FIXTURE_PIPED_ADO_PAYLOAD,
    FIXTURE_PIPED_WINDOWS,
    FIXTURE_PIPED,
    FIXTURE_UNIDIFF_ADO_ITERATION_CHANGES,
    FIXTURE_UNIDIFF_ADO_PAYLOAD,
    FIXTURE_UNIDIFF,
  } = require("./__fixtures__");

  const { makeReview } = require("../src/AzureDevOpsClient");

  const {
    AZURE_PERSONAL_ACCESS_TOKEN: ACCESS_TOKEN,
    BUILD_REPOSITORY_ID: REPOSITORY_ID,
    SYSTEM_PULLREQUEST_PULLREQUESTID: PULL_REQUEST_ID,
    SYSTEM_TEAMFOUNDATIONCOLLECTIONURI: SERVER_URL,
    SYSTEM_TEAMPROJECTID: PROJECT_ID,
  } = process.env;

  beforeEach(() => {
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

  test("rejects if `AZURE_PERSONAL_ACCESS_TOKEN` is missing", async () => {
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    delete process.env["AZURE_PERSONAL_ACCESS_TOKEN"];
    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`AZURE_PERSONAL_ACCESS_TOKEN` must be set to your Azure DevOps access token"
    );

    errorSpy.mockRestore();
  });

  test("rejects if `BUILD_REPOSITORY_ID` is missing", async () => {
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    delete process.env["BUILD_REPOSITORY_ID"];
    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`BUILD_REPOSITORY_ID` should've been defined by Azure Pipelines"
    );

    errorSpy.mockRestore();
  });

  test("rejects if `SYSTEM_PULLREQUEST_PULLREQUESTID` is missing", async () => {
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    delete process.env["SYSTEM_PULLREQUEST_PULLREQUESTID"];
    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`SYSTEM_PULLREQUEST_PULLREQUESTID` should've been defined by Azure Pipelines"
    );

    errorSpy.mockRestore();
  });

  test("rejects if `SYSTEM_TEAMFOUNDATIONCOLLECTIONURI` is missing", async () => {
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    delete process.env["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"];
    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`SYSTEM_TEAMFOUNDATIONCOLLECTIONURI` should've been defined by Azure Pipelines"
    );

    errorSpy.mockRestore();
  });

  test("rejects if `SYSTEM_TEAMPROJECTID` is missing", async () => {
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    delete process.env["SYSTEM_TEAMPROJECTID"];
    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`SYSTEM_TEAMPROJECTID` should've been defined by Azure Pipelines"
    );

    errorSpy.mockRestore();
  });

  test("rejects if multiple environment variables are missing", async () => {
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    delete process.env["AZURE_PERSONAL_ACCESS_TOKEN"];
    delete process.env["BUILD_REPOSITORY_ID"];
    delete process.env["SYSTEM_PULLREQUEST_PULLREQUESTID"];
    delete process.env["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"];
    delete process.env["SYSTEM_TEAMPROJECTID"];

    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`AZURE_PERSONAL_ACCESS_TOKEN` must be set to your Azure DevOps access token"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`BUILD_REPOSITORY_ID` should've been defined by Azure Pipelines"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`SYSTEM_PULLREQUEST_PULLREQUESTID` should've been defined by Azure Pipelines"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`SYSTEM_TEAMFOUNDATIONCOLLECTIONURI` should've been defined by Azure Pipelines"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`SYSTEM_TEAMPROJECTID` should've been defined by Azure Pipelines"
    );

    errorSpy.mockRestore();
  });

  test("fetches environment variables", async () => {
    let azureAccessToken = "";
    let buildRepositoryId = "";
    let prPullRequestId = "";
    let projectId = "";
    let tfCollectionUri = "";

    await makeReview(
      FIXTURE_UNIDIFF,
      mock({
        createThread: () => Promise.resolve(),
        getPullRequestIterationChanges: () =>
          Promise.resolve(FIXTURE_UNIDIFF_ADO_ITERATION_CHANGES),
        getPullRequestIterations: (
          /** @type {string} */ repositoryId,
          /** @type {string} */ pullRequestId,
          /** @type {string} */ project
        ) => {
          buildRepositoryId = repositoryId;
          prPullRequestId = pullRequestId;
          projectId = project;
          return Promise.resolve([{ id: 1 }]);
        },
        setAuthToken: (/** @type {string} */ authToken) => {
          azureAccessToken = authToken;
        },
        setServerUrl: (/** @type {string} */ serverUrl) => {
          tfCollectionUri = serverUrl;
        },
      })
    );

    const {
      AZURE_PERSONAL_ACCESS_TOKEN,
      BUILD_REPOSITORY_ID,
      SYSTEM_PULLREQUEST_PULLREQUESTID,
      SYSTEM_TEAMPROJECTID,
      SYSTEM_TEAMFOUNDATIONCOLLECTIONURI,
    } = process.env;
    expect(azureAccessToken).toBe(AZURE_PERSONAL_ACCESS_TOKEN);
    expect(buildRepositoryId).toBe(BUILD_REPOSITORY_ID);
    expect(prPullRequestId).toBe(
      parseInt(SYSTEM_PULLREQUEST_PULLREQUESTID || "")
    );
    expect(projectId).toBe(SYSTEM_TEAMPROJECTID);
    expect(tfCollectionUri).toBe(SYSTEM_TEAMFOUNDATIONCOLLECTIONURI);
  });

  test("skips invalid diffs", async () => {
    let payload = undefined;
    const mocks = mock({
      createThread: (/** @type {GitPullRequestCommentThread} */ review) => {
        payload = review;
        return Promise.resolve();
      },
    });

    await makeReview("", mocks);
    expect(payload).toBeUndefined();

    await makeReview(
      "diff --git a/src/Graphics/TextureAllocator.gl.h b/src/Graphics/TextureAllocator.gl.h",
      mocks
    );
    expect(payload).toBeUndefined();
  });

  test("supports unified diffs", async () => {
    /** @type {GitPullRequestCommentThread[]} */
    let payloads = [];
    const mocks = mock({
      createThread: (/** @type {GitPullRequestCommentThread} */ review) => {
        payloads.push(review);
        return Promise.resolve();
      },
      getPullRequestIterationChanges: () =>
        Promise.resolve(FIXTURE_UNIDIFF_ADO_ITERATION_CHANGES),
    });
    await makeReview(FIXTURE_UNIDIFF, mocks);
    expect(payloads).toEqual(FIXTURE_UNIDIFF_ADO_PAYLOAD);
  });

  test("supports piped diffs", async () => {
    /** @type {GitPullRequestCommentThread[]} */
    let payload = [];
    const mocks = mock({
      createThread: (/** @type {GitPullRequestCommentThread} */ review) => {
        payload.push(review);
        return Promise.resolve();
      },
      getPullRequestIterationChanges: () =>
        Promise.resolve(FIXTURE_PIPED_ADO_ITERATION_CHANGES),
    });

    await makeReview(FIXTURE_PIPED, mocks);
    expect(payload).toEqual(FIXTURE_PIPED_ADO_PAYLOAD);

    payload = [];

    await makeReview(FIXTURE_PIPED_WINDOWS, mocks);
    expect(payload).toEqual(FIXTURE_PIPED_ADO_PAYLOAD);
  });

  test("ignores files not in latest iteration", async () => {
    /** @type {GitPullRequestCommentThread[]} */
    let payloads = [];
    await makeReview(
      FIXTURE_UNIDIFF,
      mock({
        createThread: (/** @type {GitPullRequestCommentThread} */ review) => {
          payloads.push(review);
          return Promise.resolve();
        },
        getPullRequestIterationChanges: () => Promise.resolve({}),
      })
    );
    expect(payloads).toHaveLength(0);
  });

  test("dumps the exception on failure", async () => {
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    await makeReview(
      FIXTURE_UNIDIFF,
      mock({
        createThread: () => Promise.reject("test"),
        getPullRequestIterationChanges: () =>
          Promise.resolve(FIXTURE_UNIDIFF_ADO_ITERATION_CHANGES),
      })
    );

    expect(errorSpy).toHaveBeenCalledWith("test");

    errorSpy.mockRestore();
  });

  test("throws on failure", async () => {
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation();

    const task = makeReview(
      FIXTURE_UNIDIFF,
      mock({
        createThread: () => Promise.reject("test"),
        getPullRequestIterationChanges: () =>
          Promise.resolve(FIXTURE_UNIDIFF_ADO_ITERATION_CHANGES),
        fail: true,
      })
    );

    await expect(task).rejects.toBe("test");

    expect(errorSpy).toHaveBeenCalledWith("test");

    errorSpy.mockRestore();
  });
});

describe("getItemPath", () => {
  const { getItemPath } = require("../src/AzureDevOpsClient");

  test("returns `undefined` when missing item path", () => {
    expect(getItemPath({})).toBeUndefined();
    expect(getItemPath({ item: {} })).toBeUndefined();
    expect(getItemPath({ item: { path: "" } })).toBeUndefined();
  });

  test("trims leading '/' from item path", () => {
    expect(
      getItemPath({ item: { path: "test/AzureDevOpsClient.test.js" } })
    ).toBe("test/AzureDevOpsClient.test.js");
    expect(
      getItemPath({ item: { path: "/test/AzureDevOpsClient.test.js" } })
    ).toBe("test/AzureDevOpsClient.test.js");
    expect(
      getItemPath({ item: { path: "//test/AzureDevOpsClient.test.js" } })
    ).toBe("/test/AzureDevOpsClient.test.js");
  });
});
