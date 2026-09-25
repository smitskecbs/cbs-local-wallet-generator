import { describe, expect, it, vi } from 'vitest'
import { SearchController } from './searchController'

describe('SearchController cancellation and races', () => {
  it('accepts only the first found wallet for the active search', () => {
    const onFound = vi.fn()
    const controller = new SearchController({
      onProgress: () => {},
      onFound,
      onError: () => {},
      onStopped: () => {},
    })

    controller.beginForTests(1)
    controller.handleWorkerMessageForTests({
      type: 'found',
      searchId: 1,
      publicKey: 'First',
      privateKey: 'pk1',
      secretKey: [1],
    })
    controller.handleWorkerMessageForTests({
      type: 'found',
      searchId: 1,
      publicKey: 'Second',
      privateKey: 'pk2',
      secretKey: [2],
    })

    expect(onFound).toHaveBeenCalledTimes(1)
    expect(onFound.mock.calls[0]?.[0]?.publicKey).toBe('First')
    expect(controller.hasAcceptedWinner).toBe(true)
  })

  it('aggregates progress deltas for the active search', () => {
    const controller = new SearchController({
      onProgress: () => {},
      onFound: () => {},
      onError: () => {},
      onStopped: () => {},
    })

    controller.beginForTests(7)
    controller.handleWorkerMessageForTests({
      type: 'progress',
      searchId: 7,
      attempts: 1000,
    })
    controller.handleWorkerMessageForTests({
      type: 'progress',
      searchId: 7,
      attempts: 500,
    })

    expect(controller.getAttemptCount()).toBe(1500)
  })

  it('ignores progress and found from stale search IDs', () => {
    const onFound = vi.fn()
    const controller = new SearchController({
      onProgress: () => {},
      onFound,
      onError: () => {},
      onStopped: () => {},
    })

    controller.beginForTests(2)
    controller.handleWorkerMessageForTests({
      type: 'progress',
      searchId: 1,
      attempts: 9999,
    })
    controller.handleWorkerMessageForTests({
      type: 'found',
      searchId: 1,
      publicKey: 'Stale',
      privateKey: 'pk',
      secretKey: [1],
    })

    expect(controller.getAttemptCount()).toBe(0)
    expect(onFound).not.toHaveBeenCalled()
  })

  it('stop prevents further progress updates and cleans workers', () => {
    const onStopped = vi.fn()
    const onProgress = vi.fn()
    const controller = new SearchController({
      onProgress,
      onFound: () => {},
      onError: () => {},
      onStopped,
    })

    controller.beginForTests(3)
    controller.handleWorkerMessageForTests({
      type: 'progress',
      searchId: 3,
      attempts: 100,
    })
    expect(controller.getAttemptCount()).toBe(100)

    controller.stop()
    expect(onStopped).toHaveBeenCalledWith(3)
    expect(controller.currentLifecycle).toBe('stopped')
    expect(controller.getActiveWorkerCountForTests()).toBe(0)

    controller.handleWorkerMessageForTests({
      type: 'progress',
      searchId: 3,
      attempts: 5000,
    })
    expect(controller.getAttemptCount()).toBe(100)
  })

  it('stop prevents found result from being accepted', () => {
    const onFound = vi.fn()
    const controller = new SearchController({
      onProgress: () => {},
      onFound,
      onError: () => {},
      onStopped: () => {},
    })

    controller.beginForTests(4)
    controller.stop()
    controller.handleWorkerMessageForTests({
      type: 'found',
      searchId: 4,
      publicKey: 'Late',
      privateKey: 'pk',
      secretKey: [1],
    })

    expect(onFound).not.toHaveBeenCalled()
  })

  it('second search after stop uses a new searchId and accepts its results', () => {
    const onFound = vi.fn()
    const controller = new SearchController({
      onProgress: () => {},
      onFound,
      onError: () => {},
      onStopped: () => {},
    })

    controller.beginForTests(10)
    controller.stop()

    controller.beginForTests(11)
    controller.handleWorkerMessageForTests({
      type: 'found',
      searchId: 11,
      publicKey: 'Fresh',
      privateKey: 'pk',
      secretKey: [2],
    })

    expect(onFound).toHaveBeenCalledTimes(1)
    expect(onFound.mock.calls[0]?.[0]?.publicKey).toBe('Fresh')
  })

  it('stop/found race: first found wins if it arrives while searching', () => {
    const onFound = vi.fn()
    const onStopped = vi.fn()
    const controller = new SearchController({
      onProgress: () => {},
      onFound,
      onError: () => {},
      onStopped,
    })

    controller.beginForTests(5)
    controller.handleWorkerMessageForTests({
      type: 'found',
      searchId: 5,
      publicKey: 'Winner',
      privateKey: 'pk',
      secretKey: [1],
    })
    controller.stop()

    expect(onFound).toHaveBeenCalledTimes(1)
    expect(onStopped).not.toHaveBeenCalled()
  })
})
