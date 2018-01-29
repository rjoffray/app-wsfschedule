const debug = process.env.NODE_ENV !== 'production'
const dev = process.env.NODE_ENV === 'development'
const { join } = require('path')
const walkSync = require('walk-sync')
const _ = require('lodash')
const oak = require('oak')
const pug = require('pug')
const url = require('url')
const { existsSync } = require('fs')
const qs = require('querystring')
const tools = require('oak-tools')

// this prevents window dialog instances from popping up when something throws. This gets logged instead of blowing up in the UI.
oak.catchErrors()

const settingsPath = join(__dirname, 'settings')

const express = require('express')
const stylus = require('stylus')
const app = express()

const port = process.env.PORT ? _.toNumber(process.env.PORT) : 9999

const logger = tools.logger({
  level: debug ? 'debug' : 'info',
  pretty: debug
})

let publicPath = join(__dirname, 'public')
let viewsPath = join(__dirname, 'views')

app.set('views', viewsPath)
app.set('view engine', 'pug')
app.use(stylus.middleware({
  src: viewsPath,
  dest: publicPath
}))
app.use(express.static(publicPath))

app.get('/', function (req, res) {
  res.render('index')
})

// for partial templates
// angular ui-router will issue http requests for HTML route partials, this method compiles the .pug files and serves it back to ui.router
app.get('/tmpl/:name*', function ({ originalUrl }, res) {
  let orig = url.parse(originalUrl)
  let tmplPath = join(viewsPath, orig.pathname.replace('/tmpl/', '')) + '.pug'
  let query = qs.parse(orig.query)
  logger.debug({
    msg: 'template render',
    path: tmplPath
  })
  if (existsSync(tmplPath)) {
    res.send(pug.renderFile(tmplPath, query))
  } else {
    res.status(404).send('Template does not exist.')
  }
})

// serving up any spec files for the UI to use. This is useful for defining a swagger file around our own assets (which is the only spec right now)
app.get('/spec/:name', function ({ params }, res) {
  let spec = join(__dirname, 'spec', `${params.name}.json`)
  if (existsSync(spec)) {
    res.send(require(spec))
  } else {
    res.status(404).send('Spec does not exist.')
  }
})

// get all JS files inside the views folder (nested), load them all with index.js at the start
const jsFiles = _.map(
  [
    'index.js',
    ...(
      walkSync(viewsPath, {
        globs: ['*/*.js']
      })
    )
  ], v => join(viewsPath, v)
)

logger.debug({
  msg: 'client js files loaded',
  files: jsFiles
})

let window = null

app.listen(port, function () {
  oak.on('ready', () => {
    loadWindow()
  })
})

function loadWindow () {
  window = oak.load({
    url: `http://localhost:${port}/`,
    background: '#000000',
    sslExceptions: ['localhost'],
    /**
    * we load nearly all of our client side code here, including node modules that are useful.
    * Regarding the scripts property of `oak.load`, `name` is exposed to `window.foo` in the client side, and path is the direct `require()` path.
    * Some of the node modules required are built specifically for the browser, so we can just issue the path and let the script determine its own window namespace.
    **/
    scripts: [
      {
        name: 'settings',
        path: settingsPath
      },
      {
        name: 'lodash',
        path: 'lodash'
      },
      {
        name: 'moment',
        path: 'moment'
      },
      {
        name: 'uuid',
        path: 'uuid'
      },
      {
        name: 'async',
        path: 'async'
      },
      {
        name: 'tools',
        path: 'oak-tools'
      },
      join(__dirname, '..', 'node_modules', 'angular'),
      join(__dirname, '..', 'node_modules', 'angular-animate'),
      join(__dirname, '..', 'node_modules', 'angular-sanitize'),
      ...jsFiles
    ]
  })
  .on('ready', function () {
    window.send('newSession', window.session)
    if (dev) {
      window.debug()
    }
  })
  .on('log.*', function (props) {
    logger[this.event.replace('log.', '')](props)
  })
  .on('unresponsive', function () {
    reloadIt('renderer unresponsive')
  })
  .on('crashed', function () {
    reloadIt('renderer unresponsive')
  })
}

function reloadIt (err) {
  let oldWindow = window
  logger.error(new Error(err))
  loadWindow()
  oldWindow.close()
}
