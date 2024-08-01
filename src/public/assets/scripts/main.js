/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/annotationCatalogContainer.vue?vue&type=script&lang=js":
/*!********************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/annotationCatalogContainer.vue?vue&type=script&lang=js ***!
  \********************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _components_catalogImageGrid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components/catalogImageGrid */ "./src/resources/assets/js/components/catalogImageGrid.vue");
/* harmony import */ var _api_labels__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api/labels */ "./src/resources/assets/js/api/labels.js");
/* harmony import */ var _mixins_largoContainer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./mixins/largoContainer */ "./src/resources/assets/js/mixins/largoContainer.vue");




/**
 * View model for the annotation catalog
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_mixins_largoContainer__WEBPACK_IMPORTED_MODULE_2__["default"]],
  components: {
    catalogImageGrid: _components_catalogImageGrid__WEBPACK_IMPORTED_MODULE_0__["default"]
  },
  data: function data() {
    return {
      labelTrees: []
    };
  },
  methods: {
    queryAnnotations: function queryAnnotations(label) {
      var imagePromise = _api_labels__WEBPACK_IMPORTED_MODULE_1__["default"].queryImageAnnotations({
        id: label.id
      });
      var videoPromise = _api_labels__WEBPACK_IMPORTED_MODULE_1__["default"].queryVideoAnnotations({
        id: label.id
      });
      return Vue.Promise.all([imagePromise, videoPromise]);
    },
    showOutlines: function showOutlines() {
      this.showAnnotationOutlines = true;
    },
    hideOutlines: function hideOutlines() {
      this.showAnnotationOutlines = false;
    }
  },
  created: function created() {
    var labelTree = biigle.$require('annotationCatalog.labelTree');
    this.labelTrees = [labelTree];
    this.showAnnotationOutlines = false;
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/annotationPatch.vue?vue&type=script&lang=js":
/*!********************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/annotationPatch.vue?vue&type=script&lang=js ***!
  \********************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mixins/annotationPatch */ "./src/resources/assets/js/mixins/annotationPatch.vue");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../constants */ "./src/resources/assets/js/constants.js");



/**
 * An example annotation patch image.
 *
 * @type {Object}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__["default"]],
  props: {
    _id: {
      type: String,
      required: true
    },
    _uuid: {
      type: String,
      required: true
    },
    label: {
      type: Object,
      required: true
    },
    emptySrc: {
      type: String,
      required: true
    },
    _urlTemplate: {
      type: String,
      required: true
    }
  },
  data: function data() {
    return {
      url: ''
    };
  },
  computed: {
    title: function title() {
      return 'Example annotation for label ' + this.label.name;
    },
    src: function src() {
      return this.url || this.emptySrc;
    },
    image: function image() {
      return {
        id: this._id,
        uuid: this._uuid,
        type: _constants__WEBPACK_IMPORTED_MODULE_1__.IMAGE_ANNOTATION
      };
    },
    urlTemplate: function urlTemplate() {
      return this._urlTemplate;
    }
  },
  methods: {
    showEmptyImage: function showEmptyImage() {
      this.url = '';
    }
  },
  created: function created() {
    this.url = this.getThumbnailUrl();
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/annotationsLabelsTabPlugin.vue?vue&type=script&lang=js":
/*!*******************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/annotationsLabelsTabPlugin.vue?vue&type=script&lang=js ***!
  \*******************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _annotationPatch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./annotationPatch */ "./src/resources/assets/js/components/annotationPatch.vue");
/* harmony import */ var _api_volumes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../api/volumes */ "./src/resources/assets/js/api/volumes.js");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");





/**
 * The plugin component to show example annotation patches in the labels tab of the
 * annotation tool.
 *
 * @type {Object}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_import__WEBPACK_IMPORTED_MODULE_2__.LoaderMixin],
  components: {
    annotationPatch: _annotationPatch__WEBPACK_IMPORTED_MODULE_0__["default"]
  },
  props: {
    label: {
      "default": null
    },
    volumeId: {
      type: Number,
      required: true
    },
    count: {
      type: Number,
      "default": 3
    }
  },
  data: function data() {
    return {
      exampleLabel: null,
      exampleAnnotations: [],
      cache: {},
      shown: true
    };
  },
  computed: {
    isShown: function isShown() {
      return this.shown && this.label !== null;
    },
    hasExamples: function hasExamples() {
      return this.exampleLabel && this.exampleAnnotations && Object.keys(this.exampleAnnotations).length > 0;
    }
  },
  methods: {
    parseResponse: function parseResponse(response) {
      return response.data;
    },
    setExampleAnnotations: function setExampleAnnotations(args) {
      // Delete the cached item if there is less than the desired number of
      // example annotations. Maybe there are more the next time we fetch them
      // again.
      if (!args[0].hasOwnProperty('annotations') || Object.keys(args[0].annotations).length < this.count) {
        delete this.cache[args[1]];
      }

      // Also delete the cached item if there are only examples with a similar
      // label. Maybe there are examples from the requested label the next
      // time.
      if (!args[0].hasOwnProperty('label') || args[0].label.id !== args[1]) {
        delete this.cache[args[1]];
      }

      // Only set the example annotations if the received data belongs to the
      // currently selected label. The user might have selected another label
      // in the meantime.
      if (this.label && this.label.id === args[1]) {
        this.exampleAnnotations = args[0].annotations;
        this.exampleLabel = args[0].label;
      }
    },
    updateShown: function updateShown(shown) {
      this.shown = shown;
    },
    updateExampleAnnotations: function updateExampleAnnotations() {
      this.exampleAnnotations = [];

      // Note that this includes the check for label !== null.
      if (this.isShown) {
        this.startLoading();
        if (!this.cache.hasOwnProperty(this.label.id)) {
          this.cache[this.label.id] = _api_volumes__WEBPACK_IMPORTED_MODULE_1__["default"].queryExampleAnnotations({
            id: this.volumeId,
            label_id: this.label.id,
            take: this.count
          }).then(this.parseResponse);
        }
        Vue.Promise.all([this.cache[this.label.id], this.label.id]).then(this.setExampleAnnotations)["finally"](this.finishLoading);
      }
    }
  },
  watch: {
    label: function label() {
      this.updateExampleAnnotations();
    },
    shown: function shown() {
      this.updateExampleAnnotations();
    }
  },
  created: function created() {
    _import__WEBPACK_IMPORTED_MODULE_2__.Events.$on('settings.exampleAnnotations', this.updateShown);
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/annotationsSettingsTabPlugin.vue?vue&type=script&lang=js":
/*!*********************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/annotationsSettingsTabPlugin.vue?vue&type=script&lang=js ***!
  \*********************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");



/**
 * The plugin component to change the settings whether to show the example annotations.
 *
 * @type {Object}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  components: {
    powerButton: _import__WEBPACK_IMPORTED_MODULE_0__.PowerToggle
  },
  props: {
    settings: {
      type: Object,
      required: true
    }
  },
  data: function data() {
    return {
      isShown: true
    };
  },
  methods: {
    hide: function hide() {
      this.isShown = false;
      this.settings.set('exampleAnnotations', false);
    },
    show: function show() {
      this.isShown = true;
      this.settings["delete"]('exampleAnnotations');
    }
  },
  watch: {
    isShown: function isShown(shown) {
      _import__WEBPACK_IMPORTED_MODULE_0__.Events.$emit('settings.exampleAnnotations', shown);
    }
  },
  created: function created() {
    if (this.settings.has('exampleAnnotations')) {
      this.isShown = this.settings.get('exampleAnnotations');
    }
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/catalogImageGrid.vue?vue&type=script&lang=js":
/*!*********************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/catalogImageGrid.vue?vue&type=script&lang=js ***!
  \*********************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");
/* harmony import */ var _catalogImageGridImage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./catalogImageGridImage */ "./src/resources/assets/js/components/catalogImageGridImage.vue");



/**
 * A variant of the image grid used for the annotation catalog
 *
 * @type {Object}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_import__WEBPACK_IMPORTED_MODULE_0__.ImageGrid],
  components: {
    imageGridImage: _catalogImageGridImage__WEBPACK_IMPORTED_MODULE_1__["default"]
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=script&lang=js":
/*!**************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=script&lang=js ***!
  \**************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mixins/annotationPatch */ "./src/resources/assets/js/mixins/annotationPatch.vue");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../constants */ "./src/resources/assets/js/constants.js");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");
//
//
//
//
//
//
//
//
//
//





/**
 * A variant of the image grid image used for the annotation catalog
 *
 * @type {Object}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_import__WEBPACK_IMPORTED_MODULE_2__.ImageGridImage, _mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__["default"]],
  data: function data() {
    return {
      showAnnotationRoute: null,
      overlayIsLoaded: false,
      overlayHasError: false
    };
  },
  inject: ['outlines'],
  computed: {
    showAnnotationLink: function showAnnotationLink() {
      return this.showAnnotationRoute ? this.showAnnotationRoute + this.image.id : '';
    },
    svgSrcUrl: function svgSrcUrl() {
      // Replace file extension by svg file format
      return this.srcUrl.replace(/.[A-Za-z]*$/, '.svg');
    },
    showOutlines: function showOutlines() {
      return !this.overlayHasError && this.outlines.showAnnotationOutlines;
    }
  },
  methods: {
    handleOverlayLoad: function handleOverlayLoad() {
      this.overlayIsLoaded = true;
    },
    handleOverlayError: function handleOverlayError() {
      this.overlayHasError = true;
    }
  },
  created: function created() {
    if (this.type === _constants__WEBPACK_IMPORTED_MODULE_1__.IMAGE_ANNOTATION) {
      this.showAnnotationRoute = biigle.$require('annotationCatalog.showImageAnnotationRoute');
    } else {
      this.showAnnotationRoute = biigle.$require('annotationCatalog.showVideoAnnotationRoute');
    }
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/dismissImageGrid.vue?vue&type=script&lang=js":
/*!*********************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/dismissImageGrid.vue?vue&type=script&lang=js ***!
  \*********************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");
/* harmony import */ var _dismissImageGridImage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./dismissImageGridImage */ "./src/resources/assets/js/components/dismissImageGridImage.vue");



/**
 * A variant of the image grid used for the dismiss step of Largo
 *
 * @type {Object}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_import__WEBPACK_IMPORTED_MODULE_0__.ImageGrid],
  components: {
    imageGridImage: _dismissImageGridImage__WEBPACK_IMPORTED_MODULE_1__["default"]
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=script&lang=js":
/*!**************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=script&lang=js ***!
  \**************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mixins/annotationPatch */ "./src/resources/assets/js/mixins/annotationPatch.vue");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//




/**
 * A variant of the image grid image used for the dismiss step of Largo
 *
 * @type {Object}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_import__WEBPACK_IMPORTED_MODULE_1__.ImageGridImage, _mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__["default"]],
  data: function data() {
    return {
      showAnnotationRoute: null,
      overlayIsLoaded: false,
      overlayHasError: false
    };
  },
  inject: ['outlines'],
  computed: {
    showAnnotationLink: function showAnnotationLink() {
      return this.showAnnotationRoute ? this.showAnnotationRoute + this.image.id : '';
    },
    selected: function selected() {
      return this.image.dismissed;
    },
    title: function title() {
      return this.selected ? 'Undo dismissing this annotation' : 'Dismiss this annotation';
    },
    svgSrcUrl: function svgSrcUrl() {
      // Replace file extension by svg file format
      return this.srcUrl.replace(/.[A-Za-z]*$/, '.svg');
    },
    showAnnotationOutlines: function showAnnotationOutlines() {
      return !this.overlayHasError && this.outlines.showAnnotationOutlines;
    }
  },
  methods: {
    handleOverlayLoad: function handleOverlayLoad() {
      this.overlayIsLoaded = true;
    },
    handleOverlayError: function handleOverlayError() {
      this.overlayHasError = true;
    }
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/relabelImageGrid.vue?vue&type=script&lang=js":
/*!*********************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/relabelImageGrid.vue?vue&type=script&lang=js ***!
  \*********************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");
/* harmony import */ var _relabelImageGridImage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./relabelImageGridImage */ "./src/resources/assets/js/components/relabelImageGridImage.vue");



/**
 * A variant of the image grid used for the relabel step of Largo
 *
 * @type {Object}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_import__WEBPACK_IMPORTED_MODULE_0__.ImageGrid],
  components: {
    imageGridImage: _relabelImageGridImage__WEBPACK_IMPORTED_MODULE_1__["default"]
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=script&lang=js":
/*!**************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=script&lang=js ***!
  \**************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mixins/annotationPatch */ "./src/resources/assets/js/mixins/annotationPatch.vue");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//




/**
 * A variant of the image grid image used for the relabel step of Largo
 *
 * @type {Object}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_import__WEBPACK_IMPORTED_MODULE_1__.ImageGridImage, _mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__["default"]],
  data: function data() {
    return {
      showAnnotationRoute: null,
      overlayIsLoaded: false,
      overlayHasError: false
    };
  },
  inject: ['outlines'],
  computed: {
    showAnnotationLink: function showAnnotationLink() {
      return this.showAnnotationRoute ? this.showAnnotationRoute + this.image.id : '';
    },
    selected: function selected() {
      return this.image.newLabel;
    },
    title: function title() {
      return this.selected ? 'Revert changing the label of this annotation' : 'Change the label of this annotation';
    },
    newLabelStyle: function newLabelStyle() {
      return {
        'background-color': '#' + this.image.newLabel.color
      };
    },
    svgSrcUrl: function svgSrcUrl() {
      // Replace file extension by svg file format
      return this.srcUrl.replace(/.[A-Za-z]*$/, '.svg');
    },
    showAnnotationOutlines: function showAnnotationOutlines() {
      return !this.overlayHasError && this.outlines.showAnnotationOutlines;
    }
  },
  methods: {
    handleOverlayLoad: function handleOverlayLoad() {
      this.overlayIsLoaded = true;
    },
    handleOverlayError: function handleOverlayError() {
      this.overlayHasError = true;
    }
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/settingsTab.vue?vue&type=script&lang=js":
/*!****************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/settingsTab.vue?vue&type=script&lang=js ***!
  \****************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _stores_settings__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../stores/settings */ "./src/resources/assets/js/stores/settings.js");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");
//
//
//
//
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  components: {
    PowerToggle: _import__WEBPACK_IMPORTED_MODULE_1__.PowerToggle
  },
  data: function data() {
    return {
      restoreKeys: ['showOutlines'],
      showOutlines: true
    };
  },
  computed: {
    settings: function settings() {
      return _stores_settings__WEBPACK_IMPORTED_MODULE_0__["default"];
    }
  },
  methods: {
    enableOutlines: function enableOutlines() {
      this.showOutlines = true;
    },
    disableOutlines: function disableOutlines() {
      this.showOutlines = false;
    }
  },
  watch: {
    showOutlines: function showOutlines(show) {
      this.$emit('change-outlines', show);
      this.settings.set('showOutlines', show);
    }
  },
  created: function created() {
    var _this = this;
    this.restoreKeys.forEach(function (key) {
      _this[key] = _this.settings.get(key);
    });
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/sortingTab.vue?vue&type=script&lang=js":
/*!***************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/sortingTab.vue?vue&type=script&lang=js ***!
  \***************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SORT_DIRECTION": () => (/* binding */ SORT_DIRECTION),
/* harmony export */   "SORT_KEY": () => (/* binding */ SORT_KEY),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

var SORT_DIRECTION = {
  ASCENDING: 0,
  DESCENDING: 1
};
var SORT_KEY = {
  ANNOTATION_ID: 0,
  OUTLIER: 1
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  data: function data() {
    return {
      sortDirection: SORT_DIRECTION.DESCENDING,
      sortKey: SORT_KEY.ANNOTATION_ID
    };
  },
  computed: {
    sortedAscending: function sortedAscending() {
      return this.sortDirection === SORT_DIRECTION.ASCENDING;
    },
    sortedDescending: function sortedDescending() {
      return this.sortDirection === SORT_DIRECTION.DESCENDING;
    },
    sortingByAnnotationId: function sortingByAnnotationId() {
      return this.sortKey === SORT_KEY.ANNOTATION_ID;
    },
    sortingByOutlier: function sortingByOutlier() {
      return this.sortKey === SORT_KEY.OUTLIER;
    }
  },
  methods: {
    sortAscending: function sortAscending() {
      this.sortDirection = SORT_DIRECTION.ASCENDING;
    },
    sortDescending: function sortDescending() {
      this.sortDirection = SORT_DIRECTION.DESCENDING;
    },
    reset: function reset() {
      this.sortDescending();
      this.sortByAnnotationId();
    },
    sortByAnnotationId: function sortByAnnotationId() {
      this.sortKey = SORT_KEY.ANNOTATION_ID;
    },
    sortByOutlier: function sortByOutlier() {
      this.sortKey = SORT_KEY.OUTLIER;
    }
  },
  watch: {
    sortDirection: function sortDirection(direction) {
      this.$emit('change-direction', direction);
    },
    sortKey: function sortKey(key) {
      this.$emit('change-key', key);
    }
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/largoContainer.vue?vue&type=script&lang=js":
/*!********************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/largoContainer.vue?vue&type=script&lang=js ***!
  \********************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mixins_largoContainer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mixins/largoContainer */ "./src/resources/assets/js/mixins/largoContainer.vue");
/* harmony import */ var _api_volumes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api/volumes */ "./src/resources/assets/js/api/volumes.js");



/**
 * View model for the main Largo container
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_mixins_largoContainer__WEBPACK_IMPORTED_MODULE_0__["default"]],
  data: function data() {
    return {
      volumeId: null,
      labelTrees: [],
      mediaType: ''
    };
  },
  methods: {
    queryAnnotations: function queryAnnotations(label) {
      var imagePromise;
      var videoPromise;
      if (this.mediaType === 'image') {
        imagePromise = _api_volumes__WEBPACK_IMPORTED_MODULE_1__["default"].queryImageAnnotations({
          id: this.volumeId,
          label_id: label.id
        });
        videoPromise = Vue.Promise.resolve([]);
      } else {
        imagePromise = Vue.Promise.resolve([]);
        videoPromise = _api_volumes__WEBPACK_IMPORTED_MODULE_1__["default"].queryVideoAnnotations({
          id: this.volumeId,
          label_id: label.id
        });
      }
      return Vue.Promise.all([imagePromise, videoPromise]);
    },
    performSave: function performSave(payload) {
      return _api_volumes__WEBPACK_IMPORTED_MODULE_1__["default"].save({
        id: this.volumeId
      }, payload);
    },
    querySortByOutlier: function querySortByOutlier(labelId) {
      var _this = this;
      return _api_volumes__WEBPACK_IMPORTED_MODULE_1__["default"].sortAnnotationsByOutlier({
        id: this.volumeId,
        label_id: labelId
      }).then(function (response) {
        // The sorting expects annotation IDs prefixed with 'i' or 'v' so it
        // can work with mixed image and video annotations.
        if (_this.mediaType === 'image') {
          response.body = response.body.map(function (id) {
            return 'i' + id;
          });
        } else {
          response.body = response.body.map(function (id) {
            return 'v' + id;
          });
        }
        return response;
      });
    }
  },
  created: function created() {
    this.volumeId = biigle.$require('largo.volumeId');
    this.labelTrees = biigle.$require('largo.labelTrees');
    this.mediaType = biigle.$require('largo.mediaType');
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/largoTitle.vue?vue&type=script&lang=js":
/*!****************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/largoTitle.vue?vue&type=script&lang=js ***!
  \****************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./import */ "./src/resources/assets/js/import.js");


/**
 * The dynamic part of the Largo breadcrumbs in the navbar
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  data: function data() {
    return {
      step: 0,
      count: 0,
      dismissedCount: 0
    };
  },
  computed: {
    shownCount: function shownCount() {
      if (this.isInDismissStep) {
        return this.count;
      }
      return this.dismissedCount;
    },
    isInDismissStep: function isInDismissStep() {
      return this.step === 0;
    },
    isInRelabelStep: function isInRelabelStep() {
      return this.step === 1;
    }
  },
  methods: {
    updateStep: function updateStep(step) {
      this.step = step;
    },
    updateCount: function updateCount(count) {
      this.count = count;
    },
    updateDismissedCount: function updateDismissedCount(count) {
      this.dismissedCount = count;
    }
  },
  created: function created() {
    _import__WEBPACK_IMPORTED_MODULE_0__.Events.$on('annotations-count', this.updateCount);
    _import__WEBPACK_IMPORTED_MODULE_0__.Events.$on('dismissed-annotations-count', this.updateDismissedCount);
    _import__WEBPACK_IMPORTED_MODULE_0__.Events.$on('step', this.updateStep);
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/mixins/annotationPatch.vue?vue&type=script&lang=js":
/*!****************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/mixins/annotationPatch.vue?vue&type=script&lang=js ***!
  \****************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../constants */ "./src/resources/assets/js/constants.js");

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  computed: {
    id: function id() {
      return this.image.id;
    },
    uuid: function uuid() {
      return this.image.uuid;
    },
    type: function type() {
      return this.image.type;
    },
    patchPrefix: function patchPrefix() {
      return this.uuid[0] + this.uuid[1] + '/' + this.uuid[2] + this.uuid[3] + '/' + this.uuid;
    },
    urlTemplate: function urlTemplate() {
      // Usually this would be set in the created function but in this special
      // case this is not possible.
      return biigle.$require('largo.patchUrlTemplate');
    }
  },
  methods: {
    getThumbnailUrl: function getThumbnailUrl() {
      if (this.type === _constants__WEBPACK_IMPORTED_MODULE_0__.VIDEO_ANNOTATION) {
        return this.urlTemplate.replace(':prefix', this.patchPrefix).replace(':id', "v-".concat(this.id));
      }
      return this.urlTemplate.replace(':prefix', this.patchPrefix).replace(':id', this.id);
    }
  },
  created: function created() {
    if (this.type === _constants__WEBPACK_IMPORTED_MODULE_0__.IMAGE_ANNOTATION) {
      this.showAnnotationRoute = biigle.$require('largo.showImageAnnotationRoute');
    } else {
      this.showAnnotationRoute = biigle.$require('largo.showVideoAnnotationRoute');
    }
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/mixins/largoContainer.vue?vue&type=script&lang=js":
/*!***************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/mixins/largoContainer.vue?vue&type=script&lang=js ***!
  \***************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _components_dismissImageGrid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../components/dismissImageGrid */ "./src/resources/assets/js/components/dismissImageGrid.vue");
/* harmony import */ var _components_relabelImageGrid__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/relabelImageGrid */ "./src/resources/assets/js/components/relabelImageGrid.vue");
/* harmony import */ var _components_settingsTab__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/settingsTab */ "./src/resources/assets/js/components/settingsTab.vue");
/* harmony import */ var _components_sortingTab__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../components/sortingTab */ "./src/resources/assets/js/components/sortingTab.vue");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../constants */ "./src/resources/assets/js/constants.js");
















/**
 * Mixin for largo view models
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_import__WEBPACK_IMPORTED_MODULE_4__.LoaderMixin],
  components: {
    labelTrees: _import__WEBPACK_IMPORTED_MODULE_4__.LabelTrees,
    sidebar: _import__WEBPACK_IMPORTED_MODULE_4__.Sidebar,
    sidebarTab: _import__WEBPACK_IMPORTED_MODULE_4__.SidebarTab,
    powerToggle: _import__WEBPACK_IMPORTED_MODULE_4__.PowerToggle,
    dismissImageGrid: _components_dismissImageGrid__WEBPACK_IMPORTED_MODULE_0__["default"],
    relabelImageGrid: _components_relabelImageGrid__WEBPACK_IMPORTED_MODULE_1__["default"],
    settingsTab: _components_settingsTab__WEBPACK_IMPORTED_MODULE_2__["default"],
    sortingTab: _components_sortingTab__WEBPACK_IMPORTED_MODULE_3__["default"]
  },
  data: function data() {
    return {
      user: null,
      labelTrees: [],
      step: 0,
      selectedLabel: null,
      annotationsCache: {},
      lastSelectedImage: null,
      forceChange: false,
      waitForSessionId: null,
      showAnnotationOutlines: true,
      // The cache is nested in two levels. The first level key is the label ID.
      // The second level key is the sorting key. The cached value is an array
      // of annotation IDs sorted in ascending order.
      sortingSequenceCache: {},
      sortingDirection: _components_sortingTab__WEBPACK_IMPORTED_MODULE_3__.SORT_DIRECTION.DESCENDING,
      sortingKey: _components_sortingTab__WEBPACK_IMPORTED_MODULE_3__.SORT_KEY.ANNOTATION_ID
    };
  },
  provide: function provide() {
    var _this = this;
    var appData = {};

    // Need defineProperty to maintain reactivity.
    // See https://stackoverflow.com/questions/65718651/how-do-i-make-vue-2-provide-inject-api-reactive
    Object.defineProperty(appData, "showAnnotationOutlines", {
      get: function get() {
        return _this.showAnnotationOutlines;
      }
    });
    return {
      'outlines': appData
    };
  },
  computed: {
    isInDismissStep: function isInDismissStep() {
      return this.step === 0;
    },
    isInRelabelStep: function isInRelabelStep() {
      return this.step === 1;
    },
    annotations: function annotations() {
      if (this.selectedLabel && this.annotationsCache.hasOwnProperty(this.selectedLabel.id)) {
        return this.annotationsCache[this.selectedLabel.id];
      }
      return [];
    },
    sortedAnnotations: function sortedAnnotations() {
      var _this$sortingSequence, _this$sortingSequence2, _this$selectedLabel;
      var annotations = this.annotations.slice();

      // This will always be missing for the default sorting.
      var sequence = (_this$sortingSequence = this.sortingSequenceCache) === null || _this$sortingSequence === void 0 ? void 0 : (_this$sortingSequence2 = _this$sortingSequence[(_this$selectedLabel = this.selectedLabel) === null || _this$selectedLabel === void 0 ? void 0 : _this$selectedLabel.id]) === null || _this$sortingSequence2 === void 0 ? void 0 : _this$sortingSequence2[this.sortingKey];
      if (sequence) {
        var map = {};
        sequence.forEach(function (id, idx) {
          return map[id] = idx;
        });

        // Image annotation IDs are prefixed with 'i', video annotations with
        // 'v' to avoid duplicate IDs whe sorting both types of annotations.
        annotations.sort(function (a, b) {
          return map[a.type === _constants__WEBPACK_IMPORTED_MODULE_5__.VIDEO_ANNOTATION ? 'v' + a.id : 'i' + a.id] - map[b.type === _constants__WEBPACK_IMPORTED_MODULE_5__.VIDEO_ANNOTATION ? 'v' + b.id : 'i' + b.id];
        });
      }
      if (this.sortingDirection === _components_sortingTab__WEBPACK_IMPORTED_MODULE_3__.SORT_DIRECTION.ASCENDING) {
        return annotations.reverse();
      }
      return annotations;
    },
    allAnnotations: function allAnnotations() {
      var annotations = [];
      for (var id in this.annotationsCache) {
        if (!this.annotationsCache.hasOwnProperty(id)) continue;
        Array.prototype.push.apply(annotations, this.annotationsCache[id]);
      }
      return annotations;
    },
    hasNoAnnotations: function hasNoAnnotations() {
      return this.selectedLabel && !this.loading && this.annotations.length === 0;
    },
    dismissedAnnotations: function dismissedAnnotations() {
      return this.allAnnotations.filter(function (item) {
        return item.dismissed;
      });
    },
    annotationsWithNewLabel: function annotationsWithNewLabel() {
      return this.dismissedAnnotations.filter(function (item) {
        return !!item.newLabel;
      });
    },
    hasDismissedAnnotations: function hasDismissedAnnotations() {
      return this.dismissedAnnotations.length > 0;
    },
    dismissedImageAnnotationsToSave: function dismissedImageAnnotationsToSave() {
      return this.packDismissedToSave(this.dismissedAnnotations.filter(function (a) {
        return a.type === _constants__WEBPACK_IMPORTED_MODULE_5__.IMAGE_ANNOTATION;
      }));
    },
    dismissedVideoAnnotationsToSave: function dismissedVideoAnnotationsToSave() {
      return this.packDismissedToSave(this.dismissedAnnotations.filter(function (a) {
        return a.type === _constants__WEBPACK_IMPORTED_MODULE_5__.VIDEO_ANNOTATION;
      }));
    },
    changedImageAnnotationsToSave: function changedImageAnnotationsToSave() {
      return this.packChangedToSave(this.annotationsWithNewLabel.filter(function (a) {
        return a.type === _constants__WEBPACK_IMPORTED_MODULE_5__.IMAGE_ANNOTATION;
      }));
    },
    changedVideoAnnotationsToSave: function changedVideoAnnotationsToSave() {
      return this.packChangedToSave(this.annotationsWithNewLabel.filter(function (a) {
        return a.type === _constants__WEBPACK_IMPORTED_MODULE_5__.VIDEO_ANNOTATION;
      }));
    },
    toDeleteCount: function toDeleteCount() {
      return this.dismissedAnnotations.length - this.annotationsWithNewLabel.length;
    },
    saveButtonClass: function saveButtonClass() {
      return this.forceChange ? 'btn-danger' : 'btn-success';
    },
    sortingIsActive: function sortingIsActive() {
      return this.isInDismissStep && (this.sortingKey !== _components_sortingTab__WEBPACK_IMPORTED_MODULE_3__.SORT_KEY.ANNOTATION_ID || this.sortingDirection !== _components_sortingTab__WEBPACK_IMPORTED_MODULE_3__.SORT_DIRECTION.DESCENDING);
    }
  },
  methods: {
    getAnnotations: function getAnnotations(label) {
      var _this2 = this,
        _this$sortingSequence3,
        _this$sortingSequence4;
      var promise1;
      var promise2;
      if (!this.annotationsCache.hasOwnProperty(label.id)) {
        Vue.set(this.annotationsCache, label.id, []);
        this.startLoading();
        promise1 = this.queryAnnotations(label).then(function (response) {
          return _this2.gotAnnotations(label, response);
        }, _import__WEBPACK_IMPORTED_MODULE_4__.handleErrorResponse);
      } else {
        promise1 = Vue.Promise.resolve();
      }
      var sequence = (_this$sortingSequence3 = this.sortingSequenceCache) === null || _this$sortingSequence3 === void 0 ? void 0 : (_this$sortingSequence4 = _this$sortingSequence3[label.id]) === null || _this$sortingSequence4 === void 0 ? void 0 : _this$sortingSequence4[this.sortingKey];
      if (this.sortingIsActive && !sequence) {
        if (!this.loading) {
          this.startLoading();
        }
        promise2 = this.fetchSortingSequence(this.sortingKey, label.id)["catch"](_import__WEBPACK_IMPORTED_MODULE_4__.handleErrorResponse);
      } else {
        promise2 = Vue.Promise.resolve();
      }
      Vue.Promise.all([promise1, promise2])["finally"](this.finishLoading);
    },
    gotAnnotations: function gotAnnotations(label, response) {
      var imageAnnotations = response[0].data;
      var videoAnnotations = response[1].data;

      // This is the object that we will use to store information for each
      // annotation patch.
      var annotations = [];
      if (imageAnnotations) {
        annotations = annotations.concat(this.initAnnotations(label, imageAnnotations, _constants__WEBPACK_IMPORTED_MODULE_5__.IMAGE_ANNOTATION));
      }
      if (videoAnnotations) {
        annotations = annotations.concat(this.initAnnotations(label, videoAnnotations, _constants__WEBPACK_IMPORTED_MODULE_5__.VIDEO_ANNOTATION));
      }
      // Show the newest annotations (with highest ID) first.
      annotations = annotations.sort(function (a, b) {
        return b.id - a.id;
      });
      Vue.set(this.annotationsCache, label.id, annotations);
    },
    initAnnotations: function initAnnotations(label, annotations, type) {
      return Object.keys(annotations).map(function (id) {
        return {
          id: id,
          uuid: annotations[id],
          label_id: label.id,
          dismissed: false,
          newLabel: null,
          type: type
        };
      });
    },
    handleSelectedLabel: function handleSelectedLabel(label) {
      this.selectedLabel = label;
      if (this.isInDismissStep) {
        this.getAnnotations(label);
      }
    },
    handleDeselectedLabel: function handleDeselectedLabel() {
      this.selectedLabel = null;
    },
    handleSelectedImageDismiss: function handleSelectedImageDismiss(image, event) {
      if (image.dismissed) {
        image.dismissed = false;
        image.newLabel = null;
      } else {
        image.dismissed = true;
        if (event.shiftKey && this.lastSelectedImage) {
          this.dismissAllImagesBetween(image, this.lastSelectedImage);
        } else {
          this.lastSelectedImage = image;
        }
      }
    },
    goToRelabel: function goToRelabel() {
      this.step = 1;
      this.lastSelectedImage = null;
    },
    goToDismiss: function goToDismiss() {
      this.step = 0;
      this.lastSelectedImage = null;
      if (this.selectedLabel) {
        this.getAnnotations(this.selectedLabel);
      }
    },
    handleSelectedImageRelabel: function handleSelectedImageRelabel(image, event) {
      if (image.newLabel) {
        // If a new label is selected, swap the label instead of removing it.
        if (this.selectedLabel && image.newLabel.id !== this.selectedLabel.id) {
          image.newLabel = this.selectedLabel;
        } else {
          image.newLabel = null;
        }
      } else if (this.selectedLabel) {
        image.newLabel = this.selectedLabel;
        if (event.shiftKey && this.lastSelectedImage) {
          this.relabelAllImagesBetween(image, this.lastSelectedImage);
        } else {
          this.lastSelectedImage = image;
        }
      }
    },
    save: function save() {
      var _this3 = this;
      if (this.loading) {
        return;
      }
      if (this.toDeleteCount > 0) {
        var response;
        while (response !== null && parseInt(response, 10) !== this.toDeleteCount) {
          response = prompt("This might delete ".concat(this.toDeleteCount, " annotation(s). Please enter the number to continue."));
        }
        if (response === null) {
          return;
        }
      }
      this.startLoading();
      this.performSave({
        dismissed_image_annotations: this.dismissedImageAnnotationsToSave,
        changed_image_annotations: this.changedImageAnnotationsToSave,
        dismissed_video_annotations: this.dismissedVideoAnnotationsToSave,
        changed_video_annotations: this.changedVideoAnnotationsToSave,
        force: this.forceChange
      }).then(function (response) {
        return _this3.waitForSessionId = response.body.id;
      }, function (response) {
        _this3.finishLoading();
        (0,_import__WEBPACK_IMPORTED_MODULE_4__.handleErrorResponse)(response);
      });
    },
    handleSessionSaved: function handleSessionSaved(event) {
      if (event.id == this.waitForSessionId) {
        this.finishLoading();
        _import__WEBPACK_IMPORTED_MODULE_4__.Messages.success('Saved. You can now start a new re-evaluation session.');
        this.step = 0;
        for (var key in this.annotationsCache) {
          if (!this.annotationsCache.hasOwnProperty(key)) continue;
          delete this.annotationsCache[key];
        }
        for (var _key in this.sortingSequenceCache) {
          if (!this.sortingSequenceCache.hasOwnProperty(_key)) continue;
          delete this.sortingSequenceCache[_key];
        }
        this.handleSelectedLabel(this.selectedLabel);
      }
    },
    handleSessionFailed: function handleSessionFailed(event) {
      if (event.id == this.waitForSessionId) {
        this.finishLoading();
        _import__WEBPACK_IMPORTED_MODULE_4__.Messages.danger('There was an unexpected error.');
      }
    },
    dismissAllImagesBetween: function dismissAllImagesBetween(image1, image2) {
      var index1 = this.sortedAnnotations.indexOf(image1);
      var index2 = this.sortedAnnotations.indexOf(image2);
      if (index2 < index1) {
        var tmp = index2;
        index2 = index1;
        index1 = tmp;
      }
      for (var i = index1 + 1; i < index2; i++) {
        this.sortedAnnotations[i].dismissed = true;
      }
    },
    relabelAllImagesBetween: function relabelAllImagesBetween(image1, image2) {
      var label = this.selectedLabel;
      var index1 = this.allAnnotations.indexOf(image1);
      var index2 = this.allAnnotations.indexOf(image2);
      if (index2 < index1) {
        var tmp = index2;
        index2 = index1;
        index1 = tmp;
      }
      for (var i = index1 + 1; i < index2; i++) {
        if (this.allAnnotations[i].dismissed) {
          this.allAnnotations[i].newLabel = label;
        }
      }
    },
    enableForceChange: function enableForceChange() {
      this.forceChange = true;
    },
    disableForceChange: function disableForceChange() {
      this.forceChange = false;
    },
    packDismissedToSave: function packDismissedToSave(annotations) {
      var dismissed = {};
      for (var i = annotations.length - 1; i >= 0; i--) {
        if (dismissed.hasOwnProperty(annotations[i].label_id)) {
          dismissed[annotations[i].label_id].push(annotations[i].id);
        } else {
          dismissed[annotations[i].label_id] = [annotations[i].id];
        }
      }
      return dismissed;
    },
    packChangedToSave: function packChangedToSave(annotations) {
      var changed = {};
      for (var i = annotations.length - 1; i >= 0; i--) {
        if (changed.hasOwnProperty(annotations[i].newLabel.id)) {
          changed[annotations[i].newLabel.id].push(annotations[i].id);
        } else {
          changed[annotations[i].newLabel.id] = [annotations[i].id];
        }
      }
      return changed;
    },
    initializeEcho: function initializeEcho() {
      _import__WEBPACK_IMPORTED_MODULE_4__.Echo.getInstance()["private"]("user-".concat(this.user.id)).listen('.Biigle\\Modules\\Largo\\Events\\LargoSessionSaved', this.handleSessionSaved).listen('.Biigle\\Modules\\Largo\\Events\\LargoSessionFailed', this.handleSessionFailed);
    },
    updateShowOutlines: function updateShowOutlines(show) {
      this.showAnnotationOutlines = show;
    },
    updateSortDirection: function updateSortDirection(direction) {
      this.sortingDirection = direction;
    },
    fetchSortingSequence: function fetchSortingSequence(key, labelId) {
      var _this4 = this;
      var promise;
      if (key === _components_sortingTab__WEBPACK_IMPORTED_MODULE_3__.SORT_KEY.OUTLIER) {
        promise = this.querySortByOutlier(labelId).then(function (response) {
          return response.body;
        });
      } else {
        promise = Vue.Promise.resolve([]);
      }
      return promise.then(function (ids) {
        return _this4.putSortingSequenceToCache(key, labelId, ids);
      });
    },
    putSortingSequenceToCache: function putSortingSequenceToCache(key, labelId, sequence) {
      if (!this.sortingSequenceCache[labelId]) {
        Vue.set(this.sortingSequenceCache, labelId, {});
      }
      this.sortingSequenceCache[labelId][key] = sequence;
    },
    updateSortKey: function updateSortKey(key) {
      var _this$selectedLabel2,
        _this$sortingSequence5,
        _this$sortingSequence6,
        _this5 = this;
      var labelId = (_this$selectedLabel2 = this.selectedLabel) === null || _this$selectedLabel2 === void 0 ? void 0 : _this$selectedLabel2.id;
      var sequence = (_this$sortingSequence5 = this.sortingSequenceCache) === null || _this$sortingSequence5 === void 0 ? void 0 : (_this$sortingSequence6 = _this$sortingSequence5[labelId]) === null || _this$sortingSequence6 === void 0 ? void 0 : _this$sortingSequence6[key];
      if (labelId && !sequence) {
        this.startLoading();
        this.fetchSortingSequence(key, labelId).then(function () {
          return _this5.sortingKey = key;
        })["catch"](_import__WEBPACK_IMPORTED_MODULE_4__.handleErrorResponse)["finally"](this.finishLoading);
      } else {
        this.sortingKey = key;
      }
    }
  },
  watch: {
    annotations: function annotations(_annotations) {
      _import__WEBPACK_IMPORTED_MODULE_4__.Events.$emit('annotations-count', _annotations.length);
    },
    dismissedAnnotations: function dismissedAnnotations(annotations) {
      _import__WEBPACK_IMPORTED_MODULE_4__.Events.$emit('dismissed-annotations-count', annotations.length);
    },
    step: function step(_step) {
      _import__WEBPACK_IMPORTED_MODULE_4__.Events.$emit('step', _step);
    },
    selectedLabel: function selectedLabel() {
      if (this.isInDismissStep) {
        this.$refs.dismissGrid.setOffset(0);
      }
    }
  },
  created: function created() {
    var _this6 = this;
    this.user = biigle.$require('largo.user');
    window.addEventListener('beforeunload', function (e) {
      if (_this6.hasDismissedAnnotations) {
        e.preventDefault();
        e.returnValue = '';
        return 'This page is asking you to confirm that you want to leave - data you have entered may not be saved.';
      }
    });
    this.initializeEcho();
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/projectLargoContainer.vue?vue&type=script&lang=js":
/*!***************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/projectLargoContainer.vue?vue&type=script&lang=js ***!
  \***************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mixins_largoContainer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mixins/largoContainer */ "./src/resources/assets/js/mixins/largoContainer.vue");
/* harmony import */ var _api_projects__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api/projects */ "./src/resources/assets/js/api/projects.js");



/**
 * View model for the main Largo container (for projects)
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_mixins_largoContainer__WEBPACK_IMPORTED_MODULE_0__["default"]],
  data: function data() {
    return {
      projectId: null,
      labelTrees: []
    };
  },
  methods: {
    queryAnnotations: function queryAnnotations(label) {
      var imagePromise = _api_projects__WEBPACK_IMPORTED_MODULE_1__["default"].queryImageAnnotations({
        id: this.projectId,
        label_id: label.id
      });
      var videoPromise = _api_projects__WEBPACK_IMPORTED_MODULE_1__["default"].queryVideoAnnotations({
        id: this.projectId,
        label_id: label.id
      });
      return Vue.Promise.all([imagePromise, videoPromise]);
    },
    performSave: function performSave(payload) {
      return _api_projects__WEBPACK_IMPORTED_MODULE_1__["default"].save({
        id: this.projectId
      }, payload);
    },
    querySortByOutlier: function querySortByOutlier(labelId) {
      return _api_projects__WEBPACK_IMPORTED_MODULE_1__["default"].sortAnnotationsByOutlier({
        id: this.projectId,
        label_id: labelId
      });
    }
  },
  created: function created() {
    this.projectId = biigle.$require('largo.projectId');
    this.labelTrees = biigle.$require('largo.labelTrees');
  }
});

/***/ }),

/***/ "./src/resources/assets/js/annotationsLabelsTabPlugins.js":
/*!****************************************************************!*\
  !*** ./src/resources/assets/js/annotationsLabelsTabPlugins.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _components_annotationsLabelsTabPlugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components/annotationsLabelsTabPlugin */ "./src/resources/assets/js/components/annotationsLabelsTabPlugin.vue");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./import */ "./src/resources/assets/js/import.js");


if (_import__WEBPACK_IMPORTED_MODULE_1__.LabelsTabPlugins) {
  _import__WEBPACK_IMPORTED_MODULE_1__.LabelsTabPlugins.exampleAnnotations = _components_annotationsLabelsTabPlugin__WEBPACK_IMPORTED_MODULE_0__["default"];
}

/***/ }),

/***/ "./src/resources/assets/js/annotationsSettingsTabPlugins.js":
/*!******************************************************************!*\
  !*** ./src/resources/assets/js/annotationsSettingsTabPlugins.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _components_annotationsSettingsTabPlugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components/annotationsSettingsTabPlugin */ "./src/resources/assets/js/components/annotationsSettingsTabPlugin.vue");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./import */ "./src/resources/assets/js/import.js");



/**
 * The plugin component to change the settings whether to show the example annotations.
 *
 * @type {Object}
 */
if (_import__WEBPACK_IMPORTED_MODULE_1__.SettingsTabPlugins) {
  _import__WEBPACK_IMPORTED_MODULE_1__.SettingsTabPlugins.exampleAnnotations = _components_annotationsSettingsTabPlugin__WEBPACK_IMPORTED_MODULE_0__["default"];
}

/***/ }),

/***/ "./src/resources/assets/js/api/labels.js":
/*!***********************************************!*\
  !*** ./src/resources/assets/js/api/labels.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Resource for Largo operations on labels.
 *
 * var resource = biigle.$require('largo.api.labels');
 *
 * Get first 4 image annotations with a specific label (that the user is allowed to see):
 * resource.queryImageAnnotations({id: 1, take: 4}).then(...);
 *
 * Get first 4 video annotations with a specific label (that the user is allowed to see):
 * resource.queryVideoAnnotations({id: 1, take: 4}).then(...);
 *
 * @type {Vue.resource}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Vue.resource('api/v1/labels{/id}', {}, {
  queryImageAnnotations: {
    method: 'GET',
    url: 'api/v1/labels{/id}/image-annotations'
  },
  queryVideoAnnotations: {
    method: 'GET',
    url: 'api/v1/labels{/id}/video-annotations'
  }
}));

/***/ }),

/***/ "./src/resources/assets/js/api/projects.js":
/*!*************************************************!*\
  !*** ./src/resources/assets/js/api/projects.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Resource for Largo operations on projects.
 *
 * var resource = biigle.$require('largo.api.projects');
 *
 * Get all image annotations with a specific label:
 * resource.queryImageAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Get all video annotations with a specific label:
 * resource.queryVideoAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Save the results of a Largo session:
 * resource.save({id: 1}, {dismissed_image_annotations: {1: [...]}, changed_image_annotations: {12: 1, ...}, dismissed_video_annotations: {1: [...]}, changed_video_annotations: {12: 1, ...}}).then(...);
 *
 * @type {Vue.resource}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Vue.resource('api/v1/projects{/id}/largo', {}, {
  queryImageAnnotations: {
    method: 'GET',
    url: 'api/v1/projects{/id}/image-annotations/filter/label{/label_id}'
  },
  queryVideoAnnotations: {
    method: 'GET',
    url: 'api/v1/projects{/id}/video-annotations/filter/label{/label_id}'
  },
  sortAnnotationsByOutlier: {
    method: 'GET',
    url: 'api/v1/projects{/id}/annotations/sort/outliers{/label_id}'
  }
}));

/***/ }),

/***/ "./src/resources/assets/js/api/volumes.js":
/*!************************************************!*\
  !*** ./src/resources/assets/js/api/volumes.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Resource for Largo operations on volumes.
 *
 * var resource = biigle.$require('largo.api.volumes');
 *
 * Get all image annotations with a specific label:
 * resource.queryImageAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Get all video annotations with a specific label:
 * resource.queryVideoAnnotations({id: 1, label_id: 124}).then(...);
 *
 * Save the results of a Largo session:
 * resource.save({id: 1}, {dismissed_image_annotations: {1: [...]}, changed_image_annotations: {12: 1, ...}}).then(...);
 *
 * Get example annotations for a specific label (other than queryAnnotations this may
 * return examples from other labels as well):
 * resource.queryExampleAnnotations({id: 1, label_id: 124}).then(...);
 *
 * @type {Vue.resource}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Vue.resource('api/v1/volumes{/id}/largo', {}, {
  queryImageAnnotations: {
    method: 'GET',
    url: 'api/v1/volumes{/id}/image-annotations/filter/label{/label_id}'
  },
  queryVideoAnnotations: {
    method: 'GET',
    url: 'api/v1/volumes{/id}/video-annotations/filter/label{/label_id}'
  },
  queryExampleAnnotations: {
    method: 'GET',
    url: 'api/v1/volumes{/id}/image-annotations/examples{/label_id}'
  },
  sortAnnotationsByOutlier: {
    method: 'GET',
    url: 'api/v1/volumes{/id}/annotations/sort/outliers{/label_id}'
  }
}));

/***/ }),

/***/ "./src/resources/assets/js/constants.js":
/*!**********************************************!*\
  !*** ./src/resources/assets/js/constants.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "IMAGE_ANNOTATION": () => (/* binding */ IMAGE_ANNOTATION),
/* harmony export */   "VIDEO_ANNOTATION": () => (/* binding */ VIDEO_ANNOTATION)
/* harmony export */ });
var IMAGE_ANNOTATION = 'imageAnnotation';
var VIDEO_ANNOTATION = 'videoAnnotation';

/***/ }),

/***/ "./src/resources/assets/js/export.js":
/*!*******************************************!*\
  !*** ./src/resources/assets/js/export.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mixins/annotationPatch */ "./src/resources/assets/js/mixins/annotationPatch.vue");

biigle.$declare('largo.mixins.annotationPatch', _mixins_annotationPatch__WEBPACK_IMPORTED_MODULE_0__["default"]);

/***/ }),

/***/ "./src/resources/assets/js/import.js":
/*!*******************************************!*\
  !*** ./src/resources/assets/js/import.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Echo": () => (/* binding */ Echo),
/* harmony export */   "Events": () => (/* binding */ Events),
/* harmony export */   "ImageGrid": () => (/* binding */ ImageGrid),
/* harmony export */   "ImageGridImage": () => (/* binding */ ImageGridImage),
/* harmony export */   "LabelTrees": () => (/* binding */ LabelTrees),
/* harmony export */   "LabelsTabPlugins": () => (/* binding */ LabelsTabPlugins),
/* harmony export */   "LoaderMixin": () => (/* binding */ LoaderMixin),
/* harmony export */   "Messages": () => (/* binding */ Messages),
/* harmony export */   "PowerToggle": () => (/* binding */ PowerToggle),
/* harmony export */   "Settings": () => (/* binding */ Settings),
/* harmony export */   "SettingsTabPlugins": () => (/* binding */ SettingsTabPlugins),
/* harmony export */   "Sidebar": () => (/* binding */ Sidebar),
/* harmony export */   "SidebarTab": () => (/* binding */ SidebarTab),
/* harmony export */   "handleErrorResponse": () => (/* binding */ handleErrorResponse)
/* harmony export */ });
var Echo = biigle.$require('echo');
var Events = biigle.$require('events');
var handleErrorResponse = biigle.$require('messages').handleErrorResponse;
var ImageGrid = biigle.$require('volumes.components.imageGrid');
var ImageGridImage = biigle.$require('volumes.components.imageGridImage');
var LabelsTabPlugins = biigle.$require('annotations.components.labelsTabPlugins');
var LabelTrees = biigle.$require('labelTrees.components.labelTrees');
var LoaderMixin = biigle.$require('core.mixins.loader');
var Messages = biigle.$require('messages');
var PowerToggle = biigle.$require('core.components.powerToggle');
var Settings = biigle.$require('core.models.Settings');
var SettingsTabPlugins = biigle.$require('annotations.components.settingsTabPlugins');
var Sidebar = biigle.$require('core.components.sidebar');
var SidebarTab = biigle.$require('core.components.sidebarTab');

/***/ }),

/***/ "./src/resources/assets/js/main.js":
/*!*****************************************!*\
  !*** ./src/resources/assets/js/main.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _annotationsLabelsTabPlugins__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./annotationsLabelsTabPlugins */ "./src/resources/assets/js/annotationsLabelsTabPlugins.js");
/* harmony import */ var _annotationsSettingsTabPlugins__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./annotationsSettingsTabPlugins */ "./src/resources/assets/js/annotationsSettingsTabPlugins.js");
/* harmony import */ var _export__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./export */ "./src/resources/assets/js/export.js");
/* harmony import */ var _annotationCatalogContainer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./annotationCatalogContainer */ "./src/resources/assets/js/annotationCatalogContainer.vue");
/* harmony import */ var _largoContainer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./largoContainer */ "./src/resources/assets/js/largoContainer.vue");
/* harmony import */ var _largoTitle__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./largoTitle */ "./src/resources/assets/js/largoTitle.vue");
/* harmony import */ var _projectLargoContainer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./projectLargoContainer */ "./src/resources/assets/js/projectLargoContainer.vue");







biigle.$mount('annotation-catalog-container', _annotationCatalogContainer__WEBPACK_IMPORTED_MODULE_3__["default"]);
biigle.$mount('largo-container', _largoContainer__WEBPACK_IMPORTED_MODULE_4__["default"]);
biigle.$mount('largo-title', _largoTitle__WEBPACK_IMPORTED_MODULE_5__["default"]);
biigle.$mount('project-largo-container', _projectLargoContainer__WEBPACK_IMPORTED_MODULE_6__["default"]);

/***/ }),

/***/ "./src/resources/assets/js/stores/settings.js":
/*!****************************************************!*\
  !*** ./src/resources/assets/js/stores/settings.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/import.js");


/**
 * Store for largo settings
 */

var defaults = {
  showOutlines: true
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new _import__WEBPACK_IMPORTED_MODULE_0__.Settings({
  data: {
    storageKey: 'biigle.largo.settings',
    defaults: defaults
  }
}));

/***/ }),

/***/ "./src/resources/assets/sass/main.scss":
/*!*********************************************!*\
  !*** ./src/resources/assets/sass/main.scss ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/resources/assets/js/annotationCatalogContainer.vue":
/*!****************************************************************!*\
  !*** ./src/resources/assets/js/annotationCatalogContainer.vue ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _annotationCatalogContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./annotationCatalogContainer.vue?vue&type=script&lang=js */ "./src/resources/assets/js/annotationCatalogContainer.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _annotationCatalogContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/annotationCatalogContainer.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/annotationPatch.vue":
/*!****************************************************************!*\
  !*** ./src/resources/assets/js/components/annotationPatch.vue ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _annotationPatch_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./annotationPatch.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/annotationPatch.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _annotationPatch_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/annotationPatch.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/annotationsLabelsTabPlugin.vue":
/*!***************************************************************************!*\
  !*** ./src/resources/assets/js/components/annotationsLabelsTabPlugin.vue ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _annotationsLabelsTabPlugin_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./annotationsLabelsTabPlugin.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/annotationsLabelsTabPlugin.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _annotationsLabelsTabPlugin_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/annotationsLabelsTabPlugin.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/annotationsSettingsTabPlugin.vue":
/*!*****************************************************************************!*\
  !*** ./src/resources/assets/js/components/annotationsSettingsTabPlugin.vue ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _annotationsSettingsTabPlugin_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./annotationsSettingsTabPlugin.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/annotationsSettingsTabPlugin.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _annotationsSettingsTabPlugin_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/annotationsSettingsTabPlugin.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/catalogImageGrid.vue":
/*!*****************************************************************!*\
  !*** ./src/resources/assets/js/components/catalogImageGrid.vue ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _catalogImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./catalogImageGrid.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/catalogImageGrid.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _catalogImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/catalogImageGrid.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/catalogImageGridImage.vue":
/*!**********************************************************************!*\
  !*** ./src/resources/assets/js/components/catalogImageGridImage.vue ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _catalogImageGridImage_vue_vue_type_template_id_67759ed7__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./catalogImageGridImage.vue?vue&type=template&id=67759ed7 */ "./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=template&id=67759ed7");
/* harmony import */ var _catalogImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./catalogImageGridImage.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");





/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__["default"])(
  _catalogImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__["default"],
  _catalogImageGridImage_vue_vue_type_template_id_67759ed7__WEBPACK_IMPORTED_MODULE_0__.render,
  _catalogImageGridImage_vue_vue_type_template_id_67759ed7__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/catalogImageGridImage.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/dismissImageGrid.vue":
/*!*****************************************************************!*\
  !*** ./src/resources/assets/js/components/dismissImageGrid.vue ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _dismissImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./dismissImageGrid.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/dismissImageGrid.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _dismissImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/dismissImageGrid.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/dismissImageGridImage.vue":
/*!**********************************************************************!*\
  !*** ./src/resources/assets/js/components/dismissImageGridImage.vue ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _dismissImageGridImage_vue_vue_type_template_id_2702d1f0__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./dismissImageGridImage.vue?vue&type=template&id=2702d1f0 */ "./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=template&id=2702d1f0");
/* harmony import */ var _dismissImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./dismissImageGridImage.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");





/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__["default"])(
  _dismissImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__["default"],
  _dismissImageGridImage_vue_vue_type_template_id_2702d1f0__WEBPACK_IMPORTED_MODULE_0__.render,
  _dismissImageGridImage_vue_vue_type_template_id_2702d1f0__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/dismissImageGridImage.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/relabelImageGrid.vue":
/*!*****************************************************************!*\
  !*** ./src/resources/assets/js/components/relabelImageGrid.vue ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _relabelImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./relabelImageGrid.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/relabelImageGrid.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _relabelImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/relabelImageGrid.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/relabelImageGridImage.vue":
/*!**********************************************************************!*\
  !*** ./src/resources/assets/js/components/relabelImageGridImage.vue ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _relabelImageGridImage_vue_vue_type_template_id_3ecb855f__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./relabelImageGridImage.vue?vue&type=template&id=3ecb855f */ "./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=template&id=3ecb855f");
/* harmony import */ var _relabelImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./relabelImageGridImage.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");





/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__["default"])(
  _relabelImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__["default"],
  _relabelImageGridImage_vue_vue_type_template_id_3ecb855f__WEBPACK_IMPORTED_MODULE_0__.render,
  _relabelImageGridImage_vue_vue_type_template_id_3ecb855f__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/relabelImageGridImage.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/settingsTab.vue":
/*!************************************************************!*\
  !*** ./src/resources/assets/js/components/settingsTab.vue ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _settingsTab_vue_vue_type_template_id_9eff6094__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./settingsTab.vue?vue&type=template&id=9eff6094 */ "./src/resources/assets/js/components/settingsTab.vue?vue&type=template&id=9eff6094");
/* harmony import */ var _settingsTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./settingsTab.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/settingsTab.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");





/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__["default"])(
  _settingsTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__["default"],
  _settingsTab_vue_vue_type_template_id_9eff6094__WEBPACK_IMPORTED_MODULE_0__.render,
  _settingsTab_vue_vue_type_template_id_9eff6094__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/settingsTab.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/components/sortingTab.vue":
/*!***********************************************************!*\
  !*** ./src/resources/assets/js/components/sortingTab.vue ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SORT_DIRECTION": () => (/* reexport safe */ _sortingTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__.SORT_DIRECTION),
/* harmony export */   "SORT_KEY": () => (/* reexport safe */ _sortingTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__.SORT_KEY),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _sortingTab_vue_vue_type_template_id_2f804e5d__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sortingTab.vue?vue&type=template&id=2f804e5d */ "./src/resources/assets/js/components/sortingTab.vue?vue&type=template&id=2f804e5d");
/* harmony import */ var _sortingTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./sortingTab.vue?vue&type=script&lang=js */ "./src/resources/assets/js/components/sortingTab.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");





/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__["default"])(
  _sortingTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__["default"],
  _sortingTab_vue_vue_type_template_id_2f804e5d__WEBPACK_IMPORTED_MODULE_0__.render,
  _sortingTab_vue_vue_type_template_id_2f804e5d__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/components/sortingTab.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/largoContainer.vue":
/*!****************************************************!*\
  !*** ./src/resources/assets/js/largoContainer.vue ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _largoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./largoContainer.vue?vue&type=script&lang=js */ "./src/resources/assets/js/largoContainer.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _largoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/largoContainer.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/largoTitle.vue":
/*!************************************************!*\
  !*** ./src/resources/assets/js/largoTitle.vue ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _largoTitle_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./largoTitle.vue?vue&type=script&lang=js */ "./src/resources/assets/js/largoTitle.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _largoTitle_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/largoTitle.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/mixins/annotationPatch.vue":
/*!************************************************************!*\
  !*** ./src/resources/assets/js/mixins/annotationPatch.vue ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _annotationPatch_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./annotationPatch.vue?vue&type=script&lang=js */ "./src/resources/assets/js/mixins/annotationPatch.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _annotationPatch_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/mixins/annotationPatch.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/mixins/largoContainer.vue":
/*!***********************************************************!*\
  !*** ./src/resources/assets/js/mixins/largoContainer.vue ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _largoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./largoContainer.vue?vue&type=script&lang=js */ "./src/resources/assets/js/mixins/largoContainer.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _largoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/mixins/largoContainer.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/projectLargoContainer.vue":
/*!***********************************************************!*\
  !*** ./src/resources/assets/js/projectLargoContainer.vue ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _projectLargoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./projectLargoContainer.vue?vue&type=script&lang=js */ "./src/resources/assets/js/projectLargoContainer.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _projectLargoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/projectLargoContainer.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/annotationCatalogContainer.vue?vue&type=script&lang=js":
/*!****************************************************************************************!*\
  !*** ./src/resources/assets/js/annotationCatalogContainer.vue?vue&type=script&lang=js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationCatalogContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./annotationCatalogContainer.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/annotationCatalogContainer.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationCatalogContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/annotationPatch.vue?vue&type=script&lang=js":
/*!****************************************************************************************!*\
  !*** ./src/resources/assets/js/components/annotationPatch.vue?vue&type=script&lang=js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationPatch_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./annotationPatch.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/annotationPatch.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationPatch_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/annotationsLabelsTabPlugin.vue?vue&type=script&lang=js":
/*!***************************************************************************************************!*\
  !*** ./src/resources/assets/js/components/annotationsLabelsTabPlugin.vue?vue&type=script&lang=js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationsLabelsTabPlugin_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./annotationsLabelsTabPlugin.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/annotationsLabelsTabPlugin.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationsLabelsTabPlugin_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/annotationsSettingsTabPlugin.vue?vue&type=script&lang=js":
/*!*****************************************************************************************************!*\
  !*** ./src/resources/assets/js/components/annotationsSettingsTabPlugin.vue?vue&type=script&lang=js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationsSettingsTabPlugin_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./annotationsSettingsTabPlugin.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/annotationsSettingsTabPlugin.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationsSettingsTabPlugin_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/catalogImageGrid.vue?vue&type=script&lang=js":
/*!*****************************************************************************************!*\
  !*** ./src/resources/assets/js/components/catalogImageGrid.vue?vue&type=script&lang=js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_catalogImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./catalogImageGrid.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/catalogImageGrid.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_catalogImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=script&lang=js":
/*!**********************************************************************************************!*\
  !*** ./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=script&lang=js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_catalogImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./catalogImageGridImage.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_catalogImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/dismissImageGrid.vue?vue&type=script&lang=js":
/*!*****************************************************************************************!*\
  !*** ./src/resources/assets/js/components/dismissImageGrid.vue?vue&type=script&lang=js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_dismissImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./dismissImageGrid.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/dismissImageGrid.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_dismissImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=script&lang=js":
/*!**********************************************************************************************!*\
  !*** ./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=script&lang=js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_dismissImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./dismissImageGridImage.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_dismissImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/relabelImageGrid.vue?vue&type=script&lang=js":
/*!*****************************************************************************************!*\
  !*** ./src/resources/assets/js/components/relabelImageGrid.vue?vue&type=script&lang=js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_relabelImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./relabelImageGrid.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/relabelImageGrid.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_relabelImageGrid_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=script&lang=js":
/*!**********************************************************************************************!*\
  !*** ./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=script&lang=js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_relabelImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./relabelImageGridImage.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_relabelImageGridImage_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/settingsTab.vue?vue&type=script&lang=js":
/*!************************************************************************************!*\
  !*** ./src/resources/assets/js/components/settingsTab.vue?vue&type=script&lang=js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_settingsTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./settingsTab.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/settingsTab.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_settingsTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/sortingTab.vue?vue&type=script&lang=js":
/*!***********************************************************************************!*\
  !*** ./src/resources/assets/js/components/sortingTab.vue?vue&type=script&lang=js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SORT_DIRECTION": () => (/* reexport safe */ _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_sortingTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__.SORT_DIRECTION),
/* harmony export */   "SORT_KEY": () => (/* reexport safe */ _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_sortingTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__.SORT_KEY),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_sortingTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./sortingTab.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/sortingTab.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_sortingTab_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/largoContainer.vue?vue&type=script&lang=js":
/*!****************************************************************************!*\
  !*** ./src/resources/assets/js/largoContainer.vue?vue&type=script&lang=js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_largoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./largoContainer.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/largoContainer.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_largoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/largoTitle.vue?vue&type=script&lang=js":
/*!************************************************************************!*\
  !*** ./src/resources/assets/js/largoTitle.vue?vue&type=script&lang=js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_largoTitle_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./largoTitle.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/largoTitle.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_largoTitle_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/mixins/annotationPatch.vue?vue&type=script&lang=js":
/*!************************************************************************************!*\
  !*** ./src/resources/assets/js/mixins/annotationPatch.vue?vue&type=script&lang=js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationPatch_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./annotationPatch.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/mixins/annotationPatch.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_annotationPatch_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/mixins/largoContainer.vue?vue&type=script&lang=js":
/*!***********************************************************************************!*\
  !*** ./src/resources/assets/js/mixins/largoContainer.vue?vue&type=script&lang=js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_largoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./largoContainer.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/mixins/largoContainer.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_largoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/projectLargoContainer.vue?vue&type=script&lang=js":
/*!***********************************************************************************!*\
  !*** ./src/resources/assets/js/projectLargoContainer.vue?vue&type=script&lang=js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_projectLargoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./projectLargoContainer.vue?vue&type=script&lang=js */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5.use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/projectLargoContainer.vue?vue&type=script&lang=js");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_projectLargoContainer_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=template&id=67759ed7":
/*!****************************************************************************************************!*\
  !*** ./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=template&id=67759ed7 ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_catalogImageGridImage_vue_vue_type_template_id_67759ed7__WEBPACK_IMPORTED_MODULE_0__.render),
/* harmony export */   "staticRenderFns": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_catalogImageGridImage_vue_vue_type_template_id_67759ed7__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns)
/* harmony export */ });
/* harmony import */ var _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_catalogImageGridImage_vue_vue_type_template_id_67759ed7__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./catalogImageGridImage.vue?vue&type=template&id=67759ed7 */ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=template&id=67759ed7");


/***/ }),

/***/ "./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=template&id=2702d1f0":
/*!****************************************************************************************************!*\
  !*** ./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=template&id=2702d1f0 ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_dismissImageGridImage_vue_vue_type_template_id_2702d1f0__WEBPACK_IMPORTED_MODULE_0__.render),
/* harmony export */   "staticRenderFns": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_dismissImageGridImage_vue_vue_type_template_id_2702d1f0__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns)
/* harmony export */ });
/* harmony import */ var _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_dismissImageGridImage_vue_vue_type_template_id_2702d1f0__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./dismissImageGridImage.vue?vue&type=template&id=2702d1f0 */ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=template&id=2702d1f0");


/***/ }),

/***/ "./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=template&id=3ecb855f":
/*!****************************************************************************************************!*\
  !*** ./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=template&id=3ecb855f ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_relabelImageGridImage_vue_vue_type_template_id_3ecb855f__WEBPACK_IMPORTED_MODULE_0__.render),
/* harmony export */   "staticRenderFns": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_relabelImageGridImage_vue_vue_type_template_id_3ecb855f__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns)
/* harmony export */ });
/* harmony import */ var _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_relabelImageGridImage_vue_vue_type_template_id_3ecb855f__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./relabelImageGridImage.vue?vue&type=template&id=3ecb855f */ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=template&id=3ecb855f");


/***/ }),

/***/ "./src/resources/assets/js/components/settingsTab.vue?vue&type=template&id=9eff6094":
/*!******************************************************************************************!*\
  !*** ./src/resources/assets/js/components/settingsTab.vue?vue&type=template&id=9eff6094 ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_settingsTab_vue_vue_type_template_id_9eff6094__WEBPACK_IMPORTED_MODULE_0__.render),
/* harmony export */   "staticRenderFns": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_settingsTab_vue_vue_type_template_id_9eff6094__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns)
/* harmony export */ });
/* harmony import */ var _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_settingsTab_vue_vue_type_template_id_9eff6094__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./settingsTab.vue?vue&type=template&id=9eff6094 */ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/settingsTab.vue?vue&type=template&id=9eff6094");


/***/ }),

/***/ "./src/resources/assets/js/components/sortingTab.vue?vue&type=template&id=2f804e5d":
/*!*****************************************************************************************!*\
  !*** ./src/resources/assets/js/components/sortingTab.vue?vue&type=template&id=2f804e5d ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_sortingTab_vue_vue_type_template_id_2f804e5d__WEBPACK_IMPORTED_MODULE_0__.render),
/* harmony export */   "staticRenderFns": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_sortingTab_vue_vue_type_template_id_2f804e5d__WEBPACK_IMPORTED_MODULE_0__.staticRenderFns)
/* harmony export */ });
/* harmony import */ var _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_sortingTab_vue_vue_type_template_id_2f804e5d__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./sortingTab.vue?vue&type=template&id=2f804e5d */ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/sortingTab.vue?vue&type=template&id=2f804e5d");


/***/ }),

/***/ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=template&id=67759ed7":
/*!*******************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/catalogImageGridImage.vue?vue&type=template&id=67759ed7 ***!
  \*******************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* binding */ render),
/* harmony export */   "staticRenderFns": () => (/* binding */ staticRenderFns)
/* harmony export */ });
var render = function () {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c(
    "figure",
    {
      staticClass: "image-grid__image image-grid__image--catalog",
      class: _vm.classObject,
    },
    [
      _vm.showAnnotationLink
        ? _c(
            "a",
            {
              attrs: {
                href: _vm.showAnnotationLink,
                target: "_blank",
                title: "Show the annotation in the annotation tool",
              },
            },
            [
              _c("img", {
                attrs: { src: _vm.srcUrl },
                on: { error: _vm.showEmptyImage },
              }),
              _vm._v(" "),
              this.showOutlines
                ? _c("img", {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: _vm.overlayIsLoaded,
                        expression: "overlayIsLoaded",
                      },
                    ],
                    staticClass: "outlines",
                    attrs: { src: _vm.svgSrcUrl },
                    on: {
                      error: _vm.handleOverlayError,
                      load: _vm.handleOverlayLoad,
                    },
                  })
                : _vm._e(),
            ]
          )
        : _c("img", {
            attrs: { src: _vm.srcUrl },
            on: { error: _vm.showEmptyImage },
          }),
    ]
  )
}
var staticRenderFns = []
render._withStripped = true



/***/ }),

/***/ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=template&id=2702d1f0":
/*!*******************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/dismissImageGridImage.vue?vue&type=template&id=2702d1f0 ***!
  \*******************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* binding */ render),
/* harmony export */   "staticRenderFns": () => (/* binding */ staticRenderFns)
/* harmony export */ });
var render = function () {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c(
    "figure",
    {
      staticClass: "image-grid__image image-grid__image--largo",
      class: _vm.classObject,
      attrs: { title: _vm.title },
    },
    [
      _vm.selectable
        ? _c("div", { staticClass: "image-icon" }, [
            _c("i", { staticClass: "fas", class: _vm.iconClass }),
          ])
        : _vm._e(),
      _vm._v(" "),
      _c("img", {
        attrs: { src: _vm.srcUrl },
        on: { error: _vm.showEmptyImage, click: _vm.toggleSelect },
      }),
      _vm._v(" "),
      this.showAnnotationOutlines
        ? _c("img", {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.overlayIsLoaded,
                expression: "overlayIsLoaded",
              },
            ],
            staticClass: "outlines",
            attrs: { src: _vm.svgSrcUrl },
            on: { error: _vm.handleOverlayError, load: _vm.handleOverlayLoad },
          })
        : _vm._e(),
      _vm._v(" "),
      _vm.showAnnotationLink
        ? _c("div", { staticClass: "image-buttons" }, [
            _c(
              "a",
              {
                staticClass: "image-button",
                attrs: {
                  href: _vm.showAnnotationLink,
                  target: "_blank",
                  title: "Show the annotation in the annotation tool",
                },
              },
              [
                _c("span", {
                  staticClass: "fa fa-external-link-square-alt fa-fw",
                  attrs: { "aria-hidden": "true" },
                }),
              ]
            ),
          ])
        : _vm._e(),
    ]
  )
}
var staticRenderFns = []
render._withStripped = true



/***/ }),

/***/ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=template&id=3ecb855f":
/*!*******************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/relabelImageGridImage.vue?vue&type=template&id=3ecb855f ***!
  \*******************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* binding */ render),
/* harmony export */   "staticRenderFns": () => (/* binding */ staticRenderFns)
/* harmony export */ });
var render = function () {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c(
    "figure",
    {
      staticClass:
        "image-grid__image image-grid__image--largo image-grid__image--relabel",
      class: _vm.classObject,
      attrs: { title: _vm.title },
    },
    [
      _vm.selectable
        ? _c("div", { staticClass: "image-icon" }, [
            _c("i", { staticClass: "fas", class: _vm.iconClass }),
          ])
        : _vm._e(),
      _vm._v(" "),
      _c("img", {
        attrs: { src: _vm.srcUrl },
        on: { click: _vm.toggleSelect, error: _vm.showEmptyImage },
      }),
      _vm._v(" "),
      this.showAnnotationOutlines
        ? _c("img", {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.overlayIsLoaded,
                expression: "overlayIsLoaded",
              },
            ],
            staticClass: "outlines",
            attrs: { src: _vm.svgSrcUrl },
            on: { error: _vm.handleOverlayError, load: _vm.handleOverlayLoad },
          })
        : _vm._e(),
      _vm._v(" "),
      _vm.showAnnotationLink
        ? _c("div", { staticClass: "image-buttons" }, [
            _c(
              "a",
              {
                staticClass: "image-button",
                attrs: {
                  href: _vm.showAnnotationLink,
                  target: "_blank",
                  title: "Show the annotation in the annotation tool",
                },
              },
              [
                _c("span", {
                  staticClass: "fa fa-external-link-square-alt",
                  attrs: { "aria-hidden": "true" },
                }),
              ]
            ),
          ])
        : _vm._e(),
      _vm._v(" "),
      _vm.selected
        ? _c("div", { staticClass: "new-label" }, [
            _c("span", {
              staticClass: "new-label__color",
              style: _vm.newLabelStyle,
            }),
            _vm._v(" "),
            _c("span", {
              staticClass: "new-label__name",
              domProps: { textContent: _vm._s(_vm.image.newLabel.name) },
            }),
          ])
        : _vm._e(),
    ]
  )
}
var staticRenderFns = []
render._withStripped = true



/***/ }),

/***/ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/settingsTab.vue?vue&type=template&id=9eff6094":
/*!*********************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/settingsTab.vue?vue&type=template&id=9eff6094 ***!
  \*********************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* binding */ render),
/* harmony export */   "staticRenderFns": () => (/* binding */ staticRenderFns)
/* harmony export */ });
var render = function () {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("div", { staticClass: "settings-tab" }, [
    _c(
      "div",
      { staticClass: "largo-tab__button" },
      [
        _c(
          "power-toggle",
          {
            attrs: { active: _vm.showOutlines },
            on: { on: _vm.enableOutlines, off: _vm.disableOutlines },
          },
          [_vm._v("\n            Show annotation outlines\n        ")]
        ),
      ],
      1
    ),
  ])
}
var staticRenderFns = []
render._withStripped = true



/***/ }),

/***/ "./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/sortingTab.vue?vue&type=template&id=2f804e5d":
/*!********************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/components/sortingTab.vue?vue&type=template&id=2f804e5d ***!
  \********************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* binding */ render),
/* harmony export */   "staticRenderFns": () => (/* binding */ staticRenderFns)
/* harmony export */ });
var render = function () {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("div", { staticClass: "sorting-tab" }, [
    _c("div", { staticClass: "sorting-tab__buttons" }, [
      _c("div", { staticClass: "btn-group", attrs: { role: "group" } }, [
        _c(
          "button",
          {
            staticClass: "btn btn-default",
            class: { active: _vm.sortedDescending },
            attrs: { type: "button", title: "Sort descending" },
            on: { click: _vm.sortDescending },
          },
          [_c("span", { staticClass: "fa fa-sort-amount-down" })]
        ),
        _vm._v(" "),
        _c(
          "button",
          {
            staticClass: "btn btn-default",
            class: { active: _vm.sortedAscending },
            attrs: { type: "button", title: "Sort ascending" },
            on: { click: _vm.sortAscending },
          },
          [_c("span", { staticClass: "fa fa-sort-amount-up" })]
        ),
      ]),
      _vm._v(" "),
      _c(
        "div",
        { staticClass: "btn-group pull-right", attrs: { role: "group" } },
        [
          _c(
            "button",
            {
              staticClass: "btn btn-default",
              attrs: { type: "button", title: "Reset sorting" },
              on: { click: _vm.reset },
            },
            [_c("span", { staticClass: "fa fa-times" })]
          ),
        ]
      ),
    ]),
    _vm._v(" "),
    _c("div", { staticClass: "list-group sorter-list-group" }, [
      _c(
        "button",
        {
          staticClass: "list-group-item",
          class: { active: _vm.sortingByAnnotationId },
          attrs: { title: "Sort by annotation timestamp (higher is newer)" },
          on: { click: _vm.sortByAnnotationId },
        },
        [_vm._v("\n            Created\n        ")]
      ),
      _vm._v(" "),
      _c(
        "button",
        {
          staticClass: "list-group-item",
          class: { active: _vm.sortingByOutlier },
          attrs: { title: "Sort by outliers (higher is more dissimilar)" },
          on: { click: _vm.sortByOutlier },
        },
        [_vm._v("\n            Outliers\n        ")]
      ),
    ]),
  ])
}
var staticRenderFns = []
render._withStripped = true



/***/ }),

/***/ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js":
/*!********************************************************************!*\
  !*** ./node_modules/vue-loader/lib/runtime/componentNormalizer.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ normalizeComponent)
/* harmony export */ });
/* globals __VUE_SSR_CONTEXT__ */

// IMPORTANT: Do NOT use ES2015 features in this file (except for modules).
// This module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle.

function normalizeComponent(
  scriptExports,
  render,
  staticRenderFns,
  functionalTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier /* server only */,
  shadowMode /* vue-cli only */
) {
  // Vue.extend constructor export interop
  var options =
    typeof scriptExports === 'function' ? scriptExports.options : scriptExports

  // render functions
  if (render) {
    options.render = render
    options.staticRenderFns = staticRenderFns
    options._compiled = true
  }

  // functional template
  if (functionalTemplate) {
    options.functional = true
  }

  // scopedId
  if (scopeId) {
    options._scopeId = 'data-v-' + scopeId
  }

  var hook
  if (moduleIdentifier) {
    // server build
    hook = function (context) {
      // 2.3 injection
      context =
        context || // cached call
        (this.$vnode && this.$vnode.ssrContext) || // stateful
        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
      // 2.2 with runInNewContext: true
      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__
      }
      // inject component styles
      if (injectStyles) {
        injectStyles.call(this, context)
      }
      // register component module identifier for async chunk inferrence
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (injectStyles) {
    hook = shadowMode
      ? function () {
          injectStyles.call(
            this,
            (options.functional ? this.parent : this).$root.$options.shadowRoot
          )
        }
      : injectStyles
  }

  if (hook) {
    if (options.functional) {
      // for template-only hot-reload because in that case the render fn doesn't
      // go through the normalizer
      options._injectStyles = hook
      // register for functional component in vue file
      var originalRender = options.render
      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context)
        return originalRender(h, context)
      }
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook]
    }
  }

  return {
    exports: scriptExports,
    options: options
  }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"/assets/scripts/main": 0,
/******/ 			"assets/styles/main": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkbiigle_largo"] = self["webpackChunkbiigle_largo"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	__webpack_require__.O(undefined, ["assets/styles/main"], () => (__webpack_require__("./src/resources/assets/js/main.js")))
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["assets/styles/main"], () => (__webpack_require__("./src/resources/assets/sass/main.scss")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;