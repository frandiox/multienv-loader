# Multienv

> A configurable dotenv loader for multiple environments

## Installation

```
yarn add -D multienv # or npm install multienv --save-dev
```

## Usage

```
require('multienv').load(options)
```

#### Options

- `options.mode`: Environment mode. Defaults to `process.env.NODE_ENV`
- `options.envPath`: Location of dotenv files. Defaults to `process.cwd()`
- `options.envFiles`: Array of dotenv filenames to load. Defaults to `['.env', '.env.[mode]', '.env.local', '.env.[mode].local']`
- `options.dry`: Does not modify `process.env`. Defaults to `false`
- `options.override`: Existing variables in `process.env` will be overriden by the dotenv files. Defaults to `false`
