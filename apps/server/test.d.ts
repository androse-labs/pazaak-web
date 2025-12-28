declare module 'bun:test' {
  interface Expect {
    toUsuallyBe<T>(expected: T, threshold?: number, iterations?: number): void
  }

  interface Matchers<R> {
    toUsuallyBe<T>(expected: T, threshold?: number, iterations?: number): R
  }
}
