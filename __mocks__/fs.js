//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
"use strict";

const fs = jest.genMockFromModule("fs");

let mockFiles = undefined;
fs.__setMockFiles = (newMockFiles) => {
  mockFiles = Object.create(null);
  for (var mock in newMockFiles) {
    mockFiles[mock] = newMockFiles[mock];
  }
};

fs.readFileSync = (filePath) => {
  return mockFiles[filePath];
};

module.exports = fs;
