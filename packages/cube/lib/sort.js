import { Readable, Duplex } from 'stream'
import { sort, compareOn, createStore } from 'external-merge-sort'

export function sortBySubject(sortChunkSize) {
  const write = async (chunk, filename) => {
    await this.env.toFile(Readable.from(chunk), filename)
    return this.env.fromFile(filename)
  }

  const comparer = compareOn(x => x.subject.value)
  const store = createStore(write, '.nt')
  const maxSize = Number(sortChunkSize)

  return Duplex.from(iterable => sort(iterable, { comparer, store, maxSize }))
}
