# suggestion-bot

![build](https://github.com/tido64/suggestion-bot/workflows/build/badge.svg)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/tido64/suggestion-bot.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/tido64/suggestion-bot/context:javascript)
[![codecov](https://codecov.io/gh/tido64/suggestion-bot/branch/master/graph/badge.svg)](https://codecov.io/gh/tido64/suggestion-bot)
[![npm version](https://badgen.net/npm/v/suggestion-bot)](https://www.npmjs.com/package/suggestion-bot)

`suggestion-bot` submits code reviews with suggestions based on your diffs.

![screenshot of code review with suggestions](docs/screenshot.png)

## Usage

```sh
suggestion-bot <diff>
```

Example:

```sh
# Submit current changes as suggestions
GITHUB_TOKEN=<secret> suggestion-bot "$(git diff)"

# Alternatively, pipe to suggestion-bot
# to avoid escape character issues
git diff | GITHUB_TOKEN=<secret> suggestion-bot
```

If your CI is hosted by Azure DevOps, replace `GITHUB_TOKEN` with
`AZURE_PERSONAL_ACCESS_TOKEN`.

## Requirements

- Host your code on [GitHub](https://github.com/)
- A GitHub
  [personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

-- or --

- Host your code on [Azure DevOps](https://dev.azure.com/)
- An Azure DevOps
  [personal access token](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops&tabs=preview-page)

## Recipes

- [Using `suggestion-bot` with GitHub Actions](#using-suggestion-bot-with-github-actions)
- [Using `suggestion-bot` with `clang-format`](#using-suggestion-bot-with-clang-format)
- [Using `suggestion-bot` with Prettier](#using-suggestion-bot-with-prettier)

### Using `suggestion-bot` with GitHub Actions

1. Install `suggestion-bot` in your project

   ```sh
   yarn add suggestion-bot --dev
   ```

2. Create a GitHub
   [personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

3. Create a new
   [secret for your repository](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets#creating-encrypted-secrets-for-a-repository).
   Set the name of your secret (e.g. `GH_TOKEN`), and your personal access token
   as value.

4. Configure your GitHub workflow so `suggestion-bot` can access the secret via
   an environment variable `GITHUB_TOKEN`, e.g.:

   ```yaml
   # .github/workflows/build.yml
   jobs:
     lint:
       runs-on: ubuntu-latest
       steps:
         - name: Set up Node.js
           uses: actions/setup-node@v1
           with:
             node-version: 12
         - name: Checkout
           uses: actions/checkout@v2
         - name: Install
           run: yarn
         - name: ClangFormat
           if: ${{ github.event_name == 'pull_request' }}
           env:
             GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
           run: scripts/clang-format-diff.sh | yarn suggestion-bot
   ```

### Using `suggestion-bot` with `clang-format`

Use
[`clang-format-diff`](https://clang.llvm.org/docs/ClangFormat.html#script-for-patch-reformatting)
to format only changed files:

```sh
curl --silent --show-error --remote-name https://raw.githubusercontent.com/llvm/llvm-project/release/10.x/clang/tools/clang-format/clang-format-diff.py
git diff --unified=0 --no-color @^ \
  | python clang-format-diff.py -p1 -regex '.*\.(cpp|cc|c\+\+|cxx|c|cl|h|hh|hpp|m|mm|inc)' -sort-includes \
  | yarn suggestion-bot
```

### Using `suggestion-bot` with Prettier

We must first write a script that pipes [Prettier](https://prettier.io/)'s
output to `diff` so we can feed it to `suggestion-bot` later.

```js
#!/usr/bin/env node

const { spawnSync } = require("child_process");
const fs = require("fs");
const prettier = require("prettier");

const diff = process.argv.slice(2).reduce((diff, filepath) => {
  const source = fs.readFileSync(filepath, { encoding: "utf8" });
  const { stdout } = spawnSync("diff", ["--unified", filepath, "-"], {
    input: prettier.format(source, { filepath }),
    encoding: "utf-8",
  });
  return diff + stdout;
}, "");

require("suggestion-bot")(diff);
```

Save the script somewhere, e.g. `scripts/prettier-diff.js`, then invoke it with
Node:

```sh
node scripts/prettier-diff.js $(git ls-files '*.js')
```
