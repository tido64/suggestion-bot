# suggestion-bot

![build](https://github.com/tido64/suggestion-bot/workflows/build/badge.svg)
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
GITHUB_TOKEN=<secret> suggestion-bot $(git diff)

# Alternatively
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
           run: yarn suggestion-bot $(scripts/clang-format-diff.sh)
   ```

### Using `suggestion-bot` with `clang-format`

Use
[`clang-format-diff`](https://clang.llvm.org/docs/ClangFormat.html#script-for-patch-reformatting)
to format only changed files:

```sh
curl --silent --show-error --remote-name https://raw.githubusercontent.com/llvm/llvm-project/release/10.x/clang/tools/clang-format/clang-format-diff.py
yarn suggestion-bot "$(git diff --unified=0 --no-color @^ | python clang-format-diff.py -p1 -sort-includes)"
```

### Using `suggestion-bot` with Prettier

We must first write a script that pipes [Prettier](https://prettier.io/)'s
output to `diff` so we can feed it to `suggestion-bot` later.

```sh
#!/bin/sh
for f in $(yarn --silent prettier --list-different $(git ls-files '*.js')); do
  yarn --silent prettier "$f" | diff -u "$f" -
done
```

Save the script somewhere, e.g. `scripts/prettier-diff.sh`, then use it as
follows:

```sh
yarn suggestion-bot "$(scripts/prettier-diff.sh)"
```
