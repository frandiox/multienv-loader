/* MULTIENV LOADER: dotenv loader for multiple environments */
/* Loads env variables from dotenv files: .env, .env.[NODE_ENV], .env.local, .env.[NODE_ENV].local */

const fs = require('fs')
const path = require('path')

const multienv = {}

/**
 * @description Main entry point. Loads env variables from dotenv files
 * @param {Object=} options
 * @param {String=} options.mode Mode provided in `process.env.NODE_END`
 * @param {String=} options.envPath Path of the dotenv files. Defaults to `process.cwd()`
 * @param {Array=} options.envFiles Array of env files to load. Defaults to `['.env', '.env.[mode]', '.env.local', '.env.[mode].local']`
 * @param {Boolean=} options.dry Whether it should modify `process.env` or just return the result
 * @param {Boolean=} options.override Whether it should override variables already defined in `process.env`
 * @param {function=} options.filter Use variable only if filter returns `true`
 * @return {Object} Object containing all the key:value from the src files
 */
multienv.load = function({
  mode = process.env.NODE_ENV || '',
  envPath = process.cwd(),
  envFiles = ['.env', `.env.${mode}`, '.env.local', `.env.${mode}.local`],
  dry = false,
  override = false,
  filter,
} = {}) {
  const env = Object.assign.apply(
    null,
    [{}].concat(
      envFiles.map(envFile => multienv.safeLoad(path.resolve(envPath, envFile)))
    )
  )

  if (!dry) multienv.loadEnv(env, { override, filter })

  return env
}

/**
 * @description Loads the given dotenv safely, silently ignoring non existing files
 * @param {String} path Dotenv file path to load
 * @return {Object} Object containing all the key:value from the src
 */
multienv.safeLoad = function(path = '.env') {
  try {
    const content = fs.readFileSync(path, 'utf-8')
    return multienv.parse(content)
  } catch (err) {
    // only ignore error if file is not found
    if (err.toString().indexOf('ENOENT') < 0) {
      throw err
    }

    return {}
  }
}

/**
 * @description Loads the given env variables
 * @param {Object} env Object containing all the key:value from the src
 * @param {Object=} options
 * @param {Boolean=} options.override Whether it should override variables already defined in `process.env`
 * @param {function=} options.filter Use only variables that if the filter returns true
 */
multienv.loadEnv = function(env, { override, filter = () => true } = {}) {
  Object.keys(env).forEach(key => {
    if ((override || process.env[key] === undefined) && filter(key)) {
      process.env[key] = env[key]
    }
  })
}

/**
 * @description Parses a dotenv-like string into an object
 * @param {String} src Content of a dotenv file (`key=value` lines)
 * @return {Object} Object containing all the key:value from the src
 */
multienv.parse = function(src = '') {
  const res = {}
  src.split('\n').forEach(line => {
    // matching "KEY' and 'VAL' in 'KEY=VAL'
    const keyValueArr = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    // matched?
    if (keyValueArr != null) {
      const key = keyValueArr[1]
      let value = keyValueArr[2] || ''

      // expand newlines in quoted values
      const len = value ? value.length : 0
      if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {
        value = value.replace(/\\n/gm, '\n')
      }

      // remove any surrounding quotes and extra spaces
      value = value.replace(/(^['"]|['"]$)/g, '').trim()

      res[key] = value
    }
  })

  return res
}

module.exports = multienv
