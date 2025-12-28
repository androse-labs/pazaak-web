import { expect } from 'bun:test'

expect.extend({
  toUsuallyBe<T>(
    actualFn: unknown,
    expected: T,
    threshold = 0.75,
    iterations = 15,
  ) {
    if (typeof actualFn !== 'function') {
      return {
        pass: false,
        message: () =>
          `expected a function to execute, but got ${typeof actualFn}`,
      }
    }

    let matches = 0
    const valueCounts = new Map<string, { raw: any; count: number }>()

    for (let i = 0; i < iterations; i++) {
      const val = (actualFn as () => T)()
      const key = JSON.stringify(val)
      if (!valueCounts.has(key)) {
        valueCounts.set(key, { raw: val, count: 0 })
      }
      valueCounts.get(key)!.count += 1

      // Use deep equality for objects
      if (JSON.stringify(val) === JSON.stringify(expected)) matches++
    }

    const pass = matches / iterations >= threshold

    let mostCommon = null
    let highestCount = -1
    for (const [_, { raw, count }] of valueCounts.entries()) {
      if (JSON.stringify(raw) === JSON.stringify(expected)) continue
      if (count > highestCount) {
        mostCommon = raw
        highestCount = count
      }
    }

    return {
      pass,
      message: () =>
        pass
          ? `expected function not to usually return "${JSON.stringify(expected)}" (threshold: ${threshold}, iterations: ${iterations}), but got ${matches}.`
          : mostCommon !== null
            ? `expected function to usually return "${JSON.stringify(expected)}" (threshold: ${threshold}, iterations: ${iterations}), but it only did ${matches} times. Most common returned: ${JSON.stringify(mostCommon)} (${highestCount} times).`
            : `expected function to usually return "${JSON.stringify(expected)}" (threshold: ${threshold}, iterations: ${iterations}), but it only did ${matches} times.`,
    }
  },
})
