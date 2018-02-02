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
window.appName = 'appWsfschedule'
window.angular.module(window.appName, [
  'ngAnimate',
  'ngSanitize'
])
  .config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['self', 'http://www.wsdot.wa.gov/**'])
  })
  .constant('md5', window.md5)
  .constant('oak', window.oak)
  .constant('settings', window.settings)
  .constant('_', window.lodash)
  .constant('moment', window.moment)
  .constant('store', window.store)
  .run(function ($rootScope, $q) {
    $rootScope.settings = window.settings
    $rootScope._ = window.lodash
  })
