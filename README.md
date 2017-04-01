# Stagepipe

Stagepipe is an asynchronous flow control library for JavaScript applications.

Application code is organized into "stages" and "pipes", represented by a
multidimensional array. You can think of stages as the rows of the array and
pipes as the columns. The entire data structure is caled a "pipeline".

``` js
//    Pipe 1         Pipe 2
//      |              |
//      V              V
[
  [ getFirstName, getEmail      ], // <-- Stage 1
  [ upperCase,    validateEmail ], // <-- Stage 2
  [ greetUser,    sendPromo     ]  // <-- Stage 3
]
```

Each stage is executed in sequence until all stages are completed or an
unhandled exception occurs. Subsequent stages are not started until *all* pipes
in the current stage are completed. For example, suppose that `getEmail` in the
above example returned a promise that resolves after making an HTTP call to a
remote server. Stage 2 will not begin until that HTTP call comes back and the
data is ready.

The previous example could be called from code like so:

``` js
const { stagepipe } = require('stagepipe')

const pipes = // Contents from the previous example
const pipeline = stagepipe(pipes)

// Invoke the pipeline with a user ID as input
pipeline(userId)
  .then(() => console.log('Done!'))
  .catch(err => console.error(err))
```

Pipelines always have exactly one input and produce exactly one output. Because
of this, the first example is not valid and needs to be rewritten like so:

``` js
[
  [ split()                     ],
  [ getFirstName, getEmail      ],
  [ upperCase,    validateEmail ],
  [ greetUser,    sendPromo     ]
]
```

This pipeline takes its input and `split`s it into two pipes which produce the
same result. In the next stage, both `getFirstName` and `validateEmail` will
receive as input the data passed to the pipeline.

You can split streams into as many concurrent pipes as you'd like:

``` js
[
  [ split(4)                                               ],
  [ getFirstName, getEmail, getFavoriteColor, getBirthDate ]
]
```

Note that it *is* valid to terminate a pipeline with multipe pipes even though
only one output will be produced. In the previous example, the output of the
pipeline would be the output of the `getFirstName` function.

### Stages

Each stage is an array of pipes to execute. If a stage consists of only one pipe
you can omit the array notation for convenience:

``` js
[
  split(), // <-- There is only one pipe in this stage, don't need [ ]
  [ getFirstName, getEmail ] <-- Multiple pipes, must wrap in [ ]!
]
```

### Pipes

Pipe elements  are just functions. If a function returns a promise, the current
stage of the pipe will not be completed until the promise resolves. For any
other return value (including `undefined`), the result will be synchronously
passed to the next stage. In other words, if you're doing something async, you
need to return a `Promise`.

Data is fed through each pipe top to bottom, left to right. By default, each
function is assumed to have an arity of 1. If you need to call a function with
more than one argument (thus merging two pipes from the previous stage), use the
`arity` function.

``` js
[
  [ split()    ],
//   |\
//   |  \
//   |    \
  [ foo,   bar ],
//   |      |
  [ baz,   qux ],
//   |     /
//   |   /
//   |/
  arity(2, myFunc)
]
```

## API

- `stagepipe(pipeline)` Returns a function that will execute the given pipeline.
  The function takes as input the starting state of the pipeline and returns a
  promise that will resolve to the output value of the pipeline.
- `split([count=2])` Splits a pipe into `count` pipes.
- `pass()` A noop function that passes its input out to the next stage
- `arity(count, fn)` Joins two or more pipes into one by calling `fn` with
  outputs of the previous stage. If there are not enough outputs in the previous
  stage, `undefined` will be passed as the remaining argument values.
- `print([count=1])` A debugging utility. Prints the state of `count` pipes and
  passes the data along to the next stage.

## License

MIT
