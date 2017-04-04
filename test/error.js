const { describe, it } = require('mocha')
const { expect } = require('code')
const { stagepipe, StagepipeError } = require('../lib/stagepipe')

describe('StagepipeError', () => {
  it('should extend Error', () => {
    const err = new StagepipeError('Something terrible has happened!')
    expect(err).to.be.instanceOf(Error)
  })

  it('should have a message property', () => {
    try {
      throw new StagepipeError('Ah, crap!')
    } catch (err) {
      expect(err.message).to.equal('Ah, crap!')
    }
  })

  it('should have a stack property', () => {
    try {
      throw new StagepipeError('Oh noes')
    } catch (err) {
      expect(err.stack).to.be.a.string()
    }
  })
})

describe('invalid pipelines', () => {
  it('should throw when the pipeline is not an array', () => {
    expect(() => stagepipe('hi')()).to.throw(StagepipeError)
  })

  it('should throw when given a non-function, non-array object', () => {
    expect(() => stagepipe([ 'hi' ])()).to.throw(StagepipeError)
  })

  it('should throw when given a non-function as a stage function', () => {
    const pipes = [ 'hi' ]
    expect(() => stagepipe([ pipes ])()).to.throw(StagepipeError)
  })

  it('should throw when a pipe returns undefined', done => {
    const pipeline = [ () => undefined ]
    stagepipe(pipeline)()
      .catch(err => {
        expect(err).to.be.instanceOf(StagepipeError)
        done()
      })
  })
})
