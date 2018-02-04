(function (wsfApp) {
  'use strict'

  wsfApp.controller('mainController', MainController)
  MainController.$inject = ['$window', '$log', '$rootScope', '$scope', '$interval', '$timeout', 'settings', 'oak', '_', 'moment']
  function MainController ($window, $log, $rootScope, $scope, $interval, $timeout, settings, oak, _, moment) {
    $scope.routes = []
    $scope.appName = ''
    $scope.showTimes = true
    $scope.timezone = "America/Los_Angeles"

    $window.oak.on('loadSettings', function (incoming) {
      console.log(incoming.data.default.appInfo)
      $scope.routes = incoming.data.default.appInfo.routes
      $scope.appName = incoming.data.default.appInfo.appName
      $scope.appSubTitle = incoming.data.default.appInfo.appSubTitle
      $scope.today = moment().tz($scope.timezone)
      console.log($scope.today.format("LLLL"))
    })
    $window.oak.on('loadStatus', function (incoming) {
      $scope.boatStatus = incoming.data
      console.log('boat status: ', $scope.boatStatus)
    })
    $window.oak.on('reloadPage', function () {
      console.log('reloading page: ')
      $window.oak.reload()
    })

    $interval(function () {
     // nothing has to happen here but dont take it out
    }, 100)

    $scope.splitTime = function (t) {
      if (t){
        var s = t.split(' ')
        return '<span class="hours-minutes">' + s[0] + '</span>' + '&nbsp;<span class="am-pm">' + s[1] + '</span>'  
      }
      return ''
    }

    $scope.isBoatGone = function(time, index){
      var boatTime = moment(time).tz($scope.timezone).unix().valueOf()
      var now = moment().tz($scope.timezone).unix().valueOf()
      if(boatTime <= now ){
        return true
      }

      return false

      

    }

    oak.ready()
  }
})(window.angular.module(window.appName))
