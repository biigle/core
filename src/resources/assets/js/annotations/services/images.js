/**
 * @namespace biigle.annotations
 * @ngdoc service
 * @name images
 * @memberOf biigle.annotations
 * @description Manages (pre-)loading of the images to annotate.
 */
angular.module('biigle.annotations').service('images', function ($rootScope, URL, $q, filterSubset, VOLUME_ID, IMAGES_IDS, IMAGES_FILENAMES) {
      "use strict";

      var _this = this;
      // array of all image IDs of the volume
      var imageIds = [];
      // maximum number of images to hold in buffer
      var MAX_BUFFER_SIZE = 5;
      // buffer of already loaded images
      var buffer = [];

        // array of image IDs that the user hasn't seen yet
        var notVisited = [];

      // the currently shown image
      this.currentImage = undefined;

        var getFilename = function (id) {
            var index = IMAGES_IDS.indexOf(id);
            return IMAGES_FILENAMES[index];
        };

      /**
       * Returns the next ID of the specified image or the next ID of the
       * current image if no image was specified.
       */
      var nextId = function (id) {
         id = id || _this.currentImage._id;
         var index = imageIds.indexOf(id);
         return imageIds[(index + 1) % imageIds.length];
      };

      /**
       * Returns the previous ID of the specified image or the previous ID of
       * the current image if no image was specified.
       */
      var prevId = function (id) {
         id = id || _this.currentImage._id;
         var index = imageIds.indexOf(id);
         var length = imageIds.length;
         return imageIds[(index - 1 + length) % length];
      };

      /**
       * Returns the specified image from the buffer or `undefined` if it is
       * not buffered.
       */
      var getImage = function (id) {
         id = id || _this.currentImage._id;
         for (var i = buffer.length - 1; i >= 0; i--) {
            if (buffer[i]._id == id) return buffer[i];
         }

         return undefined;
      };

      /**
       * Sets the specified image to as the currently shown image.
       */
      var show = function (image) {
         _this.currentImage = image;

            for (var i = notVisited.length - 1; i >= 0; i--) {
                if (notVisited[i] === image._id) {
                    notVisited.splice(i, 1);
                }
            }

            return image;
      };

      /**
       * Loads the specified image either from buffer or from the external
       * resource. Returns a promise that gets resolved when the image is
       * loaded.
       */
      var fetchImage = function (id) {
         var deferred = $q.defer();
         var img = getImage(id);

         if (img) {
            deferred.resolve(img);
         } else {
            img = document.createElement('img');
            img._id = id;
                img._filename = getFilename(id);
            img.onload = function () {
               buffer.push(img);
               // control maximum buffer size
               if (buffer.length > MAX_BUFFER_SIZE) {
                  buffer.shift();
               }
               deferred.resolve(img);
            };
            img.onerror = function (msg) {
               deferred.reject(msg);
            };
            img.src = URL + "/api/v1/images/" + id + "/file";
         }

            $rootScope.$broadcast('image.fetching', img);

         return deferred.promise;
      };

        var preloadNextAndPrev = function (image) {
            // pre-load previous and next images but don't display them
            fetchImage(nextId(image._id));
            fetchImage(prevId(image._id));

            return image;
        };

      /**
       * Initializes the service for a given volume. Returns a promise that
       * is resolved, when the service is initialized.
       */
      this.init = function () {
            imageIds = IMAGES_IDS;
            // look for a sequence of image IDs in local storage.
            // this sequence is produces by the volume index page when the images are
            // sorted or filtered. we want to reflect the same ordering or filtering here
            // in the annotator
            var storedSequence = window.localStorage['biigle.volumes.' + VOLUME_ID + '.images'];
            if (storedSequence) {
                storedSequence = JSON.parse(storedSequence);
                // if there is such a stored sequence, filter out any image IDs that do not
                // belong to the volume (any more), since some of them may have been deleted
                // in the meantime
                filterSubset(storedSequence, imageIds);
                // then set the stored sequence as the sequence of image IDs instead of simply
                // all IDs belonging to the volume
                imageIds = storedSequence;
            }

            angular.copy(imageIds, notVisited);
      };

      /**
       * Show the image with the specified ID. Returns a promise that is
       * resolved when the image is shown.
       */
      this.show = function (id) {
         return fetchImage(id)
                .then(show)
                .then(preloadNextAndPrev);
      };

      /**
       * Show the next image. Returns a promise that is
       * resolved when the image is shown.
       */
      this.next = function () {
         return _this.show(nextId());
      };

      /**
       * Show the previous image. Returns a promise that is
       * resolved when the image is shown.
       */
      this.prev = function () {
         return _this.show(prevId());
      };

      this.getCurrentId = function () {
         return _this.currentImage._id;
      };

        this.hasUnvisitedImages = function () {
            return notVisited.length !== 0;
        };
   }
);
