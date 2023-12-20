import { strictEqual, ok } from 'assert'
import { expect } from 'chai'
import shell from 'shelljs'

const support = (new URL('./support', import.meta.url)).pathname
const cwd = new URL('..', import.meta.url).pathname

describe('cube validation pipeline', function () {
  this.timeout(10000)

  it('should run check-cube-observations pipeline without error', () => {
    const constraintFile = `${support}/constraint01.ttl`
    const command = `cat ${support}/observations01.ttl | barnard59 cube check-observations --constraint ${constraintFile}`

    const result = shell.exec(command, { silent: true, cwd })

    strictEqual(result.stderr, '')
    strictEqual(result.stdout, '')
    strictEqual(result.code, 0)
  })

  it('should run check-cube-observations pipeline with error', () => {
    const constraintFile = `${support}/constraint01.ttl`
    const command = `cat ${support}/observations02.ttl | barnard59 cube check-observations --constraint ${constraintFile} --maxViolations 1`

    const result = shell.exec(command, { silent: true, cwd })

    strictEqual(result.code, 1)
    expect(result.stderr).to.match(/1 violations found/)
    ok(result.stdout.includes('_:report <http://www.w3.org/ns/shacl#conforms> "false"^^<http://www.w3.org/2001/XMLSchema#boolean>'))
  })

  it('should run check-cube-observations when maxViolations is not exceeded', () => {
    const constraintFile = `${support}/constraint01.ttl`
    const command = `cat ${support}/observations02.ttl | barnard59 cube check-observations --constraint ${constraintFile}`

    const result = shell.exec(command, { silent: true, cwd })

    strictEqual(result.code, 1)
    expect(result.stderr).to.match(/1 violations found/)
    ok(result.stdout.includes('_:report <http://www.w3.org/ns/shacl#conforms> "false"^^<http://www.w3.org/2001/XMLSchema#boolean>'))
  })

  it('should run check-cube-observations pipeline with options', () => {
    const constraintFile = `${support}/constraint01.ttl`
    const command = `cat ${support}/observations01.ttl | barnard59 cube check-observations --constraint ${constraintFile} --maxViolations 1 --batchSize 1 --sortChunkSize 1`

    const result = shell.exec(command, { silent: true, cwd })

    strictEqual(result.stderr, '')
    strictEqual(result.stdout, '')
    strictEqual(result.code, 0)
  })
})
