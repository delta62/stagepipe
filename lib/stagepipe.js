const outputSymbol = Symbol('stagepipe.output')
const pipeSymbol   = Symbol('stagepipe.pipe')

function stagepipe(stages) {
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
  if (pipe[pipeSymbol]) return pipe
  return {
    [pipeSymbol]: true,
    arity:        1,
    fn:           pipe
  }
}

function makeStage(pipes) {
  if (!Array.isArray(pipes)) {
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
    try {
      let result = pipe.fn.apply(null, args)
      resolve(result)
    } catch (ex) {
      reject(ex)
    }
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

module.exports = {
  stagepipe,
  split,
  pass,
  arity,
  print
}
