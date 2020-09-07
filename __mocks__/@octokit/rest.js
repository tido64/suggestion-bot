//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

class Octokit {
  constructor({ auth, createReview, setAuth }) {
    this.pulls = {
      createReview,
    };
    setAuth && setAuth(auth);
  }
}

module.exports["Octokit"] = Octokit;
