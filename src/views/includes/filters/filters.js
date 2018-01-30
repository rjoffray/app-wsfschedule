window.angular.module('appWsfschedule')
  .filter('tel', function () {
    return function (number) {
      if (!number) return ''
      number = String(number)

      let formattedNumber = number
      let area = number.substring(0, 3)
      let front = number.substring(3, 6)
      let end = number.substring(6, 10)

      if (front) {
        formattedNumber = ('(' + area + ') ' + front)
      }
      if (end) {
        formattedNumber += ('-' + end)
      }
      return formattedNumber
    }
  })
  .filter('isDoubleByte', function () {
    return function (str) {
      for (var i = 0, n = str.length; i < n; i++) {
        if (str.charCodeAt(i) > 255) {
          return true
        }
      }
      return false
    }
  })
  .filter('jpg', function () {
    return function (str) {
      let jpg = str.substr(0, str.lastIndexOf('.')) + '.jpg'
      return window.encodeURIComponent(jpg)
    }
  })
  .filter('encodeHtmlEntities', function () {
    return function (str) {
      return str.replace(/[\u00A0-\u9999<>\&]/gim, function (i) { // eslint-disable-line
        return '&#' + i.charCodeAt(0) + ';'
      })
    }
  })
  .filter('html', function ($sce) {
    return function (text) {
      return $sce.trustAsHtml(text)
    }
  })
  .filter('orderObjectBy', function () {
    return function (items, field, reverse) {
      var filtered = []
      window.angular.forEach(items, function (item) {
        filtered.push(item)
      })
      filtered.sort(function (a, b) {
        return (a[field] > b[field] ? 1 : -1)
      })
      if (reverse) filtered.reverse()
      return filtered
    }
  })
