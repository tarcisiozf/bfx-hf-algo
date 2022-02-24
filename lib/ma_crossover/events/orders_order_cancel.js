'use strict'

const { OrderCancelledSignal } = require('bfx-hf-signals/lib/types')

/**
 * Triggered when an atomic order cancellation is detected, cancels any open
 * orders and emits the `'exec:stop'` event.
 *
 * @memberOf module:MACrossover
 * @listens AOHost~ordersOrderCancel
 *
 * @param {AOInstance} instance - AO instance
 * @param {object} order - order that was cancelled
 * @returns {Promise} p - resolves on completion
 */
const onOrdersOrderCancel = async (instance = {}, order) => {
  const { h = {} } = instance
  const { emit, debug, tracer } = h

  debug('detected atomic cancellation, stopping...')

  const signal = tracer.collect(new OrderCancelledSignal(order))

  return emit('exec:stop', null, { keepOrdersOpen: false, origin: signal })
}

module.exports = onOrdersOrderCancel
