//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
"use strict";

describe("getItemPath", () => {
  const { getItemPath } = require("../src/AzureDevOpsClient");

  test("returns `undefined` when missing item path", () => {
    expect(getItemPath({})).toBeUndefined();
    expect(getItemPath({ item: {} })).toBeUndefined();
    expect(getItemPath({ item: { path: "" } })).toBeUndefined();
  });

  test("trims leading '/' from item path", () => {
    expect(
      getItemPath({ item: { path: "tests/AzureDevOpsClient.test.js" } })
    ).toBe("tests/AzureDevOpsClient.test.js");
    expect(
      getItemPath({ item: { path: "/tests/AzureDevOpsClient.test.js" } })
    ).toBe("tests/AzureDevOpsClient.test.js");
    expect(
      getItemPath({ item: { path: "//tests/AzureDevOpsClient.test.js" } })
    ).toBe("/tests/AzureDevOpsClient.test.js");
  });
});
