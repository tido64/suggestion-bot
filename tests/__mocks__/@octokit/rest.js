//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
"use strict";

class Octokit {
  constructor({ auth, createReview, request, setAuth }) {
    this.pulls = {
      createReview,
    };
    this.request = request;
    setAuth && setAuth(auth);
  }
}

exports.Octokit = Octokit;
