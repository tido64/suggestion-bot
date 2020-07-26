#!/usr/bin/env node

//
// Copyright (c) Tommy Nguyen
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//

const suggest = require("./src/index");
if (process.stdin.isTTY) {
  const { [2]: diff } = process.argv;
  suggest(diff);
} else {
  let data = "";
  const stdin = process.openStdin();
  stdin.setEncoding("utf8");
  stdin.on("data", (chunk) => {
    data += chunk;
  });
  stdin.on("end", () => suggest(data));
}
