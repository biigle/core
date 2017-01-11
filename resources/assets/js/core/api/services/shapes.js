/**
 * @namespace biigle.api
 * @ngdoc service
 * @name shapes
 * @memberOf biigle.api
 * @description Wrapper service for the available shapes
 * @example
var shapesArray = spahes.getAll(); // [{id: 1, name: 'Point'}, ...]
shapes.getId('Point'); // 1
shapes.getName(1); // 'Point'
 */
angular.module('biigle.api').service('shapes', function (Shape) {
      "use strict";

      var shapes = {};
      var shapesInverse = {};

      var resources = Shape.query(function (s) {
         s.forEach(function (shape) {
            shapes[shape.id] = shape.name;
            shapesInverse[shape.name] = shape.id;
         });
      });

      this.getName = function (id) {
         return shapes[id];
      };

      this.getId = function (name) {
         return shapesInverse[name];
      };

      this.getAll = function () {
         return resources;
      };
   }
);
