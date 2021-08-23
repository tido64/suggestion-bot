//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// @ts-check

describe("trimQuotes", () => {
  const { trimQuotes } = require("../src/Helpers");

  test("trims only leading and trailing quotes", () => {
    expect(trimQuotes('""')).toBe("");
    expect(trimQuotes('"""')).toBe('"');
    expect(trimQuotes('""""')).toBe('""');
    expect(trimQuotes('"str"ing"')).toBe('str"ing');
    expect(trimQuotes('str"ing')).toBe('str"ing');

    expect(trimQuotes("''")).toBe("");
    expect(trimQuotes("'''")).toBe("'");
    expect(trimQuotes("''''")).toBe("''");
    expect(trimQuotes("'str'ing'")).toBe("str'ing");
    expect(trimQuotes("str'ing")).toBe("str'ing");
  });
});
