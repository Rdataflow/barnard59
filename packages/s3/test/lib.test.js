// @ts-check
import { strictEqual, deepEqual } from 'node:assert'
import { Readable } from 'node:stream'
import { S3Client } from '@aws-sdk/client-s3'
import { generateConfig, newClient } from '../lib/client.js'
import { toReadable, toString } from '../lib/streams.js'

describe('lib', async () => {
  describe('client', async () => {
    it('should be able to create a new client', async () => {
      const client = new S3Client()
      strictEqual(client instanceof S3Client, true)
    })

    it('should be able to create a new client using newClient', async () => {
      const client = newClient({})
      strictEqual(client instanceof S3Client, true)
    })

    it('should be able to generate a config with default values', async () => {
      const generatedConfig = generateConfig({})
      deepEqual(generatedConfig, {
        region: 'us-east-1',
      })
    })

    it('should be able to override default region', async () => {
      const generatedConfig = generateConfig({
        region: 'eu-central-1',
      })
      deepEqual(generatedConfig, {
        region: 'eu-central-1',
      })
    })

    it('should be able to forward authentication', async () => {
      const generatedConfig = generateConfig({
        endpoint: 'http://localhost',
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
        region: 'eu-central-1',
      })
      deepEqual(generatedConfig, {
        endpoint: 'http://localhost',
        credentials: {
          accessKeyId: 'accessKeyId',
          secretAccessKey: 'secretAccessKey',
        },
        region: 'eu-central-1',
      })
    })
  })

  describe('streams', () => {
    it('should handle errors in the webStream', (done) => {
      // Mock the reader and webStream
      const mockReader = {
        read: () => Promise.reject(new Error('Test error')),
      }
      const mockWebStream = {
        getReader: () => mockReader,
      }

      // Convert to Node.js readable stream
      const nodeStream = toReadable(mockWebStream)

      // Listen for the error event
      nodeStream.on('error', (err) => {
        try {
          strictEqual(err.message, 'Test error')
          done()
        } catch (error) {
          done(error)
        }
      })

      nodeStream.pipe(process.stdout)
    })

    it('should reject on stream error', async () => {
      // Create a mock Readable stream
      const mockStream = new Readable({
        read: () => { },
      })

      // Manually emit an error after a brief delay
      process.nextTick(() => {
        mockStream.emit('error', new Error('Test error'))
      })

      try {
        // Pass the mock stream to your function
        await toString(mockStream)
        throw new Error('Error was not thrown as expected')
      } catch (error) {
        // Assert the error
        strictEqual(error.message, 'Test error')
      }
    })
  })
})
