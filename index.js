const path = require('path');
const arrify = require('arrify');
const formatter = require('stylelint').formatters.string
const runner = require('./lib/runner')
const emitter = require('./lib/emitter')

const defaultFiles = [
  '**/*.s?(c|a)ss'
]

class EasyStylelintPlugin {
  constructor (options = {}) {
    this.changesOnly = false
    this.ignoreFirstRun = false
    this.failOnError = false

    if (options.changesOnly) {
      this.changesOnly = options.changesOnly

      delete options.changesOnly
    }

    if (options.ignoreFirstRun) {
      this.ignoreFirstRun = options.ignoreFirstRun

      delete options.ignoreFirstRun
    }

    if (options.failOnError) {
      this.failOnError = options.failOnError

      delete options.failOnError
    }

    this.options = options
    this.errors = []
    this.warnings = []
  }

  apply (compiler) {
    const context = this.options.context || compiler.context

    const options = Object.assign({
      formatter
    }, this.options, {
      files: arrify(this.options.files || defaultFiles).map(file => path.resolve(context, file)),
      context
    })

    if (this.changesOnly) {
      const emitFn = emitter.bind(null, this, options, compiler)

      if (compiler.hooks) {
        compiler.hooks.emit.tapAsync('EasyStylelintPlugin', emitFn)
      } else {
        compiler.plugin('emit', emitFn)
      }
    } else {
      const runFn = runner.bind(null, this, options)

      if (compiler.hooks) {
        compiler.hooks.run.tapAsync('EasyStylelintPlugin', runFn)
        compiler.hooks.watchRun.tapAsync('EasyStylelintPlugin', runFn)
      } else {
        compiler.plugin('run', runFn)
        compiler.plugin('watch-run', (watcher, next) => runFn(watcher.compiler, next))
      }
    }
  }
}

module.exports = EasyStylelintPlugin
