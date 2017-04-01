const { describe, it } = require('mocha')
const { expect }       = require('code')
const sinon            = require('sinon')
const {
  stagepipe,
  split,
  arity,
  pass
} = require('../lib/stagepipe')

describe('stagepipe tests', () => {
  it('should return input through an empty stagepipe', () => {
    const fn = stagepipe([ ])
    return fn(5).then(out => expect(out).to.equal(5))
  })

  it('should transform a value using a single stage', () => {
    const fn = stagepipe([ addOne ])
    return fn(5).then(out => expect(out).to.equal(6))
  })

  it('should pass a value through multiple stages', () => {
    const fn = stagepipe([ addOne, addOne ])
    return fn(0).then(out => expect(out).to.equal(2))
  })

  describe('split', () => {
    it('should split the input into two streams', () => {
      const spy = sinon.spy()
      const fn = stagepipe([ split(), [ spy, spy ] ])
      return fn().then(() => expect(spy.callCount).to.equal(2))
    })

    it('should split the input into many streams', () => {
      const spy = sinon.spy()
      const fn = stagepipe([ split(4), [ spy, spy, spy, spy ] ])
      return fn().then(() => expect(spy.callCount).to.equal(4))
    })

    it('should pass the same input to each split recipient', () => {
      const spy = sinon.spy()
      const fn = stagepipe([ split(), [ spy, spy ] ])
      return fn(3.14).then(() => {
        expect(spy.calledWith(3.14)).to.be.true()
      })
    })
  })

  describe('pass', () => {
    it('should return its input', () => {
      const fn = stagepipe([ pass() ])
      return fn(5).then(output => expect(output).to.equal(5))
    })
  })

  describe('arity', () => {
    it('should pass multiple arguments to a pipe', () => {
      const spy = sinon.spy()
      const fn = stagepipe([ split(), arity(2, spy) ])
      return fn(42).then(() => {
        expect(spy.calledWith(42, 42)).to.be.true()
      })
    })

    it('should pass no arguments to a pipe', () => {
      const spy = sinon.spy()
      const fn = stagepipe([ arity(0, spy) ])
      return fn(42).then(() => {
        const args = spy.firstCall.args
        expect(args).to.have.length(0)
      })
    })

    it('should shift skipped arguments to subsequent pipes', () => {
      const spy = sinon.spy()
      const fn = stagepipe([ [ arity(0, noop), spy  ] ])
      return fn(42).then(() => {
        expect(spy.calledWith(42)).to.be.true()
      })
    })

    it('should join a previously split pipe', () => {
      const fn = stagepipe([
        split(2),
        [ pass(), () => 6 ],
        arity(2, (x, y) => x + y)
      ])
      return fn(12).then(out => expect(out).to.equal(18))
    })
  })
})

function noop() { }

function addOne(x) {
  return x + 1
}
