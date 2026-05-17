export function testKitGrind() {
  const worker = new Worker(
    new URL('./kitWorker.ts', import.meta.url),
    {
      type: 'module',
    }
  )

  worker.onmessage = (event) => {
    console.log('Kit worker result:', event.data)
  }

  worker.postMessage({
    pattern: 'CBS',
    endPattern: '',
    position: 'prefix',
    ignoreCase: true,
  })
}