/**
 * @namespace dias.ui.utils
 * @ngdoc service
 * @name urlParams
 * @memberOf dias.ui.utils
 * @description Manages URL parameters after a #
 */
angular.module('dias.ui.utils').service('urlParams', function () {
      "use strict";

      var state = {};

      // transforms a URL parameter string like #a=1&b=2 to an object
      var decodeState = function () {
         var params = location.hash.replace('#', '').split('&');

         var state = {};

         params.forEach(function (param) {
            // capture key-value pairs
            var capture = param.match(/(.+)\=(.+)/);
            if (capture && capture.length === 3) {
               state[capture[1]] = decodeURIComponent(capture[2]);
            }
         });

         return state;
      };

      // transforms an object to a URL parameter string
      var encodeState = function (state) {
         var params = '';
         for (var key in state) {
            params += key + '=' + encodeURIComponent(state[key]) + '&';
         }
         return params.substring(0, params.length - 1);
      };

      this.pushState = function (s) {
         state.slug = s;
         history.pushState(state, '', state.slug + '#' + encodeState(state));
      };

      // sets a URL parameter and updates the history state
      this.set = function (params) {
         for (var key in params) {
            state[key] = params[key];
         }
         history.replaceState(state, '', state.slug + '#' + encodeState(state));
      };

      // returns a URL parameter
      this.get = function (key) {
         return state[key];
      };

      state = history.state;

      if (!state) {
         state = decodeState();
      }
   }
);
