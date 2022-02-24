/* eslint-env mocha */
'use strict'

const assert = require('assert')
const onLifeStop = require('../../../../lib/ma_crossover/events/life_stop')

describe('ma_crossover:events:life_stop', () => {
  const tracer = { collect: () => ({ meta: {} }) }

  it('cancels all orders when ma crossover algo stopped', async () => {
    let cancelledOrders = false

    await onLifeStop({
      h: {
        tracer,
        updateState: () => {},
        debug: () => {},
        emit: (eventName) => {
          if (eventName === 'exec:order:cancel:all') {
            cancelledOrders = true
          }
        }
      }
    })

    assert.ok(cancelledOrders, 'did not cancel all orders set by ma crossover algo')
  })

  it('does not cancel order when ma crossover algo stopped when option is passed to keep orders alive', async () => {
    let cancelledOrders = false

    await onLifeStop({
      h: {
        tracer,
        updateState: () => {},
        debug: () => {},
        emit: (eventName) => {
          if (eventName === 'exec:order:cancel:all') {
            cancelledOrders = true
          }
        }
      }
    }, { keepOrdersOpen: true })

    assert.deepStrictEqual(cancelledOrders, false, 'shouldn\'t have cancelled orders set by ma crossover algo')
  })
})
