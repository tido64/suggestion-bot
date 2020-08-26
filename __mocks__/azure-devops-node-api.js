//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

class WebApi {
  constructor(_, __, { createThread }) {
    this.createThread = createThread;
  }

  connect() {
    return Promise.resolve();
  }

  getGitApi() {
    return this;
  }

  getPullRequestIterations() {
    return Promise.resolve([1]);
  }
}

module.exports.getPersonalAccessTokenHandler = (authToken) => authToken;
module.exports.WebApi = WebApi;
