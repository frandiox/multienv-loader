[![Build Status](https://travis-ci.org/frandiox/multienv-loader.svg?branch=master)](https://travis-ci.org/frandiox/multienv-loader)
[![Coverage Status](https://coveralls.io/repos/github/frandiox/multienv-loader/badge.svg?branch=master)](https://coveralls.io/github/frandiox/multienv-loader?branch=master)

# Multienv Loader

> A configurable `.env` file loader for multiple environments inspired by [dotenv](https://github.com/motdotla/dotenv) and [vue-cli](https://github.com/vuejs/vue-cli)

## Installation

```bash
yarn add -D multienv-loader
```

```bash
npm install multienv-loader --save-dev
```

## Usage

At the top of your entry file:

```js
require('multienv-loader').load() // or load(options)
```

#### Options

- `options.mode`: Environment mode. Defaults to `process.env.NODE_ENV`
- `options.envPath`: Location of dotenv files. Defaults to `process.cwd()`
- `options.envFiles`: Array of dotenv filenames to load in order. Defaults to `['.env', '.env.[mode]', '.env.local', '.env.[mode].local']`
- `options.dry`: Does not modify `process.env`. Defaults to `false`
- `options.override`: Existing variables in `process.env` will be overriden by the dotenv files. Defaults to `false`

#### Recommended `.gitignore`

```
# Local Env Files
.env.local
.env.*.local
```

#### Other

Internal functions like `parse` or `safeLoad` are [also exposed](index.js).

## License

[MIT](LICENSE)
