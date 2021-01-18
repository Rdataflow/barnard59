const { describe, it } = require('mocha')
const assert = require('assert')
const path = require('path')
const sinon = require('sinon')
const iriResolve = require('rdf-loader-code/lib/iriResolve')
const proxyquire = require('proxyquire')
const parser = require('../lib/parser')

class ClownfaceMock {
  namedNode () {
    return null
  }

  has () {
    return null
  }

  in () {
    return null
  }

  out () {
    return null
  }

  list () {
    return null
  }
}

function generateGraphMock () {
  const pizzaSteps = sinon.createStubInstance(ClownfaceMock, {
    out: sinon.stub().returnsThis()
  })
  pizzaSteps.term = { value: null }
  const steps = [
    'operation1',
    'Turn on the oven',
    'operation2',
    'Put there frozen pizza',
    'operation3',
    'Wait 30 min',
    'operation4',
    'Enjoy!'
  ]
  sinon.stub(pizzaSteps, 'term').get(function getterFn () {
    return { value: steps.shift() }
  })

  const pancakeSteps = sinon.createStubInstance(ClownfaceMock, {
    out: sinon.stub().returnsThis()
  })
  pancakeSteps.term = { value: null }
  const steps2 = [
    'operation1',
    'Find a French chef',
    'operation2',
    'Ask them to make you pancakes'
  ]
  sinon.stub(pancakeSteps, 'term').get(function getterFn () {
    return { value: steps2.shift() }
  })

  const pancakesPipeline = sinon.createStubInstance(ClownfaceMock, {
    out: sinon.stub().returnsThis(),
    list: [pancakeSteps, pancakeSteps]
  })
  pancakesPipeline.term = { value: 'pancakes' }

  const pizzaPipeline = sinon.createStubInstance(ClownfaceMock, {
    out: sinon.stub().returnsThis(),
    list: [pizzaSteps, pizzaSteps, pizzaSteps, pizzaSteps]
  })
  pizzaPipeline.term = { value: 'pizza' }

  const graph = sinon.createStubInstance(ClownfaceMock, {
    has: [pizzaPipeline, pancakesPipeline]
  })
  return graph
}

describe('parser.getDependencies', () => {
  it('should create tree structure for codelinks', () => {
    const input = [
      { stepName: 'a', stepOperation: 'node:barnard59-base#fetch.json' },
      { stepName: 'b', stepOperation: 'node:barnard59-base#map' },
      { stepName: 'c', stepOperation: 'node:barnard59-formats#ntriples.serialize' },
      { stepName: 'd', stepOperation: 'file:awesomeModule#awesomeFunction' }
    ]
    const expected = {
      'node:': {
        'barnard59-base': new Set(['node:barnard59-base#fetch.json', 'node:barnard59-base#map']),
        'barnard59-formats': new Set(['node:barnard59-formats#ntriples.serialize'])
      },
      'file:': {
        [path.join(process.cwd(), 'awesomeModule')]: new Set(['file:awesomeModule#awesomeFunction'])
      }
    }
    const actual = parser.getDependencies(input)
    assert.deepStrictEqual(expected, actual)
  })

  it('should fail with noniterable input', () => {
    const input = 'node:barnard59-base#fetch.json'
    assert.throws(() => parser.getDependencies(input), TypeError)
  })

  it('should forward iriResolve error', () => {
    const input = [{ stepOperation: 'abc' }]
    try {
      iriResolve(input[0].stepOperation, process.cwd())
      assert.fail('The input is invalid')
    }
    catch (expectedError) {
      assert.throws(() => parser.getDependencies(input), expectedError)
    }
  })
})

describe('parser.getAllCodeLinks', () => {
  it('should transform dict values to set', () => {
    const input = {
      pancakes: ['flour', 'eggs', 'milk', 'olive oil'],
      brioche: ['flour', 'milk', 'butter', 'yeast']
    }
    const expected = new Set(['flour', 'eggs', 'milk', 'olive oil', 'butter', 'yeast'])
    const actual = parser.getAllCodeLinks(input)
    assert.deepStrictEqual(expected, actual)
  })
})

describe('parser.readGraph', () => {
  it('should read .ttl file and create DatasetCore object', async () => {
    const input = path.join(__dirname, 'example.ttl')
    const graph = await parser.readGraph(input)

    assert.strictEqual(graph.dataset.size, 4)
  })
})

describe('parser.getModuleOperationProperties', () => {
  // Mock input properties
  const ids = ['Christian Andersen', 'Johnny Bravo', 'Pikachu']
  const andersenNodes = [{
    term: {
      value: 'prefix/writer'
    }
  },
  {
    term: {
      value: 'prefix/Dannish'
    }
  }]
  const bravoNodes = [{
    term: {
      value: 'prefix/narcissist'
    }
  },
  {
    term: {
      value: 'prefix/womanizer'
    }
  }]
  const picachuNodes = []

  const graph = sinon.createStubInstance(ClownfaceMock, {
    namedNode: sinon.stub().returnsThis(),
    in: sinon.stub().returnsThis()
  })

  graph.out.onCall(0).returns(andersenNodes)
  graph.out.onCall(1).returns(bravoNodes)
  graph.out.onCall(2).returns(picachuNodes)

  it('should create properties tree for identifiers', () => {
    const actual = parser.getModuleOperationProperties(graph, ids)
    const expected = {
      'Christian Andersen': ['writer', 'Dannish'],
      'Johnny Bravo': ['narcissist', 'womanizer'],
      Pikachu: null
    }
    assert.deepStrictEqual(actual, expected)
  })
})

describe('parser.getIdentifiers', () => {
  it('should create pipelines list', () => {
    const input = generateGraphMock()
    const expected = {
      pizza: [
        { stepName: 'Turn on the oven', stepOperation: 'operation1' },
        { stepName: 'Put there frozen pizza', stepOperation: 'operation2' },
        { stepName: 'Wait 30 min', stepOperation: 'operation3' },
        { stepName: 'Enjoy!', stepOperation: 'operation4' }
      ],
      pancakes: [
        { stepName: 'Find a French chef', stepOperation: 'operation1' },
        { stepName: 'Ask them to make you pancakes', stepOperation: 'operation2' }
      ]
    }
    const actual = parser.getIdentifiers(input)
    assert.deepStrictEqual(actual, expected)
  })
  it('should return only requested pipeline', () => {
    const input = generateGraphMock()
    const expected = {
      pancakes: [
        { stepName: 'Find a French chef', stepOperation: 'operation1' },
        { stepName: 'Ask them to make you pancakes', stepOperation: 'operation2' }
      ]
    }
    const actual = parser.getIdentifiers(input, 'pancakes')
    assert.deepStrictEqual(actual, expected)
  })
  it('should return empty dict if pipeline does not exist', () => {
    const input = generateGraphMock()
    const expected = {}
    const actual = parser.getIdentifiers(input, 'inexistentPipeline')
    assert.deepStrictEqual(actual, expected)
  })
})

describe('parser.getAllOperationProperties', () => {
  const mock = {}
  const mockedParser = proxyquire('../lib/parser', {
    './utils': mock
  })
  it('should get operation properties from operations.ttl file', async () => {
    mock.removeFilePart = sinon.stub().returns('test')

    const input = {
      'node:': {
        // name of any installed module
        sinon: new Set(['node:party-module#dance', 'node:party-module#drink'])
      }
    }
    const expected = {
      'node:party-module#dance': null,
      'node:party-module#drink': ['Operation', 'Writable', 'Readable']
    }

    const actual = await mockedParser.getAllOperationProperties(input)
    assert.deepStrictEqual(actual, expected)
  })

  it("should return nulls if operation.ttl doesn't exist", async () => {
    mock.removeFilePart = sinon.stub().returns('inexistent-folder')

    const input = {
      'node:': {
        sinon: new Set(['node:party-module#dance', 'node:party-module#drink']),
        mocha: new Set(['node:work-module#code', 'node:work-module#sleep'])
      }
    }

    const expected = {
      'node:party-module#dance': null,
      'node:party-module#drink': null,
      'node:work-module#code': null,
      'node:work-module#sleep': null
    }

    const actual = await mockedParser.getAllOperationProperties(input)
    assert.deepStrictEqual(actual, expected)
  })

  it('should return properties for existing operations, and nulls for nonexisting ones', async () => {
    mock.removeFilePart = sinon.stub().returns('test')

    const input = {
      'node:': {
        sinon: new Set(['node:party-module#dance', 'node:party-module#drink']),
        mocha: new Set(['node:work-module#code', 'node:work-module#sleep'])
      }
    }

    const expected = {
      'node:party-module#dance': null,
      'node:party-module#drink': ['Operation', 'Writable', 'Readable'],
      'node:work-module#code': null,
      'node:work-module#sleep': null
    }

    const actual = await mockedParser.getAllOperationProperties(input)
    assert.deepStrictEqual(actual, expected)
  })
})
