const SerialPort = require('serialport')
const _ = require('lodash')
const async = require('async')
var devices = []

function init (config, cb = function () {}) {
  // example device
  // comName: '/dev/ttyACM1',
  // manufacturer: 'OAK',
  // serialNumber: 'OAK_LIGHT',
  // pnpId: 'usb-OAK_LIGHT-if00',
  // vendorId: '0x1b4f',
  // productId: '0x8d21'
  SerialPort.list((err, ports) => {
    if (err) console.error(err)
    devices = _(ports)
      .chain()
      .filter(d => {
        return (
          d.serialNumber === 'OAK_LIGHT'
        ) || (
          _.isString(d.serialNumber) && d.serialNumber.indexOf('OAK_LIGHT') !== -1
        ) || (
          d.manufacturer === 'OAK' && d.productId === 'LIGHT'
        )
      })
      .map(function (d) {
        return new SerialPort(
          d.comName,
          {
            autoOpen: true,
            baudRate: 115200
          }
        )
      })
      .value()
  })
}

function getDevices () {
  return devices
}

function open (cb = function () {}) {
  async.each(function (d, _cb) {
    if (!d.isOpen()) {
      d.open(_cb)
    }
  }, cb)
}

function change ({ r = 0, g = 0, b = 0, w = 0, dur = 1000 } = {}, cb = function () {}) {
  let toWrite = [r, g, b, w, dur].join(',')
  async.each(devices, function (device, next) {
    if (!device.isOpen()) return next()
    device.write(toWrite, next)
  }, cb)
}

function close (cb = function () {}) {
  async.each(devices, function (device, next) {
    device.close(next)
  }, cb)
}

init()

module.exports = { init, change, open, close, getDevices }
