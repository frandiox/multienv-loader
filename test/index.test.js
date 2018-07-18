const fs = require('fs')
const path = require('path')
const multienv = require('..')

const dotenvPath = path.resolve(__dirname, 'fixtures', '.env')
const dotenvContent = fs.readFileSync(dotenvPath, 'utf8')
const dry = true
const vars = { TEST1: 'TEST1', TEST2: 'TEST2' }
const cleanEnv = o => Object.keys(o).forEach(key => delete process.env[key])
Object.freeze(vars)

describe('multienv', () => {
  describe('parse', () => {
    it('correctly turns string into object', () => {
      const result = multienv.parse('A=1\nB=2\nC=3')
      expect(result).toHaveProperty('A', '1')
      expect(result).toHaveProperty('B', '2')
      expect(result).toHaveProperty('C', '3')
    })

    it('parses multiline values', () => {
      const result = multienv.parse('A=1\nB="1\\n2\\n3"\nC=3')
      expect(result).toHaveProperty('A', '1')
      expect(result).toHaveProperty('B', '1\n2\n3')
      expect(result).toHaveProperty('C', '3')
    })

    it('parses empty values', () => {
      const result = multienv.parse('A=1\nB=\nC=3')
      expect(result).toHaveProperty('A', '1')
      expect(result).toHaveProperty('B', '')
      expect(result).toHaveProperty('C', '3')
    })
  })

  describe('safeLoad', () => {
    let spyParse

    beforeAll(() => {
      spyParse = jest.spyOn(multienv, 'parse')
      spyParse.mockImplementation(() => vars)
    })

    afterAll(() => spyParse.mockRestore())
    beforeEach(() => spyParse.mockClear())

    it('reads files safely', () => {
      expect(() => multienv.safeLoad(dotenvPath)).not.toThrow()
      expect(spyParse).toHaveBeenCalledTimes(1)

      expect(() =>
        multienv.safeLoad(path.resolve(__dirname, 'fixtures', 'non-existing'))
      ).not.toThrow()
      expect(spyParse).toHaveBeenCalledTimes(1)
    })

    it('reads files and calls parser', () => {
      const res = multienv.safeLoad(dotenvPath)
      expect(res).toEqual(vars)
      expect(spyParse).toHaveBeenCalledTimes(1)
      expect(spyParse).toHaveBeenCalledWith(dotenvContent)
    })

    it('throws if the error is different from ENOENT', () => {
      const spyFs = jest.spyOn(fs, 'readFileSync')
      const enoentError = new Error('ENOENT')
      const randomError = new Error('Some random error')

      expect(() => multienv.safeLoad('non existing file')).not.toThrow()
      spyFs.mockImplementationOnce(() => {
        throw enoentError
      })
      expect(() => multienv.safeLoad()).not.toThrow()

      spyFs.mockImplementationOnce(() => {
        throw randomError
      })
      expect(() => multienv.safeLoad()).toThrow(randomError)

      expect(spyParse).not.toHaveBeenCalled()

      spyFs.mockRestore()
    })
  })

  describe('loadEnv', () => {
    const TEST3 = 'TEST3'
    const MODIFIED = 'modified'
    const ORIGINAL = 'original'
    const input = Object.freeze(Object.assign({ [TEST3]: MODIFIED }, vars))
    const res = expect.objectContaining(vars)

    beforeEach(() => {
      expect(process.env).not.toEqual(res)
      process.env.TEST3 = ORIGINAL
    })

    afterEach(() => cleanEnv(input))

    it('merges all the variables correctly in process.env without overriding', () => {
      multienv.loadEnv(input)

      expect(process.env).toEqual(res)
      expect(process.env).toHaveProperty(TEST3, ORIGINAL)
    })

    it('merges all the variables correctly in process.env overriding', () => {
      multienv.loadEnv(input, { override: true })

      expect(process.env).toEqual(res)
      expect(process.env).toHaveProperty(TEST3, MODIFIED)
    })
  })

  describe('load', () => {
    const envPath = path.resolve(__dirname, './fixtures')
    const mode = process.env.NODE_ENV || 'test'
    const envFiles = [
      '\\.env',
      `\\.env\\.${mode}`,
      '\\.env\\.local',
      `\\.env\\.${mode}.local`,
    ]
    const res = expect.objectContaining({
      FIRST: '111',
      SECOND: 'bbb',
      THIRD: 'ccc',
      FOURTH: '444',
      FIFTH: 'eee',
      SIXTH: '666',
    })

    it('loads base, mode and local dotenvs', () => {
      const spySafeLoad = jest.spyOn(multienv, 'safeLoad')
      spySafeLoad.mockImplementation(() => vars)

      expect(multienv.load({ envPath, mode, dry })).toEqual(vars)

      expect(spySafeLoad).toHaveBeenCalledTimes(envFiles.length)
      envFiles.forEach((envFile, index) => {
        expect(spySafeLoad).toHaveBeenNthCalledWith(
          index + 1,
          expect.stringMatching(new RegExp(`${envFile}$`))
        )
      })

      spySafeLoad.mockRestore()
    })

    it('works with default values', () => {
      const spySafeLoad = jest.spyOn(multienv, 'safeLoad')
      spySafeLoad.mockImplementation(() => null)

      const spyLoadEnv = jest.spyOn(multienv, 'loadEnv')
      spySafeLoad.mockImplementationOnce(() => null)

      const result = multienv.load()

      expect(spyLoadEnv).toHaveBeenCalledWith(result, { override: false })

      expect(spySafeLoad).toHaveBeenCalledTimes(envFiles.length)
      envFiles.forEach((envFile, index) => {
        expect(spySafeLoad).toHaveBeenNthCalledWith(
          index + 1,
          expect.stringMatching(new RegExp(`${envFile}$`))
        )
      })

      spySafeLoad.mockRestore()
    })

    it('merges all the dotenv files correctly in the returned value in DRY mode', () => {
      expect(process.env).not.toEqual(res)
      expect(multienv.load({ envPath, mode, dry })).toEqual(res)
      expect(process.env).not.toEqual(res)
    })

    it('merges all the dotenv files correctly in process.env', () => {
      expect(process.env).not.toEqual(res)
      const env = multienv.load({ envPath, mode })
      expect(env).toEqual(res)
      expect(process.env).toEqual(res)
      cleanEnv(env)
    })
  })
})
