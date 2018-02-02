const debug = process.env.NODE_ENV !== 'production'
const dev = process.env.NODE_ENV === 'development'
const { join } = require('path')
const walkSync = require('walk-sync')
const _ = require('lodash')
const moment = require('moment-timezone')
const oak = require('oak')
const pug = require('pug')
const url = require('url')
const util = require('util')
const { existsSync } = require('fs')
const qs = require('querystring')
const tools = require('oak-tools')
const request = require('request')
const fs = require('graceful-fs')
const _setTimeout = require('safe-timers').setTimeout

const apiRoot = 'http://www.wsdot.wa.gov/ferries/api/schedule/rest'
const apiAccessCode = 'beae0283-3493-4760-9997-04b1c32a23e2'
const timezone = 'America/Los_Angeles'

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
/**
 * Setting this to yesterday will
 * force us to get new data when the app first starts
 * we will use unix timestamp as a standard of comparison
**/
let cacheDate = moment().subtract(1, 'days').tz(timezone).unix().valueOf()

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
        globs: ['*/*.js', '*/*/*.js']
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
        path: join(__dirname, '..', 'node_modules', 'lodash')
      },
      {
        name: 'moment',
        path: join(__dirname, '..', 'node_modules', 'moment')
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
    writeSchedules()
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

function writeSchedules () {
  let _this = this
  _this.settings = require(settingsPath + '.json')
  _this.routesLoaded = 0
  _this.sendStatusData = function () {
    let vesselWatchUrl = 'http://www.wsdot.com/ferries/vesselwatch/Vessels.ashx'
    let vesselStatus = {}
    request({url: vesselWatchUrl, json: true}, function (error, response, body) {
      body.vessellist.map(function (obj) {
        vesselStatus[obj.vesselID] = {
          'name': obj.name,
          'leftdock': obj.leftdock,
          'eta': obj.eta === 'Calculating' ? '' : obj.eta,
          'departDelayed': obj.departDelayed
        }
      })
      if (error) {
        logger.error({
          msg: 'Error getting vesselWatch data'
        })
      }
      window.send('loadStatus', {
        'data': vesselStatus
      })
      logger.debug({
        msg: 'Sent loadStatus'
      })
    })
  }
  _this.getSchedule = function (routeIndex, fileName, departingTerminalId, arrivingTerminalId, onlyRemaingTimes) {
    let cacheFlushUrl = util.format('%s/%s?apiaccesscode=%s', apiRoot, 'cacheflushdate', apiAccessCode)
    let flushDate = null
    /**
     * We will need to check the WSF api endpoint
     * to see when the last time they flushed the cache
     */
    request.get(cacheFlushUrl, function (error, response, body) {
      /** if we dont have an error we can assume we have an internet connection */
      if (!error) {
        flushDate = moment(JSON.parse(body)).tz(timezone).unix().valueOf()
      }
      let destinationUrl = join(publicPath, 'data', fileName)
      /**
       * If the new flush date is greater that our last cache and there is no
       * network error we will need to go get a new copy of the data
       */
      if (flushDate > cacheDate && !error) {
        let apiUrl = util.format('%s/%s/%s/%s/%s?apiaccesscode=%s', apiRoot, 'scheduletoday', departingTerminalId, arrivingTerminalId, onlyRemaingTimes, apiAccessCode)
        let fileStream = fs.createWriteStream(destinationUrl)
        request.get(apiUrl).pipe(fileStream)
        fileStream.on('finish', function (err) {
          cacheDate = moment().tz(timezone).unix().valueOf()
          logger.debug({
            msg: 'Wrote cache: ' + fileName
          })
          _this.sendData(routeIndex, destinationUrl, err)
        })
      } else {
        _this.sendData(routeIndex, destinationUrl)
      }
    })
  }
  _this.sendData = function (routeIndex, destinationUrl, err) {
    _this.routesLoaded ++
    if (!err) {
      let newTimes = _this.scrubScheduleTimes(routeIndex, destinationUrl)
      _this.settings.default.appInfo.routes[routeIndex].times = newTimes
    }
    if (_this.settings.default.appInfo.routes.length === _this.routesLoaded) {
      _this.settings.default.appInfo.currentTime = moment().tz(timezone).format('LLLL')
      window.send('loadSettings', {
        'data': _this.settings
      })
      logger.debug({
        msg: 'Sent loadSettings'
      })

      /**
       * We are using a timeout to avoid using setInterval
       * so we can repeat
       */
      _setTimeout(function (msg) {
        writeSchedules()
      }, 60000)
    }
  }
  _this.scrubScheduleTimes = function (routeIndex, destinationUrl) {
    let fullSchedule = require(destinationUrl)
    let foundIndex = -1
    let remainingTimes = fullSchedule.TerminalCombos[0].Times.map(
      function (obj, index) {
        let now = moment().tz(timezone).unix()
        let unixTime = moment(obj.DepartingTime).tz(timezone).unix()
        // console.log(moment(obj.DepartingTime).format('h:mm'))
        if (unixTime >= now) {
          if (foundIndex === -1) {
            foundIndex = index - 1
          }
        }
        return {
          'time': moment(obj.DepartingTime).tz(timezone).format('h:mm'),
          'index': index,
          'vesselId': obj.VesselID,
          'vesselName': obj.VesselName

        }
      })
    if (foundIndex === -1) {
      return [
        {
          'time': '&nbsp;',
          'status': ''
        },
        {
          'time': '',
          'status': 'No More Boats Today'
        },
        {
          'time': '&nbsp;',
          'status': ' '
        }
      ]
    }
    return remainingTimes.slice(foundIndex, Math.min(foundIndex + 3, remainingTimes.length - 1))
    // return remainingTimes.slice(0, Math.min(4, remainingTimes.length - 1))
  }

  for (let routeIndex in _this.settings.default.appInfo.routes) {
    let route = _this.settings.default.appInfo.routes[routeIndex]
    _this.getSchedule(routeIndex, route.fileName, route.departingTerminalId, route.arrivingTerminalId, route.onlyRemainingTimes)
  }
  _this.sendStatusData()
}
