/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name MinimapController
 * @memberOf biigle.annotations
 * @description Controller for the minimap in the sidebar
 */
angular.module('biigle.annotations').controller('MinimapController', function ($scope, map, mapImage, $element, styles) {
      "use strict";

        var element = $element[0];
        var viewportSource = new ol.source.Vector();

      var minimap = new ol.Map({
         target: element,
         // remove controls
         controls: [],
         // disable interactions
         interactions: []
      });

        var mapSize = map.getSize();
        var mapView = map.getView();

      // get the same layers than the map
      minimap.addLayer(mapImage.getLayer());
        minimap.addLayer(new ol.layer.Vector({
            source: viewportSource,
            style: styles.viewport
        }));

      var viewport = new ol.Feature();
      viewportSource.addFeature(viewport);

      // refresh the view (the image size could have been changed)
      $scope.$on('image.shown', function () {
            var extent = mapImage.getExtent();
         minimap.setView(new ol.View({
            projection: mapImage.getProjection(),
            center: ol.extent.getCenter(extent),
                // calculate resolution that fits the image into the minimap element
            resolution: Math.max(
                    extent[2] / element.clientWidth,
                    extent[3] / element.clientHeight
                )
         }));
      });

      // move the viewport rectangle on the minimap
      var refreshViewport = function () {
         viewport.setGeometry(ol.geom.Polygon.fromExtent(mapView.calculateExtent(mapSize)));
      };

        map.on('change:size', function () {
            mapSize = map.getSize();
        });

        map.on('change:view', function () {
            mapView = map.getView();
        });

      map.on('postcompose', refreshViewport);

      var dragViewport = function (e) {
         mapView.setCenter(e.coordinate);
      };

      minimap.on('pointerdrag', dragViewport);

      $element.on('mouseleave', function () {
         minimap.un('pointerdrag', dragViewport);
      });

      $element.on('mouseenter', function () {
         minimap.on('pointerdrag', dragViewport);
      });
   }
);
