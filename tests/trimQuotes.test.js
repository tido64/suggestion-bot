const { trimQuotes } = require("../src/Helpers");

describe("trimQuotes", () => {
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
