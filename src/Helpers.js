module.exports = {
  /**
   * Concatenates specified strings.
   * @param {string[]} strings
   * @returns {string}
   */
  concatStrings: (...strings) => {
    return strings.concat("").join("\n");
  },

  /**
   * Trims specified string for wrapping quotation marks.
   * @param {string} p
   * @returns {string}
   */
  trimQuotes: (p) => {
    if (
      (p.startsWith('"') && p.endsWith('"')) ||
      (p.startsWith("'") && p.endsWith("'"))
    ) {
      return p.slice(1, p.length - 1);
    }
    return p;
  },
};
