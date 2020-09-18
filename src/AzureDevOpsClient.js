//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// @ts-check

/**
 * @typedef {import("azure-devops-node-api/interfaces/common/VsoBaseInterfaces").IRequestOptions} RequestOptions
 * @typedef {import("azure-devops-node-api/interfaces/GitInterfaces").GitPullRequestChange} GitPullRequestChange
 * @typedef {import("azure-devops-node-api/interfaces/GitInterfaces").GitPullRequestCommentThread} GitPullRequestCommentThread
 * @typedef {import("./makeComments").Comment} Comment
 * @typedef {{ [filePath: string]: number }} ChangeTrackingIdMap
 * @typedef {(changes: ChangeTrackingIdMap, change: GitPullRequestChange) => (ChangeTrackingIdMap)} ChangeTrackingIdMapReducer
 */
/**
 * @template U
 * @template T
 * @typedef {(previous: Promise<void | U>, current: T) => Promise<void | U>} PromiseReducer
 */

/**
 * Establishes a connection to Azure DevOps instance.
 * @param {string} serverUrl
 * @param {string} authToken
 * @param {RequestOptions} [options]
 */
function connect(serverUrl, authToken, options) {
  const azdev = require("azure-devops-node-api");
  const authHandler = azdev.getPersonalAccessTokenHandler(authToken);
  const vsts = new azdev.WebApi(serverUrl, authHandler, options);
  return vsts.connect().then(() => vsts.getGitApi());
}

/**
 * Returns the item path (file path) of specified PR change, with the leading
 * '/' removed.
 * @param {GitPullRequestChange} change
 * @returns {string | undefined}
 */
function getItemPath(change) {
  if (!change.item || !change.item.path) {
    return undefined;
  }

  const itemPath = change.item.path;
  return itemPath.startsWith("/") ? itemPath.slice(1) : itemPath;
}

/**
 * Transforms specified comment to a `CommentThread`.
 * @param {Comment} comment
 * @param {number} iteration
 * @param {number} changeTrackingId
 * @returns {GitPullRequestCommentThread}
 */
function transformComment(
  { body, path, line, line_length, start_line },
  iteration,
  changeTrackingId
) {
  const COMMENT_THREAD_STATUS_ACTIVE = 1;
  const COMMENT_TYPE_TEXT = 1;
  return {
    comments: [{ content: body, commentType: COMMENT_TYPE_TEXT }],
    status: COMMENT_THREAD_STATUS_ACTIVE,
    threadContext: {
      filePath: path,
      rightFileEnd: {
        line,
        offset: line_length,
      },
      rightFileStart: start_line
        ? { line: start_line, offset: 1 }
        : { line, offset: 1 },
    },
    pullRequestThreadContext: {
      changeTrackingId,
      iterationContext: {
        firstComparingIteration: iteration,
        secondComparingIteration: iteration,
      },
    },
  };
}

/**
 * Submits a code review with suggestions with specified diff and options.
 * @param {string} diff
 * @param {RequestOptions} [options]
 */
function makeReview(diff, options) {
  const {
    AZURE_PERSONAL_ACCESS_TOKEN: authToken,
    BUILD_REPOSITORY_ID: repositoryId,
    SYSTEM_PULLREQUEST_PULLREQUESTID,
    SYSTEM_TEAMFOUNDATIONCOLLECTIONURI: serverUrl,
    SYSTEM_TEAMPROJECTID: project,
  } = process.env;
  if (
    !authToken ||
    !project ||
    !repositoryId ||
    !serverUrl ||
    !SYSTEM_PULLREQUEST_PULLREQUESTID
  ) {
    if (!authToken) {
      console.error(
        "`AZURE_PERSONAL_ACCESS_TOKEN` must be set to your Azure DevOps access token"
      );
    }
    if (!repositoryId) {
      console.error(
        "`BUILD_REPOSITORY_ID` should've been defined by Azure Pipelines"
      );
    }
    if (!SYSTEM_PULLREQUEST_PULLREQUESTID) {
      console.error(
        "`SYSTEM_PULLREQUEST_PULLREQUESTID` should've been defined by Azure Pipelines"
      );
    }
    if (!serverUrl) {
      console.error(
        "`SYSTEM_TEAMFOUNDATIONCOLLECTIONURI` should've been defined by Azure Pipelines"
      );
    }
    if (!project) {
      console.error(
        "`SYSTEM_TEAMPROJECTID` should've been defined by Azure Pipelines"
      );
    }
    return Promise.reject(
      new Error("One or several environment variables are missing")
    );
  }

  const { makeComments } = require("./makeComments");
  const comments = makeComments(diff);
  if (comments.length === 0) {
    return Promise.resolve();
  }

  const pullRequestId = parseInt(SYSTEM_PULLREQUEST_PULLREQUESTID);
  return connect(serverUrl, authToken, options)
    .then((gitApi) =>
      gitApi
        .getPullRequestIterations(repositoryId, pullRequestId, project, false)
        .then((iterations) => {
          const iterationId = iterations[iterations.length - 1].id || 1;
          return gitApi
            .getPullRequestIterationChanges(
              repositoryId,
              pullRequestId,
              iterationId
            )
            .then(({ changeEntries }) => {
              let latestChangeTrackingId = 1;
              const changes = !changeEntries
                ? {}
                : changeEntries.reduce(
                    /** @type {ChangeTrackingIdMapReducer} */
                    (changes, change) => {
                      const filePath = getItemPath(change);
                      if (filePath) {
                        const changeTrackingId = change.changeTrackingId || 1;
                        changes[filePath] = changeTrackingId;
                        if (changeTrackingId > latestChangeTrackingId) {
                          latestChangeTrackingId = changeTrackingId;
                        }
                      }
                      return changes;
                    },
                    {}
                  );
              return comments.reduce(
                /** @type {PromiseReducer<GitPullRequestCommentThread, Comment>} */
                (request, comment) => {
                  const changeTrackingId = changes[comment.path];
                  if (changeTrackingId == undefined) {
                    return request;
                  }
                  return request.then(() =>
                    gitApi.createThread(
                      transformComment(comment, iterationId, changeTrackingId),
                      repositoryId,
                      pullRequestId,
                      project
                    )
                  );
                },
                Promise.resolve()
              );
            });
        })
    )
    .catch((e) => console.error(e));
}

module.exports["getItemPath"] = getItemPath;
module.exports["makeReview"] = makeReview;
