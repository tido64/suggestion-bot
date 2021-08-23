//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// @ts-check

jest.mock("fs");

/**
 * @param {Record<string, unknown>} mocks
 * @returns {{ auth: string }}
 */
function mock(mocks) {
  // @ts-ignore
  return mocks;
}

describe("GitHubClient", () => {
  const {
    FIXTURE_PIPED_GH_PAYLOAD,
    FIXTURE_PIPED_WINDOWS,
    FIXTURE_PIPED,
    FIXTURE_UNIDIFF_GH_PAYLOAD,
    FIXTURE_UNIDIFF,
  } = require("./__fixtures__");

  const { makeReview } = require("../src/GitHubClient");

  const { GITHUB_EVENT_PATH, GITHUB_REPOSITORY } = process.env;

  const dirSpy = jest.spyOn(global.console, "dir");
  const errorSpy = jest.spyOn(global.console, "error");

  beforeEach(() => {
    const { env } = process;
    env["GITHUB_TOKEN"] = "auth-token";
    env["GITHUB_EVENT_PATH"] = "/github/workflow/event.json";
    env["GITHUB_REPOSITORY"] = "tido64/suggestion-bot";

    // @ts-ignore
    require("fs").__setMockFiles({
      "/github/workflow/event.json": '{ "pull_request": { "number": 0 } }',
    });
  });

  afterAll(() => {
    const { env } = process;
    env["GITHUB_EVENT_PATH"] = GITHUB_EVENT_PATH;
    env["GITHUB_REPOSITORY"] = GITHUB_REPOSITORY;
  });

  afterEach(() => {
    dirSpy.mockReset();
    errorSpy.mockReset();
  });

  test("rejects if `GITHUB_EVENT_PATH` is missing", async () => {
    delete process.env["GITHUB_EVENT_PATH"];
    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`GITHUB_EVENT_PATH` should've been defined by GitHub Actions"
    );
  });

  test("rejects if `GITHUB_REPOSITORY` is missing", async () => {
    delete process.env["GITHUB_REPOSITORY"];
    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`GITHUB_REPOSITORY` should've been defined by GitHub Actions"
    );
  });

  test("rejects if `GITHUB_TOKEN` is missing", async () => {
    delete process.env["GITHUB_TOKEN"];
    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`GITHUB_TOKEN` must be set to your GitHub access token"
    );
  });

  test("rejects if multiple environment variables are missing", async () => {
    delete process.env["GITHUB_EVENT_PATH"];
    delete process.env["GITHUB_REPOSITORY"];
    delete process.env["GITHUB_TOKEN"];

    await expect(makeReview("")).rejects.toThrow(
      "One or several environment variables are missing"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`GITHUB_EVENT_PATH` should've been defined by GitHub Actions"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`GITHUB_REPOSITORY` should've been defined by GitHub Actions"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "`GITHUB_TOKEN` must be set to your GitHub access token"
    );
  });

  test("fetches auth token from environment variable", async () => {
    let auth = "";
    await makeReview(
      FIXTURE_UNIDIFF,
      mock({
        createReview: () => Promise.resolve(),
        setAuth: (/** @type {string} */ token) => {
          auth = token;
        },
      })
    );
    expect(auth).toBe(process.env["GITHUB_TOKEN"]);
  });

  test("skips invalid diffs", async () => {
    let payload = undefined;
    const mocks = mock({
      createReview: (/** @type {{}} */ review) => {
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
    let payload = undefined;
    await makeReview(
      FIXTURE_UNIDIFF,
      mock({
        createReview: (/** @type {{}} */ review) => {
          payload = review;
          return Promise.resolve();
        },
      })
    );
    expect(payload).toEqual(FIXTURE_UNIDIFF_GH_PAYLOAD);
  });

  test("supports piped diffs", async () => {
    let payload = undefined;
    const mocks = mock({
      createReview: (/** @type {{}} */ review) => {
        payload = review;
        return Promise.resolve();
      },
    });

    await makeReview(FIXTURE_PIPED, mocks);
    expect(payload).toEqual(FIXTURE_PIPED_GH_PAYLOAD);

    await makeReview(FIXTURE_PIPED_WINDOWS, mocks);
    expect(payload).toEqual(FIXTURE_PIPED_GH_PAYLOAD);
  });

  test("dumps the payload on failure", async () => {
    await makeReview(
      FIXTURE_UNIDIFF,
      mock({ createReview: () => Promise.reject("HttpError") })
    );

    expect(errorSpy).toHaveBeenCalledWith("HttpError");
    expect(dirSpy).toHaveBeenCalledWith(FIXTURE_UNIDIFF_GH_PAYLOAD, {
      depth: null,
    });
  });

  test("retries with a comment when getting an error due to suggestions to unchanged files", async () => {
    const message = "Changes were made in the following files:";
    await makeReview(
      FIXTURE_UNIDIFF,
      mock({
        message,
        createReview: () => Promise.reject({ name: "HttpError", status: 422 }),
        /** @type {(url: string, request: Record<string, unknown>) => Promise<void>} */
        request: (url, request) => {
          expect(url).toEqual(expect.stringContaining("/issues/0/comments"));
          expect(request).toEqual(
            expect.objectContaining({
              body: expect.stringContaining(message),
            })
          );
          return Promise.resolve();
        },
      })
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("retries with a comment when getting a server internal error", async () => {
    const message = "Changes were made in the following files:";
    await makeReview(
      FIXTURE_UNIDIFF,
      mock({
        message,
        createReview: () => Promise.reject({ name: "HttpError", status: 500 }),
        /** @type {(url: string, request: Record<string, unknown>) => Promise<void>} */
        request: (url, request) => {
          expect(url).toEqual(expect.stringContaining("/issues/0/comments"));
          expect(request).toEqual(
            expect.objectContaining({
              body: expect.stringContaining(message),
            })
          );
          return Promise.resolve();
        },
      })
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("dumps the payload when retry with comment fails", async () => {
    await makeReview(
      FIXTURE_UNIDIFF,
      mock({
        createReview: () => Promise.reject({ name: "HttpError", status: 422 }),
        request: () => Promise.reject("HttpError"),
      })
    );

    expect(errorSpy).toHaveBeenCalledWith("HttpError");
    expect(dirSpy).toHaveBeenCalledWith(FIXTURE_UNIDIFF_GH_PAYLOAD, {
      depth: null,
    });
  });
});
