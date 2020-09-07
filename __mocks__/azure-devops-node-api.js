//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

class WebApi {
  constructor(
    serverUrl,
    authHandler,
    { createThread, getPullRequestIterations, setAuthToken, setServerUrl }
  ) {
    this._getPullRequestIterations = getPullRequestIterations;
    this.createThread = createThread;
    setAuthToken && setAuthToken(authHandler);
    setServerUrl && setServerUrl(serverUrl);
  }

  connect() {
    return Promise.resolve();
  }

  getGitApi() {
    return this;
  }

  getPullRequestIterations(
    repositoryId,
    pullRequestId,
    project,
    includeCommits
  ) {
    return this._getPullRequestIterations
      ? this._getPullRequestIterations(
          repositoryId,
          pullRequestId,
          project,
          includeCommits
        )
      : Promise.resolve([1]);
  }
}

module.exports["getPersonalAccessTokenHandler"] = (authToken) => authToken;
module.exports["WebApi"] = WebApi;
