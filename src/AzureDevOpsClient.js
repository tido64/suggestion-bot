//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

/**
 * @typedef {{
     path: string;
     line: number;
     line_length: number;
     side: "LEFT" | "RIGHT";
     start_line?: number;
     start_side?: "LEFT" | "RIGHT";
     body: string;
   }} Comment
 * @typedef {import("azure-devops-node-api/interfaces/common/VsoBaseInterfaces").IRequestOptions} RequestOptions
 * @typedef {import("azure-devops-node-api/interfaces/GitInterfaces").GitPullRequestChange} GitPullRequestChange
 * @typedef {import("azure-devops-node-api/interfaces/GitInterfaces").GitPullRequestCommentThread} GitPullRequestCommentThread
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
  const { makeComments } = require("./makeComments");
  const comments = makeComments(diff);
  if (comments.length === 0) {
    return Promise.resolve();
  }

  const { env } = process;
  const authToken = env["AZURE_PERSONAL_ACCESS_TOKEN"];
  const repositoryId = env["BUILD_REPOSITORY_ID"];
  const pullRequestId = parseInt(env["SYSTEM_PULLREQUEST_PULLREQUESTID"]);
  const serverUrl = env["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"];
  const project = env["SYSTEM_TEAMPROJECTID"];

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
              const changes = changeEntries.reduce(
                /** @type {(changes: { [filePath: string]: number }, change: GitPullRequestChange) => ({ [filePath: string]: number })} */
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
              return comments
                .map((comment) =>
                  transformComment(
                    comment,
                    iterationId,
                    changes[comment.path] || latestChangeTrackingId
                  )
                )
                .reduce(
                  (request, commentThread) =>
                    request.then(() =>
                      gitApi.createThread(
                        commentThread,
                        repositoryId,
                        pullRequestId,
                        project
                      )
                    ),
                  Promise.resolve()
                );
            });
        })
    )
    .catch((e) => console.error(e));
}

module.exports["getItemPath"] = getItemPath;
module.exports["makeReview"] = makeReview;
