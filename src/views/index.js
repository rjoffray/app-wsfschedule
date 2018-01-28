'use strict'

window.oak.webFrame.setVisualZoomLevelLimits(1, 1)
window.oak.on('newSession', function (id) {
  window.oak.session = id
})

window.reload = function () {
  window.oak.reload()
}

window.getScope = function () {
  let s = window.angular.element(document.getElementsByTagName('wrapper')).scope()
  return s
}

let app = window.angular
  .module('thd', [
    'ngAnimate',
    'ngIdle'
  ])
  .constant('uuid', window.uuid)
  .constant('md5', window.md5)
  .constant('oak', window.oak)
  .constant('settings', window.settings)
  .constant('_', window.lodash)
  .run(function ($rootScope, oakApi, $q) {
    $rootScope.settings = window.settings
    $rootScope._ = window.lodash
  })

window.angular.module('app-wsfschedule')
  .controller('mainController', function mainController ($rootScope, $scope, $transitions, $state, $analytics, $timeout, Idle, settings, uuid, oak, _) {
    oak.ready()
  })
