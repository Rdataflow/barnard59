import { expect } from 'chai'
import rdf from '@zazuko/env'
import toCanonical from 'rdf-dataset-ext/toCanonical.js'
import { pipelineDefinitionLoader } from 'barnard59-test-support/loadPipelineDefinition.js'
import { desugarWith } from '../lib/cli.js'

const loadPipelineDefinition = pipelineDefinitionLoader(import.meta.url)

// test double for a fake context
const knownOperations = rdf.termMap([
  [rdf.namedNode('http://barnard59.zazuko.com/operations/concat'), rdf.namedNode('node:barnard59-base#concat')],
])

const check = async name => {
  const expected = await loadPipelineDefinition(`${name}-expected`)
  const pipeline = await loadPipelineDefinition(name)
  const sut = desugarWith({ knownOperations })

  const result = sut(pipeline)

  expect(toCanonical(result.dataset)).to.eq(toCanonical(expected.dataset))
}

describe('simplified syntax', () => {
  it('should desugar simplified syntax', async () => {
    await check('simplified-step-args')
  })
  it('should ignore empty arguments', async () => {
    await check('simplified-step-noargs')
  })
})
