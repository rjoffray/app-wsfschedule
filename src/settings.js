const { join } = require('path')
const _ = require('lodash')
let _settings = require(join(__dirname, 'settings.json'))

class Settings {
  get category () {
    return process.env.CATEGORY || _settings.category || 'electrical'
  }
  get physicalAisle () {
    return process.env.PHYSICAL_AISLE || _settings.physical_aisle || '3'
  }
  get store () {
    return _.toNumber(process.env.STORE || _settings.store || '1777')
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
