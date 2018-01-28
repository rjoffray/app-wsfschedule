const { join } = require('path')
const _ = require('lodash')
let _settings = require(join(__dirname, 'settings.json'))

class Settings {
  get appInfo () {
    return _settings.appInfo || 'none'
  }
  get all () {
    return _settings
  }
  get debug () {
    return process.env.NODE_ENV !== 'production'
  }
}

const settings = new Settings()

module.exports = settings
