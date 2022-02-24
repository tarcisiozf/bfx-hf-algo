'use strict'

const { Config } = require('bfx-api-node-core')
const { DUST } = Config
const { nBN } = require('@bitfinex/lib-js-util-math')
const { types: { OrderFilledSignal, CancelAllSignal } } = require('bfx-hf-signals')

/**
 * Called when an order is filled. Cancels any remaining open orders (slice or
 * excess), updates the remaining amount on the instance state, and submits
 * the next order set.
 *
 * @memberOf module:Iceberg
 * @listens AOHost~ordersOrderFill
 *
 * @param {AOInstance} instance - AO instance
 * @param {object} order - order that filled
 * @returns {Promise} p - resolves on completion
 */
const onOrdersOrderFill = async (instance = {}, order) => {
  const { state = {}, h = {} } = instance
  const { args = {}, orders = {}, gid } = state
  const { emit, updateState, debug, debouncedSubmitOrders, tracer } = h
  const { amount } = args
  const m = amount < 0 ? -1 : 1

  const fillSignal = tracer.collect(new OrderFilledSignal(order))

  tracer.collect(new CancelAllSignal(fillSignal))
  await emit('exec:order:cancel:all', gid, orders)

  const fillAmount = order.getLastFillAmount()
  fillSignal.meta.fillAmount = fillAmount

  const remainingAmount = nBN(instance.state.remainingAmount).minus(fillAmount).toNumber()
  const absRem = m < 0 ? remainingAmount * -1 : remainingAmount
  fillSignal.meta.remainingAmount = remainingAmount

  order.resetFilledAmount()

  debug('updated remaining amount: %f [filled %f]', remainingAmount, fillAmount)

  await updateState(instance, { remainingAmount })

  if (absRem > DUST) { // continue
    debouncedSubmitOrders(fillSignal) // created in life.start
    return
  }

  if (absRem < 0) {
    debug('warning: overfill! %f', absRem)
  }

  return emit('exec:stop', null, { origin: fillSignal })
}

module.exports = onOrdersOrderFill
