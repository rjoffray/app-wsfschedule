'use strict'
window.angular.module('vgAnalytics', ['angulartics'])
  .directive(
    'vgAnalytics', ['$analytics', 'VG_STATES', function ($analytics, VG_STATES) {
      return {
        restrict: 'E',
        require: '^videogular',
        scope: {
          vgTrackInfo: '=?'
        },
        link: function (scope, elem, attr, API) {
          let info = null
          let currentState = null
          let totalMiliseconds = null
          let progressTracks = []

          scope.API = API

          scope.trackEvent = function trackEvent (eventName) {
            $analytics.eventTrack(eventName, info)
          }

          scope.onPlayerReady = function onPlayerReady (isReady) {
            if (isReady) {
              scope.trackEvent('ready')
            }
          }

          scope.onChangeState = function onChangeState (state) {
            currentState = state

            switch (state) {
              case VG_STATES.PLAY:
                if (scope.vgTrackInfo.events.play) {
                  scope.setValue(scope.vgTrackInfo.events.play)
                  scope.trackEvent('play')
                }
                break

              case VG_STATES.PAUSE:
                if (scope.vgTrackInfo.events.pause) {
                  scope.setValue(scope.vgTrackInfo.events.pause)
                  scope.trackEvent('pause')
                }
                break

              case VG_STATES.STOP:
                if (scope.vgTrackInfo.events.stop) {
                  scope.setValue(scope.vgTrackInfo.events.stop)
                  scope.trackEvent('stop')
                }
                break
            }
          }

          scope.onCompleteVideo = function onCompleteVideo (isCompleted) {
            if (isCompleted) {
              scope.trackEvent('complete')
            }
          }

          scope.onUpdateTime = function onUpdateTime (newCurrentTime) {
            if (progressTracks.length > 0 && newCurrentTime >= progressTracks[0].jump) {
              scope.trackEvent('progress ' + progressTracks[0].percent + '%')
              progressTracks.shift()
            }
          }

          scope.updateTrackInfo = function updateTrackInfo (newVal) {
            if (scope.vgTrackInfo.title) info.title = scope.vgTrackInfo.title
            if (scope.vgTrackInfo.id) info.id = scope.vgTrackInfo.id
          }

          scope.setValue = function setValue (eventType) {
            if (eventType) {
              if (eventType === 'percent') {
                if (API.totalTime > 1000) {
                  info.percent = Math.floor((API.currentTime / API.totalTime) * 100)
                } else {
                  info.percent = 0
                }
              } else if (eventType === 'time') {
                info.percent = Math.floor(API.currentTime / 1000)
              }
            }
          }

          scope.addWatchers = function () {
            if (scope.vgTrackInfo.title || scope.vgTrackInfo.id) {
              info = {}

              scope.updateTrackInfo(scope.vgTrackInfo)
            }

            scope.$watch('vgTrackInfo', scope.updateTrackInfo, true)

            // Add ready track event
            if (scope.vgTrackInfo.events.ready) {
              scope.$watch(
                function () {
                  return API.isReady
                },
                function (newVal, oldVal) {
                  scope.onPlayerReady(newVal)
                }
              )
            }

            // Add state track event
            if (scope.vgTrackInfo.events.play || scope.vgTrackInfo.events.pause || scope.vgTrackInfo.events.stop) {
              scope.$watch(
                function () {
                  return API.currentState
                },
                function (newVal, oldVal) {
                  if (newVal !== oldVal) scope.onChangeState(newVal)
                }
              )
            }

            // Add complete track event
            if (scope.vgTrackInfo.events.complete) {
              scope.$watch(
                function () {
                  return API.isCompleted
                },
                function (newVal, oldVal) {
                  scope.onCompleteVideo(newVal)
                }
              )
            }

            // Add progress track event
            if (scope.vgTrackInfo.events.progress) {
              scope.$watch(
                function () {
                  return API.currentTime
                },
                function (newVal, oldVal) {
                  scope.onUpdateTime(newVal / 1000)
                }
              )

              let totalTimeWatch = scope.$watch(
                function () {
                  return API.totalTime
                },
                function (newVal, oldVal) {
                  totalMiliseconds = newVal / 1000

                  if (totalMiliseconds > 0) {
                    let totalTracks = scope.vgTrackInfo.events.progress - 1
                    let progressJump = Math.floor(totalMiliseconds * scope.vgTrackInfo.events.progress / 100)

                    for (let i = 0; i < totalTracks; i++) {
                      progressTracks.push({
                        percent: (i + 1) * scope.vgTrackInfo.events.progress,
                        jump: (i + 1) * progressJump
                      })
                    }

                    totalTimeWatch()
                  }
                }
              )
            }
          }

          if (API.isConfig) {
            scope.$watch('API.config',
              function () {
                if (scope.API.config) {
                  scope.vgTrackInfo = scope.API.config.plugins.analytics
                  scope.addWatchers()
                }
              }
            )
          } else {
            scope.addWatchers()
          }
        }
      }
    }])
