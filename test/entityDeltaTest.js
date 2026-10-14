/* eslint-env mocha */
const assert = require('assert')
const [readEntityDelta, writeEntityDelta, sizeOfEntityDelta] = require('../src/datatypes/minecraft').entityDelta

function roundTrip (value) {
  const size = sizeOfEntityDelta(value)
  const buffer = Buffer.alloc(size)
  assert.strictEqual(writeEntityDelta(value, buffer, 0), size)
  const read = readEntityDelta(buffer, 0)
  assert.strictEqual(read.size, size)
  return { buffer, value: read.value }
}

describe('entityDelta (26.3 ClientboundMoveEntityPacket VecDelta)', () => {
  it('uses the flat 3x i16 layout for a single zero-tick step', () => {
    const value = { onGround: true, steps: [{ dX: 1, dY: -2, dZ: 300, ticks: 0 }] }
    const { buffer, value: read } = roundTrip(value)
    // properties varint 0b1 (onGround, stepCount 0) followed by 3x i16
    assert.strictEqual(buffer.toString('hex'), '010001fffe012c')
    assert.deepStrictEqual(read, value)
  })

  it('round-trips stepped deltas with their tick offsets', () => {
    const value = { onGround: false, steps: [{ dX: 1, dY: 2, dZ: 3, ticks: 1 }, { dX: -1, dY: -2, dZ: -3, ticks: 200 }] }
    const { buffer, value: read } = roundTrip(value)
    // properties = stepCount 2 << 1 | onGround 0
    assert.strictEqual(buffer[0], 4)
    assert.deepStrictEqual(read, value)
  })
})
