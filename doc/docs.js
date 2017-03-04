/**
 * Passes input through 0 pipes. Always returns the input.
 */
luigi([ ])

/**
 * Passes input through `foo`. Returns the return value of `foo`.
 */
luigi([ foo ])

/**
 * Passes input through `foo`, then passes the output of `foo` into `bar`.
 * Returns the output of `foo`.
 */
luigi([ foo, bar ])

/**
 * Passes the input into `foo`, then passes the output from `foo` into `bar`.
 * `baz` is also called, but with no arguments. Finally, `qux` is called with
 * the output from `bar`. Any output of `baz` is ignored.
 */
luigi([
  foo,
  [ bar, baz ],
  qux
])

/**
 * Passes the input into `foo`, then splits (duplicates) the output of `foo`
 * and sends it to both `foo` and `bar`. The pipeline returns the output of
 * `foo`.
 */
luigi([
  foo,
  split(),
  [ foo, bar ]
])

/**
 * Same as above, except that the output of `foo` is sent to 4 functions in the
 * next stage of the pipeline. The pipeline returns the output of `foo`.
 */
luigi([
  foo,
  split(4),
  [ foo, bar, baz, qux ]
])

/**
 * Passes the input into `foo` and `bar`, then passes the result of both
 * functions into `baz` using positional parameters. The pipeline returns the
 * output of `baz`.
 */
luigi([
  split(),
  [ foo, bar ],
  arity(2, baz)
])

/**
 * Splits the input into 4 streams, then calls `foo` with the first two streams
 * and `bar` with the next two. Returns the output of `foo`.
 */
luigi([
  split(4),
  [ arity(2, foo), arity(2, bar) ]
])

/**
 * Splits the input and sends it to the functions in the first stage of the
 * pipeline. The output of `foo` is passed as the sole input to `baz` and the
 * output of `bar` is passed through the pipeline without modification. `qux`
 * is called with the output of `baz` and `beer` is called with the output of
 * `bar`. The pipeline returns the output of `qux`.
 *
 * pass() is the same as split(1)!
 */
luigi([
  split(),
  [ foo, bar ],
  [ baz, pass() ],
  [ qux, beer ]
])
