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

window.angular
  .module('appWsfschedule', [
    'ngAnimate',
    'ngSanitize'
  ])
  .constant('uuid', window.uuid)
  .constant('md5', window.md5)
  .constant('oak', window.oak)
  .constant('settings', window.settings)
  .constant('_', window.lodash)
  .constant('moment', window.moment)
  .run(function ($rootScope, $q) {
    $rootScope.settings = window.settings
    $rootScope._ = window.lodash
  }).controller('mainController', function mainController ($rootScope, $scope, $interval, $timeout, settings, uuid, oak, _, moment) {
    function updateTime () {
      $scope.today = moment().format('LLLL')
    }

    $interval(function () {
      updateTime()
    }, 200)

    $scope.routes = [
      {
        'terminal': 'North Terminal',
        'destination': 'Fauntleroy (West Seattle)',
        'times': [
          {
            'time': '9:00',
            'status': ''
          },
          {
            'time': '9:40',
            'status': ''
          },
          {
            'time': '10:15',
            'status': ''
          }
        ]
      },
      {
        'terminal': 'North Terminal',
        'destination': 'Southworth (Kitsap Peninsula)',
        'times': [
          {
            'time': '9:30',
            'status': ''
          },
          {
            'time': '9:55',
            'status': ''
          },
          {
            'time': '10:45',
            'status': ''
          }
        ]
      },
      {
        'terminal': 'South Terminal',
        'destination': 'Point Defiance (Tacoma)',
        'times': [
          {
            'time': '9:15',
            'status': ''
          },
          {
            'time': '10:10',
            'status': ''
          },
          {
            'time': '10:55',
            'status': ''
          }
        ]
      }
    ]
    oak.ready()
  })
