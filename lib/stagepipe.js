const outputSymbol = Symbol('stagepipe.output')
const pipeSymbol   = Symbol('stagepipe.pipe')

function stagepipe(stages) {
  invariant(Array.isArray(stages), 'Pipeline must be an array')

  return input => {
    input = makeOutput([ input ])

    let ret = Promise.resolve(input)
    stages.forEach(pipes => {
      ret = ret.then(makeStage(pipes))
    })

    return ret.then(unwrapOutput)
  }
}

function makeOutput(outputs) {
  if (outputs && outputs[outputSymbol]) return outputs
  return {
    [outputSymbol]: true,
    outputs
  }
}

function unwrapOutput(output) {
  return output.outputs[0]
}

function makePipe(pipe) {
  const isValid = pipe[pipeSymbol] || typeof pipe === 'function'
  invariant(isValid, 'Pipes must be functions')
  if (pipe[pipeSymbol]) return pipe
  return {
    [pipeSymbol]: true,
    arity:        1,
    fn:           pipe
  }
}

function makeStage(pipes) {
  if (!Array.isArray(pipes)) {
    const isValid = typeof pipes === 'function' || pipes[pipeSymbol]
    const msg = 'Invalid stage. Stages must be arrays of functions or a ' +
      `single function, but this stage is a ${typeof pipes}`
    invariant(isValid, msg)
    pipes = [ pipes ]
  }

  pipes = pipes.map(makePipe)

  return pipeData => {
    let usedPipes = 0
    let promises = pipes.map(pipe => {
      let arity = pipe.arity
      let input = pipeData.outputs.slice(usedPipes, usedPipes + arity)
      usedPipes += arity
      return executePipe(pipe, input)
    })

    return Promise.all(promises)
      .then(outputs => {
        return outputs.map(output => {
          return output && output[outputSymbol] ? output : makeOutput(output)
        })
      })
      .then(outputs => {
        return outputs.reduce((acc, output) => {
          return acc.concat(output.outputs)
        }, [ ])
      })
      .then(makeOutput)
  }
}

function executePipe(pipe, args) {
  return new Promise((resolve, reject) => {
    const result = pipe.fn.apply(null, args)
    result === undefined
      ? reject(new StagepipeError('Pipe returned undefined'))
      : resolve(result)
  })
}

function arity(num, fn) {
  return {
    [pipeSymbol]: true,
    arity:         num,
    fn
  }
}

function split(count = 2) {
  return input => {
    const outputs = new Array(count).fill(null).map(() => input)
    return {
      [outputSymbol]: true,
      outputs
    }
  }
}

function pass() {
  return split(1)
}

function print(count = 1) {
  return {
    [pipeSymbol]: true,
    arity:        count,
    fn: (...inputs) => {
      console.log(inputs)
      return {
        [outputSymbol]: true,
        outputs: inputs
      }
    }
  }
}

function StagepipeError() {
  const tmp = Error.apply(this, arguments)
  tmp.name = this.name = 'StagepipeError'
  this.message = tmp.message
  Object.defineProperty(this, 'stack', {
    get: () => tmp.stack,
    configurable: true
  })
}
StagepipeError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: StagepipeError,
    writable: true,
    configurable: true
  }
})

function invariant(condition, message) {
  if (condition !== true) {
    throw new StagepipeError(message)
  }
}

module.exports = {
  stagepipe,
  split,
  pass,
  arity,
  print,
  StagepipeError
}
