import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { expect } from 'vitest'
import { server } from './src/mocks/server'

expect.extend(matchers)

// jsdom does not implement HTMLDialogElement.showModal / close
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
} else {
  const nativeClose = HTMLDialogElement.prototype.close
  HTMLDialogElement.prototype.close = function (...args: unknown[]) {
    nativeClose.apply(this, args as [string?])
    this.dispatchEvent(new Event('close'))
  }
}

beforeAll(() => server.listen())

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())
