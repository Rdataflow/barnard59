const autoDestroy = require('./autoDestroy')
const { Writable } = require('readable-stream')

class WritablePipeline extends Writable {
  constructor (pipeline, init) {
    super({
      objectMode: pipeline.writableObjectMode,
      write: async (chunk, encoding, callback) => {
        if (await init(this)) {
          pipeline.write(chunk, encoding, callback)
        }
      },
      final: async callback => {
        if (await init(this)) {
          pipeline.final(callback)
        }
      },
      destroy: (err, callback) => {
        pipeline.destroy(err, callback)
      }
    })

    autoDestroy(this)
  }
}

module.exports = WritablePipeline
