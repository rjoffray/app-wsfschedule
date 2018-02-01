(function(wsfApp) {
  'use strict';

  wsfApp.controller('mainController',MainController);
  MainController.$inject = ["$window", "$log", "$rootScope", "$scope", "$interval", "$timeout", "settings", "oak", "_", "moment"]
  function MainController($window, $log, $rootScope, $scope, $interval, $timeout, settings, oak, _, moment) {
    $scope.routes = []
    $scope.appName = ""
    
    $window.oak.on('loadSettings', function(incoming){
      console.log(incoming)
      $scope.routes = incoming.data.default.appInfo.routes
      $scope.appName = incoming.data.default.appInfo.appName
      $scope.today = incoming.data.default.appInfo.currentTime
    })

    $interval(function() {
     //nothing has to happen here but dont take it out
    }, 100)

    oak.ready()
  }
})(window.angular.module(window.appName))
