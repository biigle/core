/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name images
 * @memberOf dias.annotations
 * @description Manages (pre-)loading of the images to annotate.
 */
angular.module('dias.annotations').service('images', function ($rootScope, TransectImage, URL) {
		"use strict";

		// svg namespace
		var SVGNS = "http://www.w3.org/2000/svg";
		var _this = this;
		var imageIds = [];
		var currentId;

		this.buffer = [];
		this.loading = true;

		var show = function (id) {
			for (var i = _this.buffer.length - 1; i >= 0; i--) {
				_this.buffer[i]._show = _this.buffer[i]._id == id;
			}
			_this.loading = false;
			currentId = id;
		};

		var hasIdInBuffer = function (id) {
			for (var i = _this.buffer.length - 1; i >= 0; i--) {
				if (_this.buffer[i]._id == id) {
					return true;
				}
			}
			return false;
		};

		var fetchImage = function (id) {
			if (hasIdInBuffer(id)) {
				show(id);
				return;
			}

			_this.loading = true;
			var img = document.createElement('img');
			img._id = id;
			img.onload = function () {
				_this.buffer.push(img);
				show(id);
				$rootScope.$apply();
			};
			img.src = URL + "/api/v1/images/" + id + "/file";
			// var img = document.createElementNS(SVGNS, "image");
			// img.href.baseVal = URL + "/api/v1/images/" + 1 + "/file";
			// img.width.baseVal.value = 100;
			// img.height.baseVal.value = 100;
			// console.log(img, img2);
		};

		// initializes the service for a given transect and a given "start" image
		this.init = function (transectId) {
			imageIds = TransectImage.query({transect_id: transectId});
			
		};

		this.show = function (id) {
			fetchImage(id);
		};

		this.next = function () {
			var index = imageIds.indexOf(currentId);
			fetchImage(imageIds[(index + 1) % imageIds.length]);
		};

		this.prev = function () {
			var index = imageIds.indexOf(currentId);
			var length = imageIds.length;
			fetchImage(imageIds[(index - 1 + length) % length]);
		};
	}
);