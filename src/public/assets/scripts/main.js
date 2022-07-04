/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/reports/mixins/reportForm.vue?vue&type=script&lang=js&":
/*!********************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/reports/mixins/reportForm.vue?vue&type=script&lang=js& ***!
  \********************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/reports/import.js");



/**
 * A mixin for a report form
 *
 * @type {Object}
 */

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_import__WEBPACK_IMPORTED_MODULE_0__.LoaderMixin],
  components: {
    labelTrees: _import__WEBPACK_IMPORTED_MODULE_0__.LabelTrees
  },
  data: function data() {
    return {
      allowedOptions: {},
      selectedType: '',
      selectedVariant: '',
      reportTypes: [],
      labelTrees: [],
      hasOnlyLabels: false,
      success: false,
      errors: {},
      options: {
        export_area: false,
        newest_label: false,
        separate_label_trees: false,
        separate_users: false,
        only_labels: [],
        aggregate_child_labels: false
      }
    };
  },
  computed: {
    flatLabels: function flatLabels() {
      var labels = [];
      this.labelTrees.forEach(function (tree) {
        Array.prototype.push.apply(labels, tree.labels);
      });
      return labels;
    },
    selectedLabels: function selectedLabels() {
      return this.flatLabels.filter(function (label) {
        return label.selected;
      });
    },
    selectedLabelsCount: function selectedLabelsCount() {
      return this.selectedLabels.length;
    },
    variants: function variants() {
      var variants = {};
      this.reportTypes.forEach(function (type) {
        var fragments = type.name.split('\\');

        if (!variants.hasOwnProperty(fragments[0])) {
          variants[fragments[0]] = [];
        }

        if (fragments[1]) {
          variants[fragments[0]].push(fragments[1]);
        }
      });
      return variants;
    },
    availableReportTypes: function availableReportTypes() {
      var types = {};
      this.reportTypes.forEach(function (type) {
        types[type.name] = type.id;
      });
      return types;
    },
    selectedReportTypeId: function selectedReportTypeId() {
      if (this.selectedVariant) {
        return this.availableReportTypes[this.selectedType + '\\' + this.selectedVariant];
      }

      return this.availableReportTypes[this.selectedType];
    },
    availableVariants: function availableVariants() {
      return this.variants[this.selectedType];
    },
    hasAvailableVariants: function hasAvailableVariants() {
      return this.availableVariants.length > 0;
    },
    onlyOneAvailableVariant: function onlyOneAvailableVariant() {
      return this.availableVariants.length === 1;
    },
    selectedOptions: function selectedOptions() {
      var _this = this;

      var options = {};
      this.allowedOptions[this.selectedType].forEach(function (allowed) {
        options[allowed] = _this.options[allowed];
      });
      options.type_id = this.selectedReportTypeId;
      return options;
    }
  },
  methods: {
    request: function request(id, resource) {
      if (this.loading) return;
      this.success = false;
      this.startLoading();
      resource.save({
        id: id
      }, this.selectedOptions).then(this.submitted, this.handleError)["finally"](this.finishLoading);
    },
    submitted: function submitted() {
      this.success = true;
      this.errors = {};
    },
    handleError: function handleError(response) {
      if (response.status === 422) {
        if (response.data.hasOwnProperty('errors')) {
          this.errors = response.data.errors;
        } else {
          this.errors = response.data;
        }
      } else {
        (0,_import__WEBPACK_IMPORTED_MODULE_0__.handleErrorResponse)(response);
      }
    },
    selectType: function selectType(type) {
      this.selectedType = type;

      if (this.availableVariants.indexOf(this.selectedVariant) === -1) {
        this.selectedVariant = this.availableVariants[0] || '';
      }
    },
    wantsType: function wantsType(type) {
      return this.selectedType === type;
    },
    wantsVariant: function wantsVariant(variant) {
      if (Array.isArray(variant)) {
        return variant.indexOf(this.selectedVariant) !== -1;
      }

      return this.selectedVariant === variant;
    },
    hasOption: function hasOption(key) {
      return this.allowedOptions[this.selectedType].includes(key);
    },
    hasError: function hasError(key) {
      return this.errors.hasOwnProperty(key);
    },
    getError: function getError(key) {
      return this.errors[key] ? this.errors[key].join(' ') : '';
    },
    wantsCombination: function wantsCombination(type, variant) {
      return this.wantsType(type) && this.wantsVariant(variant);
    }
  },
  watch: {
    selectedLabels: function selectedLabels(labels) {
      this.options.only_labels = labels.map(function (label) {
        return label.id;
      });
    },
    hasOnlyLabels: function hasOnlyLabels(has) {
      if (!has) {
        this.flatLabels.forEach(function (label) {
          label.selected = false;
        });
      }
    },
    'options.separate_label_trees': function optionsSeparate_label_trees(separate) {
      if (separate) {
        this.options.separate_users = false;
      }
    },
    'options.separate_users': function optionsSeparate_users(separate) {
      if (separate) {
        this.options.separate_label_trees = false;
      }
    }
  },
  created: function created() {
    this.reportTypes = biigle.$require('reports.reportTypes');
    this.selectedType = Object.keys(this.variants)[0];
    this.selectedVariant = this.availableVariants[0];
    var trees = biigle.$require('reports.labelTrees'); // The "selected" property is automatically set by the label trees component.
    // However, this may not be fast enough for very large label trees to complete
    // before the selectedLabels computed property is evaluated. The computed
    // property won't work correctly in that case so we explicitly set the "selected"
    // property here.

    trees.forEach(function (tree) {
      tree.labels.forEach(function (label) {
        label.selected = false;
      });
    });
    this.labelTrees = trees;
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/reports/projectForm.vue?vue&type=script&lang=js&":
/*!**************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/reports/projectForm.vue?vue&type=script&lang=js& ***!
  \**************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mixins_reportForm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mixins/reportForm */ "./src/resources/assets/js/reports/mixins/reportForm.vue");
/* harmony import */ var _api_projectReports__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api/projectReports */ "./src/resources/assets/js/reports/api/projectReports.js");


/**
 * The form for requesting a project report
 */

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_mixins_reportForm__WEBPACK_IMPORTED_MODULE_0__["default"]],
  data: function data() {
    return {
      projectId: null,
      allowedOptions: {
        'ImageAnnotations': ['export_area', 'newest_label', 'separate_label_trees', 'separate_users', 'only_labels', 'aggregate_child_labels'],
        'ImageLabels': ['separate_label_trees', 'separate_users', 'only_labels'],
        'VideoAnnotations': ['newest_label', 'separate_label_trees', 'separate_users', 'annotation_session_id', 'only_labels'],
        'VideoLabels': ['separate_label_trees', 'separate_users', 'only_labels'],
        'ImageIfdo': ['export_area', 'newest_label', 'only_labels', 'strip_ifdo']
      }
    };
  },
  methods: {
    submit: function submit() {
      this.request(this.projectId, _api_projectReports__WEBPACK_IMPORTED_MODULE_1__["default"]);
    }
  },
  created: function created() {
    this.projectId = biigle.$require('reports.projectId');
  }
});

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/reports/volumeForm.vue?vue&type=script&lang=js&":
/*!*************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/reports/volumeForm.vue?vue&type=script&lang=js& ***!
  \*************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mixins_reportForm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mixins/reportForm */ "./src/resources/assets/js/reports/mixins/reportForm.vue");
/* harmony import */ var _api_volumeReports__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api/volumeReports */ "./src/resources/assets/js/reports/api/volumeReports.js");


/**
 * The form for requesting a volume report
 */

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  mixins: [_mixins_reportForm__WEBPACK_IMPORTED_MODULE_0__["default"]],
  data: function data() {
    return {
      allowedOptions: {
        'ImageAnnotations': ['export_area', 'newest_label', 'separate_label_trees', 'separate_users', 'annotation_session_id', 'only_labels', 'aggregate_child_labels'],
        'ImageLabels': ['separate_label_trees', 'separate_users', 'annotation_session_id', 'only_labels'],
        'VideoAnnotations': ['newest_label', 'separate_label_trees', 'separate_users', 'annotation_session_id', 'only_labels'],
        'VideoLabels': ['separate_label_trees', 'separate_users', 'annotation_session_id', 'only_labels'],
        'ImageIfdo': ['export_area', 'newest_label', 'only_labels', 'strip_ifdo']
      },
      options: {
        annotation_session_id: null
      }
    };
  },
  methods: {
    submit: function submit() {
      this.request(this.volumeId, _api_volumeReports__WEBPACK_IMPORTED_MODULE_1__["default"]);
    }
  },
  created: function created() {
    this.volumeId = biigle.$require('reports.volumeId');
  }
});

/***/ }),

/***/ "./src/resources/assets/js/reports/api/projectReports.js":
/*!***************************************************************!*\
  !*** ./src/resources/assets/js/reports/api/projectReports.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Resource for requesting reports for projects
 *
 * let resource = biigle.$require('reports.api.projectReports');
 *
 * Request a basic annotation report:
 *
 * resource.save({id: 1}, {
 *     type_id: 2,
 *     export_area: 1,
 *     separate_label_trees: 0,
 * }).then(...)
 *
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Vue.resource('/api/v1/projects{/id}/reports'));

/***/ }),

/***/ "./src/resources/assets/js/reports/api/volumeReports.js":
/*!**************************************************************!*\
  !*** ./src/resources/assets/js/reports/api/volumeReports.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Resource for requesting reports for volumes
 *
 * let resource = biigle.$require('reports.api.volumeReports');
 *
 * Request a basic annotation report:
 *
 * resource.save({id: 1}, {
 *     type_id: 2,
 *     export_area: 1,
 *     separate_label_trees: 0,
 *     annotation_session_id: 23,
 * }).then(...)
 *
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Vue.resource('/api/v1/volumes{/id}/reports'));

/***/ }),

/***/ "./src/resources/assets/js/reports/import.js":
/*!***************************************************!*\
  !*** ./src/resources/assets/js/reports/import.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "handleErrorResponse": () => (/* binding */ handleErrorResponse),
/* harmony export */   "LabelTrees": () => (/* binding */ LabelTrees),
/* harmony export */   "LoaderMixin": () => (/* binding */ LoaderMixin)
/* harmony export */ });
var handleErrorResponse = biigle.$require('messages').handleErrorResponse;
var LabelTrees = biigle.$require('labelTrees.components.labelTrees');
var LoaderMixin = biigle.$require('core.mixins.loader');

/***/ }),

/***/ "./src/resources/assets/js/reports/main.js":
/*!*************************************************!*\
  !*** ./src/resources/assets/js/reports/main.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _projectForm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./projectForm */ "./src/resources/assets/js/reports/projectForm.vue");
/* harmony import */ var _volumeForm__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./volumeForm */ "./src/resources/assets/js/reports/volumeForm.vue");


biigle.$mount('project-report-form', _projectForm__WEBPACK_IMPORTED_MODULE_0__["default"]);
biigle.$mount('volume-report-form', _volumeForm__WEBPACK_IMPORTED_MODULE_1__["default"]);

/***/ }),

/***/ "./src/resources/assets/sass/main.scss":
/*!*********************************************!*\
  !*** ./src/resources/assets/sass/main.scss ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/resources/assets/js/reports/mixins/reportForm.vue":
/*!***************************************************************!*\
  !*** ./src/resources/assets/js/reports/mixins/reportForm.vue ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _reportForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reportForm.vue?vue&type=script&lang=js& */ "./src/resources/assets/js/reports/mixins/reportForm.vue?vue&type=script&lang=js&");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _reportForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/reports/mixins/reportForm.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/reports/projectForm.vue":
/*!*********************************************************!*\
  !*** ./src/resources/assets/js/reports/projectForm.vue ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _projectForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./projectForm.vue?vue&type=script&lang=js& */ "./src/resources/assets/js/reports/projectForm.vue?vue&type=script&lang=js&");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _projectForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/reports/projectForm.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/reports/volumeForm.vue":
/*!********************************************************!*\
  !*** ./src/resources/assets/js/reports/volumeForm.vue ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _volumeForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./volumeForm.vue?vue&type=script&lang=js& */ "./src/resources/assets/js/reports/volumeForm.vue?vue&type=script&lang=js&");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _volumeForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/reports/volumeForm.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/reports/mixins/reportForm.vue?vue&type=script&lang=js&":
/*!****************************************************************************************!*\
  !*** ./src/resources/assets/js/reports/mixins/reportForm.vue?vue&type=script&lang=js& ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_0_rules_0_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_reportForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!../../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./reportForm.vue?vue&type=script&lang=js& */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/reports/mixins/reportForm.vue?vue&type=script&lang=js&");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_0_rules_0_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_reportForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/reports/projectForm.vue?vue&type=script&lang=js&":
/*!**********************************************************************************!*\
  !*** ./src/resources/assets/js/reports/projectForm.vue?vue&type=script&lang=js& ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_0_rules_0_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_projectForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./projectForm.vue?vue&type=script&lang=js& */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/reports/projectForm.vue?vue&type=script&lang=js&");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_0_rules_0_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_projectForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./src/resources/assets/js/reports/volumeForm.vue?vue&type=script&lang=js&":
/*!*********************************************************************************!*\
  !*** ./src/resources/assets/js/reports/volumeForm.vue?vue&type=script&lang=js& ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_0_rules_0_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_volumeForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./volumeForm.vue?vue&type=script&lang=js& */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/reports/volumeForm.vue?vue&type=script&lang=js&");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_0_rules_0_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_volumeForm_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__["default"]); 

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

function normalizeComponent (
  scriptExports,
  render,
  staticRenderFns,
  functionalTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier, /* server only */
  shadowMode /* vue-cli only */
) {
  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

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
  if (moduleIdentifier) { // server build
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
      options.render = function renderWithStyleInjection (h, context) {
        hook.call(context)
        return originalRender(h, context)
      }
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate
      options.beforeCreate = existing
        ? [].concat(existing, hook)
        : [hook]
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
/******/ 		var chunkLoadingGlobal = self["webpackChunkbiigle_reports"] = self["webpackChunkbiigle_reports"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	__webpack_require__.O(undefined, ["assets/styles/main"], () => (__webpack_require__("./src/resources/assets/js/reports/main.js")))
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["assets/styles/main"], () => (__webpack_require__("./src/resources/assets/sass/main.scss")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;