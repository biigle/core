/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@biigle/ol/AssertionError.js":
/*!***************************************************!*\
  !*** ./node_modules/@biigle/ol/AssertionError.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util.js */ "./node_modules/@biigle/ol/util.js");
/**
 * @module ol/AssertionError
 */


/**
 * Error object thrown when an assertion failed. This is an ECMA-262 Error,
 * extended with a `code` property.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error.
 */
var AssertionError = /*@__PURE__*/(function (Error) {
  function AssertionError(code) {
    var path = _util_js__WEBPACK_IMPORTED_MODULE_0__.VERSION === 'latest' ? _util_js__WEBPACK_IMPORTED_MODULE_0__.VERSION : 'v' + _util_js__WEBPACK_IMPORTED_MODULE_0__.VERSION.split('-')[0];
    var message = 'Assertion failed. See https://openlayers.org/en/' + path +
    '/doc/errors/#' + code + ' for details.';

    Error.call(this, message);

    /**
     * Error code. The meaning of the code can be found on
     * https://openlayers.org/en/latest/doc/errors/ (replace `latest` with
     * the version found in the OpenLayers script's header comment if a version
     * other than the latest is used).
     * @type {number}
     * @api
     */
    this.code = code;

    /**
     * @type {string}
     */
    this.name = 'AssertionError';

    // Re-assign message, see https://github.com/Rich-Harris/buble/issues/40
    this.message = message;
  }

  if ( Error ) AssertionError.__proto__ = Error;
  AssertionError.prototype = Object.create( Error && Error.prototype );
  AssertionError.prototype.constructor = AssertionError;

  return AssertionError;
}(Error));

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (AssertionError);

//# sourceMappingURL=AssertionError.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/Collection.js":
/*!***********************************************!*\
  !*** ./node_modules/@biigle/ol/Collection.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CollectionEvent": () => (/* binding */ CollectionEvent),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _AssertionError_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./AssertionError.js */ "./node_modules/@biigle/ol/AssertionError.js");
/* harmony import */ var _CollectionEventType_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./CollectionEventType.js */ "./node_modules/@biigle/ol/CollectionEventType.js");
/* harmony import */ var _Object_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Object.js */ "./node_modules/@biigle/ol/Object.js");
/* harmony import */ var _events_Event_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/Event.js */ "./node_modules/@biigle/ol/events/Event.js");
/**
 * @module ol/Collection
 */






/**
 * @enum {string}
 * @private
 */
var Property = {
  LENGTH: 'length'
};


/**
 * @classdesc
 * Events emitted by {@link module:ol/Collection~Collection} instances are instances of this
 * type.
 */
var CollectionEvent = /*@__PURE__*/(function (Event) {
  function CollectionEvent(type, opt_element) {
    Event.call(this, type);

    /**
     * The element that is added to or removed from the collection.
     * @type {*}
     * @api
     */
    this.element = opt_element;

  }

  if ( Event ) CollectionEvent.__proto__ = Event;
  CollectionEvent.prototype = Object.create( Event && Event.prototype );
  CollectionEvent.prototype.constructor = CollectionEvent;

  return CollectionEvent;
}(_events_Event_js__WEBPACK_IMPORTED_MODULE_0__["default"]));


/**
 * @typedef {Object} Options
 * @property {boolean} [unique=false] Disallow the same item from being added to
 * the collection twice.
 */

/**
 * @classdesc
 * An expanded version of standard JS Array, adding convenience methods for
 * manipulation. Add and remove changes to the Collection trigger a Collection
 * event. Note that this does not cover changes to the objects _within_ the
 * Collection; they trigger events on the appropriate object, not on the
 * Collection as a whole.
 *
 * @fires CollectionEvent
 *
 * @template T
 * @api
 */
var Collection = /*@__PURE__*/(function (BaseObject) {
  function Collection(opt_array, opt_options) {

    BaseObject.call(this);

    var options = opt_options || {};

    /**
     * @private
     * @type {boolean}
     */
    this.unique_ = !!options.unique;

    /**
     * @private
     * @type {!Array<T>}
     */
    this.array_ = opt_array ? opt_array : [];

    if (this.unique_) {
      for (var i = 0, ii = this.array_.length; i < ii; ++i) {
        this.assertUnique_(this.array_[i], i);
      }
    }

    this.updateLength_();

  }

  if ( BaseObject ) Collection.__proto__ = BaseObject;
  Collection.prototype = Object.create( BaseObject && BaseObject.prototype );
  Collection.prototype.constructor = Collection;

  /**
   * Remove all elements from the collection.
   * @api
   */
  Collection.prototype.clear = function clear () {
    while (this.getLength() > 0) {
      this.pop();
    }
  };

  /**
   * Add elements to the collection.  This pushes each item in the provided array
   * to the end of the collection.
   * @param {!Array<T>} arr Array.
   * @return {Collection<T>} This collection.
   * @api
   */
  Collection.prototype.extend = function extend (arr) {
    for (var i = 0, ii = arr.length; i < ii; ++i) {
      this.push(arr[i]);
    }
    return this;
  };

  /**
   * Iterate over each element, calling the provided callback.
   * @param {function(T, number, Array<T>): *} f The function to call
   *     for every element. This function takes 3 arguments (the element, the
   *     index and the array). The return value is ignored.
   * @api
   */
  Collection.prototype.forEach = function forEach (f) {
    var array = this.array_;
    for (var i = 0, ii = array.length; i < ii; ++i) {
      f(array[i], i, array);
    }
  };

  /**
   * Get a reference to the underlying Array object. Warning: if the array
   * is mutated, no events will be dispatched by the collection, and the
   * collection's "length" property won't be in sync with the actual length
   * of the array.
   * @return {!Array<T>} Array.
   * @api
   */
  Collection.prototype.getArray = function getArray () {
    return this.array_;
  };

  /**
   * Get the element at the provided index.
   * @param {number} index Index.
   * @return {T} Element.
   * @api
   */
  Collection.prototype.item = function item (index) {
    return this.array_[index];
  };

  /**
   * Get the length of this collection.
   * @return {number} The length of the array.
   * @observable
   * @api
   */
  Collection.prototype.getLength = function getLength () {
    return this.get(Property.LENGTH);
  };

  /**
   * Insert an element at the provided index.
   * @param {number} index Index.
   * @param {T} elem Element.
   * @api
   */
  Collection.prototype.insertAt = function insertAt (index, elem) {
    if (this.unique_) {
      this.assertUnique_(elem);
    }
    this.array_.splice(index, 0, elem);
    this.updateLength_();
    this.dispatchEvent(
      new CollectionEvent(_CollectionEventType_js__WEBPACK_IMPORTED_MODULE_1__["default"].ADD, elem));
  };

  /**
   * Remove the last element of the collection and return it.
   * Return `undefined` if the collection is empty.
   * @return {T|undefined} Element.
   * @api
   */
  Collection.prototype.pop = function pop () {
    return this.removeAt(this.getLength() - 1);
  };

  /**
   * Insert the provided element at the end of the collection.
   * @param {T} elem Element.
   * @return {number} New length of the collection.
   * @api
   */
  Collection.prototype.push = function push (elem) {
    if (this.unique_) {
      this.assertUnique_(elem);
    }
    var n = this.getLength();
    this.insertAt(n, elem);
    return this.getLength();
  };

  /**
   * Remove the first occurrence of an element from the collection.
   * @param {T} elem Element.
   * @return {T|undefined} The removed element or undefined if none found.
   * @api
   */
  Collection.prototype.remove = function remove (elem) {
    var arr = this.array_;
    for (var i = 0, ii = arr.length; i < ii; ++i) {
      if (arr[i] === elem) {
        return this.removeAt(i);
      }
    }
    return undefined;
  };

  /**
   * Remove the element at the provided index and return it.
   * Return `undefined` if the collection does not contain this index.
   * @param {number} index Index.
   * @return {T|undefined} Value.
   * @api
   */
  Collection.prototype.removeAt = function removeAt (index) {
    var prev = this.array_[index];
    this.array_.splice(index, 1);
    this.updateLength_();
    this.dispatchEvent(new CollectionEvent(_CollectionEventType_js__WEBPACK_IMPORTED_MODULE_1__["default"].REMOVE, prev));
    return prev;
  };

  /**
   * Set the element at the provided index.
   * @param {number} index Index.
   * @param {T} elem Element.
   * @api
   */
  Collection.prototype.setAt = function setAt (index, elem) {
    var n = this.getLength();
    if (index < n) {
      if (this.unique_) {
        this.assertUnique_(elem, index);
      }
      var prev = this.array_[index];
      this.array_[index] = elem;
      this.dispatchEvent(
        new CollectionEvent(_CollectionEventType_js__WEBPACK_IMPORTED_MODULE_1__["default"].REMOVE, prev));
      this.dispatchEvent(
        new CollectionEvent(_CollectionEventType_js__WEBPACK_IMPORTED_MODULE_1__["default"].ADD, elem));
    } else {
      for (var j = n; j < index; ++j) {
        this.insertAt(j, undefined);
      }
      this.insertAt(index, elem);
    }
  };

  /**
   * @private
   */
  Collection.prototype.updateLength_ = function updateLength_ () {
    this.set(Property.LENGTH, this.array_.length);
  };

  /**
   * @private
   * @param {T} elem Element.
   * @param {number=} opt_except Optional index to ignore.
   */
  Collection.prototype.assertUnique_ = function assertUnique_ (elem, opt_except) {
    for (var i = 0, ii = this.array_.length; i < ii; ++i) {
      if (this.array_[i] === elem && i !== opt_except) {
        throw new _AssertionError_js__WEBPACK_IMPORTED_MODULE_2__["default"](58);
      }
    }
  };

  return Collection;
}(_Object_js__WEBPACK_IMPORTED_MODULE_3__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Collection);

//# sourceMappingURL=Collection.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/CollectionEventType.js":
/*!********************************************************!*\
  !*** ./node_modules/@biigle/ol/CollectionEventType.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/CollectionEventType
 */

/**
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /**
   * Triggered when an item is added to the collection.
   * @event module:ol/Collection.CollectionEvent#add
   * @api
   */
  ADD: 'add',
  /**
   * Triggered when an item is removed from the collection.
   * @event module:ol/Collection.CollectionEvent#remove
   * @api
   */
  REMOVE: 'remove'
});

//# sourceMappingURL=CollectionEventType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/Disposable.js":
/*!***********************************************!*\
  !*** ./node_modules/@biigle/ol/Disposable.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/Disposable
 */

/**
 * @classdesc
 * Objects that need to clean up after themselves.
 */
var Disposable = function Disposable() {
  /**
   * The object has already been disposed.
   * @type {boolean}
   * @private
   */
  this.disposed_ = false;
};

/**
 * Clean up.
 */
Disposable.prototype.dispose = function dispose () {
  if (!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
  }
};

/**
 * Extension point for disposable objects.
 * @protected
 */
Disposable.prototype.disposeInternal = function disposeInternal () {};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Disposable);

//# sourceMappingURL=Disposable.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/Feature.js":
/*!********************************************!*\
  !*** ./node_modules/@biigle/ol/Feature.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createStyleFunction": () => (/* binding */ createStyleFunction),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _asserts_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./asserts.js */ "./node_modules/@biigle/ol/asserts.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events.js */ "./node_modules/@biigle/ol/events.js");
/* harmony import */ var _events_EventType_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./events/EventType.js */ "./node_modules/@biigle/ol/events/EventType.js");
/* harmony import */ var _Object_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Object.js */ "./node_modules/@biigle/ol/Object.js");
/**
 * @module ol/Feature
 */





/**
 * @typedef {typeof Feature|typeof import("./render/Feature.js").default} FeatureClass
 */

/**
 * @typedef {Feature|import("./render/Feature.js").default} FeatureLike
 */

/**
 * @classdesc
 * A vector object for geographic features with a geometry and other
 * attribute properties, similar to the features in vector file formats like
 * GeoJSON.
 *
 * Features can be styled individually with `setStyle`; otherwise they use the
 * style of their vector layer.
 *
 * Note that attribute properties are set as {@link module:ol/Object} properties on
 * the feature object, so they are observable, and have get/set accessors.
 *
 * Typically, a feature has a single geometry property. You can set the
 * geometry using the `setGeometry` method and get it with `getGeometry`.
 * It is possible to store more than one geometry on a feature using attribute
 * properties. By default, the geometry used for rendering is identified by
 * the property name `geometry`. If you want to use another geometry property
 * for rendering, use the `setGeometryName` method to change the attribute
 * property associated with the geometry for the feature.  For example:
 *
 * ```js
 *
 * import Feature from 'ol/Feature';
 * import Polygon from 'ol/geom/Polygon';
 * import Point from 'ol/geom/Point';
 *
 * var feature = new Feature({
 *   geometry: new Polygon(polyCoords),
 *   labelPoint: new Point(labelCoords),
 *   name: 'My Polygon'
 * });
 *
 * // get the polygon geometry
 * var poly = feature.getGeometry();
 *
 * // Render the feature as a point using the coordinates from labelPoint
 * feature.setGeometryName('labelPoint');
 *
 * // get the point geometry
 * var point = feature.getGeometry();
 * ```
 *
 * @api
 */
var Feature = /*@__PURE__*/(function (BaseObject) {
  function Feature(opt_geometryOrProperties) {

    BaseObject.call(this);

    /**
     * @private
     * @type {number|string|undefined}
     */
    this.id_ = undefined;

    /**
     * @type {string}
     * @private
     */
    this.geometryName_ = 'geometry';

    /**
     * User provided style.
     * @private
     * @type {import("./style/Style.js").StyleLike}
     */
    this.style_ = null;

    /**
     * @private
     * @type {import("./style/Style.js").StyleFunction|undefined}
     */
    this.styleFunction_ = undefined;

    /**
     * @private
     * @type {?import("./events.js").EventsKey}
     */
    this.geometryChangeKey_ = null;

    (0,_events_js__WEBPACK_IMPORTED_MODULE_0__.listen)(
      this, (0,_Object_js__WEBPACK_IMPORTED_MODULE_1__.getChangeEventType)(this.geometryName_),
      this.handleGeometryChanged_, this);

    if (opt_geometryOrProperties) {
      if (typeof /** @type {?} */ (opt_geometryOrProperties).getSimplifiedGeometry === 'function') {
        var geometry = /** @type {import("./geom/Geometry.js").default} */ (opt_geometryOrProperties);
        this.setGeometry(geometry);
      } else {
        /** @type {Object<string, *>} */
        var properties = opt_geometryOrProperties;
        this.setProperties(properties);
      }
    }
  }

  if ( BaseObject ) Feature.__proto__ = BaseObject;
  Feature.prototype = Object.create( BaseObject && BaseObject.prototype );
  Feature.prototype.constructor = Feature;

  /**
   * Clone this feature. If the original feature has a geometry it
   * is also cloned. The feature id is not set in the clone.
   * @return {Feature} The clone.
   * @api
   */
  Feature.prototype.clone = function clone () {
    var clone = new Feature(this.getProperties());
    clone.setGeometryName(this.getGeometryName());
    var geometry = this.getGeometry();
    if (geometry) {
      clone.setGeometry(geometry.clone());
    }
    var style = this.getStyle();
    if (style) {
      clone.setStyle(style);
    }
    return clone;
  };

  /**
   * Get the feature's default geometry.  A feature may have any number of named
   * geometries.  The "default" geometry (the one that is rendered by default) is
   * set when calling {@link module:ol/Feature~Feature#setGeometry}.
   * @return {import("./geom/Geometry.js").default|undefined} The default geometry for the feature.
   * @api
   * @observable
   */
  Feature.prototype.getGeometry = function getGeometry () {
    return (
      /** @type {import("./geom/Geometry.js").default|undefined} */ (this.get(this.geometryName_))
    );
  };

  /**
   * Get the feature identifier.  This is a stable identifier for the feature and
   * is either set when reading data from a remote source or set explicitly by
   * calling {@link module:ol/Feature~Feature#setId}.
   * @return {number|string|undefined} Id.
   * @api
   */
  Feature.prototype.getId = function getId () {
    return this.id_;
  };

  /**
   * Get the name of the feature's default geometry.  By default, the default
   * geometry is named `geometry`.
   * @return {string} Get the property name associated with the default geometry
   *     for this feature.
   * @api
   */
  Feature.prototype.getGeometryName = function getGeometryName () {
    return this.geometryName_;
  };

  /**
   * Get the feature's style. Will return what was provided to the
   * {@link module:ol/Feature~Feature#setStyle} method.
   * @return {import("./style/Style.js").StyleLike} The feature style.
   * @api
   */
  Feature.prototype.getStyle = function getStyle () {
    return this.style_;
  };

  /**
   * Get the feature's style function.
   * @return {import("./style/Style.js").StyleFunction|undefined} Return a function
   * representing the current style of this feature.
   * @api
   */
  Feature.prototype.getStyleFunction = function getStyleFunction () {
    return this.styleFunction_;
  };

  /**
   * @private
   */
  Feature.prototype.handleGeometryChange_ = function handleGeometryChange_ () {
    this.changed();
  };

  /**
   * @private
   */
  Feature.prototype.handleGeometryChanged_ = function handleGeometryChanged_ () {
    if (this.geometryChangeKey_) {
      (0,_events_js__WEBPACK_IMPORTED_MODULE_0__.unlistenByKey)(this.geometryChangeKey_);
      this.geometryChangeKey_ = null;
    }
    var geometry = this.getGeometry();
    if (geometry) {
      this.geometryChangeKey_ = (0,_events_js__WEBPACK_IMPORTED_MODULE_0__.listen)(geometry,
        _events_EventType_js__WEBPACK_IMPORTED_MODULE_2__["default"].CHANGE, this.handleGeometryChange_, this);
    }
    this.changed();
  };

  /**
   * Set the default geometry for the feature.  This will update the property
   * with the name returned by {@link module:ol/Feature~Feature#getGeometryName}.
   * @param {import("./geom/Geometry.js").default|undefined} geometry The new geometry.
   * @api
   * @observable
   */
  Feature.prototype.setGeometry = function setGeometry (geometry) {
    this.set(this.geometryName_, geometry);
  };

  /**
   * Set the style for the feature.  This can be a single style object, an array
   * of styles, or a function that takes a resolution and returns an array of
   * styles. If it is `null` the feature has no style (a `null` style).
   * @param {import("./style/Style.js").StyleLike} style Style for this feature.
   * @api
   * @fires module:ol/events/Event~Event#event:change
   */
  Feature.prototype.setStyle = function setStyle (style) {
    this.style_ = style;
    this.styleFunction_ = !style ? undefined : createStyleFunction(style);
    this.changed();
  };

  /**
   * Set the feature id.  The feature id is considered stable and may be used when
   * requesting features or comparing identifiers returned from a remote source.
   * The feature id can be used with the
   * {@link module:ol/source/Vector~VectorSource#getFeatureById} method.
   * @param {number|string|undefined} id The feature id.
   * @api
   * @fires module:ol/events/Event~Event#event:change
   */
  Feature.prototype.setId = function setId (id) {
    this.id_ = id;
    this.changed();
  };

  /**
   * Set the property name to be used when getting the feature's default geometry.
   * When calling {@link module:ol/Feature~Feature#getGeometry}, the value of the property with
   * this name will be returned.
   * @param {string} name The property name of the default geometry.
   * @api
   */
  Feature.prototype.setGeometryName = function setGeometryName (name) {
    (0,_events_js__WEBPACK_IMPORTED_MODULE_0__.unlisten)(
      this, (0,_Object_js__WEBPACK_IMPORTED_MODULE_1__.getChangeEventType)(this.geometryName_),
      this.handleGeometryChanged_, this);
    this.geometryName_ = name;
    (0,_events_js__WEBPACK_IMPORTED_MODULE_0__.listen)(
      this, (0,_Object_js__WEBPACK_IMPORTED_MODULE_1__.getChangeEventType)(this.geometryName_),
      this.handleGeometryChanged_, this);
    this.handleGeometryChanged_();
  };

  return Feature;
}(_Object_js__WEBPACK_IMPORTED_MODULE_1__["default"]));


/**
 * Convert the provided object into a feature style function.  Functions passed
 * through unchanged.  Arrays of Style or single style objects wrapped
 * in a new feature style function.
 * @param {!import("./style/Style.js").StyleFunction|!Array<import("./style/Style.js").default>|!import("./style/Style.js").default} obj
 *     A feature style function, a single style, or an array of styles.
 * @return {import("./style/Style.js").StyleFunction} A style function.
 */
function createStyleFunction(obj) {
  if (typeof obj === 'function') {
    return obj;
  } else {
    /**
     * @type {Array<import("./style/Style.js").default>}
     */
    var styles;
    if (Array.isArray(obj)) {
      styles = obj;
    } else {
      (0,_asserts_js__WEBPACK_IMPORTED_MODULE_3__.assert)(typeof /** @type {?} */ (obj).getZIndex === 'function',
        41); // Expected an `import("./style/Style.js").Style` or an array of `import("./style/Style.js").Style`
      var style = /** @type {import("./style/Style.js").default} */ (obj);
      styles = [style];
    }
    return function() {
      return styles;
    };
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Feature);

//# sourceMappingURL=Feature.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/ImageState.js":
/*!***********************************************!*\
  !*** ./node_modules/@biigle/ol/ImageState.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/ImageState
 */

/**
 * @enum {number}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3
});

//# sourceMappingURL=ImageState.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/LayerType.js":
/*!**********************************************!*\
  !*** ./node_modules/@biigle/ol/LayerType.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/LayerType
 */

/**
 * A layer type used when creating layer renderers.
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  IMAGE: 'IMAGE',
  TILE: 'TILE',
  VECTOR_TILE: 'VECTOR_TILE',
  VECTOR: 'VECTOR'
});

//# sourceMappingURL=LayerType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/MapBrowserEvent.js":
/*!****************************************************!*\
  !*** ./node_modules/@biigle/ol/MapBrowserEvent.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _MapEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./MapEvent.js */ "./node_modules/@biigle/ol/MapEvent.js");
/**
 * @module ol/MapBrowserEvent
 */


/**
 * @classdesc
 * Events emitted as map browser events are instances of this type.
 * See {@link module:ol/PluggableMap~PluggableMap} for which events trigger a map browser event.
 */
var MapBrowserEvent = /*@__PURE__*/(function (MapEvent) {
  function MapBrowserEvent(type, map, browserEvent, opt_dragging, opt_frameState) {

    MapEvent.call(this, type, map, opt_frameState);

    /**
     * The original browser event.
     * @const
     * @type {Event}
     * @api
     */
    this.originalEvent = browserEvent;

    /**
     * The map pixel relative to the viewport corresponding to the original browser event.
     * @type {import("./pixel.js").Pixel}
     * @api
     */
    this.pixel = map.getEventPixel(browserEvent);

    /**
     * The coordinate in view projection corresponding to the original browser event.
     * @type {import("./coordinate.js").Coordinate}
     * @api
     */
    this.coordinate = map.getCoordinateFromPixel(this.pixel);

    /**
     * Indicates if the map is currently being dragged. Only set for
     * `POINTERDRAG` and `POINTERMOVE` events. Default is `false`.
     *
     * @type {boolean}
     * @api
     */
    this.dragging = opt_dragging !== undefined ? opt_dragging : false;

  }

  if ( MapEvent ) MapBrowserEvent.__proto__ = MapEvent;
  MapBrowserEvent.prototype = Object.create( MapEvent && MapEvent.prototype );
  MapBrowserEvent.prototype.constructor = MapBrowserEvent;

  /**
   * Prevents the default browser action.
   * See https://developer.mozilla.org/en-US/docs/Web/API/event.preventDefault.
   * @override
   * @api
   */
  MapBrowserEvent.prototype.preventDefault = function preventDefault () {
    MapEvent.prototype.preventDefault.call(this);
    this.originalEvent.preventDefault();
  };

  /**
   * Prevents further propagation of the current event.
   * See https://developer.mozilla.org/en-US/docs/Web/API/event.stopPropagation.
   * @override
   * @api
   */
  MapBrowserEvent.prototype.stopPropagation = function stopPropagation () {
    MapEvent.prototype.stopPropagation.call(this);
    this.originalEvent.stopPropagation();
  };

  return MapBrowserEvent;
}(_MapEvent_js__WEBPACK_IMPORTED_MODULE_0__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MapBrowserEvent);

//# sourceMappingURL=MapBrowserEvent.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/MapBrowserEventType.js":
/*!********************************************************!*\
  !*** ./node_modules/@biigle/ol/MapBrowserEventType.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _events_EventType_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/EventType.js */ "./node_modules/@biigle/ol/events/EventType.js");
/**
 * @module ol/MapBrowserEventType
 */


/**
 * Constants for event names.
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

  /**
   * A true single click with no dragging and no double click. Note that this
   * event is delayed by 250 ms to ensure that it is not a double click.
   * @event module:ol/MapBrowserEvent~MapBrowserEvent#singleclick
   * @api
   */
  SINGLECLICK: 'singleclick',

  /**
   * A click with no dragging. A double click will fire two of this.
   * @event module:ol/MapBrowserEvent~MapBrowserEvent#click
   * @api
   */
  CLICK: _events_EventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].CLICK,

  /**
   * A true double click, with no dragging.
   * @event module:ol/MapBrowserEvent~MapBrowserEvent#dblclick
   * @api
   */
  DBLCLICK: _events_EventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].DBLCLICK,

  /**
   * Triggered when a pointer is dragged.
   * @event module:ol/MapBrowserEvent~MapBrowserEvent#pointerdrag
   * @api
   */
  POINTERDRAG: 'pointerdrag',

  /**
   * Triggered when a pointer is moved. Note that on touch devices this is
   * triggered when the map is panned, so is not the same as mousemove.
   * @event module:ol/MapBrowserEvent~MapBrowserEvent#pointermove
   * @api
   */
  POINTERMOVE: 'pointermove',

  POINTERDOWN: 'pointerdown',
  POINTERUP: 'pointerup',
  POINTEROVER: 'pointerover',
  POINTEROUT: 'pointerout',
  POINTERENTER: 'pointerenter',
  POINTERLEAVE: 'pointerleave',
  POINTERCANCEL: 'pointercancel'
});

//# sourceMappingURL=MapBrowserEventType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/MapBrowserPointerEvent.js":
/*!***********************************************************!*\
  !*** ./node_modules/@biigle/ol/MapBrowserPointerEvent.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _MapBrowserEvent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./MapBrowserEvent.js */ "./node_modules/@biigle/ol/MapBrowserEvent.js");
/**
 * @module ol/MapBrowserPointerEvent
 */


var MapBrowserPointerEvent = /*@__PURE__*/(function (MapBrowserEvent) {
  function MapBrowserPointerEvent(type, map, pointerEvent, opt_dragging, opt_frameState) {

    MapBrowserEvent.call(this, type, map, pointerEvent.originalEvent, opt_dragging, opt_frameState);

    /**
     * @const
     * @type {import("./pointer/PointerEvent.js").default}
     */
    this.pointerEvent = pointerEvent;

  }

  if ( MapBrowserEvent ) MapBrowserPointerEvent.__proto__ = MapBrowserEvent;
  MapBrowserPointerEvent.prototype = Object.create( MapBrowserEvent && MapBrowserEvent.prototype );
  MapBrowserPointerEvent.prototype.constructor = MapBrowserPointerEvent;

  return MapBrowserPointerEvent;
}(_MapBrowserEvent_js__WEBPACK_IMPORTED_MODULE_0__["default"]));

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MapBrowserPointerEvent);

//# sourceMappingURL=MapBrowserPointerEvent.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/MapEvent.js":
/*!*********************************************!*\
  !*** ./node_modules/@biigle/ol/MapEvent.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _events_Event_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/Event.js */ "./node_modules/@biigle/ol/events/Event.js");
/**
 * @module ol/MapEvent
 */


/**
 * @classdesc
 * Events emitted as map events are instances of this type.
 * See {@link module:ol/PluggableMap~PluggableMap} for which events trigger a map event.
 */
var MapEvent = /*@__PURE__*/(function (Event) {
  function MapEvent(type, map, opt_frameState) {

    Event.call(this, type);

    /**
     * The map where the event occurred.
     * @type {import("./PluggableMap.js").default}
     * @api
     */
    this.map = map;

    /**
     * The frame state at the time of the event.
     * @type {?import("./PluggableMap.js").FrameState}
     * @api
     */
    this.frameState = opt_frameState !== undefined ? opt_frameState : null;

  }

  if ( Event ) MapEvent.__proto__ = Event;
  MapEvent.prototype = Object.create( Event && Event.prototype );
  MapEvent.prototype.constructor = MapEvent;

  return MapEvent;
}(_events_Event_js__WEBPACK_IMPORTED_MODULE_0__["default"]));

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MapEvent);

//# sourceMappingURL=MapEvent.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/Object.js":
/*!*******************************************!*\
  !*** ./node_modules/@biigle/ol/Object.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ObjectEvent": () => (/* binding */ ObjectEvent),
/* harmony export */   "getChangeEventType": () => (/* binding */ getChangeEventType),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var _ObjectEventType_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ObjectEventType.js */ "./node_modules/@biigle/ol/ObjectEventType.js");
/* harmony import */ var _Observable_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Observable.js */ "./node_modules/@biigle/ol/Observable.js");
/* harmony import */ var _events_Event_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/Event.js */ "./node_modules/@biigle/ol/events/Event.js");
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./obj.js */ "./node_modules/@biigle/ol/obj.js");
/**
 * @module ol/Object
 */







/**
 * @classdesc
 * Events emitted by {@link module:ol/Object~BaseObject} instances are instances of this type.
 */
var ObjectEvent = /*@__PURE__*/(function (Event) {
  function ObjectEvent(type, key, oldValue) {
    Event.call(this, type);

    /**
     * The name of the property whose value is changing.
     * @type {string}
     * @api
     */
    this.key = key;

    /**
     * The old value. To get the new value use `e.target.get(e.key)` where
     * `e` is the event object.
     * @type {*}
     * @api
     */
    this.oldValue = oldValue;

  }

  if ( Event ) ObjectEvent.__proto__ = Event;
  ObjectEvent.prototype = Object.create( Event && Event.prototype );
  ObjectEvent.prototype.constructor = ObjectEvent;

  return ObjectEvent;
}(_events_Event_js__WEBPACK_IMPORTED_MODULE_0__["default"]));


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Most non-trivial classes inherit from this.
 *
 * This extends {@link module:ol/Observable} with observable
 * properties, where each property is observable as well as the object as a
 * whole.
 *
 * Classes that inherit from this have pre-defined properties, to which you can
 * add your owns. The pre-defined properties are listed in this documentation as
 * 'Observable Properties', and have their own accessors; for example,
 * {@link module:ol/Map~Map} has a `target` property, accessed with
 * `getTarget()` and changed with `setTarget()`. Not all properties are however
 * settable. There are also general-purpose accessors `get()` and `set()`. For
 * example, `get('target')` is equivalent to `getTarget()`.
 *
 * The `set` accessors trigger a change event, and you can monitor this by
 * registering a listener. For example, {@link module:ol/View~View} has a
 * `center` property, so `view.on('change:center', function(evt) {...});` would
 * call the function whenever the value of the center property changes. Within
 * the function, `evt.target` would be the view, so `evt.target.getCenter()`
 * would return the new center.
 *
 * You can add your own observable properties with
 * `object.set('prop', 'value')`, and retrieve that with `object.get('prop')`.
 * You can listen for changes on that property value with
 * `object.on('change:prop', listener)`. You can get a list of all
 * properties with {@link module:ol/Object~BaseObject#getProperties}.
 *
 * Note that the observable properties are separate from standard JS properties.
 * You can, for example, give your map object a title with
 * `map.title='New title'` and with `map.set('title', 'Another title')`. The
 * first will be a `hasOwnProperty`; the second will appear in
 * `getProperties()`. Only the second is observable.
 *
 * Properties can be deleted by using the unset method. E.g.
 * object.unset('foo').
 *
 * @fires ObjectEvent
 * @api
 */
var BaseObject = /*@__PURE__*/(function (Observable) {
  function BaseObject(opt_values) {
    Observable.call(this);

    // Call {@link module:ol/util~getUid} to ensure that the order of objects' ids is
    // the same as the order in which they were created.  This also helps to
    // ensure that object properties are always added in the same order, which
    // helps many JavaScript engines generate faster code.
    (0,_util_js__WEBPACK_IMPORTED_MODULE_1__.getUid)(this);

    /**
     * @private
     * @type {!Object<string, *>}
     */
    this.values_ = {};

    if (opt_values !== undefined) {
      this.setProperties(opt_values);
    }
  }

  if ( Observable ) BaseObject.__proto__ = Observable;
  BaseObject.prototype = Object.create( Observable && Observable.prototype );
  BaseObject.prototype.constructor = BaseObject;

  /**
   * Gets a value.
   * @param {string} key Key name.
   * @return {*} Value.
   * @api
   */
  BaseObject.prototype.get = function get (key) {
    var value;
    if (this.values_.hasOwnProperty(key)) {
      value = this.values_[key];
    }
    return value;
  };

  /**
   * Get a list of object property names.
   * @return {Array<string>} List of property names.
   * @api
   */
  BaseObject.prototype.getKeys = function getKeys () {
    return Object.keys(this.values_);
  };

  /**
   * Get an object of all property names and values.
   * @return {Object<string, *>} Object.
   * @api
   */
  BaseObject.prototype.getProperties = function getProperties () {
    return (0,_obj_js__WEBPACK_IMPORTED_MODULE_2__.assign)({}, this.values_);
  };

  /**
   * @param {string} key Key name.
   * @param {*} oldValue Old value.
   */
  BaseObject.prototype.notify = function notify (key, oldValue) {
    var eventType;
    eventType = getChangeEventType(key);
    this.dispatchEvent(new ObjectEvent(eventType, key, oldValue));
    eventType = _ObjectEventType_js__WEBPACK_IMPORTED_MODULE_3__["default"].PROPERTYCHANGE;
    this.dispatchEvent(new ObjectEvent(eventType, key, oldValue));
  };

  /**
   * Sets a value.
   * @param {string} key Key name.
   * @param {*} value Value.
   * @param {boolean=} opt_silent Update without triggering an event.
   * @api
   */
  BaseObject.prototype.set = function set (key, value, opt_silent) {
    if (opt_silent) {
      this.values_[key] = value;
    } else {
      var oldValue = this.values_[key];
      this.values_[key] = value;
      if (oldValue !== value) {
        this.notify(key, oldValue);
      }
    }
  };

  /**
   * Sets a collection of key-value pairs.  Note that this changes any existing
   * properties and adds new ones (it does not remove any existing properties).
   * @param {Object<string, *>} values Values.
   * @param {boolean=} opt_silent Update without triggering an event.
   * @api
   */
  BaseObject.prototype.setProperties = function setProperties (values, opt_silent) {
    for (var key in values) {
      this.set(key, values[key], opt_silent);
    }
  };

  /**
   * Unsets a property.
   * @param {string} key Key name.
   * @param {boolean=} opt_silent Unset without triggering an event.
   * @api
   */
  BaseObject.prototype.unset = function unset (key, opt_silent) {
    if (key in this.values_) {
      var oldValue = this.values_[key];
      delete this.values_[key];
      if (!opt_silent) {
        this.notify(key, oldValue);
      }
    }
  };

  return BaseObject;
}(_Observable_js__WEBPACK_IMPORTED_MODULE_4__["default"]));


/**
 * @type {Object<string, string>}
 */
var changeEventTypeCache = {};


/**
 * @param {string} key Key name.
 * @return {string} Change name.
 */
function getChangeEventType(key) {
  return changeEventTypeCache.hasOwnProperty(key) ?
    changeEventTypeCache[key] :
    (changeEventTypeCache[key] = 'change:' + key);
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BaseObject);

//# sourceMappingURL=Object.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/ObjectEventType.js":
/*!****************************************************!*\
  !*** ./node_modules/@biigle/ol/ObjectEventType.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/ObjectEventType
 */

/**
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /**
   * Triggered when a property is changed.
   * @event module:ol/Object.ObjectEvent#propertychange
   * @api
   */
  PROPERTYCHANGE: 'propertychange'
});

//# sourceMappingURL=ObjectEventType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/Observable.js":
/*!***********************************************!*\
  !*** ./node_modules/@biigle/ol/Observable.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "unByKey": () => (/* binding */ unByKey),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./events.js */ "./node_modules/@biigle/ol/events.js");
/* harmony import */ var _events_Target_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./events/Target.js */ "./node_modules/@biigle/ol/events/Target.js");
/* harmony import */ var _events_EventType_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/EventType.js */ "./node_modules/@biigle/ol/events/EventType.js");
/**
 * @module ol/Observable
 */




/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * An event target providing convenient methods for listener registration
 * and unregistration. A generic `change` event is always available through
 * {@link module:ol/Observable~Observable#changed}.
 *
 * @fires import("./events/Event.js").Event
 * @api
 */
var Observable = /*@__PURE__*/(function (EventTarget) {
  function Observable() {

    EventTarget.call(this);

    /**
     * @private
     * @type {number}
     */
    this.revision_ = 0;

  }

  if ( EventTarget ) Observable.__proto__ = EventTarget;
  Observable.prototype = Object.create( EventTarget && EventTarget.prototype );
  Observable.prototype.constructor = Observable;

  /**
   * Increases the revision counter and dispatches a 'change' event.
   * @api
   */
  Observable.prototype.changed = function changed () {
    ++this.revision_;
    this.dispatchEvent(_events_EventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].CHANGE);
  };

  /**
   * Get the version number for this object.  Each time the object is modified,
   * its version number will be incremented.
   * @return {number} Revision.
   * @api
   */
  Observable.prototype.getRevision = function getRevision () {
    return this.revision_;
  };

  /**
   * Listen for a certain type of event.
   * @param {string|Array<string>} type The event type or array of event types.
   * @param {function(?): ?} listener The listener function.
   * @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Unique key for the listener. If
   *     called with an array of event types as the first argument, the return
   *     will be an array of keys.
   * @api
   */
  Observable.prototype.on = function on (type, listener) {
    if (Array.isArray(type)) {
      var len = type.length;
      var keys = new Array(len);
      for (var i = 0; i < len; ++i) {
        keys[i] = (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.listen)(this, type[i], listener);
      }
      return keys;
    } else {
      return (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.listen)(this, /** @type {string} */ (type), listener);
    }
  };

  /**
   * Listen once for a certain type of event.
   * @param {string|Array<string>} type The event type or array of event types.
   * @param {function(?): ?} listener The listener function.
   * @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Unique key for the listener. If
   *     called with an array of event types as the first argument, the return
   *     will be an array of keys.
   * @api
   */
  Observable.prototype.once = function once (type, listener) {
    if (Array.isArray(type)) {
      var len = type.length;
      var keys = new Array(len);
      for (var i = 0; i < len; ++i) {
        keys[i] = (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.listenOnce)(this, type[i], listener);
      }
      return keys;
    } else {
      return (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.listenOnce)(this, /** @type {string} */ (type), listener);
    }
  };

  /**
   * Unlisten for a certain type of event.
   * @param {string|Array<string>} type The event type or array of event types.
   * @param {function(?): ?} listener The listener function.
   * @api
   */
  Observable.prototype.un = function un (type, listener) {
    if (Array.isArray(type)) {
      for (var i = 0, ii = type.length; i < ii; ++i) {
        (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.unlisten)(this, type[i], listener);
      }
      return;
    } else {
      (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.unlisten)(this, /** @type {string} */ (type), listener);
    }
  };

  return Observable;
}(_events_Target_js__WEBPACK_IMPORTED_MODULE_2__["default"]));


/**
 * Removes an event listener using the key returned by `on()` or `once()`.
 * @param {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} key The key returned by `on()`
 *     or `once()` (or an array of keys).
 * @api
 */
function unByKey(key) {
  if (Array.isArray(key)) {
    for (var i = 0, ii = key.length; i < ii; ++i) {
      (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.unlistenByKey)(key[i]);
    }
  } else {
    (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.unlistenByKey)(/** @type {import("./events.js").EventsKey} */ (key));
  }
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Observable);

//# sourceMappingURL=Observable.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/array.js":
/*!******************************************!*\
  !*** ./node_modules/@biigle/ol/array.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "binarySearch": () => (/* binding */ binarySearch),
/* harmony export */   "numberSafeCompareFunction": () => (/* binding */ numberSafeCompareFunction),
/* harmony export */   "includes": () => (/* binding */ includes),
/* harmony export */   "linearFindNearest": () => (/* binding */ linearFindNearest),
/* harmony export */   "reverseSubArray": () => (/* binding */ reverseSubArray),
/* harmony export */   "extend": () => (/* binding */ extend),
/* harmony export */   "remove": () => (/* binding */ remove),
/* harmony export */   "find": () => (/* binding */ find),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "stableSort": () => (/* binding */ stableSort),
/* harmony export */   "findIndex": () => (/* binding */ findIndex),
/* harmony export */   "isSorted": () => (/* binding */ isSorted)
/* harmony export */ });
/**
 * @module ol/array
 */


/**
 * Performs a binary search on the provided sorted list and returns the index of the item if found. If it can't be found it'll return -1.
 * https://github.com/darkskyapp/binary-search
 *
 * @param {Array<*>} haystack Items to search through.
 * @param {*} needle The item to look for.
 * @param {Function=} opt_comparator Comparator function.
 * @return {number} The index of the item if found, -1 if not.
 */
function binarySearch(haystack, needle, opt_comparator) {
  var mid, cmp;
  var comparator = opt_comparator || numberSafeCompareFunction;
  var low = 0;
  var high = haystack.length;
  var found = false;

  while (low < high) {
    /* Note that "(low + high) >>> 1" may overflow, and results in a typecast
     * to double (which gives the wrong results). */
    mid = low + (high - low >> 1);
    cmp = +comparator(haystack[mid], needle);

    if (cmp < 0.0) { /* Too low. */
      low = mid + 1;

    } else { /* Key found or too high */
      high = mid;
      found = !cmp;
    }
  }

  /* Key not found. */
  return found ? low : ~low;
}


/**
 * Compare function for array sort that is safe for numbers.
 * @param {*} a The first object to be compared.
 * @param {*} b The second object to be compared.
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is less than, equal to, or greater than the second.
 */
function numberSafeCompareFunction(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}


/**
 * Whether the array contains the given object.
 * @param {Array<*>} arr The array to test for the presence of the element.
 * @param {*} obj The object for which to test.
 * @return {boolean} The object is in the array.
 */
function includes(arr, obj) {
  return arr.indexOf(obj) >= 0;
}


/**
 * @param {Array<number>} arr Array.
 * @param {number} target Target.
 * @param {number} direction 0 means return the nearest, > 0
 *    means return the largest nearest, < 0 means return the
 *    smallest nearest.
 * @return {number} Index.
 */
function linearFindNearest(arr, target, direction) {
  var n = arr.length;
  if (arr[0] <= target) {
    return 0;
  } else if (target <= arr[n - 1]) {
    return n - 1;
  } else {
    var i;
    if (direction > 0) {
      for (i = 1; i < n; ++i) {
        if (arr[i] < target) {
          return i - 1;
        }
      }
    } else if (direction < 0) {
      for (i = 1; i < n; ++i) {
        if (arr[i] <= target) {
          return i;
        }
      }
    } else {
      for (i = 1; i < n; ++i) {
        if (arr[i] == target) {
          return i;
        } else if (arr[i] < target) {
          if (arr[i - 1] - target < target - arr[i]) {
            return i - 1;
          } else {
            return i;
          }
        }
      }
    }
    return n - 1;
  }
}


/**
 * @param {Array<*>} arr Array.
 * @param {number} begin Begin index.
 * @param {number} end End index.
 */
function reverseSubArray(arr, begin, end) {
  while (begin < end) {
    var tmp = arr[begin];
    arr[begin] = arr[end];
    arr[end] = tmp;
    ++begin;
    --end;
  }
}


/**
 * @param {Array<VALUE>} arr The array to modify.
 * @param {!Array<VALUE>|VALUE} data The elements or arrays of elements to add to arr.
 * @template VALUE
 */
function extend(arr, data) {
  var extension = Array.isArray(data) ? data : [data];
  var length = extension.length;
  for (var i = 0; i < length; i++) {
    arr[arr.length] = extension[i];
  }
}


/**
 * @param {Array<VALUE>} arr The array to modify.
 * @param {VALUE} obj The element to remove.
 * @template VALUE
 * @return {boolean} If the element was removed.
 */
function remove(arr, obj) {
  var i = arr.indexOf(obj);
  var found = i > -1;
  if (found) {
    arr.splice(i, 1);
  }
  return found;
}


/**
 * @param {Array<VALUE>} arr The array to search in.
 * @param {function(VALUE, number, ?) : boolean} func The function to compare.
 * @template VALUE
 * @return {VALUE|null} The element found or null.
 */
function find(arr, func) {
  var length = arr.length >>> 0;
  var value;

  for (var i = 0; i < length; i++) {
    value = arr[i];
    if (func(value, i, arr)) {
      return value;
    }
  }
  return null;
}


/**
 * @param {Array|Uint8ClampedArray} arr1 The first array to compare.
 * @param {Array|Uint8ClampedArray} arr2 The second array to compare.
 * @return {boolean} Whether the two arrays are equal.
 */
function equals(arr1, arr2) {
  var len1 = arr1.length;
  if (len1 !== arr2.length) {
    return false;
  }
  for (var i = 0; i < len1; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}


/**
 * Sort the passed array such that the relative order of equal elements is preverved.
 * See https://en.wikipedia.org/wiki/Sorting_algorithm#Stability for details.
 * @param {Array<*>} arr The array to sort (modifies original).
 * @param {!function(*, *): number} compareFnc Comparison function.
 * @api
 */
function stableSort(arr, compareFnc) {
  var length = arr.length;
  var tmp = Array(arr.length);
  var i;
  for (i = 0; i < length; i++) {
    tmp[i] = {index: i, value: arr[i]};
  }
  tmp.sort(function(a, b) {
    return compareFnc(a.value, b.value) || a.index - b.index;
  });
  for (i = 0; i < arr.length; i++) {
    arr[i] = tmp[i].value;
  }
}


/**
 * @param {Array<*>} arr The array to search in.
 * @param {Function} func Comparison function.
 * @return {number} Return index.
 */
function findIndex(arr, func) {
  var index;
  var found = !arr.every(function(el, idx) {
    index = idx;
    return !func(el, idx, arr);
  });
  return found ? index : -1;
}


/**
 * @param {Array<*>} arr The array to test.
 * @param {Function=} opt_func Comparison function.
 * @param {boolean=} opt_strict Strictly sorted (default false).
 * @return {boolean} Return index.
 */
function isSorted(arr, opt_func, opt_strict) {
  var compare = opt_func || numberSafeCompareFunction;
  return arr.every(function(currentVal, index) {
    if (index === 0) {
      return true;
    }
    var res = compare(arr[index - 1], currentVal);
    return !(res > 0 || opt_strict && res === 0);
  });
}

//# sourceMappingURL=array.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/asserts.js":
/*!********************************************!*\
  !*** ./node_modules/@biigle/ol/asserts.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "assert": () => (/* binding */ assert)
/* harmony export */ });
/* harmony import */ var _AssertionError_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AssertionError.js */ "./node_modules/@biigle/ol/AssertionError.js");
/**
 * @module ol/asserts
 */


/**
 * @param {*} assertion Assertion we expected to be truthy.
 * @param {number} errorCode Error code.
 */
function assert(assertion, errorCode) {
  if (!assertion) {
    throw new _AssertionError_js__WEBPACK_IMPORTED_MODULE_0__["default"](errorCode);
  }
}

//# sourceMappingURL=asserts.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/color.js":
/*!******************************************!*\
  !*** ./node_modules/@biigle/ol/color.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "asString": () => (/* binding */ asString),
/* harmony export */   "fromString": () => (/* binding */ fromString),
/* harmony export */   "asArray": () => (/* binding */ asArray),
/* harmony export */   "normalize": () => (/* binding */ normalize),
/* harmony export */   "toString": () => (/* binding */ toString)
/* harmony export */ });
/* harmony import */ var _asserts_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./asserts.js */ "./node_modules/@biigle/ol/asserts.js");
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./math.js */ "./node_modules/@biigle/ol/math.js");
/**
 * @module ol/color
 */




/**
 * A color represented as a short array [red, green, blue, alpha].
 * red, green, and blue should be integers in the range 0..255 inclusive.
 * alpha should be a float in the range 0..1 inclusive. If no alpha value is
 * given then `1` will be used.
 * @typedef {Array<number>} Color
 * @api
 */


/**
 * This RegExp matches # followed by 3, 4, 6, or 8 hex digits.
 * @const
 * @type {RegExp}
 * @private
 */
var HEX_COLOR_RE_ = /^#([a-f0-9]{3}|[a-f0-9]{4}(?:[a-f0-9]{2}){0,2})$/i;


/**
 * Regular expression for matching potential named color style strings.
 * @const
 * @type {RegExp}
 * @private
 */
var NAMED_COLOR_RE_ = /^([a-z]*)$/i;


/**
 * Return the color as an rgba string.
 * @param {Color|string} color Color.
 * @return {string} Rgba string.
 * @api
 */
function asString(color) {
  if (typeof color === 'string') {
    return color;
  } else {
    return toString(color);
  }
}

/**
 * Return named color as an rgba string.
 * @param {string} color Named color.
 * @return {string} Rgb string.
 */
function fromNamed(color) {
  var el = document.createElement('div');
  el.style.color = color;
  if (el.style.color !== '') {
    document.body.appendChild(el);
    var rgb = getComputedStyle(el).color;
    document.body.removeChild(el);
    return rgb;
  } else {
    return '';
  }
}


/**
 * @param {string} s String.
 * @return {Color} Color.
 */
var fromString = (
  function() {

    // We maintain a small cache of parsed strings.  To provide cheap LRU-like
    // semantics, whenever the cache grows too large we simply delete an
    // arbitrary 25% of the entries.

    /**
     * @const
     * @type {number}
     */
    var MAX_CACHE_SIZE = 1024;

    /**
     * @type {Object<string, Color>}
     */
    var cache = {};

    /**
     * @type {number}
     */
    var cacheSize = 0;

    return (
      /**
       * @param {string} s String.
       * @return {Color} Color.
       */
      function(s) {
        var color;
        if (cache.hasOwnProperty(s)) {
          color = cache[s];
        } else {
          if (cacheSize >= MAX_CACHE_SIZE) {
            var i = 0;
            for (var key in cache) {
              if ((i++ & 3) === 0) {
                delete cache[key];
                --cacheSize;
              }
            }
          }
          color = fromStringInternal_(s);
          cache[s] = color;
          ++cacheSize;
        }
        return color;
      }
    );

  })();

/**
 * Return the color as an array. This function maintains a cache of calculated
 * arrays which means the result should not be modified.
 * @param {Color|string} color Color.
 * @return {Color} Color.
 * @api
 */
function asArray(color) {
  if (Array.isArray(color)) {
    return color;
  } else {
    return fromString(color);
  }
}

/**
 * @param {string} s String.
 * @private
 * @return {Color} Color.
 */
function fromStringInternal_(s) {
  var r, g, b, a, color;

  if (NAMED_COLOR_RE_.exec(s)) {
    s = fromNamed(s);
  }

  if (HEX_COLOR_RE_.exec(s)) { // hex
    var n = s.length - 1; // number of hex digits
    var d; // number of digits per channel
    if (n <= 4) {
      d = 1;
    } else {
      d = 2;
    }
    var hasAlpha = n === 4 || n === 8;
    r = parseInt(s.substr(1 + 0 * d, d), 16);
    g = parseInt(s.substr(1 + 1 * d, d), 16);
    b = parseInt(s.substr(1 + 2 * d, d), 16);
    if (hasAlpha) {
      a = parseInt(s.substr(1 + 3 * d, d), 16);
    } else {
      a = 255;
    }
    if (d == 1) {
      r = (r << 4) + r;
      g = (g << 4) + g;
      b = (b << 4) + b;
      if (hasAlpha) {
        a = (a << 4) + a;
      }
    }
    color = [r, g, b, a / 255];
  } else if (s.indexOf('rgba(') == 0) { // rgba()
    color = s.slice(5, -1).split(',').map(Number);
    normalize(color);
  } else if (s.indexOf('rgb(') == 0) { // rgb()
    color = s.slice(4, -1).split(',').map(Number);
    color.push(1);
    normalize(color);
  } else {
    (0,_asserts_js__WEBPACK_IMPORTED_MODULE_0__.assert)(false, 14); // Invalid color
  }
  return color;
}


/**
 * TODO this function is only used in the test, we probably shouldn't export it
 * @param {Color} color Color.
 * @return {Color} Clamped color.
 */
function normalize(color) {
  color[0] = (0,_math_js__WEBPACK_IMPORTED_MODULE_1__.clamp)((color[0] + 0.5) | 0, 0, 255);
  color[1] = (0,_math_js__WEBPACK_IMPORTED_MODULE_1__.clamp)((color[1] + 0.5) | 0, 0, 255);
  color[2] = (0,_math_js__WEBPACK_IMPORTED_MODULE_1__.clamp)((color[2] + 0.5) | 0, 0, 255);
  color[3] = (0,_math_js__WEBPACK_IMPORTED_MODULE_1__.clamp)(color[3], 0, 1);
  return color;
}


/**
 * @param {Color} color Color.
 * @return {string} String.
 */
function toString(color) {
  var r = color[0];
  if (r != (r | 0)) {
    r = (r + 0.5) | 0;
  }
  var g = color[1];
  if (g != (g | 0)) {
    g = (g + 0.5) | 0;
  }
  var b = color[2];
  if (b != (b | 0)) {
    b = (b + 0.5) | 0;
  }
  var a = color[3] === undefined ? 1 : color[3];
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

//# sourceMappingURL=color.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/colorlike.js":
/*!**********************************************!*\
  !*** ./node_modules/@biigle/ol/colorlike.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "asColorLike": () => (/* binding */ asColorLike)
/* harmony export */ });
/* harmony import */ var _color_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./color.js */ "./node_modules/@biigle/ol/color.js");
/**
 * @module ol/colorlike
 */



/**
 * A type accepted by CanvasRenderingContext2D.fillStyle
 * or CanvasRenderingContext2D.strokeStyle.
 * Represents a color, pattern, or gradient. The origin for patterns and
 * gradients as fill style is an increment of 512 css pixels from map coordinate
 * `[0, 0]`. For seamless repeat patterns, width and height of the pattern image
 * must be a factor of two (2, 4, 8, ..., 512).
 *
 * @typedef {string|CanvasPattern|CanvasGradient} ColorLike
 * @api
 */


/**
 * @param {import("./color.js").Color|ColorLike} color Color.
 * @return {ColorLike} The color as an {@link ol/colorlike~ColorLike}.
 * @api
 */
function asColorLike(color) {
  if (Array.isArray(color)) {
    return (0,_color_js__WEBPACK_IMPORTED_MODULE_0__.toString)(color);
  } else {
    return color;
  }
}

//# sourceMappingURL=colorlike.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/coordinate.js":
/*!***********************************************!*\
  !*** ./node_modules/@biigle/ol/coordinate.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "closestOnCircle": () => (/* binding */ closestOnCircle),
/* harmony export */   "closestOnSegment": () => (/* binding */ closestOnSegment),
/* harmony export */   "createStringXY": () => (/* binding */ createStringXY),
/* harmony export */   "degreesToStringHDMS": () => (/* binding */ degreesToStringHDMS),
/* harmony export */   "format": () => (/* binding */ format),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "rotate": () => (/* binding */ rotate),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "squaredDistance": () => (/* binding */ squaredDistance),
/* harmony export */   "distance": () => (/* binding */ distance),
/* harmony export */   "squaredDistanceToSegment": () => (/* binding */ squaredDistanceToSegment),
/* harmony export */   "toStringHDMS": () => (/* binding */ toStringHDMS),
/* harmony export */   "toStringXY": () => (/* binding */ toStringXY)
/* harmony export */ });
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./math.js */ "./node_modules/@biigle/ol/math.js");
/* harmony import */ var _string_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./string.js */ "./node_modules/@biigle/ol/string.js");
/**
 * @module ol/coordinate
 */




/**
 * An array of numbers representing an xy coordinate. Example: `[16, 48]`.
 * @typedef {Array<number>} Coordinate
 * @api
 */


/**
 * A function that takes a {@link module:ol/coordinate~Coordinate} and
 * transforms it into a `{string}`.
 *
 * @typedef {function((Coordinate|undefined)): string} CoordinateFormat
 * @api
 */


/**
 * Add `delta` to `coordinate`. `coordinate` is modified in place and returned
 * by the function.
 *
 * Example:
 *
 *     import {add} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     add(coord, [-2, 4]);
 *     // coord is now [5.85, 51.983333]
 *
 * @param {Coordinate} coordinate Coordinate.
 * @param {Coordinate} delta Delta.
 * @return {Coordinate} The input coordinate adjusted by
 * the given delta.
 * @api
 */
function add(coordinate, delta) {
  coordinate[0] += delta[0];
  coordinate[1] += delta[1];
  return coordinate;
}


/**
 * Calculates the point closest to the passed coordinate on the passed circle.
 *
 * @param {Coordinate} coordinate The coordinate.
 * @param {import("./geom/Circle.js").default} circle The circle.
 * @return {Coordinate} Closest point on the circumference.
 */
function closestOnCircle(coordinate, circle) {
  var r = circle.getRadius();
  var center = circle.getCenter();
  var x0 = center[0];
  var y0 = center[1];
  var x1 = coordinate[0];
  var y1 = coordinate[1];

  var dx = x1 - x0;
  var dy = y1 - y0;
  if (dx === 0 && dy === 0) {
    dx = 1;
  }
  var d = Math.sqrt(dx * dx + dy * dy);

  var x = x0 + r * dx / d;
  var y = y0 + r * dy / d;

  return [x, y];
}


/**
 * Calculates the point closest to the passed coordinate on the passed segment.
 * This is the foot of the perpendicular of the coordinate to the segment when
 * the foot is on the segment, or the closest segment coordinate when the foot
 * is outside the segment.
 *
 * @param {Coordinate} coordinate The coordinate.
 * @param {Array<Coordinate>} segment The two coordinates
 * of the segment.
 * @return {Coordinate} The foot of the perpendicular of
 * the coordinate to the segment.
 */
function closestOnSegment(coordinate, segment) {
  var x0 = coordinate[0];
  var y0 = coordinate[1];
  var start = segment[0];
  var end = segment[1];
  var x1 = start[0];
  var y1 = start[1];
  var x2 = end[0];
  var y2 = end[1];
  var dx = x2 - x1;
  var dy = y2 - y1;
  var along = (dx === 0 && dy === 0) ? 0 :
    ((dx * (x0 - x1)) + (dy * (y0 - y1))) / ((dx * dx + dy * dy) || 0);
  var x, y;
  if (along <= 0) {
    x = x1;
    y = y1;
  } else if (along >= 1) {
    x = x2;
    y = y2;
  } else {
    x = x1 + along * dx;
    y = y1 + along * dy;
  }
  return [x, y];
}


/**
 * Returns a {@link module:ol/coordinate~CoordinateFormat} function that can be
 * used to format
 * a {Coordinate} to a string.
 *
 * Example without specifying the fractional digits:
 *
 *     import {createStringXY} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var stringifyFunc = createStringXY();
 *     var out = stringifyFunc(coord);
 *     // out is now '8, 48'
 *
 * Example with explicitly specifying 2 fractional digits:
 *
 *     import {createStringXY} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var stringifyFunc = createStringXY(2);
 *     var out = stringifyFunc(coord);
 *     // out is now '7.85, 47.98'
 *
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {CoordinateFormat} Coordinate format.
 * @api
 */
function createStringXY(opt_fractionDigits) {
  return (
    /**
     * @param {Coordinate} coordinate Coordinate.
     * @return {string} String XY.
     */
    function(coordinate) {
      return toStringXY(coordinate, opt_fractionDigits);
    }
  );
}


/**
 * @param {string} hemispheres Hemispheres.
 * @param {number} degrees Degrees.
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {string} String.
 */
function degreesToStringHDMS(hemispheres, degrees, opt_fractionDigits) {
  var normalizedDegrees = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.modulo)(degrees + 180, 360) - 180;
  var x = Math.abs(3600 * normalizedDegrees);
  var dflPrecision = opt_fractionDigits || 0;
  var precision = Math.pow(10, dflPrecision);

  var deg = Math.floor(x / 3600);
  var min = Math.floor((x - deg * 3600) / 60);
  var sec = x - (deg * 3600) - (min * 60);
  sec = Math.ceil(sec * precision) / precision;

  if (sec >= 60) {
    sec = 0;
    min += 1;
  }

  if (min >= 60) {
    min = 0;
    deg += 1;
  }

  return deg + '\u00b0 ' + (0,_string_js__WEBPACK_IMPORTED_MODULE_1__.padNumber)(min, 2) + '\u2032 ' +
    (0,_string_js__WEBPACK_IMPORTED_MODULE_1__.padNumber)(sec, 2, dflPrecision) + '\u2033' +
    (normalizedDegrees == 0 ? '' : ' ' + hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0));
}


/**
 * Transforms the given {@link module:ol/coordinate~Coordinate} to a string
 * using the given string template. The strings `{x}` and `{y}` in the template
 * will be replaced with the first and second coordinate values respectively.
 *
 * Example without specifying the fractional digits:
 *
 *     import {format} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var template = 'Coordinate is ({x}|{y}).';
 *     var out = format(coord, template);
 *     // out is now 'Coordinate is (8|48).'
 *
 * Example explicitly specifying the fractional digits:
 *
 *     import {format} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var template = 'Coordinate is ({x}|{y}).';
 *     var out = format(coord, template, 2);
 *     // out is now 'Coordinate is (7.85|47.98).'
 *
 * @param {Coordinate} coordinate Coordinate.
 * @param {string} template A template string with `{x}` and `{y}` placeholders
 *     that will be replaced by first and second coordinate values.
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {string} Formatted coordinate.
 * @api
 */
function format(coordinate, template, opt_fractionDigits) {
  if (coordinate) {
    return template
      .replace('{x}', coordinate[0].toFixed(opt_fractionDigits))
      .replace('{y}', coordinate[1].toFixed(opt_fractionDigits));
  } else {
    return '';
  }
}


/**
 * @param {Coordinate} coordinate1 First coordinate.
 * @param {Coordinate} coordinate2 Second coordinate.
 * @return {boolean} The two coordinates are equal.
 */
function equals(coordinate1, coordinate2) {
  var equals = true;
  for (var i = coordinate1.length - 1; i >= 0; --i) {
    if (coordinate1[i] != coordinate2[i]) {
      equals = false;
      break;
    }
  }
  return equals;
}


/**
 * Rotate `coordinate` by `angle`. `coordinate` is modified in place and
 * returned by the function.
 *
 * Example:
 *
 *     import {rotate} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var rotateRadians = Math.PI / 2; // 90 degrees
 *     rotate(coord, rotateRadians);
 *     // coord is now [-47.983333, 7.85]
 *
 * @param {Coordinate} coordinate Coordinate.
 * @param {number} angle Angle in radian.
 * @return {Coordinate} Coordinate.
 * @api
 */
function rotate(coordinate, angle) {
  var cosAngle = Math.cos(angle);
  var sinAngle = Math.sin(angle);
  var x = coordinate[0] * cosAngle - coordinate[1] * sinAngle;
  var y = coordinate[1] * cosAngle + coordinate[0] * sinAngle;
  coordinate[0] = x;
  coordinate[1] = y;
  return coordinate;
}


/**
 * Scale `coordinate` by `scale`. `coordinate` is modified in place and returned
 * by the function.
 *
 * Example:
 *
 *     import {scale as scaleCoordinate} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var scale = 1.2;
 *     scaleCoordinate(coord, scale);
 *     // coord is now [9.42, 57.5799996]
 *
 * @param {Coordinate} coordinate Coordinate.
 * @param {number} scale Scale factor.
 * @return {Coordinate} Coordinate.
 */
function scale(coordinate, scale) {
  coordinate[0] *= scale;
  coordinate[1] *= scale;
  return coordinate;
}


/**
 * @param {Coordinate} coord1 First coordinate.
 * @param {Coordinate} coord2 Second coordinate.
 * @return {number} Squared distance between coord1 and coord2.
 */
function squaredDistance(coord1, coord2) {
  var dx = coord1[0] - coord2[0];
  var dy = coord1[1] - coord2[1];
  return dx * dx + dy * dy;
}


/**
 * @param {Coordinate} coord1 First coordinate.
 * @param {Coordinate} coord2 Second coordinate.
 * @return {number} Distance between coord1 and coord2.
 */
function distance(coord1, coord2) {
  return Math.sqrt(squaredDistance(coord1, coord2));
}


/**
 * Calculate the squared distance from a coordinate to a line segment.
 *
 * @param {Coordinate} coordinate Coordinate of the point.
 * @param {Array<Coordinate>} segment Line segment (2
 * coordinates).
 * @return {number} Squared distance from the point to the line segment.
 */
function squaredDistanceToSegment(coordinate, segment) {
  return squaredDistance(coordinate,
    closestOnSegment(coordinate, segment));
}


/**
 * Format a geographic coordinate with the hemisphere, degrees, minutes, and
 * seconds.
 *
 * Example without specifying fractional digits:
 *
 *     import {toStringHDMS} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var out = toStringHDMS(coord);
 *     // out is now '47° 58′ 60″ N 7° 50′ 60″ E'
 *
 * Example explicitly specifying 1 fractional digit:
 *
 *     import {toStringHDMS} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var out = toStringHDMS(coord, 1);
 *     // out is now '47° 58′ 60.0″ N 7° 50′ 60.0″ E'
 *
 * @param {Coordinate} coordinate Coordinate.
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {string} Hemisphere, degrees, minutes and seconds.
 * @api
 */
function toStringHDMS(coordinate, opt_fractionDigits) {
  if (coordinate) {
    return degreesToStringHDMS('NS', coordinate[1], opt_fractionDigits) + ' ' +
        degreesToStringHDMS('EW', coordinate[0], opt_fractionDigits);
  } else {
    return '';
  }
}


/**
 * Format a coordinate as a comma delimited string.
 *
 * Example without specifying fractional digits:
 *
 *     import {toStringXY} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var out = toStringXY(coord);
 *     // out is now '8, 48'
 *
 * Example explicitly specifying 1 fractional digit:
 *
 *     import {toStringXY} from 'ol/coordinate';
 *
 *     var coord = [7.85, 47.983333];
 *     var out = toStringXY(coord, 1);
 *     // out is now '7.8, 48.0'
 *
 * @param {Coordinate} coordinate Coordinate.
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {string} XY.
 * @api
 */
function toStringXY(coordinate, opt_fractionDigits) {
  return format(coordinate, '{x}, {y}', opt_fractionDigits);
}

//# sourceMappingURL=coordinate.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/css.js":
/*!****************************************!*\
  !*** ./node_modules/@biigle/ol/css.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CLASS_HIDDEN": () => (/* binding */ CLASS_HIDDEN),
/* harmony export */   "CLASS_SELECTABLE": () => (/* binding */ CLASS_SELECTABLE),
/* harmony export */   "CLASS_UNSELECTABLE": () => (/* binding */ CLASS_UNSELECTABLE),
/* harmony export */   "CLASS_UNSUPPORTED": () => (/* binding */ CLASS_UNSUPPORTED),
/* harmony export */   "CLASS_CONTROL": () => (/* binding */ CLASS_CONTROL),
/* harmony export */   "CLASS_COLLAPSED": () => (/* binding */ CLASS_COLLAPSED),
/* harmony export */   "getFontFamilies": () => (/* binding */ getFontFamilies)
/* harmony export */ });
/**
 * @module ol/css
 */


/**
 * The CSS class for hidden feature.
 *
 * @const
 * @type {string}
 */
var CLASS_HIDDEN = 'ol-hidden';


/**
 * The CSS class that we'll give the DOM elements to have them selectable.
 *
 * @const
 * @type {string}
 */
var CLASS_SELECTABLE = 'ol-selectable';


/**
 * The CSS class that we'll give the DOM elements to have them unselectable.
 *
 * @const
 * @type {string}
 */
var CLASS_UNSELECTABLE = 'ol-unselectable';


/**
 * The CSS class for unsupported feature.
 *
 * @const
 * @type {string}
 */
var CLASS_UNSUPPORTED = 'ol-unsupported';


/**
 * The CSS class for controls.
 *
 * @const
 * @type {string}
 */
var CLASS_CONTROL = 'ol-control';


/**
 * The CSS class that we'll give the DOM elements that are collapsed, i.e.
 * to those elements which usually can be expanded.
 *
 * @const
 * @type {string}
 */
var CLASS_COLLAPSED = 'ol-collapsed';


/**
 * Get the list of font families from a font spec.  Note that this doesn't work
 * for font families that have commas in them.
 * @param {string} The CSS font property.
 * @return {Object<string>} The font families (or null if the input spec is invalid).
 */
var getFontFamilies = (function() {
  var style;
  var cache = {};
  return function(font) {
    if (!style) {
      style = document.createElement('div').style;
    }
    if (!(font in cache)) {
      style.font = font;
      var family = style.fontFamily;
      style.font = '';
      if (!family) {
        return null;
      }
      cache[font] = family.split(/,\s?/);
    }
    return cache[font];
  };
})();

//# sourceMappingURL=css.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/dom.js":
/*!****************************************!*\
  !*** ./node_modules/@biigle/ol/dom.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createCanvasContext2D": () => (/* binding */ createCanvasContext2D),
/* harmony export */   "outerWidth": () => (/* binding */ outerWidth),
/* harmony export */   "outerHeight": () => (/* binding */ outerHeight),
/* harmony export */   "replaceNode": () => (/* binding */ replaceNode),
/* harmony export */   "removeNode": () => (/* binding */ removeNode),
/* harmony export */   "removeChildren": () => (/* binding */ removeChildren)
/* harmony export */ });
/**
 * @module ol/dom
 */


/**
 * Create an html canvas element and returns its 2d context.
 * @param {number=} opt_width Canvas width.
 * @param {number=} opt_height Canvas height.
 * @return {CanvasRenderingContext2D} The context.
 */
function createCanvasContext2D(opt_width, opt_height) {
  var canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
  if (opt_width) {
    canvas.width = opt_width;
  }
  if (opt_height) {
    canvas.height = opt_height;
  }
  return /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
}


/**
 * Get the current computed width for the given element including margin,
 * padding and border.
 * Equivalent to jQuery's `$(el).outerWidth(true)`.
 * @param {!HTMLElement} element Element.
 * @return {number} The width.
 */
function outerWidth(element) {
  var width = element.offsetWidth;
  var style = getComputedStyle(element);
  width += parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);

  return width;
}


/**
 * Get the current computed height for the given element including margin,
 * padding and border.
 * Equivalent to jQuery's `$(el).outerHeight(true)`.
 * @param {!HTMLElement} element Element.
 * @return {number} The height.
 */
function outerHeight(element) {
  var height = element.offsetHeight;
  var style = getComputedStyle(element);
  height += parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);

  return height;
}

/**
 * @param {Node} newNode Node to replace old node
 * @param {Node} oldNode The node to be replaced
 */
function replaceNode(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
}

/**
 * @param {Node} node The node to remove.
 * @returns {Node} The node that was removed or null.
 */
function removeNode(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
}

/**
 * @param {Node} node The node to remove the children from.
 */
function removeChildren(node) {
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
}

//# sourceMappingURL=dom.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/easing.js":
/*!*******************************************!*\
  !*** ./node_modules/@biigle/ol/easing.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "easeIn": () => (/* binding */ easeIn),
/* harmony export */   "easeOut": () => (/* binding */ easeOut),
/* harmony export */   "inAndOut": () => (/* binding */ inAndOut),
/* harmony export */   "linear": () => (/* binding */ linear),
/* harmony export */   "upAndDown": () => (/* binding */ upAndDown)
/* harmony export */ });
/**
 * @module ol/easing
 */


/**
 * Start slow and speed up.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
function easeIn(t) {
  return Math.pow(t, 3);
}


/**
 * Start fast and slow down.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
function easeOut(t) {
  return 1 - easeIn(1 - t);
}


/**
 * Start slow, speed up, and then slow down again.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
function inAndOut(t) {
  return 3 * t * t - 2 * t * t * t;
}


/**
 * Maintain a constant speed over time.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
function linear(t) {
  return t;
}


/**
 * Start slow, speed up, and at the very end slow down again.  This has the
 * same general behavior as {@link module:ol/easing~inAndOut}, but the final
 * slowdown is delayed.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
function upAndDown(t) {
  if (t < 0.5) {
    return inAndOut(2 * t);
  } else {
    return 1 - inAndOut(2 * (t - 0.5));
  }
}

//# sourceMappingURL=easing.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/events.js":
/*!*******************************************!*\
  !*** ./node_modules/@biigle/ol/events.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bindListener": () => (/* binding */ bindListener),
/* harmony export */   "findListener": () => (/* binding */ findListener),
/* harmony export */   "getListeners": () => (/* binding */ getListeners),
/* harmony export */   "listen": () => (/* binding */ listen),
/* harmony export */   "listenOnce": () => (/* binding */ listenOnce),
/* harmony export */   "unlisten": () => (/* binding */ unlisten),
/* harmony export */   "unlistenByKey": () => (/* binding */ unlistenByKey),
/* harmony export */   "unlistenAll": () => (/* binding */ unlistenAll)
/* harmony export */ });
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./obj.js */ "./node_modules/@biigle/ol/obj.js");
/**
 * @module ol/events
 */



/**
 * Key to use with {@link module:ol/Observable~Observable#unByKey}.
 * @typedef {Object} EventsKey
 * @property {Object} [bindTo]
 * @property {ListenerFunction} [boundListener]
 * @property {boolean} callOnce
 * @property {number} [deleteIndex]
 * @property {ListenerFunction} listener
 * @property {import("./events/Target.js").EventTargetLike} target
 * @property {string} type
 * @api
 */


/**
 * Listener function. This function is called with an event object as argument.
 * When the function returns `false`, event propagation will stop.
 *
 * @typedef {function((Event|import("./events/Event.js").default)): (void|boolean)} ListenerFunction
 * @api
 */


/**
 * @param {EventsKey} listenerObj Listener object.
 * @return {ListenerFunction} Bound listener.
 */
function bindListener(listenerObj) {
  var boundListener = function(evt) {
    var listener = listenerObj.listener;
    var bindTo = listenerObj.bindTo || listenerObj.target;
    if (listenerObj.callOnce) {
      unlistenByKey(listenerObj);
    }
    return listener.call(bindTo, evt);
  };
  listenerObj.boundListener = boundListener;
  return boundListener;
}


/**
 * Finds the matching {@link module:ol/events~EventsKey} in the given listener
 * array.
 *
 * @param {!Array<!EventsKey>} listeners Array of listeners.
 * @param {!Function} listener The listener function.
 * @param {Object=} opt_this The `this` value inside the listener.
 * @param {boolean=} opt_setDeleteIndex Set the deleteIndex on the matching
 *     listener, for {@link module:ol/events~unlistenByKey}.
 * @return {EventsKey|undefined} The matching listener object.
 */
function findListener(listeners, listener, opt_this, opt_setDeleteIndex) {
  var listenerObj;
  for (var i = 0, ii = listeners.length; i < ii; ++i) {
    listenerObj = listeners[i];
    if (listenerObj.listener === listener &&
        listenerObj.bindTo === opt_this) {
      if (opt_setDeleteIndex) {
        listenerObj.deleteIndex = i;
      }
      return listenerObj;
    }
  }
  return undefined;
}


/**
 * @param {import("./events/Target.js").EventTargetLike} target Target.
 * @param {string} type Type.
 * @return {Array<EventsKey>|undefined} Listeners.
 */
function getListeners(target, type) {
  var listenerMap = getListenerMap(target);
  return listenerMap ? listenerMap[type] : undefined;
}


/**
 * Get the lookup of listeners.
 * @param {Object} target Target.
 * @param {boolean=} opt_create If a map should be created if it doesn't exist.
 * @return {!Object<string, Array<EventsKey>>} Map of
 *     listeners by event type.
 */
function getListenerMap(target, opt_create) {
  var listenerMap = target.ol_lm;
  if (!listenerMap && opt_create) {
    listenerMap = target.ol_lm = {};
  }
  return listenerMap;
}


/**
 * Remove the listener map from a target.
 * @param {Object} target Target.
 */
function removeListenerMap(target) {
  delete target.ol_lm;
}


/**
 * Clean up all listener objects of the given type.  All properties on the
 * listener objects will be removed, and if no listeners remain in the listener
 * map, it will be removed from the target.
 * @param {import("./events/Target.js").EventTargetLike} target Target.
 * @param {string} type Type.
 */
function removeListeners(target, type) {
  var listeners = getListeners(target, type);
  if (listeners) {
    for (var i = 0, ii = listeners.length; i < ii; ++i) {
      /** @type {import("./events/Target.js").default} */ (target).
        removeEventListener(type, listeners[i].boundListener);
      (0,_obj_js__WEBPACK_IMPORTED_MODULE_0__.clear)(listeners[i]);
    }
    listeners.length = 0;
    var listenerMap = getListenerMap(target);
    if (listenerMap) {
      delete listenerMap[type];
      if (Object.keys(listenerMap).length === 0) {
        removeListenerMap(target);
      }
    }
  }
}


/**
 * Registers an event listener on an event target. Inspired by
 * https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html
 *
 * This function efficiently binds a `listener` to a `this` object, and returns
 * a key for use with {@link module:ol/events~unlistenByKey}.
 *
 * @param {import("./events/Target.js").EventTargetLike} target Event target.
 * @param {string} type Event type.
 * @param {ListenerFunction} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @param {boolean=} opt_once If true, add the listener as one-off listener.
 * @return {EventsKey} Unique key for the listener.
 */
function listen(target, type, listener, opt_this, opt_once) {
  var listenerMap = getListenerMap(target, true);
  var listeners = listenerMap[type];
  if (!listeners) {
    listeners = listenerMap[type] = [];
  }
  var listenerObj = findListener(listeners, listener, opt_this, false);
  if (listenerObj) {
    if (!opt_once) {
      // Turn one-off listener into a permanent one.
      listenerObj.callOnce = false;
    }
  } else {
    listenerObj = /** @type {EventsKey} */ ({
      bindTo: opt_this,
      callOnce: !!opt_once,
      listener: listener,
      target: target,
      type: type
    });
    /** @type {import("./events/Target.js").default} */ (target).
      addEventListener(type, bindListener(listenerObj));
    listeners.push(listenerObj);
  }

  return listenerObj;
}


/**
 * Registers a one-off event listener on an event target. Inspired by
 * https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html
 *
 * This function efficiently binds a `listener` as self-unregistering listener
 * to a `this` object, and returns a key for use with
 * {@link module:ol/events~unlistenByKey} in case the listener needs to be
 * unregistered before it is called.
 *
 * When {@link module:ol/events~listen} is called with the same arguments after this
 * function, the self-unregistering listener will be turned into a permanent
 * listener.
 *
 * @param {import("./events/Target.js").EventTargetLike} target Event target.
 * @param {string} type Event type.
 * @param {ListenerFunction} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 * @return {EventsKey} Key for unlistenByKey.
 */
function listenOnce(target, type, listener, opt_this) {
  return listen(target, type, listener, opt_this, true);
}


/**
 * Unregisters an event listener on an event target. Inspired by
 * https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html
 *
 * To return a listener, this function needs to be called with the exact same
 * arguments that were used for a previous {@link module:ol/events~listen} call.
 *
 * @param {import("./events/Target.js").EventTargetLike} target Event target.
 * @param {string} type Event type.
 * @param {ListenerFunction} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the
 *     listener. Default is the `target`.
 */
function unlisten(target, type, listener, opt_this) {
  var listeners = getListeners(target, type);
  if (listeners) {
    var listenerObj = findListener(listeners, listener, opt_this, true);
    if (listenerObj) {
      unlistenByKey(listenerObj);
    }
  }
}


/**
 * Unregisters event listeners on an event target. Inspired by
 * https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html
 *
 * The argument passed to this function is the key returned from
 * {@link module:ol/events~listen} or {@link module:ol/events~listenOnce}.
 *
 * @param {EventsKey} key The key.
 */
function unlistenByKey(key) {
  if (key && key.target) {
    /** @type {import("./events/Target.js").default} */ (key.target).
      removeEventListener(key.type, key.boundListener);
    var listeners = getListeners(key.target, key.type);
    if (listeners) {
      var i = 'deleteIndex' in key ? key.deleteIndex : listeners.indexOf(key);
      if (i !== -1) {
        listeners.splice(i, 1);
      }
      if (listeners.length === 0) {
        removeListeners(key.target, key.type);
      }
    }
    (0,_obj_js__WEBPACK_IMPORTED_MODULE_0__.clear)(key);
  }
}


/**
 * Unregisters all event listeners on an event target. Inspired by
 * https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html
 *
 * @param {import("./events/Target.js").EventTargetLike} target Target.
 */
function unlistenAll(target) {
  var listenerMap = getListenerMap(target);
  if (listenerMap) {
    for (var type in listenerMap) {
      removeListeners(target, type);
    }
  }
}

//# sourceMappingURL=events.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/events/Event.js":
/*!*************************************************!*\
  !*** ./node_modules/@biigle/ol/events/Event.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "stopPropagation": () => (/* binding */ stopPropagation),
/* harmony export */   "preventDefault": () => (/* binding */ preventDefault),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/events/Event
 */

/**
 * @classdesc
 * Stripped down implementation of the W3C DOM Level 2 Event interface.
 * See https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-interface.
 *
 * This implementation only provides `type` and `target` properties, and
 * `stopPropagation` and `preventDefault` methods. It is meant as base class
 * for higher level events defined in the library, and works with
 * {@link module:ol/events/Target~Target}.
 */
var Event = function Event(type) {

  /**
   * @type {boolean}
   */
  this.propagationStopped;

  /**
   * The event type.
   * @type {string}
   * @api
   */
  this.type = type;

  /**
   * The event target.
   * @type {Object}
   * @api
   */
  this.target = null;
};

/**
 * Stop event propagation.
 * @api
 */
Event.prototype.preventDefault = function preventDefault () {
  this.propagationStopped = true;
};

/**
 * Stop event propagation.
 * @api
 */
Event.prototype.stopPropagation = function stopPropagation () {
  this.propagationStopped = true;
};


/**
 * @param {Event|import("./Event.js").default} evt Event
 */
function stopPropagation(evt) {
  evt.stopPropagation();
}


/**
 * @param {Event|import("./Event.js").default} evt Event
 */
function preventDefault(evt) {
  evt.preventDefault();
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Event);

//# sourceMappingURL=Event.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/events/EventType.js":
/*!*****************************************************!*\
  !*** ./node_modules/@biigle/ol/events/EventType.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/events/EventType
 */

/**
 * @enum {string}
 * @const
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /**
   * Generic change event. Triggered when the revision counter is increased.
   * @event module:ol/events/Event~Event#change
   * @api
   */
  CHANGE: 'change',

  CLEAR: 'clear',
  CONTEXTMENU: 'contextmenu',
  CLICK: 'click',
  DBLCLICK: 'dblclick',
  DRAGENTER: 'dragenter',
  DRAGOVER: 'dragover',
  DROP: 'drop',
  ERROR: 'error',
  KEYDOWN: 'keydown',
  KEYPRESS: 'keypress',
  LOAD: 'load',
  MOUSEDOWN: 'mousedown',
  MOUSEMOVE: 'mousemove',
  MOUSEOUT: 'mouseout',
  MOUSEUP: 'mouseup',
  MOUSEWHEEL: 'mousewheel',
  MSPOINTERDOWN: 'MSPointerDown',
  RESIZE: 'resize',
  TOUCHSTART: 'touchstart',
  TOUCHMOVE: 'touchmove',
  TOUCHEND: 'touchend',
  WHEEL: 'wheel'
});

//# sourceMappingURL=EventType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/events/Target.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/events/Target.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _Disposable_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../Disposable.js */ "./node_modules/@biigle/ol/Disposable.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events.js */ "./node_modules/@biigle/ol/events.js");
/* harmony import */ var _functions_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../functions.js */ "./node_modules/@biigle/ol/functions.js");
/* harmony import */ var _Event_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Event.js */ "./node_modules/@biigle/ol/events/Event.js");
/**
 * @module ol/events/Target
 */






/**
 * @typedef {EventTarget|Target} EventTargetLike
 */


/**
 * @classdesc
 * A simplified implementation of the W3C DOM Level 2 EventTarget interface.
 * See https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-EventTarget.
 *
 * There are two important simplifications compared to the specification:
 *
 * 1. The handling of `useCapture` in `addEventListener` and
 *    `removeEventListener`. There is no real capture model.
 * 2. The handling of `stopPropagation` and `preventDefault` on `dispatchEvent`.
 *    There is no event target hierarchy. When a listener calls
 *    `stopPropagation` or `preventDefault` on an event object, it means that no
 *    more listeners after this one will be called. Same as when the listener
 *    returns false.
 */
var Target = /*@__PURE__*/(function (Disposable) {
  function Target() {

    Disposable.call(this);

    /**
     * @private
     * @type {!Object<string, number>}
     */
    this.pendingRemovals_ = {};

    /**
     * @private
     * @type {!Object<string, number>}
     */
    this.dispatching_ = {};

    /**
     * @private
     * @type {!Object<string, Array<import("../events.js").ListenerFunction>>}
     */
    this.listeners_ = {};

  }

  if ( Disposable ) Target.__proto__ = Disposable;
  Target.prototype = Object.create( Disposable && Disposable.prototype );
  Target.prototype.constructor = Target;

  /**
   * @param {string} type Type.
   * @param {import("../events.js").ListenerFunction} listener Listener.
   */
  Target.prototype.addEventListener = function addEventListener (type, listener) {
    var listeners = this.listeners_[type];
    if (!listeners) {
      listeners = this.listeners_[type] = [];
    }
    if (listeners.indexOf(listener) === -1) {
      listeners.push(listener);
    }
  };

  /**
   * Dispatches an event and calls all listeners listening for events
   * of this type. The event parameter can either be a string or an
   * Object with a `type` property.
   *
   * @param {{type: string,
   *     target: (EventTargetLike|undefined),
   *     propagationStopped: (boolean|undefined)}|
   *     import("./Event.js").default|string} event Event object.
   * @return {boolean|undefined} `false` if anyone called preventDefault on the
   *     event object or if any of the listeners returned false.
   * @api
   */
  Target.prototype.dispatchEvent = function dispatchEvent (event) {
    var evt = typeof event === 'string' ? new _Event_js__WEBPACK_IMPORTED_MODULE_0__["default"](event) : event;
    var type = evt.type;
    evt.target = this;
    var listeners = this.listeners_[type];
    var propagate;
    if (listeners) {
      if (!(type in this.dispatching_)) {
        this.dispatching_[type] = 0;
        this.pendingRemovals_[type] = 0;
      }
      ++this.dispatching_[type];
      for (var i = 0, ii = listeners.length; i < ii; ++i) {
        if (listeners[i].call(this, evt) === false || evt.propagationStopped) {
          propagate = false;
          break;
        }
      }
      --this.dispatching_[type];
      if (this.dispatching_[type] === 0) {
        var pendingRemovals = this.pendingRemovals_[type];
        delete this.pendingRemovals_[type];
        while (pendingRemovals--) {
          this.removeEventListener(type, _functions_js__WEBPACK_IMPORTED_MODULE_1__.VOID);
        }
        delete this.dispatching_[type];
      }
      return propagate;
    }
  };

  /**
   * @inheritDoc
   */
  Target.prototype.disposeInternal = function disposeInternal () {
    (0,_events_js__WEBPACK_IMPORTED_MODULE_2__.unlistenAll)(this);
  };

  /**
   * Get the listeners for a specified event type. Listeners are returned in the
   * order that they will be called in.
   *
   * @param {string} type Type.
   * @return {Array<import("../events.js").ListenerFunction>} Listeners.
   */
  Target.prototype.getListeners = function getListeners (type) {
    return this.listeners_[type];
  };

  /**
   * @param {string=} opt_type Type. If not provided,
   *     `true` will be returned if this event target has any listeners.
   * @return {boolean} Has listeners.
   */
  Target.prototype.hasListener = function hasListener (opt_type) {
    return opt_type ?
      opt_type in this.listeners_ :
      Object.keys(this.listeners_).length > 0;
  };

  /**
   * @param {string} type Type.
   * @param {import("../events.js").ListenerFunction} listener Listener.
   */
  Target.prototype.removeEventListener = function removeEventListener (type, listener) {
    var listeners = this.listeners_[type];
    if (listeners) {
      var index = listeners.indexOf(listener);
      if (type in this.pendingRemovals_) {
        // make listener a no-op, and remove later in #dispatchEvent()
        listeners[index] = _functions_js__WEBPACK_IMPORTED_MODULE_1__.VOID;
        ++this.pendingRemovals_[type];
      } else {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          delete this.listeners_[type];
        }
      }
    }
  };

  return Target;
}(_Disposable_js__WEBPACK_IMPORTED_MODULE_3__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Target);

//# sourceMappingURL=Target.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/events/condition.js":
/*!*****************************************************!*\
  !*** ./node_modules/@biigle/ol/events/condition.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "altKeyOnly": () => (/* binding */ altKeyOnly),
/* harmony export */   "altShiftKeysOnly": () => (/* binding */ altShiftKeysOnly),
/* harmony export */   "focus": () => (/* binding */ focus),
/* harmony export */   "always": () => (/* binding */ always),
/* harmony export */   "click": () => (/* binding */ click),
/* harmony export */   "mouseActionButton": () => (/* binding */ mouseActionButton),
/* harmony export */   "never": () => (/* binding */ never),
/* harmony export */   "pointerMove": () => (/* binding */ pointerMove),
/* harmony export */   "singleClick": () => (/* binding */ singleClick),
/* harmony export */   "doubleClick": () => (/* binding */ doubleClick),
/* harmony export */   "noModifierKeys": () => (/* binding */ noModifierKeys),
/* harmony export */   "platformModifierKeyOnly": () => (/* binding */ platformModifierKeyOnly),
/* harmony export */   "shiftKeyOnly": () => (/* binding */ shiftKeyOnly),
/* harmony export */   "targetNotEditable": () => (/* binding */ targetNotEditable),
/* harmony export */   "mouseOnly": () => (/* binding */ mouseOnly),
/* harmony export */   "primaryAction": () => (/* binding */ primaryAction)
/* harmony export */ });
/* harmony import */ var _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../MapBrowserEventType.js */ "./node_modules/@biigle/ol/MapBrowserEventType.js");
/* harmony import */ var _asserts_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../asserts.js */ "./node_modules/@biigle/ol/asserts.js");
/* harmony import */ var _functions_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../functions.js */ "./node_modules/@biigle/ol/functions.js");
/* harmony import */ var _has_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../has.js */ "./node_modules/@biigle/ol/has.js");
/**
 * @module ol/events/condition
 */






/**
 * A function that takes an {@link module:ol/MapBrowserEvent} and returns a
 * `{boolean}`. If the condition is met, true should be returned.
 *
 * @typedef {function(this: ?, import("../MapBrowserEvent.js").default): boolean} Condition
 */


/**
 * Return `true` if only the alt-key is pressed, `false` otherwise (e.g. when
 * additionally the shift-key is pressed).
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt key is pressed.
 * @api
 */
var altKeyOnly = function(mapBrowserEvent) {
  var originalEvent = /** @type {KeyboardEvent|MouseEvent|TouchEvent} */ (mapBrowserEvent.originalEvent);
  return (
    originalEvent.altKey &&
      !(originalEvent.metaKey || originalEvent.ctrlKey) &&
      !originalEvent.shiftKey);
};


/**
 * Return `true` if only the alt-key and shift-key is pressed, `false` otherwise
 * (e.g. when additionally the platform-modifier-key is pressed).
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt and shift keys are pressed.
 * @api
 */
var altShiftKeysOnly = function(mapBrowserEvent) {
  var originalEvent = /** @type {KeyboardEvent|MouseEvent|TouchEvent} */ (mapBrowserEvent.originalEvent);
  return (
    originalEvent.altKey &&
      !(originalEvent.metaKey || originalEvent.ctrlKey) &&
      originalEvent.shiftKey);
};


/**
 * Return `true` if the map has the focus. This condition requires a map target
 * element with a `tabindex` attribute, e.g. `<div id="map" tabindex="1">`.
 *
 * @param {import("../MapBrowserEvent.js").default} event Map browser event.
 * @return {boolean} The map has the focus.
 * @api
 */
var focus = function(event) {
  return event.target.getTargetElement() === document.activeElement;
};


/**
 * Return always true.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True.
 * @api
 */
var always = _functions_js__WEBPACK_IMPORTED_MODULE_0__.TRUE;


/**
 * Return `true` if the event is a `click` event, `false` otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `click` event.
 * @api
 */
var click = function(mapBrowserEvent) {
  return mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_1__["default"].CLICK;
};


/**
 * Return `true` if the event has an "action"-producing mouse button.
 *
 * By definition, this includes left-click on windows/linux, and left-click
 * without the ctrl key on Macs.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} The result.
 */
var mouseActionButton = function(mapBrowserEvent) {
  var originalEvent = /** @type {MouseEvent} */ (mapBrowserEvent.originalEvent);
  return originalEvent.button == 0 &&
      !(_has_js__WEBPACK_IMPORTED_MODULE_2__.WEBKIT && _has_js__WEBPACK_IMPORTED_MODULE_2__.MAC && originalEvent.ctrlKey);
};


/**
 * Return always false.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} False.
 * @api
 */
var never = _functions_js__WEBPACK_IMPORTED_MODULE_0__.FALSE;


/**
 * Return `true` if the browser event is a `pointermove` event, `false`
 * otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the browser event is a `pointermove` event.
 * @api
 */
var pointerMove = function(mapBrowserEvent) {
  return mapBrowserEvent.type == 'pointermove';
};


/**
 * Return `true` if the event is a map `singleclick` event, `false` otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `singleclick` event.
 * @api
 */
var singleClick = function(mapBrowserEvent) {
  return mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_1__["default"].SINGLECLICK;
};


/**
 * Return `true` if the event is a map `dblclick` event, `false` otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `dblclick` event.
 * @api
 */
var doubleClick = function(mapBrowserEvent) {
  return mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_1__["default"].DBLCLICK;
};


/**
 * Return `true` if no modifier key (alt-, shift- or platform-modifier-key) is
 * pressed.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True only if there no modifier keys are pressed.
 * @api
 */
var noModifierKeys = function(mapBrowserEvent) {
  var originalEvent = /** @type {KeyboardEvent|MouseEvent|TouchEvent} */ (mapBrowserEvent.originalEvent);
  return (
    !originalEvent.altKey &&
      !(originalEvent.metaKey || originalEvent.ctrlKey) &&
      !originalEvent.shiftKey);
};


/**
 * Return `true` if only the platform-modifier-key (the meta-key on Mac,
 * ctrl-key otherwise) is pressed, `false` otherwise (e.g. when additionally
 * the shift-key is pressed).
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the platform modifier key is pressed.
 * @api
 */
var platformModifierKeyOnly = function(mapBrowserEvent) {
  var originalEvent = /** @type {KeyboardEvent|MouseEvent|TouchEvent} */ (mapBrowserEvent.originalEvent);
  return !originalEvent.altKey &&
    (_has_js__WEBPACK_IMPORTED_MODULE_2__.MAC ? originalEvent.metaKey : originalEvent.ctrlKey) &&
    !originalEvent.shiftKey;
};


/**
 * Return `true` if only the shift-key is pressed, `false` otherwise (e.g. when
 * additionally the alt-key is pressed).
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the shift key is pressed.
 * @api
 */
var shiftKeyOnly = function(mapBrowserEvent) {
  var originalEvent = /** @type {KeyboardEvent|MouseEvent|TouchEvent} */ (mapBrowserEvent.originalEvent);
  return (
    !originalEvent.altKey &&
      !(originalEvent.metaKey || originalEvent.ctrlKey) &&
      originalEvent.shiftKey);
};


/**
 * Return `true` if the target element is not editable, i.e. not a `<input>`-,
 * `<select>`- or `<textarea>`-element, `false` otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True only if the target element is not editable.
 * @api
 */
var targetNotEditable = function(mapBrowserEvent) {
  var target = mapBrowserEvent.originalEvent.target;
  var tagName = /** @type {Element} */ (target).tagName;
  return (
    tagName !== 'INPUT' &&
      tagName !== 'SELECT' &&
      tagName !== 'TEXTAREA');
};


/**
 * Return `true` if the event originates from a mouse device.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a mouse device.
 * @api
 */
var mouseOnly = function(mapBrowserEvent) {
  var pointerEvent = /** @type {import("../MapBrowserPointerEvent").default} */ (mapBrowserEvent).pointerEvent;
  (0,_asserts_js__WEBPACK_IMPORTED_MODULE_3__.assert)(pointerEvent !== undefined, 56); // mapBrowserEvent must originate from a pointer event
  // see http://www.w3.org/TR/pointerevents/#widl-PointerEvent-pointerType
  return pointerEvent.pointerType == 'mouse';
};


/**
 * Return `true` if the event originates from a primary pointer in
 * contact with the surface or if the left mouse button is pressed.
 * See http://www.w3.org/TR/pointerevents/#button-states.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a primary pointer.
 * @api
 */
var primaryAction = function(mapBrowserEvent) {
  var pointerEvent = /** @type {import("../MapBrowserPointerEvent").default} */ (mapBrowserEvent).pointerEvent;
  (0,_asserts_js__WEBPACK_IMPORTED_MODULE_3__.assert)(pointerEvent !== undefined, 56); // mapBrowserEvent must originate from a pointer event
  return pointerEvent.isPrimary && pointerEvent.button === 0;
};

//# sourceMappingURL=condition.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/extent.js":
/*!*******************************************!*\
  !*** ./node_modules/@biigle/ol/extent.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "boundingExtent": () => (/* binding */ boundingExtent),
/* harmony export */   "buffer": () => (/* binding */ buffer),
/* harmony export */   "clone": () => (/* binding */ clone),
/* harmony export */   "closestSquaredDistanceXY": () => (/* binding */ closestSquaredDistanceXY),
/* harmony export */   "containsCoordinate": () => (/* binding */ containsCoordinate),
/* harmony export */   "containsExtent": () => (/* binding */ containsExtent),
/* harmony export */   "containsXY": () => (/* binding */ containsXY),
/* harmony export */   "coordinateRelationship": () => (/* binding */ coordinateRelationship),
/* harmony export */   "createEmpty": () => (/* binding */ createEmpty),
/* harmony export */   "createOrUpdate": () => (/* binding */ createOrUpdate),
/* harmony export */   "createOrUpdateEmpty": () => (/* binding */ createOrUpdateEmpty),
/* harmony export */   "createOrUpdateFromCoordinate": () => (/* binding */ createOrUpdateFromCoordinate),
/* harmony export */   "createOrUpdateFromCoordinates": () => (/* binding */ createOrUpdateFromCoordinates),
/* harmony export */   "createOrUpdateFromFlatCoordinates": () => (/* binding */ createOrUpdateFromFlatCoordinates),
/* harmony export */   "createOrUpdateFromRings": () => (/* binding */ createOrUpdateFromRings),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "extend": () => (/* binding */ extend),
/* harmony export */   "extendCoordinate": () => (/* binding */ extendCoordinate),
/* harmony export */   "extendCoordinates": () => (/* binding */ extendCoordinates),
/* harmony export */   "extendFlatCoordinates": () => (/* binding */ extendFlatCoordinates),
/* harmony export */   "extendRings": () => (/* binding */ extendRings),
/* harmony export */   "extendXY": () => (/* binding */ extendXY),
/* harmony export */   "forEachCorner": () => (/* binding */ forEachCorner),
/* harmony export */   "getArea": () => (/* binding */ getArea),
/* harmony export */   "getBottomLeft": () => (/* binding */ getBottomLeft),
/* harmony export */   "getBottomRight": () => (/* binding */ getBottomRight),
/* harmony export */   "getCenter": () => (/* binding */ getCenter),
/* harmony export */   "getCorner": () => (/* binding */ getCorner),
/* harmony export */   "getEnlargedArea": () => (/* binding */ getEnlargedArea),
/* harmony export */   "getForViewAndSize": () => (/* binding */ getForViewAndSize),
/* harmony export */   "getHeight": () => (/* binding */ getHeight),
/* harmony export */   "getIntersectionArea": () => (/* binding */ getIntersectionArea),
/* harmony export */   "getIntersection": () => (/* binding */ getIntersection),
/* harmony export */   "getMargin": () => (/* binding */ getMargin),
/* harmony export */   "getSize": () => (/* binding */ getSize),
/* harmony export */   "getTopLeft": () => (/* binding */ getTopLeft),
/* harmony export */   "getTopRight": () => (/* binding */ getTopRight),
/* harmony export */   "getWidth": () => (/* binding */ getWidth),
/* harmony export */   "intersects": () => (/* binding */ intersects),
/* harmony export */   "isEmpty": () => (/* binding */ isEmpty),
/* harmony export */   "returnOrUpdate": () => (/* binding */ returnOrUpdate),
/* harmony export */   "scaleFromCenter": () => (/* binding */ scaleFromCenter),
/* harmony export */   "intersectsSegment": () => (/* binding */ intersectsSegment),
/* harmony export */   "applyTransform": () => (/* binding */ applyTransform)
/* harmony export */ });
/* harmony import */ var _asserts_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./asserts.js */ "./node_modules/@biigle/ol/asserts.js");
/* harmony import */ var _extent_Corner_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./extent/Corner.js */ "./node_modules/@biigle/ol/extent/Corner.js");
/* harmony import */ var _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./extent/Relationship.js */ "./node_modules/@biigle/ol/extent/Relationship.js");
/**
 * @module ol/extent
 */





/**
 * An array of numbers representing an extent: `[minx, miny, maxx, maxy]`.
 * @typedef {Array<number>} Extent
 * @api
 */

/**
 * Build an extent that includes all given coordinates.
 *
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates Coordinates.
 * @return {Extent} Bounding extent.
 * @api
 */
function boundingExtent(coordinates) {
  var extent = createEmpty();
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
    extendCoordinate(extent, coordinates[i]);
  }
  return extent;
}


/**
 * @param {Array<number>} xs Xs.
 * @param {Array<number>} ys Ys.
 * @param {Extent=} opt_extent Destination extent.
 * @private
 * @return {Extent} Extent.
 */
function _boundingExtentXYs(xs, ys, opt_extent) {
  var minX = Math.min.apply(null, xs);
  var minY = Math.min.apply(null, ys);
  var maxX = Math.max.apply(null, xs);
  var maxY = Math.max.apply(null, ys);
  return createOrUpdate(minX, minY, maxX, maxY, opt_extent);
}


/**
 * Return extent increased by the provided value.
 * @param {Extent} extent Extent.
 * @param {number} value The amount by which the extent should be buffered.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 * @api
 */
function buffer(extent, value, opt_extent) {
  if (opt_extent) {
    opt_extent[0] = extent[0] - value;
    opt_extent[1] = extent[1] - value;
    opt_extent[2] = extent[2] + value;
    opt_extent[3] = extent[3] + value;
    return opt_extent;
  } else {
    return [
      extent[0] - value,
      extent[1] - value,
      extent[2] + value,
      extent[3] + value
    ];
  }
}


/**
 * Creates a clone of an extent.
 *
 * @param {Extent} extent Extent to clone.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} The clone.
 */
function clone(extent, opt_extent) {
  if (opt_extent) {
    opt_extent[0] = extent[0];
    opt_extent[1] = extent[1];
    opt_extent[2] = extent[2];
    opt_extent[3] = extent[3];
    return opt_extent;
  } else {
    return extent.slice();
  }
}


/**
 * @param {Extent} extent Extent.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {number} Closest squared distance.
 */
function closestSquaredDistanceXY(extent, x, y) {
  var dx, dy;
  if (x < extent[0]) {
    dx = extent[0] - x;
  } else if (extent[2] < x) {
    dx = x - extent[2];
  } else {
    dx = 0;
  }
  if (y < extent[1]) {
    dy = extent[1] - y;
  } else if (extent[3] < y) {
    dy = y - extent[3];
  } else {
    dy = 0;
  }
  return dx * dx + dy * dy;
}


/**
 * Check if the passed coordinate is contained or on the edge of the extent.
 *
 * @param {Extent} extent Extent.
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @return {boolean} The coordinate is contained in the extent.
 * @api
 */
function containsCoordinate(extent, coordinate) {
  return containsXY(extent, coordinate[0], coordinate[1]);
}


/**
 * Check if one extent contains another.
 *
 * An extent is deemed contained if it lies completely within the other extent,
 * including if they share one or more edges.
 *
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {boolean} The second extent is contained by or on the edge of the
 *     first.
 * @api
 */
function containsExtent(extent1, extent2) {
  return extent1[0] <= extent2[0] && extent2[2] <= extent1[2] &&
      extent1[1] <= extent2[1] && extent2[3] <= extent1[3];
}


/**
 * Check if the passed coordinate is contained or on the edge of the extent.
 *
 * @param {Extent} extent Extent.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {boolean} The x, y values are contained in the extent.
 * @api
 */
function containsXY(extent, x, y) {
  return extent[0] <= x && x <= extent[2] && extent[1] <= y && y <= extent[3];
}


/**
 * Get the relationship between a coordinate and extent.
 * @param {Extent} extent The extent.
 * @param {import("./coordinate.js").Coordinate} coordinate The coordinate.
 * @return {Relationship} The relationship (bitwise compare with
 *     import("./extent/Relationship.js").Relationship).
 */
function coordinateRelationship(extent, coordinate) {
  var minX = extent[0];
  var minY = extent[1];
  var maxX = extent[2];
  var maxY = extent[3];
  var x = coordinate[0];
  var y = coordinate[1];
  var relationship = _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].UNKNOWN;
  if (x < minX) {
    relationship = relationship | _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].LEFT;
  } else if (x > maxX) {
    relationship = relationship | _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].RIGHT;
  }
  if (y < minY) {
    relationship = relationship | _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].BELOW;
  } else if (y > maxY) {
    relationship = relationship | _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].ABOVE;
  }
  if (relationship === _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].UNKNOWN) {
    relationship = _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].INTERSECTING;
  }
  return relationship;
}


/**
 * Create an empty extent.
 * @return {Extent} Empty extent.
 * @api
 */
function createEmpty() {
  return [Infinity, Infinity, -Infinity, -Infinity];
}


/**
 * Create a new extent or update the provided extent.
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 * @param {Extent=} opt_extent Destination extent.
 * @return {Extent} Extent.
 */
function createOrUpdate(minX, minY, maxX, maxY, opt_extent) {
  if (opt_extent) {
    opt_extent[0] = minX;
    opt_extent[1] = minY;
    opt_extent[2] = maxX;
    opt_extent[3] = maxY;
    return opt_extent;
  } else {
    return [minX, minY, maxX, maxY];
  }
}


/**
 * Create a new empty extent or make the provided one empty.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
function createOrUpdateEmpty(opt_extent) {
  return createOrUpdate(
    Infinity, Infinity, -Infinity, -Infinity, opt_extent);
}


/**
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
function createOrUpdateFromCoordinate(coordinate, opt_extent) {
  var x = coordinate[0];
  var y = coordinate[1];
  return createOrUpdate(x, y, x, y, opt_extent);
}


/**
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates Coordinates.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
function createOrUpdateFromCoordinates(coordinates, opt_extent) {
  var extent = createOrUpdateEmpty(opt_extent);
  return extendCoordinates(extent, coordinates);
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
function createOrUpdateFromFlatCoordinates(flatCoordinates, offset, end, stride, opt_extent) {
  var extent = createOrUpdateEmpty(opt_extent);
  return extendFlatCoordinates(extent, flatCoordinates, offset, end, stride);
}

/**
 * @param {Array<Array<import("./coordinate.js").Coordinate>>} rings Rings.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
function createOrUpdateFromRings(rings, opt_extent) {
  var extent = createOrUpdateEmpty(opt_extent);
  return extendRings(extent, rings);
}


/**
 * Determine if two extents are equivalent.
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {boolean} The two extents are equivalent.
 * @api
 */
function equals(extent1, extent2) {
  return extent1[0] == extent2[0] && extent1[2] == extent2[2] &&
      extent1[1] == extent2[1] && extent1[3] == extent2[3];
}


/**
 * Modify an extent to include another extent.
 * @param {Extent} extent1 The extent to be modified.
 * @param {Extent} extent2 The extent that will be included in the first.
 * @return {Extent} A reference to the first (extended) extent.
 * @api
 */
function extend(extent1, extent2) {
  if (extent2[0] < extent1[0]) {
    extent1[0] = extent2[0];
  }
  if (extent2[2] > extent1[2]) {
    extent1[2] = extent2[2];
  }
  if (extent2[1] < extent1[1]) {
    extent1[1] = extent2[1];
  }
  if (extent2[3] > extent1[3]) {
    extent1[3] = extent2[3];
  }
  return extent1;
}


/**
 * @param {Extent} extent Extent.
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 */
function extendCoordinate(extent, coordinate) {
  if (coordinate[0] < extent[0]) {
    extent[0] = coordinate[0];
  }
  if (coordinate[0] > extent[2]) {
    extent[2] = coordinate[0];
  }
  if (coordinate[1] < extent[1]) {
    extent[1] = coordinate[1];
  }
  if (coordinate[1] > extent[3]) {
    extent[3] = coordinate[1];
  }
}


/**
 * @param {Extent} extent Extent.
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates Coordinates.
 * @return {Extent} Extent.
 */
function extendCoordinates(extent, coordinates) {
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
    extendCoordinate(extent, coordinates[i]);
  }
  return extent;
}


/**
 * @param {Extent} extent Extent.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {Extent} Extent.
 */
function extendFlatCoordinates(extent, flatCoordinates, offset, end, stride) {
  for (; offset < end; offset += stride) {
    extendXY(extent, flatCoordinates[offset], flatCoordinates[offset + 1]);
  }
  return extent;
}


/**
 * @param {Extent} extent Extent.
 * @param {Array<Array<import("./coordinate.js").Coordinate>>} rings Rings.
 * @return {Extent} Extent.
 */
function extendRings(extent, rings) {
  for (var i = 0, ii = rings.length; i < ii; ++i) {
    extendCoordinates(extent, rings[i]);
  }
  return extent;
}


/**
 * @param {Extent} extent Extent.
 * @param {number} x X.
 * @param {number} y Y.
 */
function extendXY(extent, x, y) {
  extent[0] = Math.min(extent[0], x);
  extent[1] = Math.min(extent[1], y);
  extent[2] = Math.max(extent[2], x);
  extent[3] = Math.max(extent[3], y);
}


/**
 * This function calls `callback` for each corner of the extent. If the
 * callback returns a truthy value the function returns that value
 * immediately. Otherwise the function returns `false`.
 * @param {Extent} extent Extent.
 * @param {function(this:T, import("./coordinate.js").Coordinate): S} callback Callback.
 * @param {T=} opt_this Value to use as `this` when executing `callback`.
 * @return {S|boolean} Value.
 * @template S, T
 */
function forEachCorner(extent, callback, opt_this) {
  var val;
  val = callback.call(opt_this, getBottomLeft(extent));
  if (val) {
    return val;
  }
  val = callback.call(opt_this, getBottomRight(extent));
  if (val) {
    return val;
  }
  val = callback.call(opt_this, getTopRight(extent));
  if (val) {
    return val;
  }
  val = callback.call(opt_this, getTopLeft(extent));
  if (val) {
    return val;
  }
  return false;
}


/**
 * Get the size of an extent.
 * @param {Extent} extent Extent.
 * @return {number} Area.
 * @api
 */
function getArea(extent) {
  var area = 0;
  if (!isEmpty(extent)) {
    area = getWidth(extent) * getHeight(extent);
  }
  return area;
}


/**
 * Get the bottom left coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Bottom left coordinate.
 * @api
 */
function getBottomLeft(extent) {
  return [extent[0], extent[1]];
}


/**
 * Get the bottom right coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Bottom right coordinate.
 * @api
 */
function getBottomRight(extent) {
  return [extent[2], extent[1]];
}


/**
 * Get the center coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Center.
 * @api
 */
function getCenter(extent) {
  return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
}


/**
 * Get a corner coordinate of an extent.
 * @param {Extent} extent Extent.
 * @param {Corner} corner Corner.
 * @return {import("./coordinate.js").Coordinate} Corner coordinate.
 */
function getCorner(extent, corner) {
  var coordinate;
  if (corner === _extent_Corner_js__WEBPACK_IMPORTED_MODULE_1__["default"].BOTTOM_LEFT) {
    coordinate = getBottomLeft(extent);
  } else if (corner === _extent_Corner_js__WEBPACK_IMPORTED_MODULE_1__["default"].BOTTOM_RIGHT) {
    coordinate = getBottomRight(extent);
  } else if (corner === _extent_Corner_js__WEBPACK_IMPORTED_MODULE_1__["default"].TOP_LEFT) {
    coordinate = getTopLeft(extent);
  } else if (corner === _extent_Corner_js__WEBPACK_IMPORTED_MODULE_1__["default"].TOP_RIGHT) {
    coordinate = getTopRight(extent);
  } else {
    (0,_asserts_js__WEBPACK_IMPORTED_MODULE_2__.assert)(false, 13); // Invalid corner
  }
  return coordinate;
}


/**
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {number} Enlarged area.
 */
function getEnlargedArea(extent1, extent2) {
  var minX = Math.min(extent1[0], extent2[0]);
  var minY = Math.min(extent1[1], extent2[1]);
  var maxX = Math.max(extent1[2], extent2[2]);
  var maxY = Math.max(extent1[3], extent2[3]);
  return (maxX - minX) * (maxY - minY);
}


/**
 * @param {import("./coordinate.js").Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {import("./size.js").Size} size Size.
 * @param {Extent=} opt_extent Destination extent.
 * @return {Extent} Extent.
 */
function getForViewAndSize(center, resolution, rotation, size, opt_extent) {
  var dx = resolution * size[0] / 2;
  var dy = resolution * size[1] / 2;
  var cosRotation = Math.cos(rotation);
  var sinRotation = Math.sin(rotation);
  var xCos = dx * cosRotation;
  var xSin = dx * sinRotation;
  var yCos = dy * cosRotation;
  var ySin = dy * sinRotation;
  var x = center[0];
  var y = center[1];
  var x0 = x - xCos + ySin;
  var x1 = x - xCos - ySin;
  var x2 = x + xCos - ySin;
  var x3 = x + xCos + ySin;
  var y0 = y - xSin - yCos;
  var y1 = y - xSin + yCos;
  var y2 = y + xSin + yCos;
  var y3 = y + xSin - yCos;
  return createOrUpdate(
    Math.min(x0, x1, x2, x3), Math.min(y0, y1, y2, y3),
    Math.max(x0, x1, x2, x3), Math.max(y0, y1, y2, y3),
    opt_extent);
}


/**
 * Get the height of an extent.
 * @param {Extent} extent Extent.
 * @return {number} Height.
 * @api
 */
function getHeight(extent) {
  return extent[3] - extent[1];
}


/**
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {number} Intersection area.
 */
function getIntersectionArea(extent1, extent2) {
  var intersection = getIntersection(extent1, extent2);
  return getArea(intersection);
}


/**
 * Get the intersection of two extents.
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @param {Extent=} opt_extent Optional extent to populate with intersection.
 * @return {Extent} Intersecting extent.
 * @api
 */
function getIntersection(extent1, extent2, opt_extent) {
  var intersection = opt_extent ? opt_extent : createEmpty();
  if (intersects(extent1, extent2)) {
    if (extent1[0] > extent2[0]) {
      intersection[0] = extent1[0];
    } else {
      intersection[0] = extent2[0];
    }
    if (extent1[1] > extent2[1]) {
      intersection[1] = extent1[1];
    } else {
      intersection[1] = extent2[1];
    }
    if (extent1[2] < extent2[2]) {
      intersection[2] = extent1[2];
    } else {
      intersection[2] = extent2[2];
    }
    if (extent1[3] < extent2[3]) {
      intersection[3] = extent1[3];
    } else {
      intersection[3] = extent2[3];
    }
  } else {
    createOrUpdateEmpty(intersection);
  }
  return intersection;
}


/**
 * @param {Extent} extent Extent.
 * @return {number} Margin.
 */
function getMargin(extent) {
  return getWidth(extent) + getHeight(extent);
}


/**
 * Get the size (width, height) of an extent.
 * @param {Extent} extent The extent.
 * @return {import("./size.js").Size} The extent size.
 * @api
 */
function getSize(extent) {
  return [extent[2] - extent[0], extent[3] - extent[1]];
}


/**
 * Get the top left coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Top left coordinate.
 * @api
 */
function getTopLeft(extent) {
  return [extent[0], extent[3]];
}


/**
 * Get the top right coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Top right coordinate.
 * @api
 */
function getTopRight(extent) {
  return [extent[2], extent[3]];
}


/**
 * Get the width of an extent.
 * @param {Extent} extent Extent.
 * @return {number} Width.
 * @api
 */
function getWidth(extent) {
  return extent[2] - extent[0];
}


/**
 * Determine if one extent intersects another.
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent.
 * @return {boolean} The two extents intersect.
 * @api
 */
function intersects(extent1, extent2) {
  return extent1[0] <= extent2[2] &&
      extent1[2] >= extent2[0] &&
      extent1[1] <= extent2[3] &&
      extent1[3] >= extent2[1];
}


/**
 * Determine if an extent is empty.
 * @param {Extent} extent Extent.
 * @return {boolean} Is empty.
 * @api
 */
function isEmpty(extent) {
  return extent[2] < extent[0] || extent[3] < extent[1];
}


/**
 * @param {Extent} extent Extent.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
function returnOrUpdate(extent, opt_extent) {
  if (opt_extent) {
    opt_extent[0] = extent[0];
    opt_extent[1] = extent[1];
    opt_extent[2] = extent[2];
    opt_extent[3] = extent[3];
    return opt_extent;
  } else {
    return extent;
  }
}


/**
 * @param {Extent} extent Extent.
 * @param {number} value Value.
 */
function scaleFromCenter(extent, value) {
  var deltaX = ((extent[2] - extent[0]) / 2) * (value - 1);
  var deltaY = ((extent[3] - extent[1]) / 2) * (value - 1);
  extent[0] -= deltaX;
  extent[2] += deltaX;
  extent[1] -= deltaY;
  extent[3] += deltaY;
}


/**
 * Determine if the segment between two coordinates intersects (crosses,
 * touches, or is contained by) the provided extent.
 * @param {Extent} extent The extent.
 * @param {import("./coordinate.js").Coordinate} start Segment start coordinate.
 * @param {import("./coordinate.js").Coordinate} end Segment end coordinate.
 * @return {boolean} The segment intersects the extent.
 */
function intersectsSegment(extent, start, end) {
  var intersects = false;
  var startRel = coordinateRelationship(extent, start);
  var endRel = coordinateRelationship(extent, end);
  if (startRel === _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].INTERSECTING ||
      endRel === _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].INTERSECTING) {
    intersects = true;
  } else {
    var minX = extent[0];
    var minY = extent[1];
    var maxX = extent[2];
    var maxY = extent[3];
    var startX = start[0];
    var startY = start[1];
    var endX = end[0];
    var endY = end[1];
    var slope = (endY - startY) / (endX - startX);
    var x, y;
    if (!!(endRel & _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].ABOVE) &&
        !(startRel & _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].ABOVE)) {
      // potentially intersects top
      x = endX - ((endY - maxY) / slope);
      intersects = x >= minX && x <= maxX;
    }
    if (!intersects && !!(endRel & _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].RIGHT) &&
        !(startRel & _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].RIGHT)) {
      // potentially intersects right
      y = endY - ((endX - maxX) * slope);
      intersects = y >= minY && y <= maxY;
    }
    if (!intersects && !!(endRel & _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].BELOW) &&
        !(startRel & _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].BELOW)) {
      // potentially intersects bottom
      x = endX - ((endY - minY) / slope);
      intersects = x >= minX && x <= maxX;
    }
    if (!intersects && !!(endRel & _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].LEFT) &&
        !(startRel & _extent_Relationship_js__WEBPACK_IMPORTED_MODULE_0__["default"].LEFT)) {
      // potentially intersects left
      y = endY - ((endX - minX) * slope);
      intersects = y >= minY && y <= maxY;
    }

  }
  return intersects;
}


/**
 * Apply a transform function to the extent.
 * @param {Extent} extent Extent.
 * @param {import("./proj.js").TransformFunction} transformFn Transform function.
 * Called with `[minX, minY, maxX, maxY]` extent coordinates.
 * @param {Extent=} opt_extent Destination extent.
 * @return {Extent} Extent.
 * @api
 */
function applyTransform(extent, transformFn, opt_extent) {
  var coordinates = [
    extent[0], extent[1],
    extent[0], extent[3],
    extent[2], extent[1],
    extent[2], extent[3]
  ];
  transformFn(coordinates, coordinates, 2);
  var xs = [coordinates[0], coordinates[2], coordinates[4], coordinates[6]];
  var ys = [coordinates[1], coordinates[3], coordinates[5], coordinates[7]];
  return _boundingExtentXYs(xs, ys, opt_extent);
}

//# sourceMappingURL=extent.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/extent/Corner.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/extent/Corner.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/extent/Corner
 */

/**
 * Extent corner.
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right'
});

//# sourceMappingURL=Corner.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/extent/Relationship.js":
/*!********************************************************!*\
  !*** ./node_modules/@biigle/ol/extent/Relationship.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/extent/Relationship
 */

/**
 * Relationship to an extent.
 * @enum {number}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  UNKNOWN: 0,
  INTERSECTING: 1,
  ABOVE: 2,
  RIGHT: 4,
  BELOW: 8,
  LEFT: 16
});

//# sourceMappingURL=Relationship.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/featureloader.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/featureloader.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "loadFeaturesXhr": () => (/* binding */ loadFeaturesXhr),
/* harmony export */   "xhr": () => (/* binding */ xhr)
/* harmony export */ });
/* harmony import */ var _functions_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./functions.js */ "./node_modules/@biigle/ol/functions.js");
/* harmony import */ var _format_FormatType_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./format/FormatType.js */ "./node_modules/@biigle/ol/format/FormatType.js");
/**
 * @module ol/featureloader
 */



/**
 * {@link module:ol/source/Vector} sources use a function of this type to
 * load features.
 *
 * This function takes an {@link module:ol/extent~Extent} representing the area to be loaded,
 * a `{number}` representing the resolution (map units per pixel) and an
 * {@link module:ol/proj/Projection} for the projection  as
 * arguments. `this` within the function is bound to the
 * {@link module:ol/source/Vector} it's called from.
 *
 * The function is responsible for loading the features and adding them to the
 * source.
 * @typedef {function(this:(import("./source/Vector").default|import("./VectorTile.js").default), import("./extent.js").Extent, number,
 *                    import("./proj/Projection.js").default)} FeatureLoader
 * @api
 */


/**
 * {@link module:ol/source/Vector} sources use a function of this type to
 * get the url to load features from.
 *
 * This function takes an {@link module:ol/extent~Extent} representing the area
 * to be loaded, a `{number}` representing the resolution (map units per pixel)
 * and an {@link module:ol/proj/Projection} for the projection  as
 * arguments and returns a `{string}` representing the URL.
 * @typedef {function(import("./extent.js").Extent, number, import("./proj/Projection.js").default): string} FeatureUrlFunction
 * @api
 */


/**
 * @param {string|FeatureUrlFunction} url Feature URL service.
 * @param {import("./format/Feature.js").default} format Feature format.
 * @param {function(this:import("./VectorTile.js").default, Array<import("./Feature.js").default>, import("./proj/Projection.js").default, import("./extent.js").Extent)|function(this:import("./source/Vector").default, Array<import("./Feature.js").default>)} success
 *     Function called with the loaded features and optionally with the data
 *     projection. Called with the vector tile or source as `this`.
 * @param {function(this:import("./VectorTile.js").default)|function(this:import("./source/Vector").default)} failure
 *     Function called when loading failed. Called with the vector tile or
 *     source as `this`.
 * @return {FeatureLoader} The feature loader.
 */
function loadFeaturesXhr(url, format, success, failure) {
  return (
    /**
     * @param {import("./extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {import("./proj/Projection.js").default} projection Projection.
     * @this {import("./source/Vector").default|import("./VectorTile.js").default}
     */
    function(extent, resolution, projection) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET',
        typeof url === 'function' ? url(extent, resolution, projection) : url,
        true);
      if (format.getType() == _format_FormatType_js__WEBPACK_IMPORTED_MODULE_0__["default"].ARRAY_BUFFER) {
        xhr.responseType = 'arraybuffer';
      }
      /**
       * @param {Event} event Event.
       * @private
       */
      xhr.onload = function(event) {
        // status will be 0 for file:// urls
        if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
          var type = format.getType();
          /** @type {Document|Node|Object|string|undefined} */
          var source;
          if (type == _format_FormatType_js__WEBPACK_IMPORTED_MODULE_0__["default"].JSON || type == _format_FormatType_js__WEBPACK_IMPORTED_MODULE_0__["default"].TEXT) {
            source = xhr.responseText;
          } else if (type == _format_FormatType_js__WEBPACK_IMPORTED_MODULE_0__["default"].XML) {
            source = xhr.responseXML;
            if (!source) {
              source = new DOMParser().parseFromString(xhr.responseText, 'application/xml');
            }
          } else if (type == _format_FormatType_js__WEBPACK_IMPORTED_MODULE_0__["default"].ARRAY_BUFFER) {
            source = /** @type {ArrayBuffer} */ (xhr.response);
          }
          if (source) {
            success.call(this, format.readFeatures(source,
              {featureProjection: projection}),
            format.readProjection(source), format.getLastExtent());
          } else {
            failure.call(this);
          }
        } else {
          failure.call(this);
        }
      }.bind(this);
      /**
       * @private
       */
      xhr.onerror = function() {
        failure.call(this);
      }.bind(this);
      xhr.send();
    }
  );
}


/**
 * Create an XHR feature loader for a `url` and `format`. The feature loader
 * loads features (with XHR), parses the features, and adds them to the
 * vector source.
 * @param {string|FeatureUrlFunction} url Feature URL service.
 * @param {import("./format/Feature.js").default} format Feature format.
 * @return {FeatureLoader} The feature loader.
 * @api
 */
function xhr(url, format) {
  return loadFeaturesXhr(url, format,
    /**
     * @param {Array<import("./Feature.js").default>} features The loaded features.
     * @param {import("./proj/Projection.js").default} dataProjection Data
     * projection.
     * @this {import("./source/Vector").default|import("./VectorTile.js").default}
     */
    function(features, dataProjection) {
      var sourceOrTile = /** @type {?} */ (this);
      if (typeof sourceOrTile.addFeatures === 'function') {
        /** @type {import("./source/Vector").default} */ (sourceOrTile).addFeatures(features);
      }
    }, /* FIXME handle error */ _functions_js__WEBPACK_IMPORTED_MODULE_1__.VOID);
}

//# sourceMappingURL=featureloader.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/format/FormatType.js":
/*!******************************************************!*\
  !*** ./node_modules/@biigle/ol/format/FormatType.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/format/FormatType
 */

/**
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  ARRAY_BUFFER: 'arraybuffer',
  JSON: 'json',
  TEXT: 'text',
  XML: 'xml'
});

//# sourceMappingURL=FormatType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/functions.js":
/*!**********************************************!*\
  !*** ./node_modules/@biigle/ol/functions.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TRUE": () => (/* binding */ TRUE),
/* harmony export */   "FALSE": () => (/* binding */ FALSE),
/* harmony export */   "VOID": () => (/* binding */ VOID)
/* harmony export */ });
/**
 * @module ol/functions
 */

/**
 * Always returns true.
 * @returns {boolean} true.
 */
function TRUE() {
  return true;
}

/**
 * Always returns false.
 * @returns {boolean} false.
 */
function FALSE() {
  return false;
}

/**
 * A reusable function, used e.g. as a default for callbacks.
 *
 * @return {void} Nothing.
 */
function VOID() {}

//# sourceMappingURL=functions.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/Circle.js":
/*!************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/Circle.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./SimpleGeometry.js */ "./node_modules/@biigle/ol/geom/SimpleGeometry.js");
/* harmony import */ var _flat_deflate_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flat/deflate.js */ "./node_modules/@biigle/ol/geom/flat/deflate.js");
/**
 * @module ol/geom/Circle
 */





/**
 * @classdesc
 * Circle geometry.
 *
 * @api
 */
var Circle = /*@__PURE__*/(function (SimpleGeometry) {
  function Circle(center, opt_radius, opt_layout) {
    SimpleGeometry.call(this);
    if (opt_layout !== undefined && opt_radius === undefined) {
      this.setFlatCoordinates(opt_layout, center);
    } else {
      var radius = opt_radius ? opt_radius : 0;
      this.setCenterAndRadius(center, radius, opt_layout);
    }
  }

  if ( SimpleGeometry ) Circle.__proto__ = SimpleGeometry;
  Circle.prototype = Object.create( SimpleGeometry && SimpleGeometry.prototype );
  Circle.prototype.constructor = Circle;

  /**
   * Make a complete copy of the geometry.
   * @return {!Circle} Clone.
   * @override
   * @api
   */
  Circle.prototype.clone = function clone () {
    return new Circle(this.flatCoordinates.slice(), undefined, this.layout);
  };

  /**
   * @inheritDoc
   */
  Circle.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    var flatCoordinates = this.flatCoordinates;
    var dx = x - flatCoordinates[0];
    var dy = y - flatCoordinates[1];
    var squaredDistance = dx * dx + dy * dy;
    if (squaredDistance < minSquaredDistance) {
      if (squaredDistance === 0) {
        for (var i = 0; i < this.stride; ++i) {
          closestPoint[i] = flatCoordinates[i];
        }
      } else {
        var delta = this.getRadius() / Math.sqrt(squaredDistance);
        closestPoint[0] = flatCoordinates[0] + delta * dx;
        closestPoint[1] = flatCoordinates[1] + delta * dy;
        for (var i$1 = 2; i$1 < this.stride; ++i$1) {
          closestPoint[i$1] = flatCoordinates[i$1];
        }
      }
      closestPoint.length = this.stride;
      return squaredDistance;
    } else {
      return minSquaredDistance;
    }
  };

  /**
   * @inheritDoc
   */
  Circle.prototype.containsXY = function containsXY (x, y) {
    var flatCoordinates = this.flatCoordinates;
    var dx = x - flatCoordinates[0];
    var dy = y - flatCoordinates[1];
    return dx * dx + dy * dy <= this.getRadiusSquared_();
  };

  /**
   * Return the center of the circle as {@link module:ol/coordinate~Coordinate coordinate}.
   * @return {import("../coordinate.js").Coordinate} Center.
   * @api
   */
  Circle.prototype.getCenter = function getCenter () {
    return this.flatCoordinates.slice(0, this.stride);
  };

  /**
   * @inheritDoc
   */
  Circle.prototype.computeExtent = function computeExtent (extent) {
    var flatCoordinates = this.flatCoordinates;
    var radius = flatCoordinates[this.stride] - flatCoordinates[0];
    return (0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.createOrUpdate)(
      flatCoordinates[0] - radius, flatCoordinates[1] - radius,
      flatCoordinates[0] + radius, flatCoordinates[1] + radius,
      extent);
  };

  /**
   * Return the radius of the circle.
   * @return {number} Radius.
   * @api
   */
  Circle.prototype.getRadius = function getRadius () {
    return Math.sqrt(this.getRadiusSquared_());
  };

  /**
   * @private
   * @return {number} Radius squared.
   */
  Circle.prototype.getRadiusSquared_ = function getRadiusSquared_ () {
    var dx = this.flatCoordinates[this.stride] - this.flatCoordinates[0];
    var dy = this.flatCoordinates[this.stride + 1] - this.flatCoordinates[1];
    return dx * dx + dy * dy;
  };

  /**
   * @inheritDoc
   * @api
   */
  Circle.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].CIRCLE;
  };

  /**
   * @inheritDoc
   * @api
   */
  Circle.prototype.intersectsExtent = function intersectsExtent (extent) {
    var circleExtent = this.getExtent();
    if ((0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.intersects)(extent, circleExtent)) {
      var center = this.getCenter();

      if (extent[0] <= center[0] && extent[2] >= center[0]) {
        return true;
      }
      if (extent[1] <= center[1] && extent[3] >= center[1]) {
        return true;
      }

      return (0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.forEachCorner)(extent, this.intersectsCoordinate, this);
    }
    return false;

  };

  /**
   * Set the center of the circle as {@link module:ol/coordinate~Coordinate coordinate}.
   * @param {import("../coordinate.js").Coordinate} center Center.
   * @api
   */
  Circle.prototype.setCenter = function setCenter (center) {
    var stride = this.stride;
    var radius = this.flatCoordinates[stride] - this.flatCoordinates[0];
    var flatCoordinates = center.slice();
    flatCoordinates[stride] = flatCoordinates[0] + radius;
    for (var i = 1; i < stride; ++i) {
      flatCoordinates[stride + i] = center[i];
    }
    this.setFlatCoordinates(this.layout, flatCoordinates);
    this.changed();
  };

  /**
   * Set the center (as {@link module:ol/coordinate~Coordinate coordinate}) and the radius (as
   * number) of the circle.
   * @param {!import("../coordinate.js").Coordinate} center Center.
   * @param {number} radius Radius.
   * @param {import("./GeometryLayout.js").default=} opt_layout Layout.
   * @api
   */
  Circle.prototype.setCenterAndRadius = function setCenterAndRadius (center, radius, opt_layout) {
    this.setLayout(opt_layout, center, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    /** @type {Array<number>} */
    var flatCoordinates = this.flatCoordinates;
    var offset = (0,_flat_deflate_js__WEBPACK_IMPORTED_MODULE_2__.deflateCoordinate)(
      flatCoordinates, 0, center, this.stride);
    flatCoordinates[offset++] = flatCoordinates[0] + radius;
    for (var i = 1, ii = this.stride; i < ii; ++i) {
      flatCoordinates[offset++] = flatCoordinates[i];
    }
    flatCoordinates.length = offset;
    this.changed();
  };

  /**
   * @inheritDoc
   */
  Circle.prototype.getCoordinates = function getCoordinates () {
    return null;
  };

  /**
   * @inheritDoc
   */
  Circle.prototype.setCoordinates = function setCoordinates (coordinates, opt_layout) {};

  /**
   * Set the radius of the circle. The radius is in the units of the projection.
   * @param {number} radius Radius.
   * @api
   */
  Circle.prototype.setRadius = function setRadius (radius) {
    this.flatCoordinates[this.stride] = this.flatCoordinates[0] + radius;
    this.changed();
  };

  return Circle;
}(_SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_3__["default"]));


/**
 * Transform each coordinate of the circle from one coordinate reference system
 * to another. The geometry is modified in place.
 * If you do not want the geometry modified in place, first clone() it and
 * then use this function on the clone.
 *
 * Internally a circle is currently represented by two points: the center of
 * the circle `[cx, cy]`, and the point to the right of the circle
 * `[cx + r, cy]`. This `transform` function just transforms these two points.
 * So the resulting geometry is also a circle, and that circle does not
 * correspond to the shape that would be obtained by transforming every point
 * of the original circle.
 *
 * @param {import("../proj.js").ProjectionLike} source The current projection.  Can be a
 *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
 * @param {import("../proj.js").ProjectionLike} destination The desired projection.  Can be a
 *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
 * @return {Circle} This geometry.  Note that original geometry is
 *     modified in place.
 * @function
 * @api
 */
Circle.prototype.transform;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Circle);

//# sourceMappingURL=Circle.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/Ellipse.js":
/*!*************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/Ellipse.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _Polygon_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Polygon.js */ "./node_modules/@biigle/ol/geom/Polygon.js");
/**
 * @module ol/geom/Ellipse
 */



/**
 * @classdesc
 * Ellipse geometry.
 *
 * @api
 */
var Ellipse = /*@__PURE__*/(function (Polygon) {
  function Ellipse () {
    Polygon.apply(this, arguments);
  }

  if ( Polygon ) Ellipse.__proto__ = Polygon;
  Ellipse.prototype = Object.create( Polygon && Polygon.prototype );
  Ellipse.prototype.constructor = Ellipse;

  Ellipse.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_0__["default"].ELLIPSE;
  };

  /**
   * @inheritDoc
   */
  Ellipse.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    var flatCoordinates = this.flatCoordinates;
    var distance = minSquaredDistance;
    var d, dx, dy;
    closestPoint[0] = flatCoordinates[0];
    closestPoint[1] = flatCoordinates[1];

    for (var i = 0, l = flatCoordinates.length; i < l; i += 2) {
      dx = x - flatCoordinates[i];
      dy = y - flatCoordinates[i + 1];
      d = dx * dx + dy * dy;
      if (d < distance) {
        distance = d;
        closestPoint[0] = flatCoordinates[i];
        closestPoint[1] = flatCoordinates[i + 1];
      }
    }

    return distance;
  };

  /**
   * Return the area of the ellipse.
   * @return {number} Area
   * @api
   */
  Ellipse.prototype.getArea = function getArea () {
    var coords = this.flatCoordinates;
    // Diameter along first principal axis.
    var a = Math.sqrt(Math.pow(coords[0] - coords[4], 2) + Math.pow(coords[1] - coords[5], 2));
    // Diameter along second principal axis.
    var b = Math.sqrt(Math.pow(coords[2] - coords[6], 2) + Math.pow(coords[3] - coords[7], 2));

    // Multiply by 0.25 because the area is calculated with the radius, not the diameter.
    return Math.PI * a * b * 0.25;
  };

  return Ellipse;
}(_Polygon_js__WEBPACK_IMPORTED_MODULE_1__["default"]));

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Ellipse);

//# sourceMappingURL=Ellipse.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/Geometry.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/Geometry.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var _Object_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../Object.js */ "./node_modules/@biigle/ol/Object.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _flat_transform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./flat/transform.js */ "./node_modules/@biigle/ol/geom/flat/transform.js");
/* harmony import */ var _proj_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../proj.js */ "./node_modules/@biigle/ol/proj.js");
/* harmony import */ var _proj_Units_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../proj/Units.js */ "./node_modules/@biigle/ol/proj/Units.js");
/* harmony import */ var _transform_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../transform.js */ "./node_modules/@biigle/ol/transform.js");
/**
 * @module ol/geom/Geometry
 */









/**
 * @type {import("../transform.js").Transform}
 */
var tmpTransform = (0,_transform_js__WEBPACK_IMPORTED_MODULE_0__.create)();


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for vector geometries.
 *
 * To get notified of changes to the geometry, register a listener for the
 * generic `change` event on your geometry instance.
 *
 * @abstract
 * @api
 */
var Geometry = /*@__PURE__*/(function (BaseObject) {
  function Geometry() {

    BaseObject.call(this);

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.extent_ = (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.createEmpty)();

    /**
     * @private
     * @type {number}
     */
    this.extentRevision_ = -1;

    /**
     * @protected
     * @type {Object<string, Geometry>}
     */
    this.simplifiedGeometryCache = {};

    /**
     * @protected
     * @type {number}
     */
    this.simplifiedGeometryMaxMinSquaredTolerance = 0;

    /**
     * @protected
     * @type {number}
     */
    this.simplifiedGeometryRevision = 0;

  }

  if ( BaseObject ) Geometry.__proto__ = BaseObject;
  Geometry.prototype = Object.create( BaseObject && BaseObject.prototype );
  Geometry.prototype.constructor = Geometry;

  /**
   * Make a complete copy of the geometry.
   * @abstract
   * @return {!Geometry} Clone.
   */
  Geometry.prototype.clone = function clone () {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * @abstract
   * @param {number} x X.
   * @param {number} y Y.
   * @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
   * @param {number} minSquaredDistance Minimum squared distance.
   * @return {number} Minimum squared distance.
   */
  Geometry.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * @param {number} x X.
   * @param {number} y Y.
   * @return {boolean} Contains (x, y).
   */
  Geometry.prototype.containsXY = function containsXY (x, y) {
    return false;
  };

  /**
   * Return the closest point of the geometry to the passed point as
   * {@link module:ol/coordinate~Coordinate coordinate}.
   * @param {import("../coordinate.js").Coordinate} point Point.
   * @param {import("../coordinate.js").Coordinate=} opt_closestPoint Closest point.
   * @return {import("../coordinate.js").Coordinate} Closest point.
   * @api
   */
  Geometry.prototype.getClosestPoint = function getClosestPoint (point, opt_closestPoint) {
    var closestPoint = opt_closestPoint ? opt_closestPoint : [NaN, NaN];
    this.closestPointXY(point[0], point[1], closestPoint, Infinity);
    return closestPoint;
  };

  /**
   * Returns true if this geometry includes the specified coordinate. If the
   * coordinate is on the boundary of the geometry, returns false.
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @return {boolean} Contains coordinate.
   * @api
   */
  Geometry.prototype.intersectsCoordinate = function intersectsCoordinate (coordinate) {
    return this.containsXY(coordinate[0], coordinate[1]);
  };

  /**
   * @abstract
   * @param {import("../extent.js").Extent} extent Extent.
   * @protected
   * @return {import("../extent.js").Extent} extent Extent.
   */
  Geometry.prototype.computeExtent = function computeExtent (extent) {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Get the extent of the geometry.
   * @param {import("../extent.js").Extent=} opt_extent Extent.
   * @return {import("../extent.js").Extent} extent Extent.
   * @api
   */
  Geometry.prototype.getExtent = function getExtent (opt_extent) {
    if (this.extentRevision_ != this.getRevision()) {
      this.extent_ = this.computeExtent(this.extent_);
      this.extentRevision_ = this.getRevision();
    }
    return (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.returnOrUpdate)(this.extent_, opt_extent);
  };

  /**
   * Rotate the geometry around a given coordinate. This modifies the geometry
   * coordinates in place.
   * @abstract
   * @param {number} angle Rotation angle in radians.
   * @param {import("../coordinate.js").Coordinate} anchor The rotation center.
   * @api
   */
  Geometry.prototype.rotate = function rotate (angle, anchor) {
    (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Scale the geometry (with an optional origin).  This modifies the geometry
   * coordinates in place.
   * @abstract
   * @param {number} sx The scaling factor in the x-direction.
   * @param {number=} opt_sy The scaling factor in the y-direction (defaults to
   *     sx).
   * @param {import("../coordinate.js").Coordinate=} opt_anchor The scale origin (defaults to the center
   *     of the geometry extent).
   * @api
   */
  Geometry.prototype.scale = function scale (sx, opt_sy, opt_anchor) {
    (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Create a simplified version of this geometry.  For linestrings, this uses
   * the the {@link
   * https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm
   * Douglas Peucker} algorithm.  For polygons, a quantization-based
   * simplification is used to preserve topology.
   * @param {number} tolerance The tolerance distance for simplification.
   * @return {Geometry} A new, simplified version of the original geometry.
   * @api
   */
  Geometry.prototype.simplify = function simplify (tolerance) {
    return this.getSimplifiedGeometry(tolerance * tolerance);
  };

  /**
   * Create a simplified version of this geometry using the Douglas Peucker
   * algorithm.
   * See https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm.
   * @abstract
   * @param {number} squaredTolerance Squared tolerance.
   * @return {Geometry} Simplified geometry.
   */
  Geometry.prototype.getSimplifiedGeometry = function getSimplifiedGeometry (squaredTolerance) {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Get the type of this geometry.
   * @abstract
   * @return {import("./GeometryType.js").default} Geometry type.
   */
  Geometry.prototype.getType = function getType () {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Apply a transform function to each coordinate of the geometry.
   * The geometry is modified in place.
   * If you do not want the geometry modified in place, first `clone()` it and
   * then use this function on the clone.
   * @abstract
   * @param {import("../proj.js").TransformFunction} transformFn Transform.
   */
  Geometry.prototype.applyTransform = function applyTransform (transformFn) {
    (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Test if the geometry and the passed extent intersect.
   * @abstract
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {boolean} `true` if the geometry and the extent intersect.
   */
  Geometry.prototype.intersectsExtent = function intersectsExtent (extent) {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Translate the geometry.  This modifies the geometry coordinates in place.  If
   * instead you want a new geometry, first `clone()` this geometry.
   * @abstract
   * @param {number} deltaX Delta X.
   * @param {number} deltaY Delta Y.
   * @api
   */
  Geometry.prototype.translate = function translate (deltaX, deltaY) {
    (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Transform each coordinate of the geometry from one coordinate reference
   * system to another. The geometry is modified in place.
   * For example, a line will be transformed to a line and a circle to a circle.
   * If you do not want the geometry modified in place, first `clone()` it and
   * then use this function on the clone.
   *
   * @param {import("../proj.js").ProjectionLike} source The current projection.  Can be a
   *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
   * @param {import("../proj.js").ProjectionLike} destination The desired projection.  Can be a
   *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
   * @return {Geometry} This geometry.  Note that original geometry is
   *     modified in place.
   * @api
   */
  Geometry.prototype.transform = function transform (source, destination) {
    /** @type {import("../proj/Projection.js").default} */
    var sourceProj = (0,_proj_js__WEBPACK_IMPORTED_MODULE_3__.get)(source);
    var transformFn = sourceProj.getUnits() == _proj_Units_js__WEBPACK_IMPORTED_MODULE_4__["default"].TILE_PIXELS ?
      function(inCoordinates, outCoordinates, stride) {
        var pixelExtent = sourceProj.getExtent();
        var projectedExtent = sourceProj.getWorldExtent();
        var scale = (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.getHeight)(projectedExtent) / (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.getHeight)(pixelExtent);
        (0,_transform_js__WEBPACK_IMPORTED_MODULE_0__.compose)(tmpTransform,
          projectedExtent[0], projectedExtent[3],
          scale, -scale, 0,
          0, 0);
        (0,_flat_transform_js__WEBPACK_IMPORTED_MODULE_5__.transform2D)(inCoordinates, 0, inCoordinates.length, stride,
          tmpTransform, outCoordinates);
        return (0,_proj_js__WEBPACK_IMPORTED_MODULE_3__.getTransform)(sourceProj, destination)(inCoordinates, outCoordinates, stride);
      } :
      (0,_proj_js__WEBPACK_IMPORTED_MODULE_3__.getTransform)(sourceProj, destination);
    this.applyTransform(transformFn);
    return this;
  };

  return Geometry;
}(_Object_js__WEBPACK_IMPORTED_MODULE_6__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Geometry);

//# sourceMappingURL=Geometry.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/GeometryLayout.js":
/*!********************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/GeometryLayout.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/geom/GeometryLayout
 */

/**
 * The coordinate layout for geometries, indicating whether a 3rd or 4th z ('Z')
 * or measure ('M') coordinate is available. Supported values are `'XY'`,
 * `'XYZ'`, `'XYM'`, `'XYZM'`.
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  XY: 'XY',
  XYZ: 'XYZ',
  XYM: 'XYM',
  XYZM: 'XYZM'
});

//# sourceMappingURL=GeometryLayout.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/GeometryType.js":
/*!******************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/GeometryType.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/geom/GeometryType
 */

/**
 * The geometry type. One of `'Point'`, `'LineString'`, `'LinearRing'`,
 * `'Polygon'`, `'MultiPoint'`, `'MultiLineString'`, `'MultiPolygon'`,
 * `'GeometryCollection'`, `'Circle'`, `'Rectangle'`,`'Ellipse'`.
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection',
  CIRCLE: 'Circle',
  RECTANGLE: 'Rectangle',
  ELLIPSE: 'Ellipse',
});

//# sourceMappingURL=GeometryType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/LineString.js":
/*!****************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/LineString.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../array.js */ "./node_modules/@biigle/ol/array.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./GeometryLayout.js */ "./node_modules/@biigle/ol/geom/GeometryLayout.js");
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./SimpleGeometry.js */ "./node_modules/@biigle/ol/geom/SimpleGeometry.js");
/* harmony import */ var _flat_closest_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flat/closest.js */ "./node_modules/@biigle/ol/geom/flat/closest.js");
/* harmony import */ var _flat_deflate_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./flat/deflate.js */ "./node_modules/@biigle/ol/geom/flat/deflate.js");
/* harmony import */ var _flat_inflate_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./flat/inflate.js */ "./node_modules/@biigle/ol/geom/flat/inflate.js");
/* harmony import */ var _flat_interpolate_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./flat/interpolate.js */ "./node_modules/@biigle/ol/geom/flat/interpolate.js");
/* harmony import */ var _flat_intersectsextent_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./flat/intersectsextent.js */ "./node_modules/@biigle/ol/geom/flat/intersectsextent.js");
/* harmony import */ var _flat_length_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./flat/length.js */ "./node_modules/@biigle/ol/geom/flat/length.js");
/* harmony import */ var _flat_segments_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./flat/segments.js */ "./node_modules/@biigle/ol/geom/flat/segments.js");
/* harmony import */ var _flat_simplify_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./flat/simplify.js */ "./node_modules/@biigle/ol/geom/flat/simplify.js");
/**
 * @module ol/geom/LineString
 */














/**
 * @classdesc
 * Linestring geometry.
 *
 * @api
 */
var LineString = /*@__PURE__*/(function (SimpleGeometry) {
  function LineString(coordinates, opt_layout) {

    SimpleGeometry.call(this);

    /**
     * @private
     * @type {import("../coordinate.js").Coordinate}
     */
    this.flatMidpoint_ = null;

    /**
     * @private
     * @type {number}
     */
    this.flatMidpointRevision_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.maxDelta_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.maxDeltaRevision_ = -1;

    if (opt_layout !== undefined && !Array.isArray(coordinates[0])) {
      this.setFlatCoordinates(opt_layout, /** @type {Array<number>} */ (coordinates));
    } else {
      this.setCoordinates(/** @type {Array<import("../coordinate.js").Coordinate>} */ (coordinates), opt_layout);
    }

  }

  if ( SimpleGeometry ) LineString.__proto__ = SimpleGeometry;
  LineString.prototype = Object.create( SimpleGeometry && SimpleGeometry.prototype );
  LineString.prototype.constructor = LineString;

  /**
   * Append the passed coordinate to the coordinates of the linestring.
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @api
   */
  LineString.prototype.appendCoordinate = function appendCoordinate (coordinate) {
    if (!this.flatCoordinates) {
      this.flatCoordinates = coordinate.slice();
    } else {
      (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.extend)(this.flatCoordinates, coordinate);
    }
    this.changed();
  };

  /**
   * Make a complete copy of the geometry.
   * @return {!LineString} Clone.
   * @override
   * @api
   */
  LineString.prototype.clone = function clone () {
    return new LineString(this.flatCoordinates.slice(), this.layout);
  };

  /**
   * @inheritDoc
   */
  LineString.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.closestSquaredDistanceXY)(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    if (this.maxDeltaRevision_ != this.getRevision()) {
      this.maxDelta_ = Math.sqrt((0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_2__.maxSquaredDelta)(
        this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, 0));
      this.maxDeltaRevision_ = this.getRevision();
    }
    return (0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_2__.assignClosestPoint)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      this.maxDelta_, false, x, y, closestPoint, minSquaredDistance);
  };

  /**
   * Iterate over each segment, calling the provided callback.
   * If the callback returns a truthy value the function returns that
   * value immediately. Otherwise the function returns `false`.
   *
   * @param {function(this: S, import("../coordinate.js").Coordinate, import("../coordinate.js").Coordinate): T} callback Function
   *     called for each segment.
   * @return {T|boolean} Value.
   * @template T,S
   * @api
   */
  LineString.prototype.forEachSegment = function forEachSegment$1 (callback) {
    return (0,_flat_segments_js__WEBPACK_IMPORTED_MODULE_3__.forEach)(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, callback);
  };

  /**
   * Returns the coordinate at `m` using linear interpolation, or `null` if no
   * such coordinate exists.
   *
   * `opt_extrapolate` controls extrapolation beyond the range of Ms in the
   * MultiLineString. If `opt_extrapolate` is `true` then Ms less than the first
   * M will return the first coordinate and Ms greater than the last M will
   * return the last coordinate.
   *
   * @param {number} m M.
   * @param {boolean=} opt_extrapolate Extrapolate. Default is `false`.
   * @return {import("../coordinate.js").Coordinate} Coordinate.
   * @api
   */
  LineString.prototype.getCoordinateAtM = function getCoordinateAtM (m, opt_extrapolate) {
    if (this.layout != _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_4__["default"].XYM &&
        this.layout != _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_4__["default"].XYZM) {
      return null;
    }
    var extrapolate = opt_extrapolate !== undefined ? opt_extrapolate : false;
    return (0,_flat_interpolate_js__WEBPACK_IMPORTED_MODULE_5__.lineStringCoordinateAtM)(this.flatCoordinates, 0,
      this.flatCoordinates.length, this.stride, m, extrapolate);
  };

  /**
   * Return the coordinates of the linestring.
   * @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
   * @override
   * @api
   */
  LineString.prototype.getCoordinates = function getCoordinates () {
    return (0,_flat_inflate_js__WEBPACK_IMPORTED_MODULE_6__.inflateCoordinates)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
  };

  /**
   * Return the coordinate at the provided fraction along the linestring.
   * The `fraction` is a number between 0 and 1, where 0 is the start of the
   * linestring and 1 is the end.
   * @param {number} fraction Fraction.
   * @param {import("../coordinate.js").Coordinate=} opt_dest Optional coordinate whose values will
   *     be modified. If not provided, a new coordinate will be returned.
   * @return {import("../coordinate.js").Coordinate} Coordinate of the interpolated point.
   * @api
   */
  LineString.prototype.getCoordinateAt = function getCoordinateAt (fraction, opt_dest) {
    return (0,_flat_interpolate_js__WEBPACK_IMPORTED_MODULE_5__.interpolatePoint)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      fraction, opt_dest);
  };

  /**
   * Return the length of the linestring on projected plane.
   * @return {number} Length (on projected plane).
   * @api
   */
  LineString.prototype.getLength = function getLength () {
    return (0,_flat_length_js__WEBPACK_IMPORTED_MODULE_7__.lineStringLength)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
  };

  /**
   * @return {Array<number>} Flat midpoint.
   */
  LineString.prototype.getFlatMidpoint = function getFlatMidpoint () {
    if (this.flatMidpointRevision_ != this.getRevision()) {
      this.flatMidpoint_ = this.getCoordinateAt(0.5, this.flatMidpoint_);
      this.flatMidpointRevision_ = this.getRevision();
    }
    return this.flatMidpoint_;
  };

  /**
   * @inheritDoc
   */
  LineString.prototype.getSimplifiedGeometryInternal = function getSimplifiedGeometryInternal (squaredTolerance) {
    var simplifiedFlatCoordinates = [];
    simplifiedFlatCoordinates.length = (0,_flat_simplify_js__WEBPACK_IMPORTED_MODULE_8__.douglasPeucker)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      squaredTolerance, simplifiedFlatCoordinates, 0);
    return new LineString(simplifiedFlatCoordinates, _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_4__["default"].XY);
  };

  /**
   * @inheritDoc
   * @api
   */
  LineString.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_9__["default"].LINE_STRING;
  };

  /**
   * @inheritDoc
   * @api
   */
  LineString.prototype.intersectsExtent = function intersectsExtent (extent) {
    return (0,_flat_intersectsextent_js__WEBPACK_IMPORTED_MODULE_10__.intersectsLineString)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      extent);
  };

  /**
   * Set the coordinates of the linestring.
   * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
   * @param {GeometryLayout=} opt_layout Layout.
   * @override
   * @api
   */
  LineString.prototype.setCoordinates = function setCoordinates (coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = (0,_flat_deflate_js__WEBPACK_IMPORTED_MODULE_11__.deflateCoordinates)(
      this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  };

  return LineString;
}(_SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_12__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LineString);

//# sourceMappingURL=LineString.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/LinearRing.js":
/*!****************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/LinearRing.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./GeometryLayout.js */ "./node_modules/@biigle/ol/geom/GeometryLayout.js");
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./SimpleGeometry.js */ "./node_modules/@biigle/ol/geom/SimpleGeometry.js");
/* harmony import */ var _flat_area_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flat/area.js */ "./node_modules/@biigle/ol/geom/flat/area.js");
/* harmony import */ var _flat_closest_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./flat/closest.js */ "./node_modules/@biigle/ol/geom/flat/closest.js");
/* harmony import */ var _flat_deflate_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./flat/deflate.js */ "./node_modules/@biigle/ol/geom/flat/deflate.js");
/* harmony import */ var _flat_inflate_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./flat/inflate.js */ "./node_modules/@biigle/ol/geom/flat/inflate.js");
/* harmony import */ var _flat_simplify_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./flat/simplify.js */ "./node_modules/@biigle/ol/geom/flat/simplify.js");
/**
 * @module ol/geom/LinearRing
 */










/**
 * @classdesc
 * Linear ring geometry. Only used as part of polygon; cannot be rendered
 * on its own.
 *
 * @api
 */
var LinearRing = /*@__PURE__*/(function (SimpleGeometry) {
  function LinearRing(coordinates, opt_layout) {

    SimpleGeometry.call(this);

    /**
     * @private
     * @type {number}
     */
    this.maxDelta_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.maxDeltaRevision_ = -1;

    if (opt_layout !== undefined && !Array.isArray(coordinates[0])) {
      this.setFlatCoordinates(opt_layout, /** @type {Array<number>} */ (coordinates));
    } else {
      this.setCoordinates(/** @type {Array<import("../coordinate.js").Coordinate>} */ (coordinates), opt_layout);
    }

  }

  if ( SimpleGeometry ) LinearRing.__proto__ = SimpleGeometry;
  LinearRing.prototype = Object.create( SimpleGeometry && SimpleGeometry.prototype );
  LinearRing.prototype.constructor = LinearRing;

  /**
   * Make a complete copy of the geometry.
   * @return {!LinearRing} Clone.
   * @override
   * @api
   */
  LinearRing.prototype.clone = function clone () {
    return new LinearRing(this.flatCoordinates.slice(), this.layout);
  };

  /**
   * @inheritDoc
   */
  LinearRing.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < (0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.closestSquaredDistanceXY)(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    if (this.maxDeltaRevision_ != this.getRevision()) {
      this.maxDelta_ = Math.sqrt((0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_1__.maxSquaredDelta)(
        this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, 0));
      this.maxDeltaRevision_ = this.getRevision();
    }
    return (0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_1__.assignClosestPoint)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
  };

  /**
   * Return the area of the linear ring on projected plane.
   * @return {number} Area (on projected plane).
   * @api
   */
  LinearRing.prototype.getArea = function getArea () {
    return (0,_flat_area_js__WEBPACK_IMPORTED_MODULE_2__.linearRing)(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
  };

  /**
   * Return the coordinates of the linear ring.
   * @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
   * @override
   * @api
   */
  LinearRing.prototype.getCoordinates = function getCoordinates () {
    return (0,_flat_inflate_js__WEBPACK_IMPORTED_MODULE_3__.inflateCoordinates)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
  };

  /**
   * @inheritDoc
   */
  LinearRing.prototype.getSimplifiedGeometryInternal = function getSimplifiedGeometryInternal (squaredTolerance) {
    var simplifiedFlatCoordinates = [];
    simplifiedFlatCoordinates.length = (0,_flat_simplify_js__WEBPACK_IMPORTED_MODULE_4__.douglasPeucker)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      squaredTolerance, simplifiedFlatCoordinates, 0);
    return new LinearRing(simplifiedFlatCoordinates, _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_5__["default"].XY);
  };

  /**
   * @inheritDoc
   * @api
   */
  LinearRing.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_6__["default"].LINEAR_RING;
  };

  /**
   * @inheritDoc
   */
  LinearRing.prototype.intersectsExtent = function intersectsExtent (extent) {
    return false;
  };

  /**
   * Set the coordinates of the linear ring.
   * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
   * @param {GeometryLayout=} opt_layout Layout.
   * @override
   * @api
   */
  LinearRing.prototype.setCoordinates = function setCoordinates (coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = (0,_flat_deflate_js__WEBPACK_IMPORTED_MODULE_7__.deflateCoordinates)(
      this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  };

  return LinearRing;
}(_SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_8__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LinearRing);

//# sourceMappingURL=LinearRing.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/MultiLineString.js":
/*!*********************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/MultiLineString.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../array.js */ "./node_modules/@biigle/ol/array.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./GeometryLayout.js */ "./node_modules/@biigle/ol/geom/GeometryLayout.js");
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _LineString_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./LineString.js */ "./node_modules/@biigle/ol/geom/LineString.js");
/* harmony import */ var _SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./SimpleGeometry.js */ "./node_modules/@biigle/ol/geom/SimpleGeometry.js");
/* harmony import */ var _flat_closest_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flat/closest.js */ "./node_modules/@biigle/ol/geom/flat/closest.js");
/* harmony import */ var _flat_deflate_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./flat/deflate.js */ "./node_modules/@biigle/ol/geom/flat/deflate.js");
/* harmony import */ var _flat_inflate_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./flat/inflate.js */ "./node_modules/@biigle/ol/geom/flat/inflate.js");
/* harmony import */ var _flat_interpolate_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./flat/interpolate.js */ "./node_modules/@biigle/ol/geom/flat/interpolate.js");
/* harmony import */ var _flat_intersectsextent_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./flat/intersectsextent.js */ "./node_modules/@biigle/ol/geom/flat/intersectsextent.js");
/* harmony import */ var _flat_simplify_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./flat/simplify.js */ "./node_modules/@biigle/ol/geom/flat/simplify.js");
/**
 * @module ol/geom/MultiLineString
 */













/**
 * @classdesc
 * Multi-linestring geometry.
 *
 * @api
 */
var MultiLineString = /*@__PURE__*/(function (SimpleGeometry) {
  function MultiLineString(coordinates, opt_layout, opt_ends) {

    SimpleGeometry.call(this);

    /**
     * @type {Array<number>}
     * @private
     */
    this.ends_ = [];

    /**
     * @private
     * @type {number}
     */
    this.maxDelta_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.maxDeltaRevision_ = -1;

    if (Array.isArray(coordinates[0])) {
      this.setCoordinates(/** @type {Array<Array<import("../coordinate.js").Coordinate>>} */ (coordinates), opt_layout);
    } else if (opt_layout !== undefined && opt_ends) {
      this.setFlatCoordinates(opt_layout, /** @type {Array<number>} */ (coordinates));
      this.ends_ = opt_ends;
    } else {
      var layout = this.getLayout();
      var lineStrings = /** @type {Array<LineString>} */ (coordinates);
      var flatCoordinates = [];
      var ends = [];
      for (var i = 0, ii = lineStrings.length; i < ii; ++i) {
        var lineString = lineStrings[i];
        if (i === 0) {
          layout = lineString.getLayout();
        }
        (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.extend)(flatCoordinates, lineString.getFlatCoordinates());
        ends.push(flatCoordinates.length);
      }
      this.setFlatCoordinates(layout, flatCoordinates);
      this.ends_ = ends;
    }

  }

  if ( SimpleGeometry ) MultiLineString.__proto__ = SimpleGeometry;
  MultiLineString.prototype = Object.create( SimpleGeometry && SimpleGeometry.prototype );
  MultiLineString.prototype.constructor = MultiLineString;

  /**
   * Append the passed linestring to the multilinestring.
   * @param {LineString} lineString LineString.
   * @api
   */
  MultiLineString.prototype.appendLineString = function appendLineString (lineString) {
    if (!this.flatCoordinates) {
      this.flatCoordinates = lineString.getFlatCoordinates().slice();
    } else {
      (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.extend)(this.flatCoordinates, lineString.getFlatCoordinates().slice());
    }
    this.ends_.push(this.flatCoordinates.length);
    this.changed();
  };

  /**
   * Make a complete copy of the geometry.
   * @return {!MultiLineString} Clone.
   * @override
   * @api
   */
  MultiLineString.prototype.clone = function clone () {
    return new MultiLineString(this.flatCoordinates.slice(), this.layout, this.ends_.slice());
  };

  /**
   * @inheritDoc
   */
  MultiLineString.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.closestSquaredDistanceXY)(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    if (this.maxDeltaRevision_ != this.getRevision()) {
      this.maxDelta_ = Math.sqrt((0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_2__.arrayMaxSquaredDelta)(
        this.flatCoordinates, 0, this.ends_, this.stride, 0));
      this.maxDeltaRevision_ = this.getRevision();
    }
    return (0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_2__.assignClosestArrayPoint)(
      this.flatCoordinates, 0, this.ends_, this.stride,
      this.maxDelta_, false, x, y, closestPoint, minSquaredDistance);
  };

  /**
   * Returns the coordinate at `m` using linear interpolation, or `null` if no
   * such coordinate exists.
   *
   * `opt_extrapolate` controls extrapolation beyond the range of Ms in the
   * MultiLineString. If `opt_extrapolate` is `true` then Ms less than the first
   * M will return the first coordinate and Ms greater than the last M will
   * return the last coordinate.
   *
   * `opt_interpolate` controls interpolation between consecutive LineStrings
   * within the MultiLineString. If `opt_interpolate` is `true` the coordinates
   * will be linearly interpolated between the last coordinate of one LineString
   * and the first coordinate of the next LineString.  If `opt_interpolate` is
   * `false` then the function will return `null` for Ms falling between
   * LineStrings.
   *
   * @param {number} m M.
   * @param {boolean=} opt_extrapolate Extrapolate. Default is `false`.
   * @param {boolean=} opt_interpolate Interpolate. Default is `false`.
   * @return {import("../coordinate.js").Coordinate} Coordinate.
   * @api
   */
  MultiLineString.prototype.getCoordinateAtM = function getCoordinateAtM (m, opt_extrapolate, opt_interpolate) {
    if ((this.layout != _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_3__["default"].XYM &&
         this.layout != _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_3__["default"].XYZM) ||
        this.flatCoordinates.length === 0) {
      return null;
    }
    var extrapolate = opt_extrapolate !== undefined ? opt_extrapolate : false;
    var interpolate = opt_interpolate !== undefined ? opt_interpolate : false;
    return (0,_flat_interpolate_js__WEBPACK_IMPORTED_MODULE_4__.lineStringsCoordinateAtM)(this.flatCoordinates, 0,
      this.ends_, this.stride, m, extrapolate, interpolate);
  };

  /**
   * Return the coordinates of the multilinestring.
   * @return {Array<Array<import("../coordinate.js").Coordinate>>} Coordinates.
   * @override
   * @api
   */
  MultiLineString.prototype.getCoordinates = function getCoordinates () {
    return (0,_flat_inflate_js__WEBPACK_IMPORTED_MODULE_5__.inflateCoordinatesArray)(
      this.flatCoordinates, 0, this.ends_, this.stride);
  };

  /**
   * @return {Array<number>} Ends.
   */
  MultiLineString.prototype.getEnds = function getEnds () {
    return this.ends_;
  };

  /**
   * Return the linestring at the specified index.
   * @param {number} index Index.
   * @return {LineString} LineString.
   * @api
   */
  MultiLineString.prototype.getLineString = function getLineString (index) {
    if (index < 0 || this.ends_.length <= index) {
      return null;
    }
    return new _LineString_js__WEBPACK_IMPORTED_MODULE_6__["default"](this.flatCoordinates.slice(
      index === 0 ? 0 : this.ends_[index - 1], this.ends_[index]), this.layout);
  };

  /**
   * Return the linestrings of this multilinestring.
   * @return {Array<LineString>} LineStrings.
   * @api
   */
  MultiLineString.prototype.getLineStrings = function getLineStrings () {
    var flatCoordinates = this.flatCoordinates;
    var ends = this.ends_;
    var layout = this.layout;
    /** @type {Array<LineString>} */
    var lineStrings = [];
    var offset = 0;
    for (var i = 0, ii = ends.length; i < ii; ++i) {
      var end = ends[i];
      var lineString = new _LineString_js__WEBPACK_IMPORTED_MODULE_6__["default"](flatCoordinates.slice(offset, end), layout);
      lineStrings.push(lineString);
      offset = end;
    }
    return lineStrings;
  };

  /**
   * @return {Array<number>} Flat midpoints.
   */
  MultiLineString.prototype.getFlatMidpoints = function getFlatMidpoints () {
    var midpoints = [];
    var flatCoordinates = this.flatCoordinates;
    var offset = 0;
    var ends = this.ends_;
    var stride = this.stride;
    for (var i = 0, ii = ends.length; i < ii; ++i) {
      var end = ends[i];
      var midpoint = (0,_flat_interpolate_js__WEBPACK_IMPORTED_MODULE_4__.interpolatePoint)(
        flatCoordinates, offset, end, stride, 0.5);
      (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.extend)(midpoints, midpoint);
      offset = end;
    }
    return midpoints;
  };

  /**
   * @inheritDoc
   */
  MultiLineString.prototype.getSimplifiedGeometryInternal = function getSimplifiedGeometryInternal (squaredTolerance) {
    var simplifiedFlatCoordinates = [];
    var simplifiedEnds = [];
    simplifiedFlatCoordinates.length = (0,_flat_simplify_js__WEBPACK_IMPORTED_MODULE_7__.douglasPeuckerArray)(
      this.flatCoordinates, 0, this.ends_, this.stride, squaredTolerance,
      simplifiedFlatCoordinates, 0, simplifiedEnds);
    return new MultiLineString(simplifiedFlatCoordinates, _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_3__["default"].XY, simplifiedEnds);
  };

  /**
   * @inheritDoc
   * @api
   */
  MultiLineString.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_8__["default"].MULTI_LINE_STRING;
  };

  /**
   * @inheritDoc
   * @api
   */
  MultiLineString.prototype.intersectsExtent = function intersectsExtent (extent) {
    return (0,_flat_intersectsextent_js__WEBPACK_IMPORTED_MODULE_9__.intersectsLineStringArray)(
      this.flatCoordinates, 0, this.ends_, this.stride, extent);
  };

  /**
   * Set the coordinates of the multilinestring.
   * @param {!Array<Array<import("../coordinate.js").Coordinate>>} coordinates Coordinates.
   * @param {GeometryLayout=} opt_layout Layout.
   * @override
   * @api
   */
  MultiLineString.prototype.setCoordinates = function setCoordinates (coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 2);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    var ends = (0,_flat_deflate_js__WEBPACK_IMPORTED_MODULE_10__.deflateCoordinatesArray)(
      this.flatCoordinates, 0, coordinates, this.stride, this.ends_);
    this.flatCoordinates.length = ends.length === 0 ? 0 : ends[ends.length - 1];
    this.changed();
  };

  return MultiLineString;
}(_SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_11__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MultiLineString);

//# sourceMappingURL=MultiLineString.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/MultiPoint.js":
/*!****************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/MultiPoint.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../array.js */ "./node_modules/@biigle/ol/array.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _Point_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Point.js */ "./node_modules/@biigle/ol/geom/Point.js");
/* harmony import */ var _SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./SimpleGeometry.js */ "./node_modules/@biigle/ol/geom/SimpleGeometry.js");
/* harmony import */ var _flat_deflate_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./flat/deflate.js */ "./node_modules/@biigle/ol/geom/flat/deflate.js");
/* harmony import */ var _flat_inflate_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./flat/inflate.js */ "./node_modules/@biigle/ol/geom/flat/inflate.js");
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../math.js */ "./node_modules/@biigle/ol/math.js");
/**
 * @module ol/geom/MultiPoint
 */









/**
 * @classdesc
 * Multi-point geometry.
 *
 * @api
 */
var MultiPoint = /*@__PURE__*/(function (SimpleGeometry) {
  function MultiPoint(coordinates, opt_layout) {
    SimpleGeometry.call(this);
    if (opt_layout && !Array.isArray(coordinates[0])) {
      this.setFlatCoordinates(opt_layout, /** @type {Array<number>} */ (coordinates));
    } else {
      this.setCoordinates(/** @type {Array<import("../coordinate.js").Coordinate>} */ (coordinates), opt_layout);
    }
  }

  if ( SimpleGeometry ) MultiPoint.__proto__ = SimpleGeometry;
  MultiPoint.prototype = Object.create( SimpleGeometry && SimpleGeometry.prototype );
  MultiPoint.prototype.constructor = MultiPoint;

  /**
   * Append the passed point to this multipoint.
   * @param {Point} point Point.
   * @api
   */
  MultiPoint.prototype.appendPoint = function appendPoint (point) {
    if (!this.flatCoordinates) {
      this.flatCoordinates = point.getFlatCoordinates().slice();
    } else {
      (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.extend)(this.flatCoordinates, point.getFlatCoordinates());
    }
    this.changed();
  };

  /**
   * Make a complete copy of the geometry.
   * @return {!MultiPoint} Clone.
   * @override
   * @api
   */
  MultiPoint.prototype.clone = function clone () {
    var multiPoint = new MultiPoint(this.flatCoordinates.slice(), this.layout);
    return multiPoint;
  };

  /**
   * @inheritDoc
   */
  MultiPoint.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.closestSquaredDistanceXY)(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    var flatCoordinates = this.flatCoordinates;
    var stride = this.stride;
    for (var i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
      var squaredDistance = (0,_math_js__WEBPACK_IMPORTED_MODULE_2__.squaredDistance)(
        x, y, flatCoordinates[i], flatCoordinates[i + 1]);
      if (squaredDistance < minSquaredDistance) {
        minSquaredDistance = squaredDistance;
        for (var j = 0; j < stride; ++j) {
          closestPoint[j] = flatCoordinates[i + j];
        }
        closestPoint.length = stride;
      }
    }
    return minSquaredDistance;
  };

  /**
   * Return the coordinates of the multipoint.
   * @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
   * @override
   * @api
   */
  MultiPoint.prototype.getCoordinates = function getCoordinates () {
    return (0,_flat_inflate_js__WEBPACK_IMPORTED_MODULE_3__.inflateCoordinates)(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
  };

  /**
   * Return the point at the specified index.
   * @param {number} index Index.
   * @return {Point} Point.
   * @api
   */
  MultiPoint.prototype.getPoint = function getPoint (index) {
    var n = !this.flatCoordinates ? 0 : this.flatCoordinates.length / this.stride;
    if (index < 0 || n <= index) {
      return null;
    }
    return new _Point_js__WEBPACK_IMPORTED_MODULE_4__["default"](this.flatCoordinates.slice(
      index * this.stride, (index + 1) * this.stride), this.layout);
  };

  /**
   * Return the points of this multipoint.
   * @return {Array<Point>} Points.
   * @api
   */
  MultiPoint.prototype.getPoints = function getPoints () {
    var flatCoordinates = this.flatCoordinates;
    var layout = this.layout;
    var stride = this.stride;
    /** @type {Array<Point>} */
    var points = [];
    for (var i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
      var point = new _Point_js__WEBPACK_IMPORTED_MODULE_4__["default"](flatCoordinates.slice(i, i + stride), layout);
      points.push(point);
    }
    return points;
  };

  /**
   * @inheritDoc
   * @api
   */
  MultiPoint.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_5__["default"].MULTI_POINT;
  };

  /**
   * @inheritDoc
   * @api
   */
  MultiPoint.prototype.intersectsExtent = function intersectsExtent (extent) {
    var flatCoordinates = this.flatCoordinates;
    var stride = this.stride;
    for (var i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
      var x = flatCoordinates[i];
      var y = flatCoordinates[i + 1];
      if ((0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.containsXY)(extent, x, y)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Set the coordinates of the multipoint.
   * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
   * @param {import("./GeometryLayout.js").default=} opt_layout Layout.
   * @override
   * @api
   */
  MultiPoint.prototype.setCoordinates = function setCoordinates (coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = (0,_flat_deflate_js__WEBPACK_IMPORTED_MODULE_6__.deflateCoordinates)(
      this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  };

  return MultiPoint;
}(_SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_7__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MultiPoint);

//# sourceMappingURL=MultiPoint.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/MultiPolygon.js":
/*!******************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/MultiPolygon.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../array.js */ "./node_modules/@biigle/ol/array.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./GeometryLayout.js */ "./node_modules/@biigle/ol/geom/GeometryLayout.js");
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _MultiPoint_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./MultiPoint.js */ "./node_modules/@biigle/ol/geom/MultiPoint.js");
/* harmony import */ var _Polygon_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./Polygon.js */ "./node_modules/@biigle/ol/geom/Polygon.js");
/* harmony import */ var _SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./SimpleGeometry.js */ "./node_modules/@biigle/ol/geom/SimpleGeometry.js");
/* harmony import */ var _flat_area_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./flat/area.js */ "./node_modules/@biigle/ol/geom/flat/area.js");
/* harmony import */ var _flat_center_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./flat/center.js */ "./node_modules/@biigle/ol/geom/flat/center.js");
/* harmony import */ var _flat_closest_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flat/closest.js */ "./node_modules/@biigle/ol/geom/flat/closest.js");
/* harmony import */ var _flat_contains_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./flat/contains.js */ "./node_modules/@biigle/ol/geom/flat/contains.js");
/* harmony import */ var _flat_deflate_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./flat/deflate.js */ "./node_modules/@biigle/ol/geom/flat/deflate.js");
/* harmony import */ var _flat_inflate_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./flat/inflate.js */ "./node_modules/@biigle/ol/geom/flat/inflate.js");
/* harmony import */ var _flat_interiorpoint_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./flat/interiorpoint.js */ "./node_modules/@biigle/ol/geom/flat/interiorpoint.js");
/* harmony import */ var _flat_intersectsextent_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./flat/intersectsextent.js */ "./node_modules/@biigle/ol/geom/flat/intersectsextent.js");
/* harmony import */ var _flat_orient_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./flat/orient.js */ "./node_modules/@biigle/ol/geom/flat/orient.js");
/* harmony import */ var _flat_simplify_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./flat/simplify.js */ "./node_modules/@biigle/ol/geom/flat/simplify.js");
/**
 * @module ol/geom/MultiPolygon
 */


















/**
 * @classdesc
 * Multi-polygon geometry.
 *
 * @api
 */
var MultiPolygon = /*@__PURE__*/(function (SimpleGeometry) {
  function MultiPolygon(coordinates, opt_layout, opt_endss) {

    SimpleGeometry.call(this);

    /**
     * @type {Array<Array<number>>}
     * @private
     */
    this.endss_ = [];

    /**
     * @private
     * @type {number}
     */
    this.flatInteriorPointsRevision_ = -1;

    /**
     * @private
     * @type {Array<number>}
     */
    this.flatInteriorPoints_ = null;

    /**
     * @private
     * @type {number}
     */
    this.maxDelta_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.maxDeltaRevision_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.orientedRevision_ = -1;

    /**
     * @private
     * @type {Array<number>}
     */
    this.orientedFlatCoordinates_ = null;

    if (!opt_endss && !Array.isArray(coordinates[0])) {
      var layout = this.getLayout();
      var polygons = /** @type {Array<Polygon>} */ (coordinates);
      var flatCoordinates = [];
      var endss = [];
      for (var i = 0, ii = polygons.length; i < ii; ++i) {
        var polygon = polygons[i];
        if (i === 0) {
          layout = polygon.getLayout();
        }
        var offset = flatCoordinates.length;
        var ends = polygon.getEnds();
        for (var j = 0, jj = ends.length; j < jj; ++j) {
          ends[j] += offset;
        }
        (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.extend)(flatCoordinates, polygon.getFlatCoordinates());
        endss.push(ends);
      }
      opt_layout = layout;
      coordinates = flatCoordinates;
      opt_endss = endss;
    }
    if (opt_layout !== undefined && opt_endss) {
      this.setFlatCoordinates(opt_layout, /** @type {Array<number>} */ (coordinates));
      this.endss_ = opt_endss;
    } else {
      this.setCoordinates(/** @type {Array<Array<Array<import("../coordinate.js").Coordinate>>>} */ (coordinates),
        opt_layout);
    }

  }

  if ( SimpleGeometry ) MultiPolygon.__proto__ = SimpleGeometry;
  MultiPolygon.prototype = Object.create( SimpleGeometry && SimpleGeometry.prototype );
  MultiPolygon.prototype.constructor = MultiPolygon;

  /**
   * Append the passed polygon to this multipolygon.
   * @param {Polygon} polygon Polygon.
   * @api
   */
  MultiPolygon.prototype.appendPolygon = function appendPolygon (polygon) {
    /** @type {Array<number>} */
    var ends;
    if (!this.flatCoordinates) {
      this.flatCoordinates = polygon.getFlatCoordinates().slice();
      ends = polygon.getEnds().slice();
      this.endss_.push();
    } else {
      var offset = this.flatCoordinates.length;
      (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.extend)(this.flatCoordinates, polygon.getFlatCoordinates());
      ends = polygon.getEnds().slice();
      for (var i = 0, ii = ends.length; i < ii; ++i) {
        ends[i] += offset;
      }
    }
    this.endss_.push(ends);
    this.changed();
  };

  /**
   * Make a complete copy of the geometry.
   * @return {!MultiPolygon} Clone.
   * @override
   * @api
   */
  MultiPolygon.prototype.clone = function clone () {
    var len = this.endss_.length;
    var newEndss = new Array(len);
    for (var i = 0; i < len; ++i) {
      newEndss[i] = this.endss_[i].slice();
    }

    return new MultiPolygon(
      this.flatCoordinates.slice(), this.layout, newEndss);
  };

  /**
   * @inheritDoc
   */
  MultiPolygon.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.closestSquaredDistanceXY)(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    if (this.maxDeltaRevision_ != this.getRevision()) {
      this.maxDelta_ = Math.sqrt((0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_2__.multiArrayMaxSquaredDelta)(
        this.flatCoordinates, 0, this.endss_, this.stride, 0));
      this.maxDeltaRevision_ = this.getRevision();
    }
    return (0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_2__.assignClosestMultiArrayPoint)(
      this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride,
      this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
  };

  /**
   * @inheritDoc
   */
  MultiPolygon.prototype.containsXY = function containsXY (x, y) {
    return (0,_flat_contains_js__WEBPACK_IMPORTED_MODULE_3__.linearRingssContainsXY)(this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride, x, y);
  };

  /**
   * Return the area of the multipolygon on projected plane.
   * @return {number} Area (on projected plane).
   * @api
   */
  MultiPolygon.prototype.getArea = function getArea () {
    return (0,_flat_area_js__WEBPACK_IMPORTED_MODULE_4__.linearRingss)(this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride);
  };

  /**
   * Get the coordinate array for this geometry.  This array has the structure
   * of a GeoJSON coordinate array for multi-polygons.
   *
   * @param {boolean=} opt_right Orient coordinates according to the right-hand
   *     rule (counter-clockwise for exterior and clockwise for interior rings).
   *     If `false`, coordinates will be oriented according to the left-hand rule
   *     (clockwise for exterior and counter-clockwise for interior rings).
   *     By default, coordinate orientation will depend on how the geometry was
   *     constructed.
   * @return {Array<Array<Array<import("../coordinate.js").Coordinate>>>} Coordinates.
   * @override
   * @api
   */
  MultiPolygon.prototype.getCoordinates = function getCoordinates (opt_right) {
    var flatCoordinates;
    if (opt_right !== undefined) {
      flatCoordinates = this.getOrientedFlatCoordinates().slice();
      (0,_flat_orient_js__WEBPACK_IMPORTED_MODULE_5__.orientLinearRingsArray)(
        flatCoordinates, 0, this.endss_, this.stride, opt_right);
    } else {
      flatCoordinates = this.flatCoordinates;
    }

    return (0,_flat_inflate_js__WEBPACK_IMPORTED_MODULE_6__.inflateMultiCoordinatesArray)(
      flatCoordinates, 0, this.endss_, this.stride);
  };

  /**
   * @return {Array<Array<number>>} Endss.
   */
  MultiPolygon.prototype.getEndss = function getEndss () {
    return this.endss_;
  };

  /**
   * @return {Array<number>} Flat interior points.
   */
  MultiPolygon.prototype.getFlatInteriorPoints = function getFlatInteriorPoints () {
    if (this.flatInteriorPointsRevision_ != this.getRevision()) {
      var flatCenters = (0,_flat_center_js__WEBPACK_IMPORTED_MODULE_7__.linearRingss)(
        this.flatCoordinates, 0, this.endss_, this.stride);
      this.flatInteriorPoints_ = (0,_flat_interiorpoint_js__WEBPACK_IMPORTED_MODULE_8__.getInteriorPointsOfMultiArray)(
        this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride,
        flatCenters);
      this.flatInteriorPointsRevision_ = this.getRevision();
    }
    return this.flatInteriorPoints_;
  };

  /**
   * Return the interior points as {@link module:ol/geom/MultiPoint multipoint}.
   * @return {MultiPoint} Interior points as XYM coordinates, where M is
   * the length of the horizontal intersection that the point belongs to.
   * @api
   */
  MultiPolygon.prototype.getInteriorPoints = function getInteriorPoints () {
    return new _MultiPoint_js__WEBPACK_IMPORTED_MODULE_9__["default"](this.getFlatInteriorPoints().slice(), _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_10__["default"].XYM);
  };

  /**
   * @return {Array<number>} Oriented flat coordinates.
   */
  MultiPolygon.prototype.getOrientedFlatCoordinates = function getOrientedFlatCoordinates () {
    if (this.orientedRevision_ != this.getRevision()) {
      var flatCoordinates = this.flatCoordinates;
      if ((0,_flat_orient_js__WEBPACK_IMPORTED_MODULE_5__.linearRingsAreOriented)(
        flatCoordinates, 0, this.endss_, this.stride)) {
        this.orientedFlatCoordinates_ = flatCoordinates;
      } else {
        this.orientedFlatCoordinates_ = flatCoordinates.slice();
        this.orientedFlatCoordinates_.length =
            (0,_flat_orient_js__WEBPACK_IMPORTED_MODULE_5__.orientLinearRingsArray)(
              this.orientedFlatCoordinates_, 0, this.endss_, this.stride);
      }
      this.orientedRevision_ = this.getRevision();
    }
    return this.orientedFlatCoordinates_;
  };

  /**
   * @inheritDoc
   */
  MultiPolygon.prototype.getSimplifiedGeometryInternal = function getSimplifiedGeometryInternal (squaredTolerance) {
    var simplifiedFlatCoordinates = [];
    var simplifiedEndss = [];
    simplifiedFlatCoordinates.length = (0,_flat_simplify_js__WEBPACK_IMPORTED_MODULE_11__.quantizeMultiArray)(
      this.flatCoordinates, 0, this.endss_, this.stride,
      Math.sqrt(squaredTolerance),
      simplifiedFlatCoordinates, 0, simplifiedEndss);
    return new MultiPolygon(simplifiedFlatCoordinates, _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_10__["default"].XY, simplifiedEndss);
  };

  /**
   * Return the polygon at the specified index.
   * @param {number} index Index.
   * @return {Polygon} Polygon.
   * @api
   */
  MultiPolygon.prototype.getPolygon = function getPolygon (index) {
    if (index < 0 || this.endss_.length <= index) {
      return null;
    }
    var offset;
    if (index === 0) {
      offset = 0;
    } else {
      var prevEnds = this.endss_[index - 1];
      offset = prevEnds[prevEnds.length - 1];
    }
    var ends = this.endss_[index].slice();
    var end = ends[ends.length - 1];
    if (offset !== 0) {
      for (var i = 0, ii = ends.length; i < ii; ++i) {
        ends[i] -= offset;
      }
    }
    return new _Polygon_js__WEBPACK_IMPORTED_MODULE_12__["default"](this.flatCoordinates.slice(offset, end), this.layout, ends);
  };

  /**
   * Return the polygons of this multipolygon.
   * @return {Array<Polygon>} Polygons.
   * @api
   */
  MultiPolygon.prototype.getPolygons = function getPolygons () {
    var layout = this.layout;
    var flatCoordinates = this.flatCoordinates;
    var endss = this.endss_;
    var polygons = [];
    var offset = 0;
    for (var i = 0, ii = endss.length; i < ii; ++i) {
      var ends = endss[i].slice();
      var end = ends[ends.length - 1];
      if (offset !== 0) {
        for (var j = 0, jj = ends.length; j < jj; ++j) {
          ends[j] -= offset;
        }
      }
      var polygon = new _Polygon_js__WEBPACK_IMPORTED_MODULE_12__["default"](flatCoordinates.slice(offset, end), layout, ends);
      polygons.push(polygon);
      offset = end;
    }
    return polygons;
  };

  /**
   * @inheritDoc
   * @api
   */
  MultiPolygon.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_13__["default"].MULTI_POLYGON;
  };

  /**
   * @inheritDoc
   * @api
   */
  MultiPolygon.prototype.intersectsExtent = function intersectsExtent (extent) {
    return (0,_flat_intersectsextent_js__WEBPACK_IMPORTED_MODULE_14__.intersectsLinearRingMultiArray)(
      this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride, extent);
  };

  /**
   * Set the coordinates of the multipolygon.
   * @param {!Array<Array<Array<import("../coordinate.js").Coordinate>>>} coordinates Coordinates.
   * @param {GeometryLayout=} opt_layout Layout.
   * @override
   * @api
   */
  MultiPolygon.prototype.setCoordinates = function setCoordinates (coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 3);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    var endss = (0,_flat_deflate_js__WEBPACK_IMPORTED_MODULE_15__.deflateMultiCoordinatesArray)(
      this.flatCoordinates, 0, coordinates, this.stride, this.endss_);
    if (endss.length === 0) {
      this.flatCoordinates.length = 0;
    } else {
      var lastEnds = endss[endss.length - 1];
      this.flatCoordinates.length = lastEnds.length === 0 ?
        0 : lastEnds[lastEnds.length - 1];
    }
    this.changed();
  };

  return MultiPolygon;
}(_SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_16__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MultiPolygon);

//# sourceMappingURL=MultiPolygon.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/Point.js":
/*!***********************************************!*\
  !*** ./node_modules/@biigle/ol/geom/Point.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./SimpleGeometry.js */ "./node_modules/@biigle/ol/geom/SimpleGeometry.js");
/* harmony import */ var _flat_deflate_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./flat/deflate.js */ "./node_modules/@biigle/ol/geom/flat/deflate.js");
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../math.js */ "./node_modules/@biigle/ol/math.js");
/**
 * @module ol/geom/Point
 */






/**
 * @classdesc
 * Point geometry.
 *
 * @api
 */
var Point = /*@__PURE__*/(function (SimpleGeometry) {
  function Point(coordinates, opt_layout) {
    SimpleGeometry.call(this);
    this.setCoordinates(coordinates, opt_layout);
  }

  if ( SimpleGeometry ) Point.__proto__ = SimpleGeometry;
  Point.prototype = Object.create( SimpleGeometry && SimpleGeometry.prototype );
  Point.prototype.constructor = Point;

  /**
   * Make a complete copy of the geometry.
   * @return {!Point} Clone.
   * @override
   * @api
   */
  Point.prototype.clone = function clone () {
    var point = new Point(this.flatCoordinates.slice(), this.layout);
    return point;
  };

  /**
   * @inheritDoc
   */
  Point.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    var flatCoordinates = this.flatCoordinates;
    var squaredDistance = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.squaredDistance)(x, y, flatCoordinates[0], flatCoordinates[1]);
    if (squaredDistance < minSquaredDistance) {
      var stride = this.stride;
      for (var i = 0; i < stride; ++i) {
        closestPoint[i] = flatCoordinates[i];
      }
      closestPoint.length = stride;
      return squaredDistance;
    } else {
      return minSquaredDistance;
    }
  };

  /**
   * Return the coordinate of the point.
   * @return {import("../coordinate.js").Coordinate} Coordinates.
   * @override
   * @api
   */
  Point.prototype.getCoordinates = function getCoordinates () {
    return !this.flatCoordinates ? [] : this.flatCoordinates.slice();
  };

  /**
   * @inheritDoc
   */
  Point.prototype.computeExtent = function computeExtent (extent) {
    return (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.createOrUpdateFromCoordinate)(this.flatCoordinates, extent);
  };

  /**
   * @inheritDoc
   * @api
   */
  Point.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].POINT;
  };

  /**
   * @inheritDoc
   * @api
   */
  Point.prototype.intersectsExtent = function intersectsExtent (extent) {
    return (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.containsXY)(extent, this.flatCoordinates[0], this.flatCoordinates[1]);
  };

  /**
   * @inheritDoc
   * @api
   */
  Point.prototype.setCoordinates = function setCoordinates (coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = (0,_flat_deflate_js__WEBPACK_IMPORTED_MODULE_3__.deflateCoordinate)(
      this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  };

  return Point;
}(_SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_4__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Point);

//# sourceMappingURL=Point.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/Polygon.js":
/*!*************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/Polygon.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "circular": () => (/* binding */ circular),
/* harmony export */   "fromExtent": () => (/* binding */ fromExtent),
/* harmony export */   "fromCircle": () => (/* binding */ fromCircle),
/* harmony export */   "makeRegular": () => (/* binding */ makeRegular)
/* harmony export */ });
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../array.js */ "./node_modules/@biigle/ol/array.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./GeometryLayout.js */ "./node_modules/@biigle/ol/geom/GeometryLayout.js");
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _LinearRing_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./LinearRing.js */ "./node_modules/@biigle/ol/geom/LinearRing.js");
/* harmony import */ var _Point_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./Point.js */ "./node_modules/@biigle/ol/geom/Point.js");
/* harmony import */ var _SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./SimpleGeometry.js */ "./node_modules/@biigle/ol/geom/SimpleGeometry.js");
/* harmony import */ var _sphere_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../sphere.js */ "./node_modules/@biigle/ol/sphere.js");
/* harmony import */ var _flat_area_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./flat/area.js */ "./node_modules/@biigle/ol/geom/flat/area.js");
/* harmony import */ var _flat_closest_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flat/closest.js */ "./node_modules/@biigle/ol/geom/flat/closest.js");
/* harmony import */ var _flat_contains_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./flat/contains.js */ "./node_modules/@biigle/ol/geom/flat/contains.js");
/* harmony import */ var _flat_deflate_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./flat/deflate.js */ "./node_modules/@biigle/ol/geom/flat/deflate.js");
/* harmony import */ var _flat_inflate_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./flat/inflate.js */ "./node_modules/@biigle/ol/geom/flat/inflate.js");
/* harmony import */ var _flat_interiorpoint_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./flat/interiorpoint.js */ "./node_modules/@biigle/ol/geom/flat/interiorpoint.js");
/* harmony import */ var _flat_intersectsextent_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./flat/intersectsextent.js */ "./node_modules/@biigle/ol/geom/flat/intersectsextent.js");
/* harmony import */ var _flat_orient_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./flat/orient.js */ "./node_modules/@biigle/ol/geom/flat/orient.js");
/* harmony import */ var _flat_simplify_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./flat/simplify.js */ "./node_modules/@biigle/ol/geom/flat/simplify.js");
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../math.js */ "./node_modules/@biigle/ol/math.js");
/**
 * @module ol/geom/Polygon
 */



















/**
 * @classdesc
 * Polygon geometry.
 *
 * @api
 */
var Polygon = /*@__PURE__*/(function (SimpleGeometry) {
  function Polygon(coordinates, opt_layout, opt_ends) {

    SimpleGeometry.call(this);

    /**
     * @type {Array<number>}
     * @private
     */
    this.ends_ = [];

    /**
     * @private
     * @type {number}
     */
    this.flatInteriorPointRevision_ = -1;

    /**
     * @private
     * @type {import("../coordinate.js").Coordinate}
     */
    this.flatInteriorPoint_ = null;

    /**
     * @private
     * @type {number}
     */
    this.maxDelta_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.maxDeltaRevision_ = -1;

    /**
     * @private
     * @type {number}
     */
    this.orientedRevision_ = -1;

    /**
     * @private
     * @type {Array<number>}
     */
    this.orientedFlatCoordinates_ = null;

    if (opt_layout !== undefined && opt_ends) {
      this.setFlatCoordinates(opt_layout, /** @type {Array<number>} */ (coordinates));
      this.ends_ = opt_ends;
    } else {
      this.setCoordinates(/** @type {Array<Array<import("../coordinate.js").Coordinate>>} */ (coordinates), opt_layout);
    }

  }

  if ( SimpleGeometry ) Polygon.__proto__ = SimpleGeometry;
  Polygon.prototype = Object.create( SimpleGeometry && SimpleGeometry.prototype );
  Polygon.prototype.constructor = Polygon;

  /**
   * Append the passed linear ring to this polygon.
   * @param {LinearRing} linearRing Linear ring.
   * @api
   */
  Polygon.prototype.appendLinearRing = function appendLinearRing (linearRing) {
    if (!this.flatCoordinates) {
      this.flatCoordinates = linearRing.getFlatCoordinates().slice();
    } else {
      (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.extend)(this.flatCoordinates, linearRing.getFlatCoordinates());
    }
    this.ends_.push(this.flatCoordinates.length);
    this.changed();
  };

  /**
   * Make a complete copy of the geometry.
   * @return {!Polygon} Clone.
   * @override
   * @api
   */
  Polygon.prototype.clone = function clone () {
    return new Polygon(this.flatCoordinates.slice(), this.layout, this.ends_.slice());
  };

  /**
   * @inheritDoc
   */
  Polygon.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.closestSquaredDistanceXY)(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    if (this.maxDeltaRevision_ != this.getRevision()) {
      this.maxDelta_ = Math.sqrt((0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_2__.arrayMaxSquaredDelta)(
        this.flatCoordinates, 0, this.ends_, this.stride, 0));
      this.maxDeltaRevision_ = this.getRevision();
    }
    return (0,_flat_closest_js__WEBPACK_IMPORTED_MODULE_2__.assignClosestArrayPoint)(
      this.flatCoordinates, 0, this.ends_, this.stride,
      this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
  };

  /**
   * @inheritDoc
   */
  Polygon.prototype.containsXY = function containsXY (x, y) {
    return (0,_flat_contains_js__WEBPACK_IMPORTED_MODULE_3__.linearRingsContainsXY)(this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride, x, y);
  };

  /**
   * Return the area of the polygon on projected plane.
   * @return {number} Area (on projected plane).
   * @api
   */
  Polygon.prototype.getArea = function getArea () {
    return (0,_flat_area_js__WEBPACK_IMPORTED_MODULE_4__.linearRings)(this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride);
  };

  /**
   * Get the coordinate array for this geometry.  This array has the structure
   * of a GeoJSON coordinate array for polygons.
   *
   * @param {boolean=} opt_right Orient coordinates according to the right-hand
   *     rule (counter-clockwise for exterior and clockwise for interior rings).
   *     If `false`, coordinates will be oriented according to the left-hand rule
   *     (clockwise for exterior and counter-clockwise for interior rings).
   *     By default, coordinate orientation will depend on how the geometry was
   *     constructed.
   * @return {Array<Array<import("../coordinate.js").Coordinate>>} Coordinates.
   * @override
   * @api
   */
  Polygon.prototype.getCoordinates = function getCoordinates (opt_right) {
    var flatCoordinates;
    if (opt_right !== undefined) {
      flatCoordinates = this.getOrientedFlatCoordinates().slice();
      (0,_flat_orient_js__WEBPACK_IMPORTED_MODULE_5__.orientLinearRings)(
        flatCoordinates, 0, this.ends_, this.stride, opt_right);
    } else {
      flatCoordinates = this.flatCoordinates;
    }

    return (0,_flat_inflate_js__WEBPACK_IMPORTED_MODULE_6__.inflateCoordinatesArray)(
      flatCoordinates, 0, this.ends_, this.stride);
  };

  /**
   * @return {Array<number>} Ends.
   */
  Polygon.prototype.getEnds = function getEnds () {
    return this.ends_;
  };

  /**
   * @return {Array<number>} Interior point.
   */
  Polygon.prototype.getFlatInteriorPoint = function getFlatInteriorPoint () {
    if (this.flatInteriorPointRevision_ != this.getRevision()) {
      var flatCenter = (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.getCenter)(this.getExtent());
      this.flatInteriorPoint_ = (0,_flat_interiorpoint_js__WEBPACK_IMPORTED_MODULE_7__.getInteriorPointOfArray)(
        this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride,
        flatCenter, 0);
      this.flatInteriorPointRevision_ = this.getRevision();
    }
    return this.flatInteriorPoint_;
  };

  /**
   * Return an interior point of the polygon.
   * @return {Point} Interior point as XYM coordinate, where M is the
   * length of the horizontal intersection that the point belongs to.
   * @api
   */
  Polygon.prototype.getInteriorPoint = function getInteriorPoint () {
    return new _Point_js__WEBPACK_IMPORTED_MODULE_8__["default"](this.getFlatInteriorPoint(), _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_9__["default"].XYM);
  };

  /**
   * Return the number of rings of the polygon,  this includes the exterior
   * ring and any interior rings.
   *
   * @return {number} Number of rings.
   * @api
   */
  Polygon.prototype.getLinearRingCount = function getLinearRingCount () {
    return this.ends_.length;
  };

  /**
   * Return the Nth linear ring of the polygon geometry. Return `null` if the
   * given index is out of range.
   * The exterior linear ring is available at index `0` and the interior rings
   * at index `1` and beyond.
   *
   * @param {number} index Index.
   * @return {LinearRing} Linear ring.
   * @api
   */
  Polygon.prototype.getLinearRing = function getLinearRing (index) {
    if (index < 0 || this.ends_.length <= index) {
      return null;
    }
    return new _LinearRing_js__WEBPACK_IMPORTED_MODULE_10__["default"](this.flatCoordinates.slice(
      index === 0 ? 0 : this.ends_[index - 1], this.ends_[index]), this.layout);
  };

  /**
   * Return the linear rings of the polygon.
   * @return {Array<LinearRing>} Linear rings.
   * @api
   */
  Polygon.prototype.getLinearRings = function getLinearRings () {
    var layout = this.layout;
    var flatCoordinates = this.flatCoordinates;
    var ends = this.ends_;
    var linearRings = [];
    var offset = 0;
    for (var i = 0, ii = ends.length; i < ii; ++i) {
      var end = ends[i];
      var linearRing = new _LinearRing_js__WEBPACK_IMPORTED_MODULE_10__["default"](flatCoordinates.slice(offset, end), layout);
      linearRings.push(linearRing);
      offset = end;
    }
    return linearRings;
  };

  /**
   * @return {Array<number>} Oriented flat coordinates.
   */
  Polygon.prototype.getOrientedFlatCoordinates = function getOrientedFlatCoordinates () {
    if (this.orientedRevision_ != this.getRevision()) {
      var flatCoordinates = this.flatCoordinates;
      if ((0,_flat_orient_js__WEBPACK_IMPORTED_MODULE_5__.linearRingIsOriented)(
        flatCoordinates, 0, this.ends_, this.stride)) {
        this.orientedFlatCoordinates_ = flatCoordinates;
      } else {
        this.orientedFlatCoordinates_ = flatCoordinates.slice();
        this.orientedFlatCoordinates_.length =
            (0,_flat_orient_js__WEBPACK_IMPORTED_MODULE_5__.orientLinearRings)(
              this.orientedFlatCoordinates_, 0, this.ends_, this.stride);
      }
      this.orientedRevision_ = this.getRevision();
    }
    return this.orientedFlatCoordinates_;
  };

  /**
   * @inheritDoc
   */
  Polygon.prototype.getSimplifiedGeometryInternal = function getSimplifiedGeometryInternal (squaredTolerance) {
    var simplifiedFlatCoordinates = [];
    var simplifiedEnds = [];
    simplifiedFlatCoordinates.length = (0,_flat_simplify_js__WEBPACK_IMPORTED_MODULE_11__.quantizeArray)(
      this.flatCoordinates, 0, this.ends_, this.stride,
      Math.sqrt(squaredTolerance),
      simplifiedFlatCoordinates, 0, simplifiedEnds);
    return new Polygon(simplifiedFlatCoordinates, _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_9__["default"].XY, simplifiedEnds);
  };

  /**
   * @inheritDoc
   * @api
   */
  Polygon.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_12__["default"].POLYGON;
  };

  /**
   * @inheritDoc
   * @api
   */
  Polygon.prototype.intersectsExtent = function intersectsExtent (extent) {
    return (0,_flat_intersectsextent_js__WEBPACK_IMPORTED_MODULE_13__.intersectsLinearRingArray)(
      this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride, extent);
  };

  /**
   * Set the coordinates of the polygon.
   * @param {!Array<Array<import("../coordinate.js").Coordinate>>} coordinates Coordinates.
   * @param {GeometryLayout=} opt_layout Layout.
   * @override
   * @api
   */
  Polygon.prototype.setCoordinates = function setCoordinates (coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 2);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    var ends = (0,_flat_deflate_js__WEBPACK_IMPORTED_MODULE_14__.deflateCoordinatesArray)(
      this.flatCoordinates, 0, coordinates, this.stride, this.ends_);
    this.flatCoordinates.length = ends.length === 0 ? 0 : ends[ends.length - 1];
    this.changed();
  };

  return Polygon;
}(_SimpleGeometry_js__WEBPACK_IMPORTED_MODULE_15__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Polygon);


/**
 * Create an approximation of a circle on the surface of a sphere.
 * @param {import("../coordinate.js").Coordinate} center Center (`[lon, lat]` in degrees).
 * @param {number} radius The great-circle distance from the center to
 *     the polygon vertices.
 * @param {number=} opt_n Optional number of vertices for the resulting
 *     polygon. Default is `32`.
 * @param {number=} opt_sphereRadius Optional radius for the sphere (defaults to
 *     the Earth's mean radius using the WGS84 ellipsoid).
 * @return {Polygon} The "circular" polygon.
 * @api
 */
function circular(center, radius, opt_n, opt_sphereRadius) {
  var n = opt_n ? opt_n : 32;
  /** @type {Array<number>} */
  var flatCoordinates = [];
  for (var i = 0; i < n; ++i) {
    (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.extend)(flatCoordinates, (0,_sphere_js__WEBPACK_IMPORTED_MODULE_16__.offset)(center, radius, 2 * Math.PI * i / n, opt_sphereRadius));
  }
  flatCoordinates.push(flatCoordinates[0], flatCoordinates[1]);
  return new Polygon(flatCoordinates, _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_9__["default"].XY, [flatCoordinates.length]);
}


/**
 * Create a polygon from an extent. The layout used is `XY`.
 * @param {import("../extent.js").Extent} extent The extent.
 * @return {Polygon} The polygon.
 * @api
 */
function fromExtent(extent) {
  var minX = extent[0];
  var minY = extent[1];
  var maxX = extent[2];
  var maxY = extent[3];
  var flatCoordinates =
      [minX, minY, minX, maxY, maxX, maxY, maxX, minY, minX, minY];
  return new Polygon(flatCoordinates, _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_9__["default"].XY, [flatCoordinates.length]);
}


/**
 * Create a regular polygon from a circle.
 * @param {import("./Circle.js").default} circle Circle geometry.
 * @param {number=} opt_sides Number of sides of the polygon. Default is 32.
 * @param {number=} opt_angle Start angle for the first vertex of the polygon in
 *     radians. Default is 0.
 * @return {Polygon} Polygon geometry.
 * @api
 */
function fromCircle(circle, opt_sides, opt_angle) {
  var sides = opt_sides ? opt_sides : 32;
  var stride = circle.getStride();
  var layout = circle.getLayout();
  var center = circle.getCenter();
  var arrayLength = stride * (sides + 1);
  var flatCoordinates = new Array(arrayLength);
  for (var i = 0; i < arrayLength; i += stride) {
    flatCoordinates[i] = 0;
    flatCoordinates[i + 1] = 0;
    for (var j = 2; j < stride; j++) {
      flatCoordinates[i + j] = center[j];
    }
  }
  var ends = [flatCoordinates.length];
  var polygon = new Polygon(flatCoordinates, layout, ends);
  makeRegular(polygon, center, circle.getRadius(), opt_angle);
  return polygon;
}


/**
 * Modify the coordinates of a polygon to make it a regular polygon.
 * @param {Polygon} polygon Polygon geometry.
 * @param {import("../coordinate.js").Coordinate} center Center of the regular polygon.
 * @param {number} radius Radius of the regular polygon.
 * @param {number=} opt_angle Start angle for the first vertex of the polygon in
 *     radians. Default is 0.
 */
function makeRegular(polygon, center, radius, opt_angle) {
  var flatCoordinates = polygon.getFlatCoordinates();
  var stride = polygon.getStride();
  var sides = flatCoordinates.length / stride - 1;
  var startAngle = opt_angle ? opt_angle : 0;
  for (var i = 0; i <= sides; ++i) {
    var offset = i * stride;
    var angle = startAngle + ((0,_math_js__WEBPACK_IMPORTED_MODULE_17__.modulo)(i, sides) * 2 * Math.PI / sides);
    flatCoordinates[offset] = center[0] + (radius * Math.cos(angle));
    flatCoordinates[offset + 1] = center[1] + (radius * Math.sin(angle));
  }
  polygon.changed();
}

//# sourceMappingURL=Polygon.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/Rectangle.js":
/*!***************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/Rectangle.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _GeometryType_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _Polygon_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Polygon.js */ "./node_modules/@biigle/ol/geom/Polygon.js");
/**
 * @module ol/geom/Rectangle
 */



/**
 * @classdesc
 * Rectangle geometry.
 *
 * @api
 */
var Rectangle = /*@__PURE__*/(function (Polygon) {
  function Rectangle () {
    Polygon.apply(this, arguments);
  }

  if ( Polygon ) Rectangle.__proto__ = Polygon;
  Rectangle.prototype = Object.create( Polygon && Polygon.prototype );
  Rectangle.prototype.constructor = Rectangle;

  Rectangle.prototype.getType = function getType () {
    return _GeometryType_js__WEBPACK_IMPORTED_MODULE_0__["default"].RECTANGLE;
  };

  /**
   * @inheritDoc
   */
  Rectangle.prototype.closestPointXY = function closestPointXY (x, y, closestPoint, minSquaredDistance) {
    var flatCoordinates = this.flatCoordinates;
    var distance = minSquaredDistance;
    var d, dx, dy;
    closestPoint[0] = flatCoordinates[0];
    closestPoint[1] = flatCoordinates[1];

    for (var i = 0, l = flatCoordinates.length; i < l; i += 2) {
      dx = x - flatCoordinates[i];
      dy = y - flatCoordinates[i + 1];
      d = dx * dx + dy * dy;
      if (d < distance) {
        distance = d;
        closestPoint[0] = flatCoordinates[i];
        closestPoint[1] = flatCoordinates[i + 1];
      }
    }

    return distance;
  };

  return Rectangle;
}(_Polygon_js__WEBPACK_IMPORTED_MODULE_1__["default"]));

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Rectangle);

//# sourceMappingURL=Rectangle.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/SimpleGeometry.js":
/*!********************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/SimpleGeometry.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getStrideForLayout": () => (/* binding */ getStrideForLayout),
/* harmony export */   "transformGeom2D": () => (/* binding */ transformGeom2D),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _Geometry_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Geometry.js */ "./node_modules/@biigle/ol/geom/Geometry.js");
/* harmony import */ var _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GeometryLayout.js */ "./node_modules/@biigle/ol/geom/GeometryLayout.js");
/* harmony import */ var _flat_transform_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./flat/transform.js */ "./node_modules/@biigle/ol/geom/flat/transform.js");
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../obj.js */ "./node_modules/@biigle/ol/obj.js");
/**
 * @module ol/geom/SimpleGeometry
 */







/**
 * @classdesc
 * Abstract base class; only used for creating subclasses; do not instantiate
 * in apps, as cannot be rendered.
 *
 * @abstract
 * @api
 */
var SimpleGeometry = /*@__PURE__*/(function (Geometry) {
  function SimpleGeometry() {

    Geometry.call(this);

    /**
     * @protected
     * @type {GeometryLayout}
     */
    this.layout = _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__["default"].XY;

    /**
     * @protected
     * @type {number}
     */
    this.stride = 2;

    /**
     * @protected
     * @type {Array<number>}
     */
    this.flatCoordinates = null;

  }

  if ( Geometry ) SimpleGeometry.__proto__ = Geometry;
  SimpleGeometry.prototype = Object.create( Geometry && Geometry.prototype );
  SimpleGeometry.prototype.constructor = SimpleGeometry;

  /**
   * @inheritDoc
   */
  SimpleGeometry.prototype.computeExtent = function computeExtent (extent) {
    return (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.createOrUpdateFromFlatCoordinates)(this.flatCoordinates,
      0, this.flatCoordinates.length, this.stride, extent);
  };

  /**
   * @abstract
   * @return {Array} Coordinates.
   */
  SimpleGeometry.prototype.getCoordinates = function getCoordinates () {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Return the first coordinate of the geometry.
   * @return {import("../coordinate.js").Coordinate} First coordinate.
   * @api
   */
  SimpleGeometry.prototype.getFirstCoordinate = function getFirstCoordinate () {
    return this.flatCoordinates.slice(0, this.stride);
  };

  /**
   * @return {Array<number>} Flat coordinates.
   */
  SimpleGeometry.prototype.getFlatCoordinates = function getFlatCoordinates () {
    return this.flatCoordinates;
  };

  /**
   * Return the last coordinate of the geometry.
   * @return {import("../coordinate.js").Coordinate} Last point.
   * @api
   */
  SimpleGeometry.prototype.getLastCoordinate = function getLastCoordinate () {
    return this.flatCoordinates.slice(this.flatCoordinates.length - this.stride);
  };

  /**
   * Return the {@link module:ol/geom/GeometryLayout layout} of the geometry.
   * @return {GeometryLayout} Layout.
   * @api
   */
  SimpleGeometry.prototype.getLayout = function getLayout () {
    return this.layout;
  };

  /**
   * @inheritDoc
   */
  SimpleGeometry.prototype.getSimplifiedGeometry = function getSimplifiedGeometry (squaredTolerance) {
    if (this.simplifiedGeometryRevision != this.getRevision()) {
      (0,_obj_js__WEBPACK_IMPORTED_MODULE_3__.clear)(this.simplifiedGeometryCache);
      this.simplifiedGeometryMaxMinSquaredTolerance = 0;
      this.simplifiedGeometryRevision = this.getRevision();
    }
    // If squaredTolerance is negative or if we know that simplification will not
    // have any effect then just return this.
    if (squaredTolerance < 0 ||
        (this.simplifiedGeometryMaxMinSquaredTolerance !== 0 &&
         squaredTolerance <= this.simplifiedGeometryMaxMinSquaredTolerance)) {
      return this;
    }
    var key = squaredTolerance.toString();
    if (this.simplifiedGeometryCache.hasOwnProperty(key)) {
      return this.simplifiedGeometryCache[key];
    } else {
      var simplifiedGeometry =
          this.getSimplifiedGeometryInternal(squaredTolerance);
      var simplifiedFlatCoordinates = simplifiedGeometry.getFlatCoordinates();
      if (simplifiedFlatCoordinates.length < this.flatCoordinates.length) {
        this.simplifiedGeometryCache[key] = simplifiedGeometry;
        return simplifiedGeometry;
      } else {
        // Simplification did not actually remove any coordinates.  We now know
        // that any calls to getSimplifiedGeometry with a squaredTolerance less
        // than or equal to the current squaredTolerance will also not have any
        // effect.  This allows us to short circuit simplification (saving CPU
        // cycles) and prevents the cache of simplified geometries from filling
        // up with useless identical copies of this geometry (saving memory).
        this.simplifiedGeometryMaxMinSquaredTolerance = squaredTolerance;
        return this;
      }
    }
  };

  /**
   * @param {number} squaredTolerance Squared tolerance.
   * @return {SimpleGeometry} Simplified geometry.
   * @protected
   */
  SimpleGeometry.prototype.getSimplifiedGeometryInternal = function getSimplifiedGeometryInternal (squaredTolerance) {
    return this;
  };

  /**
   * @return {number} Stride.
   */
  SimpleGeometry.prototype.getStride = function getStride () {
    return this.stride;
  };

  /**
   * @param {GeometryLayout} layout Layout.
   * @param {Array<number>} flatCoordinates Flat coordinates.
   */
  SimpleGeometry.prototype.setFlatCoordinates = function setFlatCoordinates (layout, flatCoordinates) {
    this.stride = getStrideForLayout(layout);
    this.layout = layout;
    this.flatCoordinates = flatCoordinates;
  };

  /**
   * @abstract
   * @param {!Array} coordinates Coordinates.
   * @param {GeometryLayout=} opt_layout Layout.
   */
  SimpleGeometry.prototype.setCoordinates = function setCoordinates (coordinates, opt_layout) {
    (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * @param {GeometryLayout|undefined} layout Layout.
   * @param {Array} coordinates Coordinates.
   * @param {number} nesting Nesting.
   * @protected
   */
  SimpleGeometry.prototype.setLayout = function setLayout (layout, coordinates, nesting) {
    /** @type {number} */
    var stride;
    if (layout) {
      stride = getStrideForLayout(layout);
    } else {
      for (var i = 0; i < nesting; ++i) {
        if (coordinates.length === 0) {
          this.layout = _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__["default"].XY;
          this.stride = 2;
          return;
        } else {
          coordinates = /** @type {Array} */ (coordinates[0]);
        }
      }
      stride = coordinates.length;
      layout = getLayoutForStride(stride);
    }
    this.layout = layout;
    this.stride = stride;
  };

  /**
   * @inheritDoc
   * @api
   */
  SimpleGeometry.prototype.applyTransform = function applyTransform (transformFn) {
    if (this.flatCoordinates) {
      transformFn(this.flatCoordinates, this.flatCoordinates, this.stride);
      this.changed();
    }
  };

  /**
   * @inheritDoc
   * @api
   */
  SimpleGeometry.prototype.rotate = function rotate$1 (angle, anchor) {
    var flatCoordinates = this.getFlatCoordinates();
    if (flatCoordinates) {
      var stride = this.getStride();
      (0,_flat_transform_js__WEBPACK_IMPORTED_MODULE_4__.rotate)(
        flatCoordinates, 0, flatCoordinates.length,
        stride, angle, anchor, flatCoordinates);
      this.changed();
    }
  };

  /**
   * @inheritDoc
   * @api
   */
  SimpleGeometry.prototype.scale = function scale$1 (sx, opt_sy, opt_anchor) {
    var sy = opt_sy;
    if (sy === undefined) {
      sy = sx;
    }
    var anchor = opt_anchor;
    if (!anchor) {
      anchor = (0,_extent_js__WEBPACK_IMPORTED_MODULE_1__.getCenter)(this.getExtent());
    }
    var flatCoordinates = this.getFlatCoordinates();
    if (flatCoordinates) {
      var stride = this.getStride();
      (0,_flat_transform_js__WEBPACK_IMPORTED_MODULE_4__.scale)(
        flatCoordinates, 0, flatCoordinates.length,
        stride, sx, sy, anchor, flatCoordinates);
      this.changed();
    }
  };

  /**
   * @inheritDoc
   * @api
   */
  SimpleGeometry.prototype.translate = function translate$1 (deltaX, deltaY) {
    var flatCoordinates = this.getFlatCoordinates();
    if (flatCoordinates) {
      var stride = this.getStride();
      (0,_flat_transform_js__WEBPACK_IMPORTED_MODULE_4__.translate)(
        flatCoordinates, 0, flatCoordinates.length, stride,
        deltaX, deltaY, flatCoordinates);
      this.changed();
    }
  };

  return SimpleGeometry;
}(_Geometry_js__WEBPACK_IMPORTED_MODULE_5__["default"]));


/**
 * @param {number} stride Stride.
 * @return {GeometryLayout} layout Layout.
 */
function getLayoutForStride(stride) {
  var layout;
  if (stride == 2) {
    layout = _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__["default"].XY;
  } else if (stride == 3) {
    layout = _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__["default"].XYZ;
  } else if (stride == 4) {
    layout = _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__["default"].XYZM;
  }
  return (
    /** @type {GeometryLayout} */ (layout)
  );
}


/**
 * @param {GeometryLayout} layout Layout.
 * @return {number} Stride.
 */
function getStrideForLayout(layout) {
  var stride;
  if (layout == _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__["default"].XY) {
    stride = 2;
  } else if (layout == _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__["default"].XYZ || layout == _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__["default"].XYM) {
    stride = 3;
  } else if (layout == _GeometryLayout_js__WEBPACK_IMPORTED_MODULE_0__["default"].XYZM) {
    stride = 4;
  }
  return /** @type {number} */ (stride);
}


/**
 * @param {SimpleGeometry} simpleGeometry Simple geometry.
 * @param {import("../transform.js").Transform} transform Transform.
 * @param {Array<number>=} opt_dest Destination.
 * @return {Array<number>} Transformed flat coordinates.
 */
function transformGeom2D(simpleGeometry, transform, opt_dest) {
  var flatCoordinates = simpleGeometry.getFlatCoordinates();
  if (!flatCoordinates) {
    return null;
  } else {
    var stride = simpleGeometry.getStride();
    return (0,_flat_transform_js__WEBPACK_IMPORTED_MODULE_4__.transform2D)(
      flatCoordinates, 0, flatCoordinates.length, stride,
      transform, opt_dest);
  }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SimpleGeometry);

//# sourceMappingURL=SimpleGeometry.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/area.js":
/*!***************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/area.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "linearRing": () => (/* binding */ linearRing),
/* harmony export */   "linearRings": () => (/* binding */ linearRings),
/* harmony export */   "linearRingss": () => (/* binding */ linearRingss)
/* harmony export */ });
/**
 * @module ol/geom/flat/area
 */


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {number} Area.
 */
function linearRing(flatCoordinates, offset, end, stride) {
  var twiceArea = 0;
  var x1 = flatCoordinates[end - stride];
  var y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    var x2 = flatCoordinates[offset];
    var y2 = flatCoordinates[offset + 1];
    twiceArea += y1 * x2 - x1 * y2;
    x1 = x2;
    y1 = y2;
  }
  return twiceArea / 2;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @return {number} Area.
 */
function linearRings(flatCoordinates, offset, ends, stride) {
  var area = 0;
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    area += linearRing(flatCoordinates, offset, end, stride);
    offset = end;
  }
  return area;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @return {number} Area.
 */
function linearRingss(flatCoordinates, offset, endss, stride) {
  var area = 0;
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    area += linearRings(flatCoordinates, offset, ends, stride);
    offset = ends[ends.length - 1];
  }
  return area;
}

//# sourceMappingURL=area.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/center.js":
/*!*****************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/center.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "linearRingss": () => (/* binding */ linearRingss)
/* harmony export */ });
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../extent.js */ "./node_modules/@biigle/ol/extent.js");
/**
 * @module ol/geom/flat/center
 */



/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @return {Array<number>} Flat centers.
 */
function linearRingss(flatCoordinates, offset, endss, stride) {
  var flatCenters = [];
  var extent = (0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.createEmpty)();
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    extent = (0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.createOrUpdateFromFlatCoordinates)(flatCoordinates, offset, ends[0], stride);
    flatCenters.push((extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2);
    offset = ends[ends.length - 1];
  }
  return flatCenters;
}

//# sourceMappingURL=center.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/closest.js":
/*!******************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/closest.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "maxSquaredDelta": () => (/* binding */ maxSquaredDelta),
/* harmony export */   "arrayMaxSquaredDelta": () => (/* binding */ arrayMaxSquaredDelta),
/* harmony export */   "multiArrayMaxSquaredDelta": () => (/* binding */ multiArrayMaxSquaredDelta),
/* harmony export */   "assignClosestPoint": () => (/* binding */ assignClosestPoint),
/* harmony export */   "assignClosestArrayPoint": () => (/* binding */ assignClosestArrayPoint),
/* harmony export */   "assignClosestMultiArrayPoint": () => (/* binding */ assignClosestMultiArrayPoint)
/* harmony export */ });
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../math.js */ "./node_modules/@biigle/ol/math.js");
/**
 * @module ol/geom/flat/closest
 */



/**
 * Returns the point on the 2D line segment flatCoordinates[offset1] to
 * flatCoordinates[offset2] that is closest to the point (x, y).  Extra
 * dimensions are linearly interpolated.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset1 Offset 1.
 * @param {number} offset2 Offset 2.
 * @param {number} stride Stride.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {Array<number>} closestPoint Closest point.
 */
function assignClosest(flatCoordinates, offset1, offset2, stride, x, y, closestPoint) {
  var x1 = flatCoordinates[offset1];
  var y1 = flatCoordinates[offset1 + 1];
  var dx = flatCoordinates[offset2] - x1;
  var dy = flatCoordinates[offset2 + 1] - y1;
  var offset;
  if (dx === 0 && dy === 0) {
    offset = offset1;
  } else {
    var t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      offset = offset2;
    } else if (t > 0) {
      for (var i = 0; i < stride; ++i) {
        closestPoint[i] = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.lerp)(flatCoordinates[offset1 + i],
          flatCoordinates[offset2 + i], t);
      }
      closestPoint.length = stride;
      return;
    } else {
      offset = offset1;
    }
  }
  for (var i$1 = 0; i$1 < stride; ++i$1) {
    closestPoint[i$1] = flatCoordinates[offset + i$1];
  }
  closestPoint.length = stride;
}


/**
 * Return the squared of the largest distance between any pair of consecutive
 * coordinates.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} max Max squared delta.
 * @return {number} Max squared delta.
 */
function maxSquaredDelta(flatCoordinates, offset, end, stride, max) {
  var x1 = flatCoordinates[offset];
  var y1 = flatCoordinates[offset + 1];
  for (offset += stride; offset < end; offset += stride) {
    var x2 = flatCoordinates[offset];
    var y2 = flatCoordinates[offset + 1];
    var squaredDelta = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.squaredDistance)(x1, y1, x2, y2);
    if (squaredDelta > max) {
      max = squaredDelta;
    }
    x1 = x2;
    y1 = y2;
  }
  return max;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} max Max squared delta.
 * @return {number} Max squared delta.
 */
function arrayMaxSquaredDelta(flatCoordinates, offset, ends, stride, max) {
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    max = maxSquaredDelta(
      flatCoordinates, offset, end, stride, max);
    offset = end;
  }
  return max;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} max Max squared delta.
 * @return {number} Max squared delta.
 */
function multiArrayMaxSquaredDelta(flatCoordinates, offset, endss, stride, max) {
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    max = arrayMaxSquaredDelta(
      flatCoordinates, offset, ends, stride, max);
    offset = ends[ends.length - 1];
  }
  return max;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} maxDelta Max delta.
 * @param {boolean} isRing Is ring.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {Array<number>} closestPoint Closest point.
 * @param {number} minSquaredDistance Minimum squared distance.
 * @param {Array<number>=} opt_tmpPoint Temporary point object.
 * @return {number} Minimum squared distance.
 */
function assignClosestPoint(flatCoordinates, offset, end,
  stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance,
  opt_tmpPoint) {
  if (offset == end) {
    return minSquaredDistance;
  }
  var i, squaredDistance;
  if (maxDelta === 0) {
    // All points are identical, so just test the first point.
    squaredDistance = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.squaredDistance)(
      x, y, flatCoordinates[offset], flatCoordinates[offset + 1]);
    if (squaredDistance < minSquaredDistance) {
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = flatCoordinates[offset + i];
      }
      closestPoint.length = stride;
      return squaredDistance;
    } else {
      return minSquaredDistance;
    }
  }
  var tmpPoint = opt_tmpPoint ? opt_tmpPoint : [NaN, NaN];
  var index = offset + stride;
  while (index < end) {
    assignClosest(
      flatCoordinates, index - stride, index, stride, x, y, tmpPoint);
    squaredDistance = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.squaredDistance)(x, y, tmpPoint[0], tmpPoint[1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = tmpPoint[i];
      }
      closestPoint.length = stride;
      index += stride;
    } else {
      // Skip ahead multiple points, because we know that all the skipped
      // points cannot be any closer than the closest point we have found so
      // far.  We know this because we know how close the current point is, how
      // close the closest point we have found so far is, and the maximum
      // distance between consecutive points.  For example, if we're currently
      // at distance 10, the best we've found so far is 3, and that the maximum
      // distance between consecutive points is 2, then we'll need to skip at
      // least (10 - 3) / 2 == 3 (rounded down) points to have any chance of
      // finding a closer point.  We use Math.max(..., 1) to ensure that we
      // always advance at least one point, to avoid an infinite loop.
      index += stride * Math.max(
        ((Math.sqrt(squaredDistance) -
            Math.sqrt(minSquaredDistance)) / maxDelta) | 0, 1);
    }
  }
  if (isRing) {
    // Check the closing segment.
    assignClosest(
      flatCoordinates, end - stride, offset, stride, x, y, tmpPoint);
    squaredDistance = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.squaredDistance)(x, y, tmpPoint[0], tmpPoint[1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = tmpPoint[i];
      }
      closestPoint.length = stride;
    }
  }
  return minSquaredDistance;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} maxDelta Max delta.
 * @param {boolean} isRing Is ring.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {Array<number>} closestPoint Closest point.
 * @param {number} minSquaredDistance Minimum squared distance.
 * @param {Array<number>=} opt_tmpPoint Temporary point object.
 * @return {number} Minimum squared distance.
 */
function assignClosestArrayPoint(flatCoordinates, offset, ends,
  stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance,
  opt_tmpPoint) {
  var tmpPoint = opt_tmpPoint ? opt_tmpPoint : [NaN, NaN];
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    minSquaredDistance = assignClosestPoint(
      flatCoordinates, offset, end, stride,
      maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint);
    offset = end;
  }
  return minSquaredDistance;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} maxDelta Max delta.
 * @param {boolean} isRing Is ring.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {Array<number>} closestPoint Closest point.
 * @param {number} minSquaredDistance Minimum squared distance.
 * @param {Array<number>=} opt_tmpPoint Temporary point object.
 * @return {number} Minimum squared distance.
 */
function assignClosestMultiArrayPoint(flatCoordinates, offset,
  endss, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance,
  opt_tmpPoint) {
  var tmpPoint = opt_tmpPoint ? opt_tmpPoint : [NaN, NaN];
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    minSquaredDistance = assignClosestArrayPoint(
      flatCoordinates, offset, ends, stride,
      maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint);
    offset = ends[ends.length - 1];
  }
  return minSquaredDistance;
}

//# sourceMappingURL=closest.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/contains.js":
/*!*******************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/contains.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "linearRingContainsExtent": () => (/* binding */ linearRingContainsExtent),
/* harmony export */   "linearRingContainsXY": () => (/* binding */ linearRingContainsXY),
/* harmony export */   "linearRingsContainsXY": () => (/* binding */ linearRingsContainsXY),
/* harmony export */   "linearRingssContainsXY": () => (/* binding */ linearRingssContainsXY)
/* harmony export */ });
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../extent.js */ "./node_modules/@biigle/ol/extent.js");
/**
 * @module ol/geom/flat/contains
 */



/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} Contains extent.
 */
function linearRingContainsExtent(flatCoordinates, offset, end, stride, extent) {
  var outside = (0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.forEachCorner)(extent,
    /**
     * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
     * @return {boolean} Contains (x, y).
     */
    function(coordinate) {
      return !linearRingContainsXY(flatCoordinates, offset, end, stride, coordinate[0], coordinate[1]);
    });
  return !outside;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {boolean} Contains (x, y).
 */
function linearRingContainsXY(flatCoordinates, offset, end, stride, x, y) {
  // http://geomalgorithms.com/a03-_inclusion.html
  // Copyright 2000 softSurfer, 2012 Dan Sunday
  // This code may be freely used and modified for any purpose
  // providing that this copyright notice is included with it.
  // SoftSurfer makes no warranty for this code, and cannot be held
  // liable for any real or imagined damage resulting from its use.
  // Users of this code must verify correctness for their application.
  var wn = 0;
  var x1 = flatCoordinates[end - stride];
  var y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    var x2 = flatCoordinates[offset];
    var y2 = flatCoordinates[offset + 1];
    if (y1 <= y) {
      if (y2 > y && ((x2 - x1) * (y - y1)) - ((x - x1) * (y2 - y1)) > 0) {
        wn++;
      }
    } else if (y2 <= y && ((x2 - x1) * (y - y1)) - ((x - x1) * (y2 - y1)) < 0) {
      wn--;
    }
    x1 = x2;
    y1 = y2;
  }
  return wn !== 0;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {boolean} Contains (x, y).
 */
function linearRingsContainsXY(flatCoordinates, offset, ends, stride, x, y) {
  if (ends.length === 0) {
    return false;
  }
  if (!linearRingContainsXY(flatCoordinates, offset, ends[0], stride, x, y)) {
    return false;
  }
  for (var i = 1, ii = ends.length; i < ii; ++i) {
    if (linearRingContainsXY(flatCoordinates, ends[i - 1], ends[i], stride, x, y)) {
      return false;
    }
  }
  return true;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {boolean} Contains (x, y).
 */
function linearRingssContainsXY(flatCoordinates, offset, endss, stride, x, y) {
  if (endss.length === 0) {
    return false;
  }
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    if (linearRingsContainsXY(flatCoordinates, offset, ends, stride, x, y)) {
      return true;
    }
    offset = ends[ends.length - 1];
  }
  return false;
}

//# sourceMappingURL=contains.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/deflate.js":
/*!******************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/deflate.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "deflateCoordinate": () => (/* binding */ deflateCoordinate),
/* harmony export */   "deflateCoordinates": () => (/* binding */ deflateCoordinates),
/* harmony export */   "deflateCoordinatesArray": () => (/* binding */ deflateCoordinatesArray),
/* harmony export */   "deflateMultiCoordinatesArray": () => (/* binding */ deflateMultiCoordinatesArray)
/* harmony export */ });
/**
 * @module ol/geom/flat/deflate
 */


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
 * @param {number} stride Stride.
 * @return {number} offset Offset.
 */
function deflateCoordinate(flatCoordinates, offset, coordinate, stride) {
  for (var i = 0, ii = coordinate.length; i < ii; ++i) {
    flatCoordinates[offset++] = coordinate[i];
  }
  return offset;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<import("../../coordinate.js").Coordinate>} coordinates Coordinates.
 * @param {number} stride Stride.
 * @return {number} offset Offset.
 */
function deflateCoordinates(flatCoordinates, offset, coordinates, stride) {
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
    var coordinate = coordinates[i];
    for (var j = 0; j < stride; ++j) {
      flatCoordinates[offset++] = coordinate[j];
    }
  }
  return offset;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<import("../../coordinate.js").Coordinate>>} coordinatess Coordinatess.
 * @param {number} stride Stride.
 * @param {Array<number>=} opt_ends Ends.
 * @return {Array<number>} Ends.
 */
function deflateCoordinatesArray(flatCoordinates, offset, coordinatess, stride, opt_ends) {
  var ends = opt_ends ? opt_ends : [];
  var i = 0;
  for (var j = 0, jj = coordinatess.length; j < jj; ++j) {
    var end = deflateCoordinates(
      flatCoordinates, offset, coordinatess[j], stride);
    ends[i++] = end;
    offset = end;
  }
  ends.length = i;
  return ends;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<Array<import("../../coordinate.js").Coordinate>>>} coordinatesss Coordinatesss.
 * @param {number} stride Stride.
 * @param {Array<Array<number>>=} opt_endss Endss.
 * @return {Array<Array<number>>} Endss.
 */
function deflateMultiCoordinatesArray(flatCoordinates, offset, coordinatesss, stride, opt_endss) {
  var endss = opt_endss ? opt_endss : [];
  var i = 0;
  for (var j = 0, jj = coordinatesss.length; j < jj; ++j) {
    var ends = deflateCoordinatesArray(
      flatCoordinates, offset, coordinatesss[j], stride, endss[i]);
    endss[i++] = ends;
    offset = ends[ends.length - 1];
  }
  endss.length = i;
  return endss;
}

//# sourceMappingURL=deflate.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/inflate.js":
/*!******************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/inflate.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "inflateCoordinates": () => (/* binding */ inflateCoordinates),
/* harmony export */   "inflateCoordinatesArray": () => (/* binding */ inflateCoordinatesArray),
/* harmony export */   "inflateMultiCoordinatesArray": () => (/* binding */ inflateMultiCoordinatesArray)
/* harmony export */ });
/**
 * @module ol/geom/flat/inflate
 */


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Array<import("../../coordinate.js").Coordinate>=} opt_coordinates Coordinates.
 * @return {Array<import("../../coordinate.js").Coordinate>} Coordinates.
 */
function inflateCoordinates(flatCoordinates, offset, end, stride, opt_coordinates) {
  var coordinates = opt_coordinates !== undefined ? opt_coordinates : [];
  var i = 0;
  for (var j = offset; j < end; j += stride) {
    coordinates[i++] = flatCoordinates.slice(j, j + stride);
  }
  coordinates.length = i;
  return coordinates;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {Array<Array<import("../../coordinate.js").Coordinate>>=} opt_coordinatess Coordinatess.
 * @return {Array<Array<import("../../coordinate.js").Coordinate>>} Coordinatess.
 */
function inflateCoordinatesArray(flatCoordinates, offset, ends, stride, opt_coordinatess) {
  var coordinatess = opt_coordinatess !== undefined ? opt_coordinatess : [];
  var i = 0;
  for (var j = 0, jj = ends.length; j < jj; ++j) {
    var end = ends[j];
    coordinatess[i++] = inflateCoordinates(
      flatCoordinates, offset, end, stride, coordinatess[i]);
    offset = end;
  }
  coordinatess.length = i;
  return coordinatess;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {Array<Array<Array<import("../../coordinate.js").Coordinate>>>=} opt_coordinatesss
 *     Coordinatesss.
 * @return {Array<Array<Array<import("../../coordinate.js").Coordinate>>>} Coordinatesss.
 */
function inflateMultiCoordinatesArray(flatCoordinates, offset, endss, stride, opt_coordinatesss) {
  var coordinatesss = opt_coordinatesss !== undefined ? opt_coordinatesss : [];
  var i = 0;
  for (var j = 0, jj = endss.length; j < jj; ++j) {
    var ends = endss[j];
    coordinatesss[i++] = inflateCoordinatesArray(
      flatCoordinates, offset, ends, stride, coordinatesss[i]);
    offset = ends[ends.length - 1];
  }
  coordinatesss.length = i;
  return coordinatesss;
}

//# sourceMappingURL=inflate.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/interiorpoint.js":
/*!************************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/interiorpoint.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getInteriorPointOfArray": () => (/* binding */ getInteriorPointOfArray),
/* harmony export */   "getInteriorPointsOfMultiArray": () => (/* binding */ getInteriorPointsOfMultiArray)
/* harmony export */ });
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../array.js */ "./node_modules/@biigle/ol/array.js");
/* harmony import */ var _contains_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./contains.js */ "./node_modules/@biigle/ol/geom/flat/contains.js");
/**
 * @module ol/geom/flat/interiorpoint
 */




/**
 * Calculates a point that is likely to lie in the interior of the linear rings.
 * Inspired by JTS's com.vividsolutions.jts.geom.Geometry#getInteriorPoint.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {Array<number>} flatCenters Flat centers.
 * @param {number} flatCentersOffset Flat center offset.
 * @param {Array<number>=} opt_dest Destination.
 * @return {Array<number>} Destination point as XYM coordinate, where M is the
 * length of the horizontal intersection that the point belongs to.
 */
function getInteriorPointOfArray(flatCoordinates, offset,
  ends, stride, flatCenters, flatCentersOffset, opt_dest) {
  var i, ii, x, x1, x2, y1, y2;
  var y = flatCenters[flatCentersOffset + 1];
  /** @type {Array<number>} */
  var intersections = [];
  // Calculate intersections with the horizontal line
  for (var r = 0, rr = ends.length; r < rr; ++r) {
    var end = ends[r];
    x1 = flatCoordinates[end - stride];
    y1 = flatCoordinates[end - stride + 1];
    for (i = offset; i < end; i += stride) {
      x2 = flatCoordinates[i];
      y2 = flatCoordinates[i + 1];
      if ((y <= y1 && y2 <= y) || (y1 <= y && y <= y2)) {
        x = (y - y1) / (y2 - y1) * (x2 - x1) + x1;
        intersections.push(x);
      }
      x1 = x2;
      y1 = y2;
    }
  }
  // Find the longest segment of the horizontal line that has its center point
  // inside the linear ring.
  var pointX = NaN;
  var maxSegmentLength = -Infinity;
  intersections.sort(_array_js__WEBPACK_IMPORTED_MODULE_0__.numberSafeCompareFunction);
  x1 = intersections[0];
  for (i = 1, ii = intersections.length; i < ii; ++i) {
    x2 = intersections[i];
    var segmentLength = Math.abs(x2 - x1);
    if (segmentLength > maxSegmentLength) {
      x = (x1 + x2) / 2;
      if ((0,_contains_js__WEBPACK_IMPORTED_MODULE_1__.linearRingsContainsXY)(flatCoordinates, offset, ends, stride, x, y)) {
        pointX = x;
        maxSegmentLength = segmentLength;
      }
    }
    x1 = x2;
  }
  if (isNaN(pointX)) {
    // There is no horizontal line that has its center point inside the linear
    // ring.  Use the center of the the linear ring's extent.
    pointX = flatCenters[flatCentersOffset];
  }
  if (opt_dest) {
    opt_dest.push(pointX, y, maxSegmentLength);
    return opt_dest;
  } else {
    return [pointX, y, maxSegmentLength];
  }
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {Array<number>} flatCenters Flat centers.
 * @return {Array<number>} Interior points as XYM coordinates, where M is the
 * length of the horizontal intersection that the point belongs to.
 */
function getInteriorPointsOfMultiArray(flatCoordinates, offset, endss, stride, flatCenters) {
  var interiorPoints = [];
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    interiorPoints = getInteriorPointOfArray(flatCoordinates,
      offset, ends, stride, flatCenters, 2 * i, interiorPoints);
    offset = ends[ends.length - 1];
  }
  return interiorPoints;
}

//# sourceMappingURL=interiorpoint.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/interpolate.js":
/*!**********************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/interpolate.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "interpolatePoint": () => (/* binding */ interpolatePoint),
/* harmony export */   "lineStringCoordinateAtM": () => (/* binding */ lineStringCoordinateAtM),
/* harmony export */   "lineStringsCoordinateAtM": () => (/* binding */ lineStringsCoordinateAtM)
/* harmony export */ });
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../array.js */ "./node_modules/@biigle/ol/array.js");
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../math.js */ "./node_modules/@biigle/ol/math.js");
/**
 * @module ol/geom/flat/interpolate
 */




/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} fraction Fraction.
 * @param {Array<number>=} opt_dest Destination.
 * @return {Array<number>} Destination.
 */
function interpolatePoint(flatCoordinates, offset, end, stride, fraction, opt_dest) {
  var pointX = NaN;
  var pointY = NaN;
  var n = (end - offset) / stride;
  if (n === 1) {
    pointX = flatCoordinates[offset];
    pointY = flatCoordinates[offset + 1];
  } else if (n == 2) {
    pointX = (1 - fraction) * flatCoordinates[offset] +
        fraction * flatCoordinates[offset + stride];
    pointY = (1 - fraction) * flatCoordinates[offset + 1] +
        fraction * flatCoordinates[offset + stride + 1];
  } else if (n !== 0) {
    var x1 = flatCoordinates[offset];
    var y1 = flatCoordinates[offset + 1];
    var length = 0;
    var cumulativeLengths = [0];
    for (var i = offset + stride; i < end; i += stride) {
      var x2 = flatCoordinates[i];
      var y2 = flatCoordinates[i + 1];
      length += Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      cumulativeLengths.push(length);
      x1 = x2;
      y1 = y2;
    }
    var target = fraction * length;
    var index = (0,_array_js__WEBPACK_IMPORTED_MODULE_0__.binarySearch)(cumulativeLengths, target);
    if (index < 0) {
      var t = (target - cumulativeLengths[-index - 2]) /
          (cumulativeLengths[-index - 1] - cumulativeLengths[-index - 2]);
      var o = offset + (-index - 2) * stride;
      pointX = (0,_math_js__WEBPACK_IMPORTED_MODULE_1__.lerp)(
        flatCoordinates[o], flatCoordinates[o + stride], t);
      pointY = (0,_math_js__WEBPACK_IMPORTED_MODULE_1__.lerp)(
        flatCoordinates[o + 1], flatCoordinates[o + stride + 1], t);
    } else {
      pointX = flatCoordinates[offset + index * stride];
      pointY = flatCoordinates[offset + index * stride + 1];
    }
  }
  if (opt_dest) {
    opt_dest[0] = pointX;
    opt_dest[1] = pointY;
    return opt_dest;
  } else {
    return [pointX, pointY];
  }
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} m M.
 * @param {boolean} extrapolate Extrapolate.
 * @return {import("../../coordinate.js").Coordinate} Coordinate.
 */
function lineStringCoordinateAtM(flatCoordinates, offset, end, stride, m, extrapolate) {
  if (end == offset) {
    return null;
  }
  var coordinate;
  if (m < flatCoordinates[offset + stride - 1]) {
    if (extrapolate) {
      coordinate = flatCoordinates.slice(offset, offset + stride);
      coordinate[stride - 1] = m;
      return coordinate;
    } else {
      return null;
    }
  } else if (flatCoordinates[end - 1] < m) {
    if (extrapolate) {
      coordinate = flatCoordinates.slice(end - stride, end);
      coordinate[stride - 1] = m;
      return coordinate;
    } else {
      return null;
    }
  }
  // FIXME use O(1) search
  if (m == flatCoordinates[offset + stride - 1]) {
    return flatCoordinates.slice(offset, offset + stride);
  }
  var lo = offset / stride;
  var hi = end / stride;
  while (lo < hi) {
    var mid = (lo + hi) >> 1;
    if (m < flatCoordinates[(mid + 1) * stride - 1]) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  var m0 = flatCoordinates[lo * stride - 1];
  if (m == m0) {
    return flatCoordinates.slice((lo - 1) * stride, (lo - 1) * stride + stride);
  }
  var m1 = flatCoordinates[(lo + 1) * stride - 1];
  var t = (m - m0) / (m1 - m0);
  coordinate = [];
  for (var i = 0; i < stride - 1; ++i) {
    coordinate.push((0,_math_js__WEBPACK_IMPORTED_MODULE_1__.lerp)(flatCoordinates[(lo - 1) * stride + i],
      flatCoordinates[lo * stride + i], t));
  }
  coordinate.push(m);
  return coordinate;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} m M.
 * @param {boolean} extrapolate Extrapolate.
 * @param {boolean} interpolate Interpolate.
 * @return {import("../../coordinate.js").Coordinate} Coordinate.
 */
function lineStringsCoordinateAtM(
  flatCoordinates, offset, ends, stride, m, extrapolate, interpolate) {
  if (interpolate) {
    return lineStringCoordinateAtM(
      flatCoordinates, offset, ends[ends.length - 1], stride, m, extrapolate);
  }
  var coordinate;
  if (m < flatCoordinates[stride - 1]) {
    if (extrapolate) {
      coordinate = flatCoordinates.slice(0, stride);
      coordinate[stride - 1] = m;
      return coordinate;
    } else {
      return null;
    }
  }
  if (flatCoordinates[flatCoordinates.length - 1] < m) {
    if (extrapolate) {
      coordinate = flatCoordinates.slice(flatCoordinates.length - stride);
      coordinate[stride - 1] = m;
      return coordinate;
    } else {
      return null;
    }
  }
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    if (offset == end) {
      continue;
    }
    if (m < flatCoordinates[offset + stride - 1]) {
      return null;
    } else if (m <= flatCoordinates[end - 1]) {
      return lineStringCoordinateAtM(
        flatCoordinates, offset, end, stride, m, false);
    }
    offset = end;
  }
  return null;
}

//# sourceMappingURL=interpolate.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/intersectsextent.js":
/*!***************************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/intersectsextent.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "intersectsLineString": () => (/* binding */ intersectsLineString),
/* harmony export */   "intersectsLineStringArray": () => (/* binding */ intersectsLineStringArray),
/* harmony export */   "intersectsLinearRing": () => (/* binding */ intersectsLinearRing),
/* harmony export */   "intersectsLinearRingArray": () => (/* binding */ intersectsLinearRingArray),
/* harmony export */   "intersectsLinearRingMultiArray": () => (/* binding */ intersectsLinearRingMultiArray)
/* harmony export */ });
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _contains_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./contains.js */ "./node_modules/@biigle/ol/geom/flat/contains.js");
/* harmony import */ var _segments_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./segments.js */ "./node_modules/@biigle/ol/geom/flat/segments.js");
/**
 * @module ol/geom/flat/intersectsextent
 */





/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
function intersectsLineString(flatCoordinates, offset, end, stride, extent) {
  var coordinatesExtent = (0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.extendFlatCoordinates)(
    (0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.createEmpty)(), flatCoordinates, offset, end, stride);
  if (!(0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.intersects)(extent, coordinatesExtent)) {
    return false;
  }
  if ((0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.containsExtent)(extent, coordinatesExtent)) {
    return true;
  }
  if (coordinatesExtent[0] >= extent[0] &&
      coordinatesExtent[2] <= extent[2]) {
    return true;
  }
  if (coordinatesExtent[1] >= extent[1] &&
      coordinatesExtent[3] <= extent[3]) {
    return true;
  }
  return (0,_segments_js__WEBPACK_IMPORTED_MODULE_1__.forEach)(flatCoordinates, offset, end, stride,
    /**
     * @param {import("../../coordinate.js").Coordinate} point1 Start point.
     * @param {import("../../coordinate.js").Coordinate} point2 End point.
     * @return {boolean} `true` if the segment and the extent intersect,
     *     `false` otherwise.
     */
    function(point1, point2) {
      return (0,_extent_js__WEBPACK_IMPORTED_MODULE_0__.intersectsSegment)(extent, point1, point2);
    });
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
function intersectsLineStringArray(flatCoordinates, offset, ends, stride, extent) {
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    if (intersectsLineString(
      flatCoordinates, offset, ends[i], stride, extent)) {
      return true;
    }
    offset = ends[i];
  }
  return false;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
function intersectsLinearRing(flatCoordinates, offset, end, stride, extent) {
  if (intersectsLineString(
    flatCoordinates, offset, end, stride, extent)) {
    return true;
  }
  if ((0,_contains_js__WEBPACK_IMPORTED_MODULE_2__.linearRingContainsXY)(flatCoordinates, offset, end, stride, extent[0], extent[1])) {
    return true;
  }
  if ((0,_contains_js__WEBPACK_IMPORTED_MODULE_2__.linearRingContainsXY)(flatCoordinates, offset, end, stride, extent[0], extent[3])) {
    return true;
  }
  if ((0,_contains_js__WEBPACK_IMPORTED_MODULE_2__.linearRingContainsXY)(flatCoordinates, offset, end, stride, extent[2], extent[1])) {
    return true;
  }
  if ((0,_contains_js__WEBPACK_IMPORTED_MODULE_2__.linearRingContainsXY)(flatCoordinates, offset, end, stride, extent[2], extent[3])) {
    return true;
  }
  return false;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
function intersectsLinearRingArray(flatCoordinates, offset, ends, stride, extent) {
  if (!intersectsLinearRing(
    flatCoordinates, offset, ends[0], stride, extent)) {
    return false;
  }
  if (ends.length === 1) {
    return true;
  }
  for (var i = 1, ii = ends.length; i < ii; ++i) {
    if ((0,_contains_js__WEBPACK_IMPORTED_MODULE_2__.linearRingContainsExtent)(flatCoordinates, ends[i - 1], ends[i], stride, extent)) {
      if (!intersectsLineString(flatCoordinates, ends[i - 1], ends[i], stride, extent)) {
        return false;
      }
    }
  }
  return true;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
function intersectsLinearRingMultiArray(flatCoordinates, offset, endss, stride, extent) {
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    if (intersectsLinearRingArray(
      flatCoordinates, offset, ends, stride, extent)) {
      return true;
    }
    offset = ends[ends.length - 1];
  }
  return false;
}

//# sourceMappingURL=intersectsextent.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/length.js":
/*!*****************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/length.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "lineStringLength": () => (/* binding */ lineStringLength),
/* harmony export */   "linearRingLength": () => (/* binding */ linearRingLength)
/* harmony export */ });
/**
 * @module ol/geom/flat/length
 */


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {number} Length.
 */
function lineStringLength(flatCoordinates, offset, end, stride) {
  var x1 = flatCoordinates[offset];
  var y1 = flatCoordinates[offset + 1];
  var length = 0;
  for (var i = offset + stride; i < end; i += stride) {
    var x2 = flatCoordinates[i];
    var y2 = flatCoordinates[i + 1];
    length += Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    x1 = x2;
    y1 = y2;
  }
  return length;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {number} Perimeter.
 */
function linearRingLength(flatCoordinates, offset, end, stride) {
  var perimeter = lineStringLength(flatCoordinates, offset, end, stride);
  var dx = flatCoordinates[end - stride] - flatCoordinates[offset];
  var dy = flatCoordinates[end - stride + 1] - flatCoordinates[offset + 1];
  perimeter += Math.sqrt(dx * dx + dy * dy);
  return perimeter;
}

//# sourceMappingURL=length.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/orient.js":
/*!*****************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/orient.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "linearRingIsClockwise": () => (/* binding */ linearRingIsClockwise),
/* harmony export */   "linearRingIsOriented": () => (/* binding */ linearRingIsOriented),
/* harmony export */   "linearRingsAreOriented": () => (/* binding */ linearRingsAreOriented),
/* harmony export */   "orientLinearRings": () => (/* binding */ orientLinearRings),
/* harmony export */   "orientLinearRingsArray": () => (/* binding */ orientLinearRingsArray)
/* harmony export */ });
/* harmony import */ var _reverse_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reverse.js */ "./node_modules/@biigle/ol/geom/flat/reverse.js");
/**
 * @module ol/geom/flat/orient
 */



/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {boolean} Is clockwise.
 */
function linearRingIsClockwise(flatCoordinates, offset, end, stride) {
  // http://tinyurl.com/clockwise-method
  // https://github.com/OSGeo/gdal/blob/trunk/gdal/ogr/ogrlinearring.cpp
  var edge = 0;
  var x1 = flatCoordinates[end - stride];
  var y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    var x2 = flatCoordinates[offset];
    var y2 = flatCoordinates[offset + 1];
    edge += (x2 - x1) * (y2 + y1);
    x1 = x2;
    y1 = y2;
  }
  return edge > 0;
}


/**
 * Determines if linear rings are oriented.  By default, left-hand orientation
 * is tested (first ring must be clockwise, remaining rings counter-clockwise).
 * To test for right-hand orientation, use the `opt_right` argument.
 *
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Array of end indexes.
 * @param {number} stride Stride.
 * @param {boolean=} opt_right Test for right-hand orientation
 *     (counter-clockwise exterior ring and clockwise interior rings).
 * @return {boolean} Rings are correctly oriented.
 */
function linearRingIsOriented(flatCoordinates, offset, ends, stride, opt_right) {
  var right = opt_right !== undefined ? opt_right : false;
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var isClockwise = linearRingIsClockwise(
      flatCoordinates, offset, end, stride);
    if (i === 0) {
      if ((right && isClockwise) || (!right && !isClockwise)) {
        return false;
      }
    } else {
      if ((right && !isClockwise) || (!right && isClockwise)) {
        return false;
      }
    }
    offset = end;
  }
  return true;
}


/**
 * Determines if linear rings are oriented.  By default, left-hand orientation
 * is tested (first ring must be clockwise, remaining rings counter-clockwise).
 * To test for right-hand orientation, use the `opt_right` argument.
 *
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Array of array of end indexes.
 * @param {number} stride Stride.
 * @param {boolean=} opt_right Test for right-hand orientation
 *     (counter-clockwise exterior ring and clockwise interior rings).
 * @return {boolean} Rings are correctly oriented.
 */
function linearRingsAreOriented(flatCoordinates, offset, endss, stride, opt_right) {
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    if (!linearRingIsOriented(
      flatCoordinates, offset, endss[i], stride, opt_right)) {
      return false;
    }
  }
  return true;
}


/**
 * Orient coordinates in a flat array of linear rings.  By default, rings
 * are oriented following the left-hand rule (clockwise for exterior and
 * counter-clockwise for interior rings).  To orient according to the
 * right-hand rule, use the `opt_right` argument.
 *
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {boolean=} opt_right Follow the right-hand rule for orientation.
 * @return {number} End.
 */
function orientLinearRings(flatCoordinates, offset, ends, stride, opt_right) {
  var right = opt_right !== undefined ? opt_right : false;
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var isClockwise = linearRingIsClockwise(
      flatCoordinates, offset, end, stride);
    var reverse = i === 0 ?
      (right && isClockwise) || (!right && !isClockwise) :
      (right && !isClockwise) || (!right && isClockwise);
    if (reverse) {
      (0,_reverse_js__WEBPACK_IMPORTED_MODULE_0__.coordinates)(flatCoordinates, offset, end, stride);
    }
    offset = end;
  }
  return offset;
}


/**
 * Orient coordinates in a flat array of linear rings.  By default, rings
 * are oriented following the left-hand rule (clockwise for exterior and
 * counter-clockwise for interior rings).  To orient according to the
 * right-hand rule, use the `opt_right` argument.
 *
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Array of array of end indexes.
 * @param {number} stride Stride.
 * @param {boolean=} opt_right Follow the right-hand rule for orientation.
 * @return {number} End.
 */
function orientLinearRingsArray(flatCoordinates, offset, endss, stride, opt_right) {
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    offset = orientLinearRings(
      flatCoordinates, offset, endss[i], stride, opt_right);
  }
  return offset;
}

//# sourceMappingURL=orient.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/reverse.js":
/*!******************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/reverse.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "coordinates": () => (/* binding */ coordinates)
/* harmony export */ });
/**
 * @module ol/geom/flat/reverse
 */


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 */
function coordinates(flatCoordinates, offset, end, stride) {
  while (offset < end - stride) {
    for (var i = 0; i < stride; ++i) {
      var tmp = flatCoordinates[offset + i];
      flatCoordinates[offset + i] = flatCoordinates[end - stride + i];
      flatCoordinates[end - stride + i] = tmp;
    }
    offset += stride;
    end -= stride;
  }
}

//# sourceMappingURL=reverse.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/segments.js":
/*!*******************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/segments.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "forEach": () => (/* binding */ forEach)
/* harmony export */ });
/**
 * @module ol/geom/flat/segments
 */


/**
 * This function calls `callback` for each segment of the flat coordinates
 * array. If the callback returns a truthy value the function returns that
 * value immediately. Otherwise the function returns `false`.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {function(this: S, import("../../coordinate.js").Coordinate, import("../../coordinate.js").Coordinate): T} callback Function
 *     called for each segment.
 * @param {S=} opt_this The object to be used as the value of 'this'
 *     within callback.
 * @return {T|boolean} Value.
 * @template T,S
 */
function forEach(flatCoordinates, offset, end, stride, callback, opt_this) {
  var point1 = [flatCoordinates[offset], flatCoordinates[offset + 1]];
  var point2 = [];
  var ret;
  for (; (offset + stride) < end; offset += stride) {
    point2[0] = flatCoordinates[offset + stride];
    point2[1] = flatCoordinates[offset + stride + 1];
    ret = callback.call(opt_this, point1, point2);
    if (ret) {
      return ret;
    }
    point1[0] = point2[0];
    point1[1] = point2[1];
  }
  return false;
}

//# sourceMappingURL=segments.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/simplify.js":
/*!*******************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/simplify.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "simplifyLineString": () => (/* binding */ simplifyLineString),
/* harmony export */   "douglasPeucker": () => (/* binding */ douglasPeucker),
/* harmony export */   "douglasPeuckerArray": () => (/* binding */ douglasPeuckerArray),
/* harmony export */   "douglasPeuckerMultiArray": () => (/* binding */ douglasPeuckerMultiArray),
/* harmony export */   "radialDistance": () => (/* binding */ radialDistance),
/* harmony export */   "snap": () => (/* binding */ snap),
/* harmony export */   "quantize": () => (/* binding */ quantize),
/* harmony export */   "quantizeArray": () => (/* binding */ quantizeArray),
/* harmony export */   "quantizeMultiArray": () => (/* binding */ quantizeMultiArray),
/* harmony export */   "reducePrecision": () => (/* binding */ reducePrecision)
/* harmony export */ });
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../math.js */ "./node_modules/@biigle/ol/math.js");
/**
 * @module ol/geom/flat/simplify
 */
// Based on simplify-js https://github.com/mourner/simplify-js
// Copyright (c) 2012, Vladimir Agafonkin
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//
//    2. Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.




/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {boolean} highQuality Highest quality.
 * @param {Array<number>=} opt_simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @return {Array<number>} Simplified line string.
 */
function simplifyLineString(flatCoordinates, offset, end,
  stride, squaredTolerance, highQuality, opt_simplifiedFlatCoordinates) {
  var simplifiedFlatCoordinates = opt_simplifiedFlatCoordinates !== undefined ?
    opt_simplifiedFlatCoordinates : [];
  if (!highQuality) {
    end = radialDistance(flatCoordinates, offset, end,
      stride, squaredTolerance,
      simplifiedFlatCoordinates, 0);
    flatCoordinates = simplifiedFlatCoordinates;
    offset = 0;
    stride = 2;
  }
  simplifiedFlatCoordinates.length = douglasPeucker(
    flatCoordinates, offset, end, stride, squaredTolerance,
    simplifiedFlatCoordinates, 0);
  return simplifiedFlatCoordinates;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @return {number} Simplified offset.
 */
function douglasPeucker(flatCoordinates, offset, end,
  stride, squaredTolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  var n = (end - offset) / stride;
  if (n < 3) {
    for (; offset < end; offset += stride) {
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset];
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset + 1];
    }
    return simplifiedOffset;
  }
  /** @type {Array<number>} */
  var markers = new Array(n);
  markers[0] = 1;
  markers[n - 1] = 1;
  /** @type {Array<number>} */
  var stack = [offset, end - stride];
  var index = 0;
  while (stack.length > 0) {
    var last = stack.pop();
    var first = stack.pop();
    var maxSquaredDistance = 0;
    var x1 = flatCoordinates[first];
    var y1 = flatCoordinates[first + 1];
    var x2 = flatCoordinates[last];
    var y2 = flatCoordinates[last + 1];
    for (var i = first + stride; i < last; i += stride) {
      var x = flatCoordinates[i];
      var y = flatCoordinates[i + 1];
      var squaredDistance = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.squaredSegmentDistance)(
        x, y, x1, y1, x2, y2);
      if (squaredDistance > maxSquaredDistance) {
        index = i;
        maxSquaredDistance = squaredDistance;
      }
    }
    if (maxSquaredDistance > squaredTolerance) {
      markers[(index - offset) / stride] = 1;
      if (first + stride < index) {
        stack.push(first, index);
      }
      if (index + stride < last) {
        stack.push(index, last);
      }
    }
  }
  for (var i$1 = 0; i$1 < n; ++i$1) {
    if (markers[i$1]) {
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset + i$1 * stride];
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset + i$1 * stride + 1];
    }
  }
  return simplifiedOffset;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array<number>} simplifiedEnds Simplified ends.
 * @return {number} Simplified offset.
 */
function douglasPeuckerArray(flatCoordinates, offset,
  ends, stride, squaredTolerance, simplifiedFlatCoordinates,
  simplifiedOffset, simplifiedEnds) {
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    simplifiedOffset = douglasPeucker(
      flatCoordinates, offset, end, stride, squaredTolerance,
      simplifiedFlatCoordinates, simplifiedOffset);
    simplifiedEnds.push(simplifiedOffset);
    offset = end;
  }
  return simplifiedOffset;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array<Array<number>>} simplifiedEndss Simplified endss.
 * @return {number} Simplified offset.
 */
function douglasPeuckerMultiArray(
  flatCoordinates, offset, endss, stride, squaredTolerance,
  simplifiedFlatCoordinates, simplifiedOffset, simplifiedEndss) {
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    var simplifiedEnds = [];
    simplifiedOffset = douglasPeuckerArray(
      flatCoordinates, offset, ends, stride, squaredTolerance,
      simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds);
    simplifiedEndss.push(simplifiedEnds);
    offset = ends[ends.length - 1];
  }
  return simplifiedOffset;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @return {number} Simplified offset.
 */
function radialDistance(flatCoordinates, offset, end,
  stride, squaredTolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  if (end <= offset + stride) {
    // zero or one point, no simplification possible, so copy and return
    for (; offset < end; offset += stride) {
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset];
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset + 1];
    }
    return simplifiedOffset;
  }
  var x1 = flatCoordinates[offset];
  var y1 = flatCoordinates[offset + 1];
  // copy first point
  simplifiedFlatCoordinates[simplifiedOffset++] = x1;
  simplifiedFlatCoordinates[simplifiedOffset++] = y1;
  var x2 = x1;
  var y2 = y1;
  for (offset += stride; offset < end; offset += stride) {
    x2 = flatCoordinates[offset];
    y2 = flatCoordinates[offset + 1];
    if ((0,_math_js__WEBPACK_IMPORTED_MODULE_0__.squaredDistance)(x1, y1, x2, y2) > squaredTolerance) {
      // copy point at offset
      simplifiedFlatCoordinates[simplifiedOffset++] = x2;
      simplifiedFlatCoordinates[simplifiedOffset++] = y2;
      x1 = x2;
      y1 = y2;
    }
  }
  if (x2 != x1 || y2 != y1) {
    // copy last point
    simplifiedFlatCoordinates[simplifiedOffset++] = x2;
    simplifiedFlatCoordinates[simplifiedOffset++] = y2;
  }
  return simplifiedOffset;
}


/**
 * @param {number} value Value.
 * @param {number} tolerance Tolerance.
 * @return {number} Rounded value.
 */
function snap(value, tolerance) {
  return tolerance * Math.round(value / tolerance);
}


/**
 * Simplifies a line string using an algorithm designed by Tim Schaub.
 * Coordinates are snapped to the nearest value in a virtual grid and
 * consecutive duplicate coordinates are discarded.  This effectively preserves
 * topology as the simplification of any subsection of a line string is
 * independent of the rest of the line string.  This means that, for examples,
 * the common edge between two polygons will be simplified to the same line
 * string independently in both polygons.  This implementation uses a single
 * pass over the coordinates and eliminates intermediate collinear points.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} tolerance Tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @return {number} Simplified offset.
 */
function quantize(flatCoordinates, offset, end, stride,
  tolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  // do nothing if the line is empty
  if (offset == end) {
    return simplifiedOffset;
  }
  // snap the first coordinate (P1)
  var x1 = snap(flatCoordinates[offset], tolerance);
  var y1 = snap(flatCoordinates[offset + 1], tolerance);
  offset += stride;
  // add the first coordinate to the output
  simplifiedFlatCoordinates[simplifiedOffset++] = x1;
  simplifiedFlatCoordinates[simplifiedOffset++] = y1;
  // find the next coordinate that does not snap to the same value as the first
  // coordinate (P2)
  var x2, y2;
  do {
    x2 = snap(flatCoordinates[offset], tolerance);
    y2 = snap(flatCoordinates[offset + 1], tolerance);
    offset += stride;
    if (offset == end) {
      // all coordinates snap to the same value, the line collapses to a point
      // push the last snapped value anyway to ensure that the output contains
      // at least two points
      // FIXME should we really return at least two points anyway?
      simplifiedFlatCoordinates[simplifiedOffset++] = x2;
      simplifiedFlatCoordinates[simplifiedOffset++] = y2;
      return simplifiedOffset;
    }
  } while (x2 == x1 && y2 == y1);
  while (offset < end) {
    // snap the next coordinate (P3)
    var x3 = snap(flatCoordinates[offset], tolerance);
    var y3 = snap(flatCoordinates[offset + 1], tolerance);
    offset += stride;
    // skip P3 if it is equal to P2
    if (x3 == x2 && y3 == y2) {
      continue;
    }
    // calculate the delta between P1 and P2
    var dx1 = x2 - x1;
    var dy1 = y2 - y1;
    // calculate the delta between P3 and P1
    var dx2 = x3 - x1;
    var dy2 = y3 - y1;
    // if P1, P2, and P3 are colinear and P3 is further from P1 than P2 is from
    // P1 in the same direction then P2 is on the straight line between P1 and
    // P3
    if ((dx1 * dy2 == dy1 * dx2) &&
        ((dx1 < 0 && dx2 < dx1) || dx1 == dx2 || (dx1 > 0 && dx2 > dx1)) &&
        ((dy1 < 0 && dy2 < dy1) || dy1 == dy2 || (dy1 > 0 && dy2 > dy1))) {
      // discard P2 and set P2 = P3
      x2 = x3;
      y2 = y3;
      continue;
    }
    // either P1, P2, and P3 are not colinear, or they are colinear but P3 is
    // between P3 and P1 or on the opposite half of the line to P2.  add P2,
    // and continue with P1 = P2 and P2 = P3
    simplifiedFlatCoordinates[simplifiedOffset++] = x2;
    simplifiedFlatCoordinates[simplifiedOffset++] = y2;
    x1 = x2;
    y1 = y2;
    x2 = x3;
    y2 = y3;
  }
  // add the last point (P2)
  simplifiedFlatCoordinates[simplifiedOffset++] = x2;
  simplifiedFlatCoordinates[simplifiedOffset++] = y2;
  return simplifiedOffset;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} tolerance Tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array<number>} simplifiedEnds Simplified ends.
 * @return {number} Simplified offset.
 */
function quantizeArray(
  flatCoordinates, offset, ends, stride,
  tolerance,
  simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds) {
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    simplifiedOffset = quantize(
      flatCoordinates, offset, end, stride,
      tolerance,
      simplifiedFlatCoordinates, simplifiedOffset);
    simplifiedEnds.push(simplifiedOffset);
    offset = end;
  }
  return simplifiedOffset;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} tolerance Tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array<Array<number>>} simplifiedEndss Simplified endss.
 * @return {number} Simplified offset.
 */
function quantizeMultiArray(
  flatCoordinates, offset, endss, stride,
  tolerance,
  simplifiedFlatCoordinates, simplifiedOffset, simplifiedEndss) {
  for (var i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    var simplifiedEnds = [];
    simplifiedOffset = quantizeArray(
      flatCoordinates, offset, ends, stride,
      tolerance,
      simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds);
    simplifiedEndss.push(simplifiedEnds);
    offset = ends[ends.length - 1];
  }
  return simplifiedOffset;
}

/**
 * Reduce the coordinate precision with rounding.
 *
 * @param {Array} coordinates Polygon coordinates.
 *
 * @return {Array}
 */
function reducePrecision(coordinates, decimals) {
  decimals = decimals ? Math.pow(10, decimals) : 1000;

  return coordinates.map(function (ring) {
    return ring.map(function (coordinate) {
      return coordinate.map(function (value) {
        return Math.round(value * decimals) / decimals;
      });
    });
  });
}

//# sourceMappingURL=simplify.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/geom/flat/transform.js":
/*!********************************************************!*\
  !*** ./node_modules/@biigle/ol/geom/flat/transform.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "transform2D": () => (/* binding */ transform2D),
/* harmony export */   "rotate": () => (/* binding */ rotate),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "translate": () => (/* binding */ translate)
/* harmony export */ });
/**
 * @module ol/geom/flat/transform
 */


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {import("../../transform.js").Transform} transform Transform.
 * @param {Array<number>=} opt_dest Destination.
 * @return {Array<number>} Transformed coordinates.
 */
function transform2D(flatCoordinates, offset, end, stride, transform, opt_dest) {
  var dest = opt_dest ? opt_dest : [];
  var i = 0;
  for (var j = offset; j < end; j += stride) {
    var x = flatCoordinates[j];
    var y = flatCoordinates[j + 1];
    dest[i++] = transform[0] * x + transform[2] * y + transform[4];
    dest[i++] = transform[1] * x + transform[3] * y + transform[5];
  }
  if (opt_dest && dest.length != i) {
    dest.length = i;
  }
  return dest;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} angle Angle.
 * @param {Array<number>} anchor Rotation anchor point.
 * @param {Array<number>=} opt_dest Destination.
 * @return {Array<number>} Transformed coordinates.
 */
function rotate(flatCoordinates, offset, end, stride, angle, anchor, opt_dest) {
  var dest = opt_dest ? opt_dest : [];
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  var anchorX = anchor[0];
  var anchorY = anchor[1];
  var i = 0;
  for (var j = offset; j < end; j += stride) {
    var deltaX = flatCoordinates[j] - anchorX;
    var deltaY = flatCoordinates[j + 1] - anchorY;
    dest[i++] = anchorX + deltaX * cos - deltaY * sin;
    dest[i++] = anchorY + deltaX * sin + deltaY * cos;
    for (var k = j + 2; k < j + stride; ++k) {
      dest[i++] = flatCoordinates[k];
    }
  }
  if (opt_dest && dest.length != i) {
    dest.length = i;
  }
  return dest;
}


/**
 * Scale the coordinates.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} sx Scale factor in the x-direction.
 * @param {number} sy Scale factor in the y-direction.
 * @param {Array<number>} anchor Scale anchor point.
 * @param {Array<number>=} opt_dest Destination.
 * @return {Array<number>} Transformed coordinates.
 */
function scale(flatCoordinates, offset, end, stride, sx, sy, anchor, opt_dest) {
  var dest = opt_dest ? opt_dest : [];
  var anchorX = anchor[0];
  var anchorY = anchor[1];
  var i = 0;
  for (var j = offset; j < end; j += stride) {
    var deltaX = flatCoordinates[j] - anchorX;
    var deltaY = flatCoordinates[j + 1] - anchorY;
    dest[i++] = anchorX + sx * deltaX;
    dest[i++] = anchorY + sy * deltaY;
    for (var k = j + 2; k < j + stride; ++k) {
      dest[i++] = flatCoordinates[k];
    }
  }
  if (opt_dest && dest.length != i) {
    dest.length = i;
  }
  return dest;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} deltaX Delta X.
 * @param {number} deltaY Delta Y.
 * @param {Array<number>=} opt_dest Destination.
 * @return {Array<number>} Transformed coordinates.
 */
function translate(flatCoordinates, offset, end, stride, deltaX, deltaY, opt_dest) {
  var dest = opt_dest ? opt_dest : [];
  var i = 0;
  for (var j = offset; j < end; j += stride) {
    dest[i++] = flatCoordinates[j] + deltaX;
    dest[i++] = flatCoordinates[j + 1] + deltaY;
    for (var k = j + 2; k < j + stride; ++k) {
      dest[i++] = flatCoordinates[k];
    }
  }
  if (opt_dest && dest.length != i) {
    dest.length = i;
  }
  return dest;
}

//# sourceMappingURL=transform.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/has.js":
/*!****************************************!*\
  !*** ./node_modules/@biigle/ol/has.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FIREFOX": () => (/* binding */ FIREFOX),
/* harmony export */   "SAFARI": () => (/* binding */ SAFARI),
/* harmony export */   "WEBKIT": () => (/* binding */ WEBKIT),
/* harmony export */   "MAC": () => (/* binding */ MAC),
/* harmony export */   "DEVICE_PIXEL_RATIO": () => (/* binding */ DEVICE_PIXEL_RATIO),
/* harmony export */   "CANVAS_LINE_DASH": () => (/* binding */ CANVAS_LINE_DASH),
/* harmony export */   "GEOLOCATION": () => (/* binding */ GEOLOCATION),
/* harmony export */   "TOUCH": () => (/* binding */ TOUCH),
/* harmony export */   "POINTER": () => (/* binding */ POINTER),
/* harmony export */   "MSPOINTER": () => (/* binding */ MSPOINTER),
/* harmony export */   "WEBGL": () => (/* reexport safe */ _webgl_js__WEBPACK_IMPORTED_MODULE_0__.HAS)
/* harmony export */ });
/* harmony import */ var _webgl_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./webgl.js */ "./node_modules/@biigle/ol/webgl.js");
/**
 * @module ol/has
 */

var ua = typeof navigator !== 'undefined' ?
  navigator.userAgent.toLowerCase() : '';

/**
 * User agent string says we are dealing with Firefox as browser.
 * @type {boolean}
 */
var FIREFOX = ua.indexOf('firefox') !== -1;

/**
 * User agent string says we are dealing with Safari as browser.
 * @type {boolean}
 */
var SAFARI = ua.indexOf('safari') !== -1 && ua.indexOf('chrom') == -1;

/**
 * User agent string says we are dealing with a WebKit engine.
 * @type {boolean}
 */
var WEBKIT = ua.indexOf('webkit') !== -1 && ua.indexOf('edge') == -1;

/**
 * User agent string says we are dealing with a Mac as platform.
 * @type {boolean}
 */
var MAC = ua.indexOf('macintosh') !== -1;


/**
 * The ratio between physical pixels and device-independent pixels
 * (dips) on the device (`window.devicePixelRatio`).
 * @const
 * @type {number}
 * @api
 */
var DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1;


/**
 * True if the browser's Canvas implementation implements {get,set}LineDash.
 * @type {boolean}
 */
var CANVAS_LINE_DASH = function() {
  var has = false;
  try {
    has = !!document.createElement('canvas').getContext('2d').setLineDash;
  } catch (e) {
    // pass
  }
  return has;
}();


/**
 * Is HTML5 geolocation supported in the current browser?
 * @const
 * @type {boolean}
 * @api
 */
var GEOLOCATION = 'geolocation' in navigator;


/**
 * True if browser supports touch events.
 * @const
 * @type {boolean}
 * @api
 */
var TOUCH = 'ontouchstart' in window;


/**
 * True if browser supports pointer events.
 * @const
 * @type {boolean}
 */
var POINTER = 'PointerEvent' in window;


/**
 * True if browser supports ms pointer events (IE 10).
 * @const
 * @type {boolean}
 */
var MSPOINTER = !!(navigator.msPointerEnabled);




//# sourceMappingURL=has.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/interaction/Draw.js":
/*!*****************************************************!*\
  !*** ./node_modules/@biigle/ol/interaction/Draw.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DrawEventType": () => (/* binding */ DrawEventType),
/* harmony export */   "DrawEvent": () => (/* binding */ DrawEvent),
/* harmony export */   "createRegularPolygon": () => (/* binding */ createRegularPolygon),
/* harmony export */   "createBox": () => (/* binding */ createBox),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _events_EventType_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../events/EventType.js */ "./node_modules/@biigle/ol/events/EventType.js");
/* harmony import */ var _Feature_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ../Feature.js */ "./node_modules/@biigle/ol/Feature.js");
/* harmony import */ var _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../MapBrowserEventType.js */ "./node_modules/@biigle/ol/MapBrowserEventType.js");
/* harmony import */ var _MapBrowserPointerEvent_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../MapBrowserPointerEvent.js */ "./node_modules/@biigle/ol/MapBrowserPointerEvent.js");
/* harmony import */ var _Object_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../Object.js */ "./node_modules/@biigle/ol/Object.js");
/* harmony import */ var _coordinate_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../coordinate.js */ "./node_modules/@biigle/ol/coordinate.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../events.js */ "./node_modules/@biigle/ol/events.js");
/* harmony import */ var _events_Event_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/Event.js */ "./node_modules/@biigle/ol/events/Event.js");
/* harmony import */ var _events_condition_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../events/condition.js */ "./node_modules/@biigle/ol/events/condition.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _functions_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../functions.js */ "./node_modules/@biigle/ol/functions.js");
/* harmony import */ var _geom_Circle_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../geom/Circle.js */ "./node_modules/@biigle/ol/geom/Circle.js");
/* harmony import */ var _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../geom/GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _geom_LineString_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../geom/LineString.js */ "./node_modules/@biigle/ol/geom/LineString.js");
/* harmony import */ var _geom_MultiLineString_js__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ../geom/MultiLineString.js */ "./node_modules/@biigle/ol/geom/MultiLineString.js");
/* harmony import */ var _geom_MultiPoint_js__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ../geom/MultiPoint.js */ "./node_modules/@biigle/ol/geom/MultiPoint.js");
/* harmony import */ var _geom_MultiPolygon_js__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ../geom/MultiPolygon.js */ "./node_modules/@biigle/ol/geom/MultiPolygon.js");
/* harmony import */ var _pointer_MouseSource_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../pointer/MouseSource.js */ "./node_modules/@biigle/ol/pointer/MouseSource.js");
/* harmony import */ var _geom_Point_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../geom/Point.js */ "./node_modules/@biigle/ol/geom/Point.js");
/* harmony import */ var _geom_Polygon_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../geom/Polygon.js */ "./node_modules/@biigle/ol/geom/Polygon.js");
/* harmony import */ var _Pointer_js__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./Pointer.js */ "./node_modules/@biigle/ol/interaction/Pointer.js");
/* harmony import */ var _Property_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./Property.js */ "./node_modules/@biigle/ol/interaction/Property.js");
/* harmony import */ var _layer_Vector_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../layer/Vector.js */ "./node_modules/@biigle/ol/layer/Vector.js");
/* harmony import */ var _source_Vector_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../source/Vector.js */ "./node_modules/@biigle/ol/source/Vector.js");
/* harmony import */ var _style_Style_js__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ../style/Style.js */ "./node_modules/@biigle/ol/style/Style.js");
/* harmony import */ var _geom_Rectangle_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../geom/Rectangle.js */ "./node_modules/@biigle/ol/geom/Rectangle.js");
/* harmony import */ var _geom_Ellipse_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../geom/Ellipse.js */ "./node_modules/@biigle/ol/geom/Ellipse.js");
/**
 * @module ol/interaction/Draw
 */





























/**
 * @typedef {Object} Options
 * @property {GeometryType} type Geometry type of
 * the geometries being drawn with this instance.
 * @property {number} [clickTolerance=6] The maximum distance in pixels between
 * "down" and "up" for a "up" event to be considered a "click" event and
 * actually add a point/vertex to the geometry being drawn.  The default of `6`
 * was chosen for the draw interaction to behave correctly on mouse as well as
 * on touch devices.
 * @property {import("../Collection.js").default<Feature>} [features]
 * Destination collection for the drawn features.
 * @property {VectorSource} [source] Destination source for
 * the drawn features.
 * @property {number} [dragVertexDelay=500] Delay in milliseconds after pointerdown
 * before the current vertex can be dragged to its exact position.
 * @property {number} [snapTolerance=12] Pixel distance for snapping to the
 * drawing finish.
 * @property {boolean} [stopClick=false] Stop click, singleclick, and
 * doubleclick events from firing during drawing.
 * @property {number} [maxPoints] The number of points that can be drawn before
 * a polygon ring or line string is finished. By default there is no
 * restriction.
 * @property {number} [minPoints] The number of points that must be drawn
 * before a polygon ring or line string can be finished. Default is `3` for
 * polygon rings and `2` for line strings.
 * @property {import("../events/condition.js").Condition} [finishCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether the drawing can be finished.
 * @property {import("../style/Style.js").StyleLike} [style]
 * Style for sketch features.
 * @property {GeometryFunction} [geometryFunction]
 * Function that is called when a geometry's coordinates are updated.
 * @property {string} [geometryName] Geometry name to use for features created
 * by the draw interaction.
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * By default {@link module:ol/events/condition~noModifierKeys}, i.e. a click,
 * adds a vertex or deactivates freehand drawing.
 * @property {boolean} [freehand=false] Operate in freehand mode for lines,
 * polygons, and circles.  This makes the interaction always operate in freehand
 * mode and takes precedence over any `freehandCondition` option.
 * @property {import("../events/condition.js").Condition} [freehandCondition]
 * Condition that activates freehand drawing for lines and polygons. This
 * function takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and
 * returns a boolean to indicate whether that event should be handled. The
 * default is {@link module:ol/events/condition~shiftKeyOnly}, meaning that the
 * Shift key activates freehand drawing.
 * @property {boolean} [wrapX=false] Wrap the world horizontally on the sketch
 * overlay.
 */


/**
 * Coordinate type when drawing points.
 * @typedef {import("../coordinate.js").Coordinate} PointCoordType
 */


/**
 * Coordinate type when drawing lines.
 * @typedef {Array<import("../coordinate.js").Coordinate>} LineCoordType
 */


/**
 * Coordinate type when drawing polygons.
 * @typedef {Array<Array<import("../coordinate.js").Coordinate>>} PolyCoordType
 */


/**
 * Types used for drawing coordinates.
 * @typedef {PointCoordType|LineCoordType|PolyCoordType} SketchCoordType
 */


/**
 * Function that takes an array of coordinates and an optional existing geometry as
 * arguments, and returns a geometry. The optional existing geometry is the
 * geometry that is returned when the function is called without a second
 * argument.
 * @typedef {function(!SketchCoordType, import("../geom/SimpleGeometry.js").default=):
 *     import("../geom/SimpleGeometry.js").default} GeometryFunction
 */


/**
 * Draw mode.  This collapses multi-part geometry types with their single-part
 * cousins.
 * @enum {string}
 */
var Mode = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon',
  CIRCLE: 'Circle',
  ELLIPSE: 'Ellipse'
};


/**
 * @enum {string}
 */
var DrawEventType = {
  /**
   * Triggered upon feature draw start
   * @event DrawEvent#drawstart
   * @api
   */
  DRAWSTART: 'drawstart',
  /**
   * Triggered upon feature draw end
   * @event DrawEvent#drawend
   * @api
   */
  DRAWEND: 'drawend'
};


/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Draw~Draw} instances are
 * instances of this type.
 */
var DrawEvent = /*@__PURE__*/(function (Event) {
  function DrawEvent(type, feature) {

    Event.call(this, type);

    /**
     * The feature being drawn.
     * @type {Feature}
     * @api
     */
    this.feature = feature;

  }

  if ( Event ) DrawEvent.__proto__ = Event;
  DrawEvent.prototype = Object.create( Event && Event.prototype );
  DrawEvent.prototype.constructor = DrawEvent;

  return DrawEvent;
}(_events_Event_js__WEBPACK_IMPORTED_MODULE_0__["default"]));


/**
 * @classdesc
 * Interaction for drawing feature geometries.
 *
 * @fires DrawEvent
 * @api
 */
var Draw = /*@__PURE__*/(function (PointerInteraction) {
  function Draw(options) {

    var pointerOptions = /** @type {import("./Pointer.js").Options} */ (options);
    if (!pointerOptions.stopDown) {
      pointerOptions.stopDown = _functions_js__WEBPACK_IMPORTED_MODULE_1__.FALSE;
    }

    PointerInteraction.call(this, pointerOptions);

    /**
     * @type {boolean}
     * @private
     */
    this.shouldHandle_ = false;

    /**
     * @type {import("../pixel.js").Pixel}
     * @private
     */
    this.downPx_ = null;

    /**
     * @type {?}
     * @private
     */
    this.downTimeout_;

    /**
     * @type {number|undefined}
     * @private
     */
    this.lastDragTime_;

    /**
     * @type {boolean}
     * @private
     */
    this.freehand_ = false;

    /**
     * Target source for drawn features.
     * @type {VectorSource}
     * @private
     */
    this.source_ = options.source ? options.source : null;

    /**
     * Target collection for drawn features.
     * @type {import("../Collection.js").default<Feature>}
     * @private
     */
    this.features_ = options.features ? options.features : null;

    /**
     * Pixel distance for snapping.
     * @type {number}
     * @private
     */
    this.snapTolerance_ = options.snapTolerance ? options.snapTolerance : 12;

    /**
     * Geometry type.
     * @type {GeometryType}
     * @private
     */
    this.type_ = /** @type {GeometryType} */ (options.type);

    /**
     * Drawing mode (derived from geometry type.
     * @type {Mode}
     * @private
     */
    this.mode_ = getMode(this.type_);

    /**
     * Stop click, singleclick, and doubleclick events from firing during drawing.
     * Default is `false`.
     * @type {boolean}
     * @private
     */
    this.stopClick_ = !!options.stopClick;

    /**
     * The number of points that must be drawn before a polygon ring or line
     * string can be finished.  The default is 3 for polygon rings and 2 for
     * line strings.
     * @type {number}
     * @private
     */
    this.minPoints_ = options.minPoints ?
      options.minPoints :
      (this.mode_ === Mode.POLYGON ? 3 : 2);

    /**
     * The number of points that can be drawn before a polygon ring or line string
     * is finished. The default is no restriction.
     * @type {number}
     * @private
     */
    this.maxPoints_ = options.maxPoints ? options.maxPoints : Infinity;

    /**
     * A function to decide if a potential finish coordinate is permissible
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.finishCondition_ = options.finishCondition ? options.finishCondition : _functions_js__WEBPACK_IMPORTED_MODULE_1__.TRUE;

    var geometryFunction = options.geometryFunction;
    if (!geometryFunction) {
      if (this.type_ === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].CIRCLE) {
        /**
         * @param {!LineCoordType} coordinates The coordinates.
         * @param {import("../geom/SimpleGeometry.js").default=} opt_geometry Optional geometry.
         * @return {import("../geom/SimpleGeometry.js").default} A geometry.
         */
        geometryFunction = function(coordinates, opt_geometry) {
          var circle = opt_geometry ? /** @type {Circle} */ (opt_geometry) :
            new _geom_Circle_js__WEBPACK_IMPORTED_MODULE_3__["default"]([NaN, NaN]);
          var squaredLength = (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_4__.squaredDistance)(
            coordinates[0], coordinates[1]);
          circle.setCenterAndRadius(coordinates[0], Math.sqrt(squaredLength));
          return circle;
        };
      } else if (this.type_ === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].RECTANGLE) {
        this.minPoints_ = 3;
        this.maxPoints_ = 3;
        /**
         * @param {!LineCoordType} coordinates The coordinates.
         * @param {import("../geom/SimpleGeometry.js").default=} opt_geometry Optional geometry.
         * @return {import("../geom/SimpleGeometry.js").default} A geometry.
         */
        geometryFunction = function(coordinates, opt_geometry) {

          /*
           *   a_vec
           * -------->
           * +-------+
           * |       |
           * |       |
           * 1       2
           * |       |   | intersection_vec
           * |       |   v
           * +-------+------<3>-- (the third point may be anywhere on this line)
           */

          if (coordinates.length > 2) {
            var first = coordinates[0];
            var second = coordinates[1];
            var third = coordinates[2];

            // vector from first to second
            var a_vec = [second[0] - first[0], second[1] - first[1]];

            if (a_vec[1] === 0) {
                // catch the case where the first and second point are equal
                coordinates = [[first, first, first, first]];
            } else {
              // perpendicular vector to a_vec
              var b_vec = [-1 * a_vec[1], a_vec[0]];

              // helper
              var tmp = a_vec[0] / a_vec[1];
              // compute the intersection parameter of the two lines
              // going from second in b_vec direction
              // and from third in a_vec direction
              var x = (third[0] + tmp * (second[1] - third[1]) - second[0]) / (b_vec[0] - b_vec[1] * tmp);

              // vector from second to the intersection point
              var intersection_vec = [x * b_vec[0], x * b_vec[1]];

              coordinates = [[
                [first[0] - intersection_vec[0], first[1] - intersection_vec[1]],
                [second[0] - intersection_vec[0], second[1] - intersection_vec[1]],
                [second[0] + intersection_vec[0], second[1] + intersection_vec[1]],
                [first[0] + intersection_vec[0], first[1] + intersection_vec[1]]
              ]];
            }
          } else {
            coordinates = [coordinates];
          }

          var geometry = opt_geometry;
          if (geometry) {
            geometry.setCoordinates(coordinates);
          } else {
            geometry = new _geom_Rectangle_js__WEBPACK_IMPORTED_MODULE_5__["default"](coordinates);
          }

          return geometry;
        };
      } else if (this.type_ === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].ELLIPSE) {
        this.minPoints_ = 3;
        this.maxPoints_ = 3;
        /**
         * @param {!LineCoordType} coordinates The coordinates.
         * @param {import("../geom/SimpleGeometry.js").default=} opt_geometry Optional geometry.
         * @return {import("../geom/SimpleGeometry.js").default} A geometry.
         */
        geometryFunction = function(coordinates, opt_geometry) {

          /*
           * An ellipse is represented as a polygon in diamond shape.
           *       +
           *     /   \
           *    /     \
           *   /       \
           *  /  a_vec  \
           * 1-----•---->2
           *  \         /|
           *   \       / | intersection_vec
           *    \     /  |
           *     \   /   v
           * ------+-------<3>--- (the third point may be anywhere on this line)
           */

          if (coordinates.length > 2) {
            var first = coordinates[0];
            var second = coordinates[1];
            var third = coordinates[2];

            // vector from first to second
            var a_vec = [second[0] - first[0], second[1] - first[1]];
            // Center point.
            var center = [first[0] + a_vec[0] * 0.5, first[1] + a_vec[1] * 0.5];

            if (a_vec[1] === 0) {
                // catch the case where the first and second point are equal
                coordinates = [[first, first, first, first]];
            } else {
              // perpendicular vector to a_vec
              var b_vec = [-1 * a_vec[1], a_vec[0]];

              // helper
              var tmp = a_vec[0] / a_vec[1];
              // compute the intersection parameter of the two lines
              // going from second in b_vec direction
              // and from third in a_vec direction
              var x = (third[0] + tmp * (second[1] - third[1]) - second[0]) / (b_vec[0] - b_vec[1] * tmp);

              // vector from second to the intersection point
              var intersection_vec = [x * b_vec[0], x * b_vec[1]];

              coordinates = [[
                [first[0], first[1]],
                [center[0] - intersection_vec[0], center[1] - intersection_vec[1]],
                [second[0], second[1]],
                [center[0] + intersection_vec[0], center[1] + intersection_vec[1]]
              ]];
            }
          } else {
            coordinates = [coordinates];
          }

          var geometry = opt_geometry;
          if (geometry) {
            geometry.setCoordinates(coordinates);
          } else {
            geometry = new _geom_Ellipse_js__WEBPACK_IMPORTED_MODULE_6__["default"](coordinates);
          }

          return geometry;
        };
      } else {
        var Constructor;
        var mode = this.mode_;
        if (mode === Mode.POINT) {
          Constructor = _geom_Point_js__WEBPACK_IMPORTED_MODULE_7__["default"];
        } else if (mode === Mode.LINE_STRING) {
          Constructor = _geom_LineString_js__WEBPACK_IMPORTED_MODULE_8__["default"];
        } else if (mode === Mode.POLYGON) {
          Constructor = _geom_Polygon_js__WEBPACK_IMPORTED_MODULE_9__["default"];
        }
        /**
         * @param {!LineCoordType} coordinates The coordinates.
         * @param {import("../geom/SimpleGeometry.js").default=} opt_geometry Optional geometry.
         * @return {import("../geom/SimpleGeometry.js").default} A geometry.
         */
        geometryFunction = function(coordinates, opt_geometry) {
          var geometry = opt_geometry;
          if (geometry) {
            if (mode === Mode.POLYGON) {
              if (coordinates[0].length) {
                // Add a closing coordinate to match the first
                geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])]);
              } else {
                geometry.setCoordinates([]);
              }
            } else {
              geometry.setCoordinates(coordinates);
            }
          } else {
            geometry = new Constructor(coordinates);
          }
          return geometry;
        };
      }
    }

    /**
     * @type {GeometryFunction}
     * @private
     */
    this.geometryFunction_ = geometryFunction;

    /**
     * @type {number}
     * @private
     */
    this.dragVertexDelay_ = options.dragVertexDelay !== undefined ? options.dragVertexDelay : 500;

    /**
     * Finish coordinate for the feature (first point for polygons, last point for
     * linestrings).
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    this.finishCoordinate_ = null;

    /**
     * Sketch feature.
     * @type {Feature}
     * @private
     */
    this.sketchFeature_ = null;

    /**
     * Sketch point.
     * @type {Feature}
     * @private
     */
    this.sketchPoint_ = null;

    /**
     * Sketch coordinates. Used when drawing a line or polygon.
     * @type {SketchCoordType}
     * @private
     */
    this.sketchCoords_ = null;

    /**
     * Sketch line. Used when drawing polygon.
     * @type {Feature}
     * @private
     */
    this.sketchLine_ = null;

    /**
     * Sketch line coordinates. Used when drawing a polygon or circle.
     * @type {LineCoordType}
     * @private
     */
    this.sketchLineCoords_ = null;

    /**
     * Squared tolerance for handling up events.  If the squared distance
     * between a down and up event is greater than this tolerance, up events
     * will not be handled.
     * @type {number}
     * @private
     */
    this.squaredClickTolerance_ = options.clickTolerance ?
      options.clickTolerance * options.clickTolerance : 36;

    /**
     * Draw overlay where our sketch features are drawn.
     * @type {VectorLayer}
     * @private
     */
    this.overlay_ = new _layer_Vector_js__WEBPACK_IMPORTED_MODULE_10__["default"]({
      source: new _source_Vector_js__WEBPACK_IMPORTED_MODULE_11__["default"]({
        useSpatialIndex: false,
        wrapX: options.wrapX ? options.wrapX : false
      }),
      style: options.style ? options.style :
        getDefaultStyleFunction(),
      updateWhileInteracting: true
    });

    /**
     * Name of the geometry attribute for newly created features.
     * @type {string|undefined}
     * @private
     */
    this.geometryName_ = options.geometryName;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.condition ? options.condition : _events_condition_js__WEBPACK_IMPORTED_MODULE_12__.noModifierKeys;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.freehandCondition_;
    if (options.freehand) {
      this.freehandCondition_ = _events_condition_js__WEBPACK_IMPORTED_MODULE_12__.always;
    } else {
      this.freehandCondition_ = options.freehandCondition ?
        options.freehandCondition : _events_condition_js__WEBPACK_IMPORTED_MODULE_12__.shiftKeyOnly;
    }

    (0,_events_js__WEBPACK_IMPORTED_MODULE_13__.listen)(this,
      (0,_Object_js__WEBPACK_IMPORTED_MODULE_14__.getChangeEventType)(_Property_js__WEBPACK_IMPORTED_MODULE_15__["default"].ACTIVE),
      this.updateState_, this);

  }

  if ( PointerInteraction ) Draw.__proto__ = PointerInteraction;
  Draw.prototype = Object.create( PointerInteraction && PointerInteraction.prototype );
  Draw.prototype.constructor = Draw;

  /**
   * @inheritDoc
   */
  Draw.prototype.setMap = function setMap (map) {
    PointerInteraction.prototype.setMap.call(this, map);
    this.updateState_();
  };

  /**
   * Get the overlay layer that this interaction renders sketch features to.
   * @return {VectorLayer} Overlay layer.
   * @api
   */
  Draw.prototype.getOverlay = function getOverlay () {
    return this.overlay_;
  };

  /**
   * Handles the {@link module:ol/MapBrowserEvent map browser event} and may actually draw or finish the drawing.
   * @override
   * @api
   */
  Draw.prototype.handleEvent = function handleEvent (event) {
    if (event.originalEvent.type === _events_EventType_js__WEBPACK_IMPORTED_MODULE_16__["default"].CONTEXTMENU) {
      // Avoid context menu for long taps when drawing on mobile
      event.preventDefault();
    }
    this.freehand_ = this.mode_ !== Mode.POINT && this.freehandCondition_(event);
    var move = event.type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_17__["default"].POINTERMOVE;
    var pass = true;
    if (!this.freehand_ && this.lastDragTime_ && event.type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_17__["default"].POINTERDRAG) {
      var now = Date.now();
      if (now - this.lastDragTime_ >= this.dragVertexDelay_) {
        this.downPx_ = event.pixel;
        this.shouldHandle_ = !this.freehand_;
        move = true;
      } else {
        this.lastDragTime_ = undefined;
      }
      if (this.shouldHandle_ && this.downTimeout_ !== undefined) {
        clearTimeout(this.downTimeout_);
        this.downTimeout_ = undefined;
      }
    }
    if (this.freehand_ &&
        event.type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_17__["default"].POINTERDRAG &&
        this.sketchFeature_ !== null) {
      this.addToDrawing_(event);
      pass = false;
    } else if (this.freehand_ &&
        event.type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_17__["default"].POINTERDOWN) {
      pass = false;
    } else if (move) {
      pass = event.type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_17__["default"].POINTERMOVE;
      if (pass && this.freehand_) {
        pass = this.handlePointerMove_(event);
      } else if (/** @type {MapBrowserPointerEvent} */ (event).pointerEvent.pointerType == _pointer_MouseSource_js__WEBPACK_IMPORTED_MODULE_18__.POINTER_TYPE ||
          (event.type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_17__["default"].POINTERDRAG && this.downTimeout_ === undefined)) {
        this.handlePointerMove_(event);
      }
    } else if (event.type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_17__["default"].DBLCLICK) {
      pass = false;
    }

    return PointerInteraction.prototype.handleEvent.call(this, event) && pass;
  };

  /**
   * @inheritDoc
   */
  Draw.prototype.handleDownEvent = function handleDownEvent (event) {
    this.shouldHandle_ = !this.freehand_;

    if (this.freehand_) {
      this.downPx_ = event.pixel;
      if (!this.finishCoordinate_) {
        this.startDrawing_(event);
      }
      return true;
    } else if (this.condition_(event)) {
      this.lastDragTime_ = Date.now();
      this.downTimeout_ = setTimeout(function() {
        this.handlePointerMove_(new _MapBrowserPointerEvent_js__WEBPACK_IMPORTED_MODULE_19__["default"](
          _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_17__["default"].POINTERMOVE, event.map, event.pointerEvent, false, event.frameState));
      }.bind(this), this.dragVertexDelay_);
      this.downPx_ = event.pixel;
      return true;
    } else {
      return false;
    }
  };


  /**
   * @inheritDoc
   */
  Draw.prototype.handleUpEvent = function handleUpEvent (event) {
    var pass = true;

    if (this.downTimeout_) {
      clearTimeout(this.downTimeout_);
      this.downTimeout_ = undefined;
    }

    this.handlePointerMove_(event);

    var circleMode = this.mode_ === Mode.CIRCLE;

    if (this.shouldHandle_) {
      if (!this.finishCoordinate_) {
        this.startDrawing_(event);
        if (this.mode_ === Mode.POINT) {
          this.finishDrawing();
        }
      } else if (this.freehand_ || circleMode) {
        this.finishDrawing();
      } else if (this.atFinish_(event)) {
        if (this.finishCondition_(event)) {
          this.finishDrawing();
        }
      } else {
        this.addToDrawing_(event);
      }
      pass = false;
    } else if (this.freehand_) {
      this.finishCoordinate_ = null;
      this.abortDrawing_();
    }
    if (!pass && this.stopClick_) {
      event.stopPropagation();
    }
    return pass;
  };

  /**
   * Handle move events.
   * @param {import("../MapBrowserEvent.js").default} event A move event.
   * @return {boolean} Pass the event to other interactions.
   * @private
   */
  Draw.prototype.handlePointerMove_ = function handlePointerMove_ (event) {
    if (this.downPx_ &&
        ((!this.freehand_ && this.shouldHandle_) ||
        (this.freehand_ && !this.shouldHandle_))) {
      var downPx = this.downPx_;
      var clickPx = event.pixel;
      var dx = downPx[0] - clickPx[0];
      var dy = downPx[1] - clickPx[1];
      var squaredDistance = dx * dx + dy * dy;
      this.shouldHandle_ = this.freehand_ ?
        squaredDistance > this.squaredClickTolerance_ :
        squaredDistance <= this.squaredClickTolerance_;
      if (!this.shouldHandle_) {
        return true;
      }
    }

    if (this.finishCoordinate_) {
      this.modifyDrawing_(event);
    } else {
      this.createOrUpdateSketchPoint_(event);
    }
    return true;
  };

  /**
   * Determine if an event is within the snapping tolerance of the start coord.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @return {boolean} The event is within the snapping tolerance of the start.
   * @private
   */
  Draw.prototype.atFinish_ = function atFinish_ (event) {
    var at = false;
    if (this.sketchFeature_) {
      var potentiallyDone = false;
      var potentiallyFinishCoordinates = [this.finishCoordinate_];
      if (this.mode_ === Mode.LINE_STRING) {
        potentiallyDone = this.sketchCoords_.length > this.minPoints_;
      } else if (this.mode_ === Mode.POLYGON) {
        var sketchCoords = /** @type {PolyCoordType} */ (this.sketchCoords_);
        potentiallyDone = sketchCoords[0].length > this.minPoints_;
        potentiallyFinishCoordinates = [sketchCoords[0][0], sketchCoords[0][sketchCoords[0].length - 2]];
      }
      if (potentiallyDone) {
        var map = event.map;
        for (var i = 0, ii = potentiallyFinishCoordinates.length; i < ii; i++) {
          var finishCoordinate = potentiallyFinishCoordinates[i];
          var finishPixel = map.getPixelFromCoordinate(finishCoordinate);
          var pixel = event.pixel;
          var dx = pixel[0] - finishPixel[0];
          var dy = pixel[1] - finishPixel[1];
          var snapTolerance = this.freehand_ ? 1 : this.snapTolerance_;
          at = Math.sqrt(dx * dx + dy * dy) <= snapTolerance;
          if (at) {
            this.finishCoordinate_ = finishCoordinate;
            break;
          }
        }
      }
    }
    return at;
  };

  /**
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @private
   */
  Draw.prototype.createOrUpdateSketchPoint_ = function createOrUpdateSketchPoint_ (event) {
    var coordinates = event.coordinate.slice();
    if (!this.sketchPoint_) {
      this.sketchPoint_ = new _Feature_js__WEBPACK_IMPORTED_MODULE_20__["default"](new _geom_Point_js__WEBPACK_IMPORTED_MODULE_7__["default"](coordinates));
      this.updateSketchFeatures_();
    } else {
      var sketchPointGeom = /** @type {Point} */ (this.sketchPoint_.getGeometry());
      sketchPointGeom.setCoordinates(coordinates);
    }
  };

  /**
   * Start the drawing.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @private
   */
  Draw.prototype.startDrawing_ = function startDrawing_ (event) {
    var start = event.coordinate;
    this.finishCoordinate_ = start;
    if (this.mode_ === Mode.POINT) {
      this.sketchCoords_ = start.slice();
    } else if (this.mode_ === Mode.POLYGON) {
      this.sketchCoords_ = [[start.slice(), start.slice()]];
      this.sketchLineCoords_ = this.sketchCoords_[0];
    } else {
      this.sketchCoords_ = [start.slice(), start.slice()];
    }
    if (this.sketchLineCoords_) {
      this.sketchLine_ = new _Feature_js__WEBPACK_IMPORTED_MODULE_20__["default"](
        new _geom_LineString_js__WEBPACK_IMPORTED_MODULE_8__["default"](this.sketchLineCoords_));
    }
    var geometry = this.geometryFunction_(this.sketchCoords_);
    this.sketchFeature_ = new _Feature_js__WEBPACK_IMPORTED_MODULE_20__["default"]();
    if (this.geometryName_) {
      this.sketchFeature_.setGeometryName(this.geometryName_);
    }
    this.sketchFeature_.setGeometry(geometry);
    this.updateSketchFeatures_();
    this.dispatchEvent(new DrawEvent(DrawEventType.DRAWSTART, this.sketchFeature_));
  };

  /**
   * Modify the drawing.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @private
   */
  Draw.prototype.modifyDrawing_ = function modifyDrawing_ (event) {
    var coordinate = event.coordinate;
    var geometry = /** @type {import("../geom/SimpleGeometry.js").default} */ (this.sketchFeature_.getGeometry());
    var coordinates, last;
    if (this.mode_ === Mode.POINT) {
      last = this.sketchCoords_;
    } else if (this.mode_ === Mode.POLYGON) {
      coordinates = /** @type {PolyCoordType} */ (this.sketchCoords_)[0];
      last = coordinates[coordinates.length - 1];
      if (this.atFinish_(event)) {
        // snap to finish
        coordinate = this.finishCoordinate_.slice();
      }
    } else {
      coordinates = this.sketchCoords_;
      last = coordinates[coordinates.length - 1];
    }
    last[0] = coordinate[0];
    last[1] = coordinate[1];
    this.geometryFunction_(/** @type {!LineCoordType} */ (this.sketchCoords_), geometry);
    if (this.sketchPoint_) {
      var sketchPointGeom = /** @type {Point} */ (this.sketchPoint_.getGeometry());
      sketchPointGeom.setCoordinates(coordinate);
    }
    /** @type {LineString} */
    var sketchLineGeom;
    if (this.mode_ === Mode.ELLIPSE) {
      if (!this.sketchLine_) {
        this.sketchLine_ = new _Feature_js__WEBPACK_IMPORTED_MODULE_20__["default"](new _geom_LineString_js__WEBPACK_IMPORTED_MODULE_8__["default"]([0, 0]));
      }
      sketchLineGeom = /** @type {LineString} */ (this.sketchLine_.getGeometry());
      if (this.sketchCoords_.length < 3) {
        sketchLineGeom.setCoordinates(this.sketchCoords_);
      } else {
        coordinates = geometry.getCoordinates()[0];
        var center = [
          (coordinates[0][0] + coordinates[2][0]) / 2,
          (coordinates[0][1] + coordinates[2][1]) / 2
        ];
        sketchLineGeom.setCoordinates([coordinates[0], center, coordinates[3]]);
      }
    } else if (geometry.getType() == _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].POLYGON &&
        this.mode_ !== Mode.POLYGON) {
      if (!this.sketchLine_) {
        this.sketchLine_ = new _Feature_js__WEBPACK_IMPORTED_MODULE_20__["default"]();
      }
      var ring = /** @type {Polygon} */ (geometry).getLinearRing(0);
      sketchLineGeom = /** @type {LineString} */ (this.sketchLine_.getGeometry());
      if (!sketchLineGeom) {
        sketchLineGeom = new _geom_LineString_js__WEBPACK_IMPORTED_MODULE_8__["default"](ring.getFlatCoordinates(), ring.getLayout());
        this.sketchLine_.setGeometry(sketchLineGeom);
      } else {
        sketchLineGeom.setFlatCoordinates(
          ring.getLayout(), ring.getFlatCoordinates());
        sketchLineGeom.changed();
      }
    } else if (this.sketchLineCoords_) {
      sketchLineGeom = /** @type {LineString} */ (this.sketchLine_.getGeometry());
      sketchLineGeom.setCoordinates(this.sketchLineCoords_);
    }
    this.updateSketchFeatures_();
  };

  /**
   * Add a new coordinate to the drawing.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @private
   */
  Draw.prototype.addToDrawing_ = function addToDrawing_ (event) {
    var coordinate = event.coordinate;
    var geometry = /** @type {import("../geom/SimpleGeometry.js").default} */ (this.sketchFeature_.getGeometry());
    var done;
    var coordinates;
    if (this.mode_ === Mode.LINE_STRING || this.mode_ === Mode.ELLIPSE) {
      this.finishCoordinate_ = coordinate.slice();
      coordinates = /** @type {LineCoordType} */ (this.sketchCoords_);
      if (coordinates.length >= this.maxPoints_) {
        if (this.freehand_) {
          coordinates.pop();
        } else {
          done = true;
        }
      }
      coordinates.push(coordinate.slice());
      this.geometryFunction_(coordinates, geometry);
    } else if (this.mode_ === Mode.POLYGON) {
      coordinates = /** @type {PolyCoordType} */ (this.sketchCoords_)[0];
      if (coordinates.length >= this.maxPoints_) {
        if (this.freehand_) {
          coordinates.pop();
        } else {
          done = true;
        }
      }
      coordinates.push(coordinate.slice());
      if (done) {
        this.finishCoordinate_ = coordinates[0];
      }
      this.geometryFunction_(this.sketchCoords_, geometry);
    }
    this.updateSketchFeatures_();
    if (done) {
      this.finishDrawing();
    }
  };

  /**
   * Remove last point of the feature currently being drawn.
   * @api
   */
  Draw.prototype.removeLastPoint = function removeLastPoint () {
    if (!this.sketchFeature_) {
      return;
    }
    var geometry = /** @type {import("../geom/SimpleGeometry.js").default} */ (this.sketchFeature_.getGeometry());
    var coordinates;
    /** @type {LineString} */
    var sketchLineGeom;
    if (this.mode_ === Mode.LINE_STRING) {
      coordinates = /** @type {LineCoordType} */ (this.sketchCoords_);
      coordinates.splice(-2, 1);
      this.geometryFunction_(coordinates, geometry);
      if (coordinates.length >= 2) {
        this.finishCoordinate_ = coordinates[coordinates.length - 2].slice();
      }
    } else if (this.mode_ === Mode.POLYGON) {
      coordinates = /** @type {PolyCoordType} */ (this.sketchCoords_)[0];
      coordinates.splice(-2, 1);
      sketchLineGeom = /** @type {LineString} */ (this.sketchLine_.getGeometry());
      sketchLineGeom.setCoordinates(coordinates);
      this.geometryFunction_(this.sketchCoords_, geometry);
    }

    if (coordinates.length === 0) {
      this.finishCoordinate_ = null;
    }

    this.updateSketchFeatures_();
  };

  /**
   * Stop drawing and add the sketch feature to the target layer.
   * The {@link module:ol/interaction/Draw~DrawEventType.DRAWEND} event is
   * dispatched before inserting the feature.
   * @api
   */
  Draw.prototype.finishDrawing = function finishDrawing () {
    var sketchFeature = this.abortDrawing_();
    if (!sketchFeature) {
      return;
    }
    var coordinates = this.sketchCoords_;
    var geometry = /** @type {import("../geom/SimpleGeometry.js").default} */ (sketchFeature.getGeometry());
    if (this.mode_ === Mode.LINE_STRING) {
      // remove the redundant last point
      coordinates.pop();
      this.geometryFunction_(coordinates, geometry);
    } else if (this.mode_ === Mode.POLYGON) {
      // remove the redundant last point in ring
      /** @type {PolyCoordType} */ (coordinates)[0].pop();
      this.geometryFunction_(coordinates, geometry);
      coordinates = geometry.getCoordinates();
    }

    // cast multi-part geometries
    if (this.type_ === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].MULTI_POINT) {
      sketchFeature.setGeometry(new _geom_MultiPoint_js__WEBPACK_IMPORTED_MODULE_21__["default"]([/** @type {PointCoordType} */(coordinates)]));
    } else if (this.type_ === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].MULTI_LINE_STRING) {
      sketchFeature.setGeometry(new _geom_MultiLineString_js__WEBPACK_IMPORTED_MODULE_22__["default"]([/** @type {LineCoordType} */(coordinates)]));
    } else if (this.type_ === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].MULTI_POLYGON) {
      sketchFeature.setGeometry(new _geom_MultiPolygon_js__WEBPACK_IMPORTED_MODULE_23__["default"]([/** @type {PolyCoordType} */(coordinates)]));
    }

    // First dispatch event to allow full set up of feature
    this.dispatchEvent(new DrawEvent(DrawEventType.DRAWEND, sketchFeature));

    // Then insert feature
    if (this.features_) {
      this.features_.push(sketchFeature);
    }
    if (this.source_) {
      this.source_.addFeature(sketchFeature);
    }
  };

  /**
   * Stop drawing without adding the sketch feature to the target layer.
   * @return {Feature} The sketch feature (or null if none).
   * @private
   */
  Draw.prototype.abortDrawing_ = function abortDrawing_ () {
    this.finishCoordinate_ = null;
    var sketchFeature = this.sketchFeature_;
    if (sketchFeature) {
      this.sketchFeature_ = null;
      this.sketchPoint_ = null;
      this.sketchLine_ = null;
      /** @type {VectorSource} */ (this.overlay_.getSource()).clear(true);
    }
    return sketchFeature;
  };

  /**
   * Extend an existing geometry by adding additional points. This only works
   * on features with `LineString` geometries, where the interaction will
   * extend lines by adding points to the end of the coordinates array.
   * @param {!Feature} feature Feature to be extended.
   * @api
   */
  Draw.prototype.extend = function extend (feature) {
    var geometry = feature.getGeometry();
    var lineString = /** @type {LineString} */ (geometry);
    this.sketchFeature_ = feature;
    this.sketchCoords_ = lineString.getCoordinates();
    var last = this.sketchCoords_[this.sketchCoords_.length - 1];
    this.finishCoordinate_ = last.slice();
    this.sketchCoords_.push(last.slice());
    this.updateSketchFeatures_();
    this.dispatchEvent(new DrawEvent(DrawEventType.DRAWSTART, this.sketchFeature_));
  };

  /**
   * Redraw the sketch features.
   * @private
   */
  Draw.prototype.updateSketchFeatures_ = function updateSketchFeatures_ () {
    var sketchFeatures = [];
    if (this.sketchFeature_) {
      sketchFeatures.push(this.sketchFeature_);
    }
    if (this.sketchLine_) {
      sketchFeatures.push(this.sketchLine_);
    }
    if (this.sketchPoint_) {
      sketchFeatures.push(this.sketchPoint_);
    }
    var overlaySource = /** @type {VectorSource} */ (this.overlay_.getSource());
    overlaySource.clear(true);
    overlaySource.addFeatures(sketchFeatures);
  };

  /**
   * @private
   */
  Draw.prototype.updateState_ = function updateState_ () {
    var map = this.getMap();
    var active = this.getActive();
    if (!map || !active) {
      this.abortDrawing_();
    }
    this.overlay_.setMap(active ? map : null);
  };

  return Draw;
}(_Pointer_js__WEBPACK_IMPORTED_MODULE_24__["default"]));


/**
 * @return {import("../style/Style.js").StyleFunction} Styles.
 */
function getDefaultStyleFunction() {
  var styles = (0,_style_Style_js__WEBPACK_IMPORTED_MODULE_25__.createEditingStyle)();
  return function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
  };
}


/**
 * Create a `geometryFunction` for `type: 'Circle'` that will create a regular
 * polygon with a user specified number of sides and start angle instead of an
 * `import("../geom/Circle.js").Circle` geometry.
 * @param {number=} opt_sides Number of sides of the regular polygon. Default is
 *     32.
 * @param {number=} opt_angle Angle of the first point in radians. 0 means East.
 *     Default is the angle defined by the heading from the center of the
 *     regular polygon to the current pointer position.
 * @return {GeometryFunction} Function that draws a
 *     polygon.
 * @api
 */
function createRegularPolygon(opt_sides, opt_angle) {
  return function(coordinates, opt_geometry) {
    var center = /** @type {LineCoordType} */ (coordinates)[0];
    var end = /** @type {LineCoordType} */ (coordinates)[1];
    var radius = Math.sqrt(
      (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_4__.squaredDistance)(center, end));
    var geometry = opt_geometry ? /** @type {Polygon} */ (opt_geometry) :
      (0,_geom_Polygon_js__WEBPACK_IMPORTED_MODULE_9__.fromCircle)(new _geom_Circle_js__WEBPACK_IMPORTED_MODULE_3__["default"](center), opt_sides);
    var angle = opt_angle;
    if (!opt_angle) {
      var x = end[0] - center[0];
      var y = end[1] - center[1];
      angle = Math.atan(y / x) - (x < 0 ? Math.PI : 0);
    }
    (0,_geom_Polygon_js__WEBPACK_IMPORTED_MODULE_9__.makeRegular)(geometry, center, radius, angle);
    return geometry;
  };
}


/**
 * Create a `geometryFunction` that will create a box-shaped polygon (aligned
 * with the coordinate system axes).  Use this with the draw interaction and
 * `type: 'Circle'` to return a box instead of a circle geometry.
 * @return {GeometryFunction} Function that draws a box-shaped polygon.
 * @api
 */
function createBox() {
  return (
    function(coordinates, opt_geometry) {
      var extent = (0,_extent_js__WEBPACK_IMPORTED_MODULE_26__.boundingExtent)(/** @type {LineCoordType} */ (coordinates));
      var boxCoordinates = [[
        (0,_extent_js__WEBPACK_IMPORTED_MODULE_26__.getBottomLeft)(extent),
        (0,_extent_js__WEBPACK_IMPORTED_MODULE_26__.getBottomRight)(extent),
        (0,_extent_js__WEBPACK_IMPORTED_MODULE_26__.getTopRight)(extent),
        (0,_extent_js__WEBPACK_IMPORTED_MODULE_26__.getTopLeft)(extent),
        (0,_extent_js__WEBPACK_IMPORTED_MODULE_26__.getBottomLeft)(extent)
      ]];
      var geometry = opt_geometry;
      if (geometry) {
        geometry.setCoordinates(boxCoordinates);
      } else {
        geometry = new _geom_Polygon_js__WEBPACK_IMPORTED_MODULE_9__["default"](boxCoordinates);
      }
      return geometry;
    }
  );
}


/**
 * Get the drawing mode.  The mode for mult-part geometries is the same as for
 * their single-part cousins.
 * @param {GeometryType} type Geometry type.
 * @return {Mode} Drawing mode.
 */
function getMode(type) {
  var mode;
  if (type === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].POINT ||
      type === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].MULTI_POINT) {
    mode = Mode.POINT;
  } else if (type === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].LINE_STRING ||
      type === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].MULTI_LINE_STRING ||
      // Use LineString mode for rectangle so the geometry always has an end point.
      type === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].RECTANGLE) {
    mode = Mode.LINE_STRING;
  } else if (type === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].POLYGON ||
      type === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].MULTI_POLYGON) {
    mode = Mode.POLYGON;
  } else if (type === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].CIRCLE) {
    mode = Mode.CIRCLE;
  } else if (type === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_2__["default"].ELLIPSE) {
    mode = Mode.ELLIPSE;
  }
  return (
    /** @type {!Mode} */ (mode)
  );
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Draw);

//# sourceMappingURL=Draw.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/interaction/Interaction.js":
/*!************************************************************!*\
  !*** ./node_modules/@biigle/ol/interaction/Interaction.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pan": () => (/* binding */ pan),
/* harmony export */   "rotate": () => (/* binding */ rotate),
/* harmony export */   "rotateWithoutConstraints": () => (/* binding */ rotateWithoutConstraints),
/* harmony export */   "zoom": () => (/* binding */ zoom),
/* harmony export */   "zoomByDelta": () => (/* binding */ zoomByDelta),
/* harmony export */   "zoomWithoutConstraints": () => (/* binding */ zoomWithoutConstraints),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _Object_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../Object.js */ "./node_modules/@biigle/ol/Object.js");
/* harmony import */ var _easing_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../easing.js */ "./node_modules/@biigle/ol/easing.js");
/* harmony import */ var _Property_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Property.js */ "./node_modules/@biigle/ol/interaction/Property.js");
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../math.js */ "./node_modules/@biigle/ol/math.js");
/**
 * @module ol/interaction/Interaction
 */






/**
 * Object literal with config options for interactions.
 * @typedef {Object} InteractionOptions
 * @property {function(import("../MapBrowserEvent.js").default):boolean} handleEvent
 * Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. If the function returns a falsy value, propagation of
 * the event to other interactions in the map's interactions chain will be
 * prevented (this includes functions with no explicit return).
 */


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * User actions that change the state of the map. Some are similar to controls,
 * but are not associated with a DOM element.
 * For example, {@link module:ol/interaction/KeyboardZoom~KeyboardZoom} is
 * functionally the same as {@link module:ol/control/Zoom~Zoom}, but triggered
 * by a keyboard event not a button element event.
 * Although interactions do not have a DOM element, some of them do render
 * vectors and so are visible on the screen.
 * @api
 */
var Interaction = /*@__PURE__*/(function (BaseObject) {
  function Interaction(options) {
    BaseObject.call(this);

    if (options.handleEvent) {
      this.handleEvent = options.handleEvent;
    }

    /**
     * @private
     * @type {import("../PluggableMap.js").default}
     */
    this.map_ = null;

    this.setActive(true);
  }

  if ( BaseObject ) Interaction.__proto__ = BaseObject;
  Interaction.prototype = Object.create( BaseObject && BaseObject.prototype );
  Interaction.prototype.constructor = Interaction;

  /**
   * Return whether the interaction is currently active.
   * @return {boolean} `true` if the interaction is active, `false` otherwise.
   * @observable
   * @api
   */
  Interaction.prototype.getActive = function getActive () {
    return /** @type {boolean} */ (this.get(_Property_js__WEBPACK_IMPORTED_MODULE_0__["default"].ACTIVE));
  };

  /**
   * Get the map associated with this interaction.
   * @return {import("../PluggableMap.js").default} Map.
   * @api
   */
  Interaction.prototype.getMap = function getMap () {
    return this.map_;
  };

  /**
   * Handles the {@link module:ol/MapBrowserEvent map browser event}.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @api
   */
  Interaction.prototype.handleEvent = function handleEvent (mapBrowserEvent) {
    return true;
  };

  /**
   * Activate or deactivate the interaction.
   * @param {boolean} active Active.
   * @observable
   * @api
   */
  Interaction.prototype.setActive = function setActive (active) {
    this.set(_Property_js__WEBPACK_IMPORTED_MODULE_0__["default"].ACTIVE, active);
  };

  /**
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../PluggableMap.js").default} map Map.
   */
  Interaction.prototype.setMap = function setMap (map) {
    this.map_ = map;
  };

  return Interaction;
}(_Object_js__WEBPACK_IMPORTED_MODULE_1__["default"]));


/**
 * @param {import("../View.js").default} view View.
 * @param {import("../coordinate.js").Coordinate} delta Delta.
 * @param {number=} opt_duration Duration.
 */
function pan(view, delta, opt_duration) {
  var currentCenter = view.getCenter();
  if (currentCenter) {
    var center = view.constrainCenter(
      [currentCenter[0] + delta[0], currentCenter[1] + delta[1]]);
    if (opt_duration) {
      view.animate({
        duration: opt_duration,
        easing: _easing_js__WEBPACK_IMPORTED_MODULE_2__.linear,
        center: center
      });
    } else {
      view.setCenter(center);
    }
  }
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
function rotate(view, rotation, opt_anchor, opt_duration) {
  rotation = view.constrainRotation(rotation, 0);
  rotateWithoutConstraints(view, rotation, opt_anchor, opt_duration);
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
function rotateWithoutConstraints(view, rotation, opt_anchor, opt_duration) {
  if (rotation !== undefined) {
    var currentRotation = view.getRotation();
    var currentCenter = view.getCenter();
    if (currentRotation !== undefined && currentCenter && opt_duration > 0) {
      view.animate({
        rotation: rotation,
        anchor: opt_anchor,
        duration: opt_duration,
        easing: _easing_js__WEBPACK_IMPORTED_MODULE_2__.easeOut
      });
    } else {
      view.rotate(rotation, opt_anchor);
    }
  }
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 * @param {number=} opt_direction Zooming direction; > 0 indicates
 *     zooming out, in which case the constraints system will select
 *     the largest nearest resolution; < 0 indicates zooming in, in
 *     which case the constraints system will select the smallest
 *     nearest resolution; == 0 indicates that the zooming direction
 *     is unknown/not relevant, in which case the constraints system
 *     will select the nearest resolution. If not defined 0 is
 *     assumed.
 */
function zoom(view, resolution, opt_anchor, opt_duration, opt_direction) {
  resolution = view.constrainResolution(resolution, 0, opt_direction);
  zoomWithoutConstraints(view, resolution, opt_anchor, opt_duration);
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number} delta Delta from previous zoom level.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
function zoomByDelta(view, delta, opt_anchor, opt_duration) {
  var currentResolution = view.getResolution();
  var resolution = view.constrainResolution(currentResolution, delta, 0);

  if (resolution !== undefined) {
    var resolutions = view.getResolutions();
    resolution = (0,_math_js__WEBPACK_IMPORTED_MODULE_3__.clamp)(
      resolution,
      view.getMinResolution() || resolutions[resolutions.length - 1],
      view.getMaxResolution() || resolutions[0]);
  }

  // If we have a constraint on center, we need to change the anchor so that the
  // new center is within the extent. We first calculate the new center, apply
  // the constraint to it, and then calculate back the anchor
  if (opt_anchor && resolution !== undefined && resolution !== currentResolution) {
    var currentCenter = view.getCenter();
    var center = view.calculateCenterZoom(resolution, opt_anchor);
    center = view.constrainCenter(center);

    opt_anchor = [
      (resolution * currentCenter[0] - currentResolution * center[0]) /
          (resolution - currentResolution),
      (resolution * currentCenter[1] - currentResolution * center[1]) /
          (resolution - currentResolution)
    ];
  }

  zoomWithoutConstraints(view, resolution, opt_anchor, opt_duration);
}


/**
 * @param {import("../View.js").default} view View.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {import("../coordinate.js").Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
function zoomWithoutConstraints(view, resolution, opt_anchor, opt_duration) {
  if (resolution) {
    var currentResolution = view.getResolution();
    var currentCenter = view.getCenter();
    if (currentResolution !== undefined && currentCenter &&
        resolution !== currentResolution && opt_duration) {
      view.animate({
        resolution: resolution,
        anchor: opt_anchor,
        duration: opt_duration,
        easing: _easing_js__WEBPACK_IMPORTED_MODULE_2__.easeOut
      });
    } else {
      if (opt_anchor) {
        var center = view.calculateCenterZoom(resolution, opt_anchor);
        view.setCenter(center);
      }
      view.setResolution(resolution);
    }
  }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Interaction);

//# sourceMappingURL=Interaction.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/interaction/Modify.js":
/*!*******************************************************!*\
  !*** ./node_modules/@biigle/ol/interaction/Modify.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ModifyEventType": () => (/* binding */ ModifyEventType),
/* harmony export */   "ModifyEvent": () => (/* binding */ ModifyEvent),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var _Collection_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../Collection.js */ "./node_modules/@biigle/ol/Collection.js");
/* harmony import */ var _CollectionEventType_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../CollectionEventType.js */ "./node_modules/@biigle/ol/CollectionEventType.js");
/* harmony import */ var _Feature_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../Feature.js */ "./node_modules/@biigle/ol/Feature.js");
/* harmony import */ var _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../MapBrowserEventType.js */ "./node_modules/@biigle/ol/MapBrowserEventType.js");
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../array.js */ "./node_modules/@biigle/ol/array.js");
/* harmony import */ var _coordinate_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../coordinate.js */ "./node_modules/@biigle/ol/coordinate.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../events.js */ "./node_modules/@biigle/ol/events.js");
/* harmony import */ var _events_Event_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/Event.js */ "./node_modules/@biigle/ol/events/Event.js");
/* harmony import */ var _events_EventType_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../events/EventType.js */ "./node_modules/@biigle/ol/events/EventType.js");
/* harmony import */ var _events_condition_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../events/condition.js */ "./node_modules/@biigle/ol/events/condition.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../geom/GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _geom_Point_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../geom/Point.js */ "./node_modules/@biigle/ol/geom/Point.js");
/* harmony import */ var _Pointer_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./Pointer.js */ "./node_modules/@biigle/ol/interaction/Pointer.js");
/* harmony import */ var _layer_Vector_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../layer/Vector.js */ "./node_modules/@biigle/ol/layer/Vector.js");
/* harmony import */ var _source_Vector_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../source/Vector.js */ "./node_modules/@biigle/ol/source/Vector.js");
/* harmony import */ var _source_VectorEventType_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../source/VectorEventType.js */ "./node_modules/@biigle/ol/source/VectorEventType.js");
/* harmony import */ var _structs_RBush_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../structs/RBush.js */ "./node_modules/@biigle/ol/structs/RBush.js");
/* harmony import */ var _style_Style_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../style/Style.js */ "./node_modules/@biigle/ol/style/Style.js");
/**
 * @module ol/interaction/Modify
 */






















/**
 * The segment index assigned to a circle's center when
 * breaking up a circle into ModifySegmentDataType segments.
 * @type {number}
 */
var CIRCLE_CENTER_INDEX = 0;

/**
 * The segment index assigned to a circle's circumference when
 * breaking up a circle into ModifySegmentDataType segments.
 * @type {number}
 */
var CIRCLE_CIRCUMFERENCE_INDEX = 1;


/**
 * @enum {string}
 */
var ModifyEventType = {
  /**
   * Triggered upon feature modification start
   * @event ModifyEvent#modifystart
   * @api
   */
  MODIFYSTART: 'modifystart',
  /**
   * Triggered upon feature modification end
   * @event ModifyEvent#modifyend
   * @api
   */
  MODIFYEND: 'modifyend'
};


/**
 * @typedef {Object} SegmentData
 * @property {Array<number>} [depth]
 * @property {Feature} feature
 * @property {import("../geom/SimpleGeometry.js").default} geometry
 * @property {number} [index]
 * @property {Array<import("../extent.js").Extent>} segment
 * @property {Array<SegmentData>} [featureSegments]
 */


/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event will be considered to add or move a
 * vertex to the sketch. Default is
 * {@link module:ol/events/condition~primaryAction}.
 * @property {import("../events/condition.js").Condition} [deleteCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. By default,
 * {@link module:ol/events/condition~singleClick} with
 * {@link module:ol/events/condition~altKeyOnly} results in a vertex deletion.
 * @property {import("../events/condition.js").Condition} [insertVertexCondition] A
 * function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and
 * returns a boolean to indicate whether a new vertex can be added to the sketch
 * features. Default is {@link module:ol/events/condition~always}.
 * @property {number} [pixelTolerance=10] Pixel tolerance for considering the
 * pointer close enough to a segment or vertex for editing.
 * @property {import("../style/Style.js").StyleLike} [style]
 * Style used for the features being modified. By default the default edit
 * style is used (see {@link module:ol/style}).
 * @property {VectorSource} [source] The vector source with
 * features to modify.  If a vector source is not provided, a feature collection
 * must be provided with the features option.
 * @property {Collection<Feature>} [features]
 * The features the interaction works on.  If a feature collection is not
 * provided, a vector source must be provided with the source option.
 * @property {boolean} [wrapX=false] Wrap the world horizontally on the sketch
 * overlay.
 */


/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Modify~Modify} instances are
 * instances of this type.
 */
var ModifyEvent = /*@__PURE__*/(function (Event) {
  function ModifyEvent(type, features, mapBrowserPointerEvent) {
    Event.call(this, type);

    /**
     * The features being modified.
     * @type {Collection<Feature>}
     * @api
     */
    this.features = features;

    /**
     * Associated {@link module:ol/MapBrowserEvent}.
     * @type {import("../MapBrowserEvent.js").default}
     * @api
     */
    this.mapBrowserEvent = mapBrowserPointerEvent;

  }

  if ( Event ) ModifyEvent.__proto__ = Event;
  ModifyEvent.prototype = Object.create( Event && Event.prototype );
  ModifyEvent.prototype.constructor = ModifyEvent;

  return ModifyEvent;
}(_events_Event_js__WEBPACK_IMPORTED_MODULE_0__["default"]));


/**
 * @classdesc
 * Interaction for modifying feature geometries.  To modify features that have
 * been added to an existing source, construct the modify interaction with the
 * `source` option.  If you want to modify features in a collection (for example,
 * the collection used by a select interaction), construct the interaction with
 * the `features` option.  The interaction must be constructed with either a
 * `source` or `features` option.
 *
 * By default, the interaction will allow deletion of vertices when the `alt`
 * key is pressed.  To configure the interaction with a different condition
 * for deletion, use the `deleteCondition` option.
 * @fires ModifyEvent
 * @api
 */
var Modify = /*@__PURE__*/(function (PointerInteraction) {
  function Modify(options) {

    PointerInteraction.call(/** @type {import("./Pointer.js").Options} */ this, (options));

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.condition ? options.condition : _events_condition_js__WEBPACK_IMPORTED_MODULE_1__.primaryAction;

    /**
     * @private
     * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Browser event.
     * @return {boolean} Combined condition result.
     */
    this.defaultDeleteCondition_ = function(mapBrowserEvent) {
      return (0,_events_condition_js__WEBPACK_IMPORTED_MODULE_1__.altKeyOnly)(mapBrowserEvent) && (0,_events_condition_js__WEBPACK_IMPORTED_MODULE_1__.singleClick)(mapBrowserEvent);
    };

    /**
     * @type {import("../events/condition.js").Condition}
     * @private
     */
    this.deleteCondition_ = options.deleteCondition ?
      options.deleteCondition : this.defaultDeleteCondition_;

    /**
     * @type {import("../events/condition.js").Condition}
     * @private
     */
    this.insertVertexCondition_ = options.insertVertexCondition ?
      options.insertVertexCondition : _events_condition_js__WEBPACK_IMPORTED_MODULE_1__.always;

    /**
     * Editing vertex.
     * @type {Feature}
     * @private
     */
    this.vertexFeature_ = null;

    /**
     * Segments intersecting {@link this.vertexFeature_} by segment uid.
     * @type {Object<string, boolean>}
     * @private
     */
    this.vertexSegments_ = null;

    /**
     * @type {import("../pixel.js").Pixel}
     * @private
     */
    this.lastPixel_ = [0, 0];

    /**
     * Tracks if the next `singleclick` event should be ignored to prevent
     * accidental deletion right after vertex creation.
     * @type {boolean}
     * @private
     */
    this.ignoreNextSingleClick_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.modified_ = false;

    /**
     * Segment RTree for each layer
     * @type {RBush<SegmentData>}
     * @private
     */
    this.rBush_ = new _structs_RBush_js__WEBPACK_IMPORTED_MODULE_2__["default"]();

    /**
     * @type {number}
     * @private
     */
    this.pixelTolerance_ = options.pixelTolerance !== undefined ?
      options.pixelTolerance : 10;

    /**
     * @type {boolean}
     * @private
     */
    this.snappedToVertex_ = false;

    /**
     * Indicate whether the interaction is currently changing a feature's
     * coordinates.
     * @type {boolean}
     * @private
     */
    this.changingFeature_ = false;

    /**
     * @type {Array}
     * @private
     */
    this.dragSegments_ = [];

    /**
     * Draw overlay where sketch features are drawn.
     * @type {VectorLayer}
     * @private
     */
    this.overlay_ = new _layer_Vector_js__WEBPACK_IMPORTED_MODULE_3__["default"]({
      source: new _source_Vector_js__WEBPACK_IMPORTED_MODULE_4__["default"]({
        useSpatialIndex: false,
        wrapX: !!options.wrapX
      }),
      style: options.style ? options.style :
        getDefaultStyleFunction(),
      updateWhileAnimating: true,
      updateWhileInteracting: true
    });

    /**
     * @const
     * @private
     * @type {!Object<string, function(Feature, import("../geom/Geometry.js").default)>}
     */
    this.SEGMENT_WRITERS_ = {
      'Point': this.writePointGeometry_,
      'LineString': this.writeLineStringGeometry_,
      'LinearRing': this.writeLineStringGeometry_,
      'Polygon': this.writePolygonGeometry_,
      'MultiPoint': this.writeMultiPointGeometry_,
      'MultiLineString': this.writeMultiLineStringGeometry_,
      'MultiPolygon': this.writeMultiPolygonGeometry_,
      'Rectangle': this.writePolygonGeometry_,
      'Ellipse': this.writePolygonGeometry_,
      'Circle': this.writeCircleGeometry_,
      'GeometryCollection': this.writeGeometryCollectionGeometry_
    };


    /**
     * @type {VectorSource}
     * @private
     */
    this.source_ = null;

    var features;
    if (options.source) {
      this.source_ = options.source;
      features = new _Collection_js__WEBPACK_IMPORTED_MODULE_5__["default"](this.source_.getFeatures());
      (0,_events_js__WEBPACK_IMPORTED_MODULE_6__.listen)(this.source_, _source_VectorEventType_js__WEBPACK_IMPORTED_MODULE_7__["default"].ADDFEATURE,
        this.handleSourceAdd_, this);
      (0,_events_js__WEBPACK_IMPORTED_MODULE_6__.listen)(this.source_, _source_VectorEventType_js__WEBPACK_IMPORTED_MODULE_7__["default"].REMOVEFEATURE,
        this.handleSourceRemove_, this);
    } else {
      features = options.features;
    }
    if (!features) {
      throw new Error('The modify interaction requires features or a source');
    }

    /**
     * @type {Collection<Feature>}
     * @private
     */
    this.features_ = features;

    this.features_.forEach(this.addFeature_.bind(this));
    (0,_events_js__WEBPACK_IMPORTED_MODULE_6__.listen)(this.features_, _CollectionEventType_js__WEBPACK_IMPORTED_MODULE_8__["default"].ADD,
      this.handleFeatureAdd_, this);
    (0,_events_js__WEBPACK_IMPORTED_MODULE_6__.listen)(this.features_, _CollectionEventType_js__WEBPACK_IMPORTED_MODULE_8__["default"].REMOVE,
      this.handleFeatureRemove_, this);

    /**
     * @type {import("../MapBrowserPointerEvent.js").default}
     * @private
     */
    this.lastPointerEvent_ = null;

  }

  if ( PointerInteraction ) Modify.__proto__ = PointerInteraction;
  Modify.prototype = Object.create( PointerInteraction && PointerInteraction.prototype );
  Modify.prototype.constructor = Modify;

  /**
   * @param {Feature} feature Feature.
   * @private
   */
  Modify.prototype.addFeature_ = function addFeature_ (feature) {
    var geometry = feature.getGeometry();
    if (geometry && geometry.getType() in this.SEGMENT_WRITERS_) {
      this.SEGMENT_WRITERS_[geometry.getType()].call(this, feature, geometry);
    }
    var map = this.getMap();
    if (map && map.isRendered() && this.getActive()) {
      this.handlePointerAtPixel_(this.lastPixel_, map);
    }
    (0,_events_js__WEBPACK_IMPORTED_MODULE_6__.listen)(feature, _events_EventType_js__WEBPACK_IMPORTED_MODULE_9__["default"].CHANGE,
      this.handleFeatureChange_, this);
  };

  /**
   * @param {import("../MapBrowserPointerEvent.js").default} evt Map browser event
   * @private
   */
  Modify.prototype.willModifyFeatures_ = function willModifyFeatures_ (evt) {
    if (!this.modified_) {
      this.modified_ = true;
      this.dispatchEvent(new ModifyEvent(
        ModifyEventType.MODIFYSTART, this.features_, evt));
    }
  };

  /**
   * @param {Feature} feature Feature.
   * @private
   */
  Modify.prototype.removeFeature_ = function removeFeature_ (feature) {
    this.removeFeatureSegmentData_(feature);
    // Remove the vertex feature if the collection of canditate features
    // is empty.
    if (this.vertexFeature_ && this.features_.getLength() === 0) {
      /** @type {VectorSource} */ (this.overlay_.getSource()).removeFeature(this.vertexFeature_);
      this.vertexFeature_ = null;
    }
    (0,_events_js__WEBPACK_IMPORTED_MODULE_6__.unlisten)(feature, _events_EventType_js__WEBPACK_IMPORTED_MODULE_9__["default"].CHANGE,
      this.handleFeatureChange_, this);
  };

  /**
   * @param {Feature} feature Feature.
   * @private
   */
  Modify.prototype.removeFeatureSegmentData_ = function removeFeatureSegmentData_ (feature) {
    var rBush = this.rBush_;
    var /** @type {Array<SegmentData>} */ nodesToRemove = [];
    rBush.forEach(
      /**
       * @param {SegmentData} node RTree node.
       */
      function(node) {
        if (feature === node.feature) {
          nodesToRemove.push(node);
        }
      });
    for (var i = nodesToRemove.length - 1; i >= 0; --i) {
      rBush.remove(nodesToRemove[i]);
    }
  };

  /**
   * @inheritDoc
   */
  Modify.prototype.setActive = function setActive (active) {
    if (this.vertexFeature_ && !active) {
      /** @type {VectorSource} */ (this.overlay_.getSource()).removeFeature(this.vertexFeature_);
      this.vertexFeature_ = null;
    }
    PointerInteraction.prototype.setActive.call(this, active);
  };

  /**
   * @inheritDoc
   */
  Modify.prototype.setMap = function setMap (map) {
    this.overlay_.setMap(map);
    PointerInteraction.prototype.setMap.call(this, map);
  };

  /**
   * Get the overlay layer that this interaction renders sketch features to.
   * @return {VectorLayer} Overlay layer.
   * @api
   */
  Modify.prototype.getOverlay = function getOverlay () {
    return this.overlay_;
  };

  /**
   * @param {import("../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  Modify.prototype.handleSourceAdd_ = function handleSourceAdd_ (event) {
    if (event.feature) {
      this.features_.push(event.feature);
    }
  };

  /**
   * @param {import("../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  Modify.prototype.handleSourceRemove_ = function handleSourceRemove_ (event) {
    if (event.feature) {
      this.features_.remove(event.feature);
    }
  };

  /**
   * @param {import("../Collection.js").CollectionEvent} evt Event.
   * @private
   */
  Modify.prototype.handleFeatureAdd_ = function handleFeatureAdd_ (evt) {
    this.addFeature_(/** @type {Feature} */ (evt.element));
  };

  /**
   * @param {import("../events/Event.js").default} evt Event.
   * @private
   */
  Modify.prototype.handleFeatureChange_ = function handleFeatureChange_ (evt) {
    if (!this.changingFeature_) {
      var feature = /** @type {Feature} */ (evt.target);
      this.removeFeature_(feature);
      this.addFeature_(feature);
    }
  };

  /**
   * @param {import("../Collection.js").CollectionEvent} evt Event.
   * @private
   */
  Modify.prototype.handleFeatureRemove_ = function handleFeatureRemove_ (evt) {
    var feature = /** @type {Feature} */ (evt.element);
    this.removeFeature_(feature);
  };

  /**
   * @param {Feature} feature Feature
   * @param {Point} geometry Geometry.
   * @private
   */
  Modify.prototype.writePointGeometry_ = function writePointGeometry_ (feature, geometry) {
    var coordinates = geometry.getCoordinates();
    var segmentData = /** @type {SegmentData} */ ({
      feature: feature,
      geometry: geometry,
      segment: [coordinates, coordinates]
    });
    this.rBush_.insert(geometry.getExtent(), segmentData);
  };

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/MultiPoint.js").default} geometry Geometry.
   * @private
   */
  Modify.prototype.writeMultiPointGeometry_ = function writeMultiPointGeometry_ (feature, geometry) {
    var points = geometry.getCoordinates();
    for (var i = 0, ii = points.length; i < ii; ++i) {
      var coordinates = points[i];
      var segmentData = /** @type {SegmentData} */ ({
        feature: feature,
        geometry: geometry,
        depth: [i],
        index: i,
        segment: [coordinates, coordinates]
      });
      this.rBush_.insert(geometry.getExtent(), segmentData);
    }
  };

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/LineString.js").default} geometry Geometry.
   * @private
   */
  Modify.prototype.writeLineStringGeometry_ = function writeLineStringGeometry_ (feature, geometry) {
    var coordinates = geometry.getCoordinates();
    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      var segment = coordinates.slice(i, i + 2);
      var segmentData = /** @type {SegmentData} */ ({
        feature: feature,
        geometry: geometry,
        index: i,
        segment: segment
      });
      this.rBush_.insert((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.boundingExtent)(segment), segmentData);
    }
  };

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/MultiLineString.js").default} geometry Geometry.
   * @private
   */
  Modify.prototype.writeMultiLineStringGeometry_ = function writeMultiLineStringGeometry_ (feature, geometry) {
    var lines = geometry.getCoordinates();
    for (var j = 0, jj = lines.length; j < jj; ++j) {
      var coordinates = lines[j];
      for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        var segment = coordinates.slice(i, i + 2);
        var segmentData = /** @type {SegmentData} */ ({
          feature: feature,
          geometry: geometry,
          depth: [j],
          index: i,
          segment: segment
        });
        this.rBush_.insert((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.boundingExtent)(segment), segmentData);
      }
    }
  };

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/Polygon.js").default} geometry Geometry.
   * @private
   */
  Modify.prototype.writePolygonGeometry_ = function writePolygonGeometry_ (feature, geometry) {
    var rings = geometry.getCoordinates();
    for (var j = 0, jj = rings.length; j < jj; ++j) {
      var coordinates = rings[j];
      for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        var segment = coordinates.slice(i, i + 2);
        var segmentData = /** @type {SegmentData} */ ({
          feature: feature,
          geometry: geometry,
          depth: [j],
          index: i,
          segment: segment
        });
        this.rBush_.insert((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.boundingExtent)(segment), segmentData);
      }
    }
  };

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/MultiPolygon.js").default} geometry Geometry.
   * @private
   */
  Modify.prototype.writeMultiPolygonGeometry_ = function writeMultiPolygonGeometry_ (feature, geometry) {
    var polygons = geometry.getCoordinates();
    for (var k = 0, kk = polygons.length; k < kk; ++k) {
      var rings = polygons[k];
      for (var j = 0, jj = rings.length; j < jj; ++j) {
        var coordinates = rings[j];
        for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
          var segment = coordinates.slice(i, i + 2);
          var segmentData = /** @type {SegmentData} */ ({
            feature: feature,
            geometry: geometry,
            depth: [j, k],
            index: i,
            segment: segment
          });
          this.rBush_.insert((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.boundingExtent)(segment), segmentData);
        }
      }
    }
  };

  /**
   * We convert a circle into two segments.  The segment at index
   * {@link CIRCLE_CENTER_INDEX} is the
   * circle's center (a point).  The segment at index
   * {@link CIRCLE_CIRCUMFERENCE_INDEX} is
   * the circumference, and is not a line segment.
   *
   * @param {Feature} feature Feature.
   * @param {import("../geom/Circle.js").default} geometry Geometry.
   * @private
   */
  Modify.prototype.writeCircleGeometry_ = function writeCircleGeometry_ (feature, geometry) {
    var coordinates = geometry.getCenter();
    var centerSegmentData = /** @type {SegmentData} */ ({
      feature: feature,
      geometry: geometry,
      index: CIRCLE_CENTER_INDEX,
      segment: [coordinates, coordinates]
    });
    var circumferenceSegmentData = /** @type {SegmentData} */ ({
      feature: feature,
      geometry: geometry,
      index: CIRCLE_CIRCUMFERENCE_INDEX,
      segment: [coordinates, coordinates]
    });
    var featureSegments = [centerSegmentData, circumferenceSegmentData];
    centerSegmentData.featureSegments = circumferenceSegmentData.featureSegments = featureSegments;
    this.rBush_.insert((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.createOrUpdateFromCoordinate)(coordinates), centerSegmentData);
    this.rBush_.insert(geometry.getExtent(), circumferenceSegmentData);
  };

  /**
   * @param {Feature} feature Feature
   * @param {import("../geom/GeometryCollection.js").default} geometry Geometry.
   * @private
   */
  Modify.prototype.writeGeometryCollectionGeometry_ = function writeGeometryCollectionGeometry_ (feature, geometry) {
    var geometries = geometry.getGeometriesArray();
    for (var i = 0; i < geometries.length; ++i) {
      this.SEGMENT_WRITERS_[geometries[i].getType()].call(this, feature, geometries[i]);
    }
  };

  /**
   * @param {import("../coordinate.js").Coordinate} coordinates Coordinates.
   * @return {Feature} Vertex feature.
   * @private
   */
  Modify.prototype.createOrUpdateVertexFeature_ = function createOrUpdateVertexFeature_ (coordinates) {
    var vertexFeature = this.vertexFeature_;
    if (!vertexFeature) {
      vertexFeature = new _Feature_js__WEBPACK_IMPORTED_MODULE_11__["default"](new _geom_Point_js__WEBPACK_IMPORTED_MODULE_12__["default"](coordinates));
      this.vertexFeature_ = vertexFeature;
      /** @type {VectorSource} */ (this.overlay_.getSource()).addFeature(vertexFeature);
    } else {
      var geometry = /** @type {Point} */ (vertexFeature.getGeometry());
      geometry.setCoordinates(coordinates);
    }
    return vertexFeature;
  };

  /**
   * Handles the {@link module:ol/MapBrowserEvent map browser event} and may modify the geometry.
   * @override
   */
  Modify.prototype.handleEvent = function handleEvent (mapBrowserEvent) {
    if (!(/** @type {import("../MapBrowserPointerEvent.js").default} */ (mapBrowserEvent).pointerEvent)) {
      return true;
    }
    this.lastPointerEvent_ = mapBrowserEvent;

    var handled;
    if (!mapBrowserEvent.map.getView().getInteracting() &&
        mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_13__["default"].POINTERMOVE &&
        !this.handlingDownUpSequence) {
      this.handlePointerMove_(mapBrowserEvent);
    }
    if (this.vertexFeature_ && this.deleteCondition_(mapBrowserEvent)) {
      if (mapBrowserEvent.type != _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_13__["default"].SINGLECLICK || !this.ignoreNextSingleClick_) {
        handled = this.removePoint();
      } else {
        handled = true;
      }
    }

    if (mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_13__["default"].SINGLECLICK) {
      this.ignoreNextSingleClick_ = false;
    }

    return PointerInteraction.prototype.handleEvent.call(this, mapBrowserEvent) && !handled;
  };

  /**
   * @inheritDoc
   */
  Modify.prototype.handleDragEvent = function handleDragEvent (evt) {
    this.ignoreNextSingleClick_ = false;
    this.willModifyFeatures_(evt);

    var vertex = evt.coordinate;
    for (var i = 0, ii = this.dragSegments_.length; i < ii; ++i) {
      var dragSegment = this.dragSegments_[i];
      var segmentData = dragSegment[0];
      var depth = segmentData.depth;
      var geometry = segmentData.geometry;
      var coordinates = (void 0);
      var segment = segmentData.segment;
      var index = dragSegment[1];

      while (vertex.length < geometry.getStride()) {
        vertex.push(segment[index][vertex.length]);
      }

      switch (geometry.getType()) {
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].POINT:
          coordinates = vertex;
          segment[0] = segment[1] = vertex;
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].MULTI_POINT:
          coordinates = geometry.getCoordinates();
          coordinates[segmentData.index] = vertex;
          segment[0] = segment[1] = vertex;
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].LINE_STRING:
          coordinates = geometry.getCoordinates();
          coordinates[segmentData.index + index] = vertex;
          segment[index] = vertex;
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].MULTI_LINE_STRING:
          coordinates = geometry.getCoordinates();
          coordinates[depth[0]][segmentData.index + index] = vertex;
          segment[index] = vertex;
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].POLYGON:
          coordinates = geometry.getCoordinates();
          coordinates[depth[0]][segmentData.index + index] = vertex;
          segment[index] = vertex;
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].MULTI_POLYGON:
          coordinates = geometry.getCoordinates();
          coordinates[depth[1]][depth[0]][segmentData.index + index] = vertex;
          segment[index] = vertex;
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].RECTANGLE:
          coordinates = geometry.getCoordinates();
          var coords = coordinates[depth[0]];
          // vertex across from the dragged vertex
          var across = coords[(segmentData.index + index + 2) % 4];
          // vector from across to vertex
          var acrossToVertex = [vertex[0] - across[0], vertex[1] - across[1]];

          // vertex left from dragged vertex
          var left = coords[(segmentData.index + index + 1) % 4];
          // vector from across to left
          var acrossToLeft = [left[0] - across[0], left[1] - across[1]];
          // normalize vector
          var length = Math.sqrt(acrossToLeft[0] * acrossToLeft[0] + acrossToLeft[1] * acrossToLeft[1]);
          acrossToLeft[0] = acrossToLeft[0] / length;
          acrossToLeft[1] = acrossToLeft[1] / length;
          // move left vertex to position of orthogonal projection from the dragged
          // vertex on the acrossToLeft vector
          var dot = acrossToVertex[0] * acrossToLeft[0] + acrossToVertex[1] * acrossToLeft[1];
          coords[(segmentData.index + index + 1) % 4] = [
            across[0] + dot * acrossToLeft[0],
            across[1] + dot * acrossToLeft[1]
          ];

          // vertex right of dragged vertex
          var right = coords[(segmentData.index + index + 3) % 4];
          // vector from across to right
          var acrossToRight = [right[0] - across[0], right[1] - across[1]];
          // normalize vector
          length = Math.sqrt(acrossToRight[0] * acrossToRight[0] + acrossToRight[1] * acrossToRight[1]);
          acrossToRight[0] = acrossToRight[0] / length;
          acrossToRight[1] = acrossToRight[1] / length;
          // move right vertex to position of orthogonal projection from the dragged
          // vertex on the acrossToRight vector
          dot = acrossToVertex[0] * acrossToRight[0] + acrossToVertex[1] * acrossToRight[1];
          coords[(segmentData.index + index + 3) % 4] = [
            across[0] + dot * acrossToRight[0],
            across[1] + dot * acrossToRight[1]
          ];

          // update position of dragged vertex
          coords[segmentData.index + index] = vertex;
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].ELLIPSE:
          coordinates = geometry.getCoordinates();
          var coords = coordinates[depth[0]];
          // Vertex left from the dragged vertex.
          var left = coords[(segmentData.index + index + 1) % 4];
          // Vertex across from the dragged vertex.
          var across = coords[(segmentData.index + index + 2) % 4];
          // Vertex right from the dragged vertex.
          var right = coords[(segmentData.index + index + 3) % 4];

          // Half the distance between left and right.
          var radius = Math.sqrt(Math.pow(left[0] - right[0], 2) + Math.pow(left[1] - right[1], 2)) / 2;
          // Vector from across to dragged.
          var acrossToDragged = [vertex[0] - across[0], vertex[1] - across[1]];
          // Vector perpendicular to acrossToDragged.
          var pAcrossToDragged = [-1 * acrossToDragged[1], acrossToDragged[0]];
          // Bring vector to unit length.
          var length = Math.sqrt(pAcrossToDragged[0] * pAcrossToDragged[0] + pAcrossToDragged[1] * pAcrossToDragged[1]);
          pAcrossToDragged[0] = pAcrossToDragged[0] / length;
          pAcrossToDragged[1] = pAcrossToDragged[1] / length;

          // New center point.
          var center = [across[0] + acrossToDragged[0] / 2, across[1] + acrossToDragged[1] / 2]

          coords[(segmentData.index + index + 1) % 4] = [
            center[0] + pAcrossToDragged[0] * radius,
            center[1] + pAcrossToDragged[1] * radius ];
          coords[(segmentData.index + index + 3) % 4] = [
            center[0] - pAcrossToDragged[0] * radius,
            center[1] - pAcrossToDragged[1] * radius ];
          // Update position of dragged vertex.
          coords[segmentData.index + index] = vertex;
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].CIRCLE:
          segment[0] = segment[1] = vertex;
          if (segmentData.index === CIRCLE_CENTER_INDEX) {
            this.changingFeature_ = true;
            geometry.setCenter(vertex);
            this.changingFeature_ = false;
          } else { // We're dragging the circle's circumference:
            this.changingFeature_ = true;
            geometry.setRadius((0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.distance)(geometry.getCenter(), vertex));
            this.changingFeature_ = false;
          }
          break;
        default:
          // pass
      }

      if (coordinates) {
        this.setGeometryCoordinates_(geometry, coordinates);
      }
    }
    this.createOrUpdateVertexFeature_(vertex);
  };

  /**
   * @inheritDoc
   */
  Modify.prototype.handleDownEvent = function handleDownEvent (evt) {
    if (!this.condition_(evt)) {
      return false;
    }
    this.handlePointerAtPixel_(evt.pixel, evt.map);
    var pixelCoordinate = evt.map.getCoordinateFromPixel(evt.pixel);
    this.dragSegments_.length = 0;
    this.modified_ = false;
    var vertexFeature = this.vertexFeature_;
    if (vertexFeature) {
      var insertVertices = [];
      var geometry = /** @type {Point} */ (vertexFeature.getGeometry());
      var vertex = geometry.getCoordinates();
      var vertexExtent = (0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.boundingExtent)([vertex]);
      var segmentDataMatches = this.rBush_.getInExtent(vertexExtent);
      var componentSegments = {};
      segmentDataMatches.sort(compareIndexes);
      for (var i = 0, ii = segmentDataMatches.length; i < ii; ++i) {
        var segmentDataMatch = segmentDataMatches[i];
        var segment = segmentDataMatch.segment;
        var uid = (0,_util_js__WEBPACK_IMPORTED_MODULE_16__.getUid)(segmentDataMatch.feature);
        var depth = segmentDataMatch.depth;
        if (depth) {
          uid += '-' + depth.join('-'); // separate feature components
        }
        if (!componentSegments[uid]) {
          componentSegments[uid] = new Array(2);
        }
        if (segmentDataMatch.geometry.getType() === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].CIRCLE &&
        segmentDataMatch.index === CIRCLE_CIRCUMFERENCE_INDEX) {

          var closestVertex = closestOnSegmentData(pixelCoordinate, segmentDataMatch);
          if ((0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.equals)(closestVertex, vertex) && !componentSegments[uid][0]) {
            this.dragSegments_.push([segmentDataMatch, 0]);
            componentSegments[uid][0] = segmentDataMatch;
          }
        } else if ((0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.equals)(segment[0], vertex) &&
            !componentSegments[uid][0]) {
          this.dragSegments_.push([segmentDataMatch, 0]);
          componentSegments[uid][0] = segmentDataMatch;
        } else if ((0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.equals)(segment[1], vertex) &&
            !componentSegments[uid][1]) {

          // prevent dragging closed linestrings by the connecting node
          if ((segmentDataMatch.geometry.getType() ===
              _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].LINE_STRING ||
              segmentDataMatch.geometry.getType() ===
              _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].MULTI_LINE_STRING) &&
              componentSegments[uid][0] &&
              componentSegments[uid][0].index === 0) {
            continue;
          }

          this.dragSegments_.push([segmentDataMatch, 1]);
          componentSegments[uid][1] = segmentDataMatch;
        } else if (this.insertVertexCondition_(evt) && (0,_util_js__WEBPACK_IMPORTED_MODULE_16__.getUid)(segment) in this.vertexSegments_ &&
            (!componentSegments[uid][0] && !componentSegments[uid][1])) {
          insertVertices.push([segmentDataMatch, vertex]);
        }
      }
      if (insertVertices.length) {
        this.willModifyFeatures_(evt);
      }
      for (var j = insertVertices.length - 1; j >= 0; --j) {
        this.insertVertex_.apply(this, insertVertices[j]);
      }
    }
    return !!this.vertexFeature_;
  };

  /**
   * @inheritDoc
   */
  Modify.prototype.handleUpEvent = function handleUpEvent (evt) {
    for (var i = this.dragSegments_.length - 1; i >= 0; --i) {
      var segmentData = this.dragSegments_[i][0];
      var geometry = segmentData.geometry;
      if (geometry.getType() === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].RECTANGLE || geometry.getType() === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].ELLIPSE) {
        // Refresh rBush with all vertices of the feature.
        this.features_.remove(segmentData.feature);
        this.features_.push(segmentData.feature);
      } else if (geometry.getType() === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].CIRCLE) {
        // Update a circle object in the R* bush:
        var coordinates = geometry.getCenter();
        var centerSegmentData = segmentData.featureSegments[0];
        var circumferenceSegmentData = segmentData.featureSegments[1];
        centerSegmentData.segment[0] = centerSegmentData.segment[1] = coordinates;
        circumferenceSegmentData.segment[0] = circumferenceSegmentData.segment[1] = coordinates;
        this.rBush_.update((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.createOrUpdateFromCoordinate)(coordinates), centerSegmentData);
        this.rBush_.update(geometry.getExtent(), circumferenceSegmentData);
      } else {
        this.rBush_.update((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.boundingExtent)(segmentData.segment), segmentData);
      }
    }
    if (this.modified_) {
      this.dispatchEvent(new ModifyEvent(ModifyEventType.MODIFYEND, this.features_, evt));
      this.modified_ = false;
    }
    return false;
  };

  /**
   * @param {import("../MapBrowserEvent.js").default} evt Event.
   * @private
   */
  Modify.prototype.handlePointerMove_ = function handlePointerMove_ (evt) {
    this.lastPixel_ = evt.pixel;
    this.handlePointerAtPixel_(evt.pixel, evt.map);
  };

  /**
   * @param {import("../pixel.js").Pixel} pixel Pixel
   * @param {import("../PluggableMap.js").default} map Map.
   * @private
   */
  Modify.prototype.handlePointerAtPixel_ = function handlePointerAtPixel_ (pixel, map) {
    var pixelCoordinate = map.getCoordinateFromPixel(pixel);
    var sortByDistance = function(a, b) {
      return pointDistanceToSegmentDataSquared(pixelCoordinate, a) -
          pointDistanceToSegmentDataSquared(pixelCoordinate, b);
    };

    var box = (0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.buffer)((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.createOrUpdateFromCoordinate)(pixelCoordinate),
      map.getView().getResolution() * this.pixelTolerance_);

    var rBush = this.rBush_;
    var nodes = rBush.getInExtent(box);
    if (nodes.length > 0) {
      nodes.sort(sortByDistance);
      var node = nodes[0];
      var closestSegment = node.segment;
      var vertex = closestOnSegmentData(pixelCoordinate, node);
      var vertexPixel = map.getPixelFromCoordinate(vertex);
      var dist = (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.distance)(pixel, vertexPixel);
      if (dist <= this.pixelTolerance_) {
        /** @type {Object<string, boolean>} */
        var vertexSegments = {};

        if (node.geometry.getType() === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].CIRCLE &&
        node.index === CIRCLE_CIRCUMFERENCE_INDEX) {

          this.snappedToVertex_ = true;
          this.createOrUpdateVertexFeature_(vertex);
        } else {
          var pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
          var pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
          var squaredDist1 = (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.squaredDistance)(vertexPixel, pixel1);
          var squaredDist2 = (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.squaredDistance)(vertexPixel, pixel2);
          dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
          this.snappedToVertex_ = dist <= this.pixelTolerance_;
          if (this.snappedToVertex_) {
            vertex = squaredDist1 > squaredDist2 ? closestSegment[1] : closestSegment[0];
          }
          this.createOrUpdateVertexFeature_(vertex);
          for (var i = 1, ii = nodes.length; i < ii; ++i) {
            var segment = nodes[i].segment;
            if (((0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.equals)(closestSegment[0], segment[0]) &&
                (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.equals)(closestSegment[1], segment[1]) ||
                ((0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.equals)(closestSegment[0], segment[1]) &&
                (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.equals)(closestSegment[1], segment[0])))) {
              vertexSegments[(0,_util_js__WEBPACK_IMPORTED_MODULE_16__.getUid)(segment)] = true;
            } else {
              break;
            }
          }
        }

        vertexSegments[(0,_util_js__WEBPACK_IMPORTED_MODULE_16__.getUid)(closestSegment)] = true;
        this.vertexSegments_ = vertexSegments;
        return;
      }
    }
    if (this.vertexFeature_) {
      /** @type {VectorSource} */ (this.overlay_.getSource()).removeFeature(this.vertexFeature_);
      this.vertexFeature_ = null;
    }
  };

  /**
   * @param {SegmentData} segmentData Segment data.
   * @param {import("../coordinate.js").Coordinate} vertex Vertex.
   * @private
   */
  Modify.prototype.insertVertex_ = function insertVertex_ (segmentData, vertex) {
    var segment = segmentData.segment;
    var feature = segmentData.feature;
    var geometry = segmentData.geometry;
    var depth = segmentData.depth;
    var index = /** @type {number} */ (segmentData.index);
    var coordinates;

    while (vertex.length < geometry.getStride()) {
      vertex.push(0);
    }

    switch (geometry.getType()) {
      case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].MULTI_LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]].splice(index + 1, 0, vertex);
        break;
      case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[0]].splice(index + 1, 0, vertex);
        break;
      case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].MULTI_POLYGON:
        coordinates = geometry.getCoordinates();
        coordinates[depth[1]][depth[0]].splice(index + 1, 0, vertex);
        break;
      case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].LINE_STRING:
        coordinates = geometry.getCoordinates();
        coordinates.splice(index + 1, 0, vertex);
        break;
      default:
        return;
    }

    this.setGeometryCoordinates_(geometry, coordinates);
    var rTree = this.rBush_;
    rTree.remove(segmentData);
    this.updateSegmentIndices_(geometry, index, depth, 1);
    var newSegmentData = /** @type {SegmentData} */ ({
      segment: [segment[0], vertex],
      feature: feature,
      geometry: geometry,
      depth: depth,
      index: index
    });
    rTree.insert((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.boundingExtent)(newSegmentData.segment),
      newSegmentData);
    this.dragSegments_.push([newSegmentData, 1]);

    var newSegmentData2 = /** @type {SegmentData} */ ({
      segment: [vertex, segment[1]],
      feature: feature,
      geometry: geometry,
      depth: depth,
      index: index + 1
    });
    rTree.insert((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.boundingExtent)(newSegmentData2.segment), newSegmentData2);
    this.dragSegments_.push([newSegmentData2, 0]);
    this.ignoreNextSingleClick_ = true;
  };

  /**
   * Removes the vertex currently being pointed.
   * @return {boolean} True when a vertex was removed.
   * @api
   */
  Modify.prototype.removePoint = function removePoint () {
    if (this.lastPointerEvent_ && this.lastPointerEvent_.type != _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_13__["default"].POINTERDRAG) {
      var evt = this.lastPointerEvent_;
      this.willModifyFeatures_(evt);
      this.removeVertex_();
      this.dispatchEvent(new ModifyEvent(ModifyEventType.MODIFYEND, this.features_, evt));
      this.modified_ = false;
      return true;
    }
    return false;
  };

  /**
   * Removes a vertex from all matching features.
   * @return {boolean} True when a vertex was removed.
   * @private
   */
  Modify.prototype.removeVertex_ = function removeVertex_ () {
    var dragSegments = this.dragSegments_;
    var segmentsByFeature = {};
    var deleted = false;
    var component, coordinates, dragSegment, geometry, i, index, left;
    var newIndex, right, segmentData, uid;
    for (i = dragSegments.length - 1; i >= 0; --i) {
      dragSegment = dragSegments[i];
      segmentData = dragSegment[0];
      uid = (0,_util_js__WEBPACK_IMPORTED_MODULE_16__.getUid)(segmentData.feature);
      if (segmentData.depth) {
        // separate feature components
        uid += '-' + segmentData.depth.join('-');
      }
      if (!(uid in segmentsByFeature)) {
        segmentsByFeature[uid] = {};
      }
      if (dragSegment[1] === 0) {
        segmentsByFeature[uid].right = segmentData;
        segmentsByFeature[uid].index = segmentData.index;
      } else if (dragSegment[1] == 1) {
        segmentsByFeature[uid].left = segmentData;
        segmentsByFeature[uid].index = segmentData.index + 1;
      }

    }
    for (uid in segmentsByFeature) {
      right = segmentsByFeature[uid].right;
      left = segmentsByFeature[uid].left;
      index = segmentsByFeature[uid].index;
      newIndex = index - 1;
      if (left !== undefined) {
        segmentData = left;
      } else {
        segmentData = right;
      }
      if (newIndex < 0) {
        newIndex = 0;
      }
      geometry = segmentData.geometry;
      coordinates = geometry.getCoordinates();
      component = coordinates;
      deleted = false;
      switch (geometry.getType()) {
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].MULTI_LINE_STRING:
          if (coordinates[segmentData.depth[0]].length > 2) {
            coordinates[segmentData.depth[0]].splice(index, 1);
            deleted = true;
          }
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].LINE_STRING:
          if (coordinates.length > 2) {
            coordinates.splice(index, 1);
            deleted = true;
          }
          break;
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].MULTI_POLYGON:
          component = component[segmentData.depth[1]];
          /* falls through */
        case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].POLYGON:
          component = component[segmentData.depth[0]];
          if (component.length > 4) {
            if (index == component.length - 1) {
              index = 0;
            }
            component.splice(index, 1);
            deleted = true;
            if (index === 0) {
              // close the ring again
              component.pop();
              component.push(component[0]);
              newIndex = component.length - 1;
            }
          }
          break;
        default:
          // pass
      }

      if (deleted) {
        this.setGeometryCoordinates_(geometry, coordinates);
        var segments = [];
        if (left !== undefined) {
          this.rBush_.remove(left);
          segments.push(left.segment[0]);
        }
        if (right !== undefined) {
          this.rBush_.remove(right);
          segments.push(right.segment[1]);
        }
        if (left !== undefined && right !== undefined) {
          var newSegmentData = /** @type {SegmentData} */ ({
            depth: segmentData.depth,
            feature: segmentData.feature,
            geometry: segmentData.geometry,
            index: newIndex,
            segment: segments
          });
          this.rBush_.insert((0,_extent_js__WEBPACK_IMPORTED_MODULE_10__.boundingExtent)(newSegmentData.segment),
            newSegmentData);
        }
        this.updateSegmentIndices_(geometry, index, segmentData.depth, -1);
        if (this.vertexFeature_) {
          /** @type {VectorSource} */ (this.overlay_.getSource()).removeFeature(this.vertexFeature_);
          this.vertexFeature_ = null;
        }
        dragSegments.length = 0;
      }

    }
    return deleted;
  };

  /**
   * @param {import("../geom/SimpleGeometry.js").default} geometry Geometry.
   * @param {Array} coordinates Coordinates.
   * @private
   */
  Modify.prototype.setGeometryCoordinates_ = function setGeometryCoordinates_ (geometry, coordinates) {
    this.changingFeature_ = true;
    geometry.setCoordinates(coordinates);
    this.changingFeature_ = false;
  };

  /**
   * @param {import("../geom/SimpleGeometry.js").default} geometry Geometry.
   * @param {number} index Index.
   * @param {Array<number>|undefined} depth Depth.
   * @param {number} delta Delta (1 or -1).
   * @private
   */
  Modify.prototype.updateSegmentIndices_ = function updateSegmentIndices_ (geometry, index, depth, delta) {
    this.rBush_.forEachInExtent(geometry.getExtent(), function(segmentDataMatch) {
      if (segmentDataMatch.geometry === geometry &&
          (depth === undefined || segmentDataMatch.depth === undefined ||
          (0,_array_js__WEBPACK_IMPORTED_MODULE_17__.equals)(segmentDataMatch.depth, depth)) &&
          segmentDataMatch.index > index) {
        segmentDataMatch.index += delta;
      }
    });
  };

  return Modify;
}(_Pointer_js__WEBPACK_IMPORTED_MODULE_18__["default"]));


/**
 * @param {SegmentData} a The first segment data.
 * @param {SegmentData} b The second segment data.
 * @return {number} The difference in indexes.
 */
function compareIndexes(a, b) {
  return a.index - b.index;
}


/**
 * Returns the distance from a point to a line segment.
 *
 * @param {import("../coordinate.js").Coordinate} pointCoordinates The coordinates of the point from
 *        which to calculate the distance.
 * @param {SegmentData} segmentData The object describing the line
 *        segment we are calculating the distance to.
 * @return {number} The square of the distance between a point and a line segment.
 */
function pointDistanceToSegmentDataSquared(pointCoordinates, segmentData) {
  var geometry = segmentData.geometry;

  if (geometry.getType() === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].CIRCLE) {
    var circleGeometry = /** @type {import("../geom/Circle.js").default} */ (geometry);

    if (segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX) {
      var distanceToCenterSquared =
            (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.squaredDistance)(circleGeometry.getCenter(), pointCoordinates);
      var distanceToCircumference =
            Math.sqrt(distanceToCenterSquared) - circleGeometry.getRadius();
      return distanceToCircumference * distanceToCircumference;
    }
  }
  return (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.squaredDistanceToSegment)(pointCoordinates, segmentData.segment);
}

/**
 * Returns the point closest to a given line segment.
 *
 * @param {import("../coordinate.js").Coordinate} pointCoordinates The point to which a closest point
 *        should be found.
 * @param {SegmentData} segmentData The object describing the line
 *        segment which should contain the closest point.
 * @return {import("../coordinate.js").Coordinate} The point closest to the specified line segment.
 */
function closestOnSegmentData(pointCoordinates, segmentData) {
  var geometry = segmentData.geometry;

  if (geometry.getType() === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].CIRCLE &&
  segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX) {
    return geometry.getClosestPoint(pointCoordinates);
  } else if (geometry.getType() === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].ELLIPSE || geometry.getType() === _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].RECTANGLE) {
    return geometry.getClosestPoint(pointCoordinates);
  }
  return (0,_coordinate_js__WEBPACK_IMPORTED_MODULE_15__.closestOnSegment)(pointCoordinates, segmentData.segment);
}


/**
 * @return {import("../style/Style.js").StyleFunction} Styles.
 */
function getDefaultStyleFunction() {
  var style = (0,_style_Style_js__WEBPACK_IMPORTED_MODULE_19__.createEditingStyle)();
  return function(feature, resolution) {
    return style[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_14__["default"].POINT];
  };
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Modify);

//# sourceMappingURL=Modify.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/interaction/Pointer.js":
/*!********************************************************!*\
  !*** ./node_modules/@biigle/ol/interaction/Pointer.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "centroid": () => (/* binding */ centroid),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../MapBrowserEventType.js */ "./node_modules/@biigle/ol/MapBrowserEventType.js");
/* harmony import */ var _Interaction_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Interaction.js */ "./node_modules/@biigle/ol/interaction/Interaction.js");
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../obj.js */ "./node_modules/@biigle/ol/obj.js");
/**
 * @module ol/interaction/Pointer
 */





/**
 * @typedef {Object} Options
 * @property {function(import("../MapBrowserPointerEvent.js").default):boolean} [handleDownEvent]
 * Function handling "down" events. If the function returns `true` then a drag
 * sequence is started.
 * @property {function(import("../MapBrowserPointerEvent.js").default)} [handleDragEvent]
 * Function handling "drag" events. This function is called on "move" events
 * during a drag sequence.
 * @property {function(import("../MapBrowserEvent.js").default):boolean} [handleEvent]
 * Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. The function may return `false` to prevent the
 * propagation of the event to other interactions in the map's interactions
 * chain.
 * @property {function(import("../MapBrowserPointerEvent.js").default)} [handleMoveEvent]
 * Function handling "move" events. This function is called on "move" events,
 * also during a drag sequence (so during a drag sequence both the
 * `handleDragEvent` function and this function are called).
 * @property {function(import("../MapBrowserPointerEvent.js").default):boolean} [handleUpEvent]
 *  Function handling "up" events. If the function returns `false` then the
 * current drag sequence is stopped.
 * @property {function(boolean):boolean} [stopDown]
 * Should the down event be propagated to other interactions, or should be
 * stopped?
 */


/**
 * @classdesc
 * Base class that calls user-defined functions on `down`, `move` and `up`
 * events. This class also manages "drag sequences".
 *
 * When the `handleDownEvent` user function returns `true` a drag sequence is
 * started. During a drag sequence the `handleDragEvent` user function is
 * called on `move` events. The drag sequence ends when the `handleUpEvent`
 * user function is called and returns `false`.
 * @api
 */
var PointerInteraction = /*@__PURE__*/(function (Interaction) {
  function PointerInteraction(opt_options) {

    var options = opt_options ? opt_options : {};

    Interaction.call(/** @type {import("./Interaction.js").InteractionOptions} */ this, (options));

    if (options.handleDownEvent) {
      this.handleDownEvent = options.handleDownEvent;
    }

    if (options.handleDragEvent) {
      this.handleDragEvent = options.handleDragEvent;
    }

    if (options.handleMoveEvent) {
      this.handleMoveEvent = options.handleMoveEvent;
    }

    if (options.handleUpEvent) {
      this.handleUpEvent = options.handleUpEvent;
    }

    if (options.stopDown) {
      this.stopDown = options.stopDown;
    }

    /**
     * @type {boolean}
     * @protected
     */
    this.handlingDownUpSequence = false;

    /**
     * @type {!Object<string, import("../pointer/PointerEvent.js").default>}
     * @private
     */
    this.trackedPointers_ = {};

    /**
     * @type {Array<import("../pointer/PointerEvent.js").default>}
     * @protected
     */
    this.targetPointers = [];

  }

  if ( Interaction ) PointerInteraction.__proto__ = Interaction;
  PointerInteraction.prototype = Object.create( Interaction && Interaction.prototype );
  PointerInteraction.prototype.constructor = PointerInteraction;

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   * @protected
   */
  PointerInteraction.prototype.handleDownEvent = function handleDownEvent (mapBrowserEvent) {
    return false;
  };

  /**
   * Handle pointer drag events.
   * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
   * @protected
   */
  PointerInteraction.prototype.handleDragEvent = function handleDragEvent (mapBrowserEvent) {};

  /**
   * Handles the {@link module:ol/MapBrowserEvent map browser event} and may call into
   * other functions, if event sequences like e.g. 'drag' or 'down-up' etc. are
   * detected.
   * @override
   * @api
   */
  PointerInteraction.prototype.handleEvent = function handleEvent (mapBrowserEvent) {
    if (!(/** @type {import("../MapBrowserPointerEvent.js").default} */ (mapBrowserEvent).pointerEvent)) {
      return true;
    }

    var stopEvent = false;
    this.updateTrackedPointers_(mapBrowserEvent);
    if (this.handlingDownUpSequence) {
      if (mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].POINTERDRAG) {
        this.handleDragEvent(mapBrowserEvent);
      } else if (mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].POINTERUP) {
        var handledUp = this.handleUpEvent(mapBrowserEvent);
        this.handlingDownUpSequence = handledUp && this.targetPointers.length > 0;
      }
    } else {
      if (mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].POINTERDOWN) {
        var handled = this.handleDownEvent(mapBrowserEvent);
        if (handled) {
          mapBrowserEvent.preventDefault();
        }
        this.handlingDownUpSequence = handled;
        stopEvent = this.stopDown(handled);
      } else if (mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].POINTERMOVE) {
        this.handleMoveEvent(mapBrowserEvent);
      }
    }
    return !stopEvent;
  };

  /**
   * Handle pointer move events.
   * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
   * @protected
   */
  PointerInteraction.prototype.handleMoveEvent = function handleMoveEvent (mapBrowserEvent) {};

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   * @protected
   */
  PointerInteraction.prototype.handleUpEvent = function handleUpEvent (mapBrowserEvent) {
    return false;
  };

  /**
   * This function is used to determine if "down" events should be propagated
   * to other interactions or should be stopped.
   * @param {boolean} handled Was the event handled by the interaction?
   * @return {boolean} Should the `down` event be stopped?
   */
  PointerInteraction.prototype.stopDown = function stopDown (handled) {
    return handled;
  };

  /**
   * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
   * @private
   */
  PointerInteraction.prototype.updateTrackedPointers_ = function updateTrackedPointers_ (mapBrowserEvent) {
    if (isPointerDraggingEvent(mapBrowserEvent)) {
      var event = mapBrowserEvent.pointerEvent;

      var id = event.pointerId.toString();
      if (mapBrowserEvent.type == _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].POINTERUP) {
        delete this.trackedPointers_[id];
      } else if (mapBrowserEvent.type ==
          _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].POINTERDOWN) {
        this.trackedPointers_[id] = event;
      } else if (id in this.trackedPointers_) {
        // update only when there was a pointerdown event for this pointer
        this.trackedPointers_[id] = event;
      }
      this.targetPointers = (0,_obj_js__WEBPACK_IMPORTED_MODULE_1__.getValues)(this.trackedPointers_);
    }
  };

  return PointerInteraction;
}(_Interaction_js__WEBPACK_IMPORTED_MODULE_2__["default"]));


/**
 * @param {Array<import("../pointer/PointerEvent.js").default>} pointerEvents List of events.
 * @return {import("../pixel.js").Pixel} Centroid pixel.
 */
function centroid(pointerEvents) {
  var length = pointerEvents.length;
  var clientX = 0;
  var clientY = 0;
  for (var i = 0; i < length; i++) {
    clientX += pointerEvents[i].clientX;
    clientY += pointerEvents[i].clientY;
  }
  return [clientX / length, clientY / length];
}


/**
 * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
 * @return {boolean} Whether the event is a pointerdown, pointerdrag
 *     or pointerup event.
 */
function isPointerDraggingEvent(mapBrowserEvent) {
  var type = mapBrowserEvent.type;
  return type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].POINTERDOWN ||
    type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].POINTERDRAG ||
    type === _MapBrowserEventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].POINTERUP;
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PointerInteraction);

//# sourceMappingURL=Pointer.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/interaction/Property.js":
/*!*********************************************************!*\
  !*** ./node_modules/@biigle/ol/interaction/Property.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/interaction/Property
 */

/**
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  ACTIVE: 'active'
});

//# sourceMappingURL=Property.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/layer/Base.js":
/*!***********************************************!*\
  !*** ./node_modules/@biigle/ol/layer/Base.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var _Object_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../Object.js */ "./node_modules/@biigle/ol/Object.js");
/* harmony import */ var _Property_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Property.js */ "./node_modules/@biigle/ol/layer/Property.js");
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../math.js */ "./node_modules/@biigle/ol/math.js");
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../obj.js */ "./node_modules/@biigle/ol/obj.js");
/**
 * @module ol/layer/Base
 */







/**
 * @typedef {Object} Options
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 */


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Note that with {@link module:ol/layer/Base} and all its subclasses, any property set in
 * the options is set as a {@link module:ol/Object} property on the layer object, so
 * is observable, and has get/set accessors.
 *
 * @api
 */
var BaseLayer = /*@__PURE__*/(function (BaseObject) {
  function BaseLayer(options) {

    BaseObject.call(this);

    /**
     * @type {Object<string, *>}
     */
    var properties = (0,_obj_js__WEBPACK_IMPORTED_MODULE_0__.assign)({}, options);
    properties[_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].OPACITY] =
       options.opacity !== undefined ? options.opacity : 1;
    properties[_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].VISIBLE] =
       options.visible !== undefined ? options.visible : true;
    properties[_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].Z_INDEX] = options.zIndex;
    properties[_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].MAX_RESOLUTION] =
       options.maxResolution !== undefined ? options.maxResolution : Infinity;
    properties[_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].MIN_RESOLUTION] =
       options.minResolution !== undefined ? options.minResolution : 0;

    this.setProperties(properties);

    /**
     * @type {import("./Layer.js").State}
     * @private
     */
    this.state_ = null;

    /**
     * The layer type.
     * @type {import("../LayerType.js").default}
     * @protected;
     */
    this.type;

  }

  if ( BaseObject ) BaseLayer.__proto__ = BaseObject;
  BaseLayer.prototype = Object.create( BaseObject && BaseObject.prototype );
  BaseLayer.prototype.constructor = BaseLayer;

  /**
   * Get the layer type (used when creating a layer renderer).
   * @return {import("../LayerType.js").default} The layer type.
   */
  BaseLayer.prototype.getType = function getType () {
    return this.type;
  };

  /**
   * @return {import("./Layer.js").State} Layer state.
   */
  BaseLayer.prototype.getLayerState = function getLayerState () {
    /** @type {import("./Layer.js").State} */
    var state = this.state_ || /** @type {?} */ ({
      layer: this,
      managed: true
    });
    state.opacity = (0,_math_js__WEBPACK_IMPORTED_MODULE_2__.clamp)(this.getOpacity(), 0, 1);
    state.sourceState = this.getSourceState();
    state.visible = this.getVisible();
    state.extent = this.getExtent();
    state.zIndex = this.getZIndex() || 0;
    state.maxResolution = this.getMaxResolution();
    state.minResolution = Math.max(this.getMinResolution(), 0);
    this.state_ = state;

    return state;
  };

  /**
   * @abstract
   * @param {Array<import("./Layer.js").default>=} opt_array Array of layers (to be
   *     modified in place).
   * @return {Array<import("./Layer.js").default>} Array of layers.
   */
  BaseLayer.prototype.getLayersArray = function getLayersArray (opt_array) {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_3__.abstract)();
  };

  /**
   * @abstract
   * @param {Array<import("./Layer.js").State>=} opt_states Optional list of layer
   *     states (to be modified in place).
   * @return {Array<import("./Layer.js").State>} List of layer states.
   */
  BaseLayer.prototype.getLayerStatesArray = function getLayerStatesArray (opt_states) {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_3__.abstract)();
  };

  /**
   * Return the {@link module:ol/extent~Extent extent} of the layer or `undefined` if it
   * will be visible regardless of extent.
   * @return {import("../extent.js").Extent|undefined} The layer extent.
   * @observable
   * @api
   */
  BaseLayer.prototype.getExtent = function getExtent () {
    return (
      /** @type {import("../extent.js").Extent|undefined} */ (this.get(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].EXTENT))
    );
  };

  /**
   * Return the maximum resolution of the layer.
   * @return {number} The maximum resolution of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.getMaxResolution = function getMaxResolution () {
    return /** @type {number} */ (this.get(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].MAX_RESOLUTION));
  };

  /**
   * Return the minimum resolution of the layer.
   * @return {number} The minimum resolution of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.getMinResolution = function getMinResolution () {
    return /** @type {number} */ (this.get(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].MIN_RESOLUTION));
  };

  /**
   * Return the opacity of the layer (between 0 and 1).
   * @return {number} The opacity of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.getOpacity = function getOpacity () {
    return /** @type {number} */ (this.get(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].OPACITY));
  };

  /**
   * @abstract
   * @return {import("../source/State.js").default} Source state.
   */
  BaseLayer.prototype.getSourceState = function getSourceState () {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_3__.abstract)();
  };

  /**
   * Return the visibility of the layer (`true` or `false`).
   * @return {boolean} The visibility of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.getVisible = function getVisible () {
    return /** @type {boolean} */ (this.get(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].VISIBLE));
  };

  /**
   * Return the Z-index of the layer, which is used to order layers before
   * rendering. The default Z-index is 0.
   * @return {number} The Z-index of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.getZIndex = function getZIndex () {
    return /** @type {number} */ (this.get(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].Z_INDEX));
  };

  /**
   * Set the extent at which the layer is visible.  If `undefined`, the layer
   * will be visible at all extents.
   * @param {import("../extent.js").Extent|undefined} extent The extent of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.setExtent = function setExtent (extent) {
    this.set(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].EXTENT, extent);
  };

  /**
   * Set the maximum resolution at which the layer is visible.
   * @param {number} maxResolution The maximum resolution of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.setMaxResolution = function setMaxResolution (maxResolution) {
    this.set(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].MAX_RESOLUTION, maxResolution);
  };

  /**
   * Set the minimum resolution at which the layer is visible.
   * @param {number} minResolution The minimum resolution of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.setMinResolution = function setMinResolution (minResolution) {
    this.set(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].MIN_RESOLUTION, minResolution);
  };

  /**
   * Set the opacity of the layer, allowed values range from 0 to 1.
   * @param {number} opacity The opacity of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.setOpacity = function setOpacity (opacity) {
    this.set(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].OPACITY, opacity);
  };

  /**
   * Set the visibility of the layer (`true` or `false`).
   * @param {boolean} visible The visibility of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.setVisible = function setVisible (visible) {
    this.set(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].VISIBLE, visible);
  };

  /**
   * Set Z-index of the layer, which is used to order layers before rendering.
   * The default Z-index is 0.
   * @param {number} zindex The z-index of the layer.
   * @observable
   * @api
   */
  BaseLayer.prototype.setZIndex = function setZIndex (zindex) {
    this.set(_Property_js__WEBPACK_IMPORTED_MODULE_1__["default"].Z_INDEX, zindex);
  };

  return BaseLayer;
}(_Object_js__WEBPACK_IMPORTED_MODULE_4__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BaseLayer);

//# sourceMappingURL=Base.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/layer/Layer.js":
/*!************************************************!*\
  !*** ./node_modules/@biigle/ol/layer/Layer.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "visibleAtResolution": () => (/* binding */ visibleAtResolution),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../events.js */ "./node_modules/@biigle/ol/events.js");
/* harmony import */ var _events_EventType_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../events/EventType.js */ "./node_modules/@biigle/ol/events/EventType.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var _Object_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../Object.js */ "./node_modules/@biigle/ol/Object.js");
/* harmony import */ var _Base_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./Base.js */ "./node_modules/@biigle/ol/layer/Base.js");
/* harmony import */ var _Property_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Property.js */ "./node_modules/@biigle/ol/layer/Property.js");
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../obj.js */ "./node_modules/@biigle/ol/obj.js");
/* harmony import */ var _render_EventType_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../render/EventType.js */ "./node_modules/@biigle/ol/render/EventType.js");
/* harmony import */ var _source_State_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../source/State.js */ "./node_modules/@biigle/ol/source/State.js");
/**
 * @module ol/layer/Layer
 */











/**
 * @typedef {Object} Options
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {import("../source/Source.js").default} [source] Source for this layer.  If not provided to the constructor,
 * the source can be set by calling {@link module:ol/layer/Layer#setSource layer.setSource(source)} after
 * construction.
 * @property {import("../PluggableMap.js").default} [map] Map.
 */


/**
 * @typedef {Object} State
 * @property {import("./Base.js").default} layer
 * @property {number} opacity
 * @property {SourceState} sourceState
 * @property {boolean} visible
 * @property {boolean} managed
 * @property {import("../extent.js").Extent} [extent]
 * @property {number} zIndex
 * @property {number} maxResolution
 * @property {number} minResolution
 */

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * A visual representation of raster or vector map data.
 * Layers group together those properties that pertain to how the data is to be
 * displayed, irrespective of the source of that data.
 *
 * Layers are usually added to a map with {@link module:ol/Map#addLayer}. Components
 * like {@link module:ol/interaction/Select~Select} use unmanaged layers
 * internally. These unmanaged layers are associated with the map using
 * {@link module:ol/layer/Layer~Layer#setMap} instead.
 *
 * A generic `change` event is fired when the state of the source changes.
 *
 * @fires import("../render/Event.js").RenderEvent
 */
var Layer = /*@__PURE__*/(function (BaseLayer) {
  function Layer(options) {

    var baseOptions = (0,_obj_js__WEBPACK_IMPORTED_MODULE_0__.assign)({}, options);
    delete baseOptions.source;

    BaseLayer.call(this, baseOptions);

    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    this.mapPrecomposeKey_ = null;

    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    this.mapRenderKey_ = null;

    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    this.sourceChangeKey_ = null;

    if (options.map) {
      this.setMap(options.map);
    }

    (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.listen)(this,
      (0,_Object_js__WEBPACK_IMPORTED_MODULE_2__.getChangeEventType)(_Property_js__WEBPACK_IMPORTED_MODULE_3__["default"].SOURCE),
      this.handleSourcePropertyChange_, this);

    var source = options.source ? options.source : null;
    this.setSource(source);
  }

  if ( BaseLayer ) Layer.__proto__ = BaseLayer;
  Layer.prototype = Object.create( BaseLayer && BaseLayer.prototype );
  Layer.prototype.constructor = Layer;

  /**
   * @inheritDoc
   */
  Layer.prototype.getLayersArray = function getLayersArray (opt_array) {
    var array = opt_array ? opt_array : [];
    array.push(this);
    return array;
  };

  /**
   * @inheritDoc
   */
  Layer.prototype.getLayerStatesArray = function getLayerStatesArray (opt_states) {
    var states = opt_states ? opt_states : [];
    states.push(this.getLayerState());
    return states;
  };

  /**
   * Get the layer source.
   * @return {import("../source/Source.js").default} The layer source (or `null` if not yet set).
   * @observable
   * @api
   */
  Layer.prototype.getSource = function getSource () {
    var source = this.get(_Property_js__WEBPACK_IMPORTED_MODULE_3__["default"].SOURCE);
    return (
      /** @type {import("../source/Source.js").default} */ (source) || null
    );
  };

  /**
    * @inheritDoc
    */
  Layer.prototype.getSourceState = function getSourceState () {
    var source = this.getSource();
    return !source ? _source_State_js__WEBPACK_IMPORTED_MODULE_4__["default"].UNDEFINED : source.getState();
  };

  /**
   * @private
   */
  Layer.prototype.handleSourceChange_ = function handleSourceChange_ () {
    this.changed();
  };

  /**
   * @private
   */
  Layer.prototype.handleSourcePropertyChange_ = function handleSourcePropertyChange_ () {
    if (this.sourceChangeKey_) {
      (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.unlistenByKey)(this.sourceChangeKey_);
      this.sourceChangeKey_ = null;
    }
    var source = this.getSource();
    if (source) {
      this.sourceChangeKey_ = (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.listen)(source,
        _events_EventType_js__WEBPACK_IMPORTED_MODULE_5__["default"].CHANGE, this.handleSourceChange_, this);
    }
    this.changed();
  };

  /**
   * Sets the layer to be rendered on top of other layers on a map. The map will
   * not manage this layer in its layers collection, and the callback in
   * {@link module:ol/Map#forEachLayerAtPixel} will receive `null` as layer. This
   * is useful for temporary layers. To remove an unmanaged layer from the map,
   * use `#setMap(null)`.
   *
   * To add the layer to a map and have it managed by the map, use
   * {@link module:ol/Map#addLayer} instead.
   * @param {import("../PluggableMap.js").default} map Map.
   * @api
   */
  Layer.prototype.setMap = function setMap (map) {
    if (this.mapPrecomposeKey_) {
      (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.unlistenByKey)(this.mapPrecomposeKey_);
      this.mapPrecomposeKey_ = null;
    }
    if (!map) {
      this.changed();
    }
    if (this.mapRenderKey_) {
      (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.unlistenByKey)(this.mapRenderKey_);
      this.mapRenderKey_ = null;
    }
    if (map) {
      this.mapPrecomposeKey_ = (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.listen)(map, _render_EventType_js__WEBPACK_IMPORTED_MODULE_6__["default"].PRECOMPOSE, function(evt) {
        var renderEvent = /** @type {import("../render/Event.js").default} */ (evt);
        var layerState = this.getLayerState();
        layerState.managed = false;
        if (this.getZIndex() === undefined) {
          layerState.zIndex = Infinity;
        }
        renderEvent.frameState.layerStatesArray.push(layerState);
        renderEvent.frameState.layerStates[(0,_util_js__WEBPACK_IMPORTED_MODULE_7__.getUid)(this)] = layerState;
      }, this);
      this.mapRenderKey_ = (0,_events_js__WEBPACK_IMPORTED_MODULE_1__.listen)(this, _events_EventType_js__WEBPACK_IMPORTED_MODULE_5__["default"].CHANGE, map.render, map);
      this.changed();
    }
  };

  /**
   * Set the layer source.
   * @param {import("../source/Source.js").default} source The layer source.
   * @observable
   * @api
   */
  Layer.prototype.setSource = function setSource (source) {
    this.set(_Property_js__WEBPACK_IMPORTED_MODULE_3__["default"].SOURCE, source);
  };

  return Layer;
}(_Base_js__WEBPACK_IMPORTED_MODULE_8__["default"]));


/**
 * Return `true` if the layer is visible, and if the passed resolution is
 * between the layer's minResolution and maxResolution. The comparison is
 * inclusive for `minResolution` and exclusive for `maxResolution`.
 * @param {State} layerState Layer state.
 * @param {number} resolution Resolution.
 * @return {boolean} The layer is visible at the given resolution.
 */
function visibleAtResolution(layerState, resolution) {
  return layerState.visible && resolution >= layerState.minResolution &&
      resolution < layerState.maxResolution;
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Layer);

//# sourceMappingURL=Layer.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/layer/Property.js":
/*!***************************************************!*\
  !*** ./node_modules/@biigle/ol/layer/Property.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/layer/Property
 */

/**
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  OPACITY: 'opacity',
  VISIBLE: 'visible',
  EXTENT: 'extent',
  Z_INDEX: 'zIndex',
  MAX_RESOLUTION: 'maxResolution',
  MIN_RESOLUTION: 'minResolution',
  SOURCE: 'source'
});

//# sourceMappingURL=Property.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/layer/Vector.js":
/*!*************************************************!*\
  !*** ./node_modules/@biigle/ol/layer/Vector.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _LayerType_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../LayerType.js */ "./node_modules/@biigle/ol/LayerType.js");
/* harmony import */ var _Layer_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Layer.js */ "./node_modules/@biigle/ol/layer/Layer.js");
/* harmony import */ var _VectorRenderType_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./VectorRenderType.js */ "./node_modules/@biigle/ol/layer/VectorRenderType.js");
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../obj.js */ "./node_modules/@biigle/ol/obj.js");
/* harmony import */ var _style_Style_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../style/Style.js */ "./node_modules/@biigle/ol/style/Style.js");
/**
 * @module ol/layer/Vector
 */







/**
 * @typedef {Object} Options
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {import("../render.js").OrderFunction} [renderOrder] Render order. Function to be used when sorting
 * features before rendering. By default features are drawn in the order that they are created. Use
 * `null` to avoid the sort, but get an undefined draw order.
 * @property {number} [renderBuffer=100] The buffer in pixels around the viewport extent used by the
 * renderer when getting features from the vector source for the rendering or hit-detection.
 * Recommended value: the size of the largest symbol, line width or label.
 * @property {import("./VectorRenderType.js").default|string} [renderMode='vector'] Render mode for vector layers:
 *  * `'image'`: Vector layers are rendered as images. Great performance, but point symbols and
 *    texts are always rotated with the view and pixels are scaled during zoom animations.
 *  * `'vector'`: Vector layers are rendered as vectors. Most accurate rendering even during
 *    animations, but slower performance.
 * @property {import("../source/Vector.js").default} [source] Source.
 * @property {import("../PluggableMap.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use {@link module:ol/Map#addLayer}.
 * @property {boolean} [declutter=false] Declutter images and text. Decluttering is applied to all
 * image and text styles, and the priority is defined by the z-index of the style. Lower z-index
 * means higher priority.
 * @property {import("../style/Style.js").StyleLike} [style] Layer style. See
 * {@link module:ol/style} for default style which will be used if this is not defined.
 * @property {boolean} [updateWhileAnimating=false] When set to `true` and `renderMode`
 * is `vector`, feature batches will be recreated during animations. This means that no
 * vectors will be shown clipped, but the setting will have a performance impact for large
 * amounts of vector data. When set to `false`, batches will be recreated when no animation
 * is active.
 * @property {boolean} [updateWhileInteracting=false] When set to `true` and `renderMode`
 * is `vector`, feature batches will be recreated during interactions. See also
 * `updateWhileAnimating`.
 */


/**
 * @enum {string}
 * @private
 */
var Property = {
  RENDER_ORDER: 'renderOrder'
};


/**
 * @classdesc
 * Vector data that is rendered client-side.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @api
 */
var VectorLayer = /*@__PURE__*/(function (Layer) {
  function VectorLayer(opt_options) {
    var options = opt_options ?
      opt_options : /** @type {Options} */ ({});

    var baseOptions = (0,_obj_js__WEBPACK_IMPORTED_MODULE_0__.assign)({}, options);

    delete baseOptions.style;
    delete baseOptions.renderBuffer;
    delete baseOptions.updateWhileAnimating;
    delete baseOptions.updateWhileInteracting;
    Layer.call(this, baseOptions);

    /**
    * @private
    * @type {boolean}
    */
    this.declutter_ = options.declutter !== undefined ? options.declutter : false;

    /**
    * @type {number}
    * @private
    */
    this.renderBuffer_ = options.renderBuffer !== undefined ?
      options.renderBuffer : 100;

    /**
    * User provided style.
    * @type {import("../style/Style.js").StyleLike}
    * @private
    */
    this.style_ = null;

    /**
    * Style function for use within the library.
    * @type {import("../style/Style.js").StyleFunction|undefined}
    * @private
    */
    this.styleFunction_ = undefined;

    this.setStyle(options.style);

    /**
    * @type {boolean}
    * @private
    */
    this.updateWhileAnimating_ = options.updateWhileAnimating !== undefined ?
      options.updateWhileAnimating : false;

    /**
    * @type {boolean}
    * @private
    */
    this.updateWhileInteracting_ = options.updateWhileInteracting !== undefined ?
      options.updateWhileInteracting : false;

    /**
    * @private
    * @type {import("./VectorTileRenderType.js").default|string}
    */
    this.renderMode_ = options.renderMode || _VectorRenderType_js__WEBPACK_IMPORTED_MODULE_1__["default"].VECTOR;

    /**
    * The layer type.
    * @protected
    * @type {import("../LayerType.js").default}
    */
    this.type = _LayerType_js__WEBPACK_IMPORTED_MODULE_2__["default"].VECTOR;

  }

  if ( Layer ) VectorLayer.__proto__ = Layer;
  VectorLayer.prototype = Object.create( Layer && Layer.prototype );
  VectorLayer.prototype.constructor = VectorLayer;

  /**
  * @return {boolean} Declutter.
  */
  VectorLayer.prototype.getDeclutter = function getDeclutter () {
    return this.declutter_;
  };

  /**
  * @param {boolean} declutter Declutter.
  */
  VectorLayer.prototype.setDeclutter = function setDeclutter (declutter) {
    this.declutter_ = declutter;
  };

  /**
  * @return {number|undefined} Render buffer.
  */
  VectorLayer.prototype.getRenderBuffer = function getRenderBuffer () {
    return this.renderBuffer_;
  };

  /**
  * @return {function(import("../Feature.js").default, import("../Feature.js").default): number|null|undefined} Render
  *     order.
  */
  VectorLayer.prototype.getRenderOrder = function getRenderOrder () {
    return (
    /** @type {import("../render.js").OrderFunction|null|undefined} */ (this.get(Property.RENDER_ORDER))
    );
  };

  /**
  * Get the style for features.  This returns whatever was passed to the `style`
  * option at construction or to the `setStyle` method.
  * @return {import("../style/Style.js").StyleLike}
  *     Layer style.
  * @api
  */
  VectorLayer.prototype.getStyle = function getStyle () {
    return this.style_;
  };

  /**
  * Get the style function.
  * @return {import("../style/Style.js").StyleFunction|undefined} Layer style function.
  * @api
  */
  VectorLayer.prototype.getStyleFunction = function getStyleFunction () {
    return this.styleFunction_;
  };

  /**
  * @return {boolean} Whether the rendered layer should be updated while
  *     animating.
  */
  VectorLayer.prototype.getUpdateWhileAnimating = function getUpdateWhileAnimating () {
    return this.updateWhileAnimating_;
  };

  /**
  * @return {boolean} Whether the rendered layer should be updated while
  *     interacting.
  */
  VectorLayer.prototype.getUpdateWhileInteracting = function getUpdateWhileInteracting () {
    return this.updateWhileInteracting_;
  };

  /**
  * @param {import("../render.js").OrderFunction|null|undefined} renderOrder
  *     Render order.
  */
  VectorLayer.prototype.setRenderOrder = function setRenderOrder (renderOrder) {
    this.set(Property.RENDER_ORDER, renderOrder);
  };

  /**
  * Set the style for features.  This can be a single style object, an array
  * of styles, or a function that takes a feature and resolution and returns
  * an array of styles. If it is `undefined` the default style is used. If
  * it is `null` the layer has no style (a `null` style), so only features
  * that have their own styles will be rendered in the layer. See
  * {@link module:ol/style} for information on the default style.
  * @param {import("../style/Style.js").default|Array<import("../style/Style.js").default>|import("../style/Style.js").StyleFunction|null|undefined} style Layer style.
  * @api
  */
  VectorLayer.prototype.setStyle = function setStyle (style) {
    this.style_ = style !== undefined ? style : _style_Style_js__WEBPACK_IMPORTED_MODULE_3__.createDefaultStyle;
    this.styleFunction_ = style === null ?
      undefined : (0,_style_Style_js__WEBPACK_IMPORTED_MODULE_3__.toFunction)(this.style_);
    this.changed();
  };

  /**
  * @return {import("./VectorRenderType.js").default|string} The render mode.
  */
  VectorLayer.prototype.getRenderMode = function getRenderMode () {
    return this.renderMode_;
  };

  return VectorLayer;
}(_Layer_js__WEBPACK_IMPORTED_MODULE_4__["default"]));


/**
 * Return the associated {@link module:ol/source/Vector vectorsource} of the layer.
 * @function
 * @return {import("../source/Vector.js").default} Source.
 * @api
 */
VectorLayer.prototype.getSource;


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (VectorLayer);

//# sourceMappingURL=Vector.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/layer/VectorRenderType.js":
/*!***********************************************************!*\
  !*** ./node_modules/@biigle/ol/layer/VectorRenderType.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/layer/VectorRenderType
 */

/**
 * @enum {string}
 * Render mode for vector layers:
 *  * `'image'`: Vector layers are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'vector'`: Vector layers are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance.
 * @api
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  IMAGE: 'image',
  VECTOR: 'vector'
});

//# sourceMappingURL=VectorRenderType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/loadingstrategy.js":
/*!****************************************************!*\
  !*** ./node_modules/@biigle/ol/loadingstrategy.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "all": () => (/* binding */ all),
/* harmony export */   "bbox": () => (/* binding */ bbox),
/* harmony export */   "tile": () => (/* binding */ tile)
/* harmony export */ });
/**
 * @module ol/loadingstrategy
 */


/**
 * Strategy function for loading all features with a single request.
 * @param {import("./extent.js").Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {Array<import("./extent.js").Extent>} Extents.
 * @api
 */
function all(extent, resolution) {
  return [[-Infinity, -Infinity, Infinity, Infinity]];
}


/**
 * Strategy function for loading features based on the view's extent and
 * resolution.
 * @param {import("./extent.js").Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {Array<import("./extent.js").Extent>} Extents.
 * @api
 */
function bbox(extent, resolution) {
  return [extent];
}


/**
 * Creates a strategy function for loading features based on a tile grid.
 * @param {import("./tilegrid/TileGrid.js").default} tileGrid Tile grid.
 * @return {function(import("./extent.js").Extent, number): Array<import("./extent.js").Extent>} Loading strategy.
 * @api
 */
function tile(tileGrid) {
  return (
    /**
     * @param {import("./extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @return {Array<import("./extent.js").Extent>} Extents.
     */
    function(extent, resolution) {
      var z = tileGrid.getZForResolution(resolution);
      var tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
      /** @type {Array<import("./extent.js").Extent>} */
      var extents = [];
      /** @type {import("./tilecoord.js").TileCoord} */
      var tileCoord = [z, 0, 0];
      for (tileCoord[1] = tileRange.minX; tileCoord[1] <= tileRange.maxX; ++tileCoord[1]) {
        for (tileCoord[2] = tileRange.minY; tileCoord[2] <= tileRange.maxY; ++tileCoord[2]) {
          extents.push(tileGrid.getTileCoordExtent(tileCoord));
        }
      }
      return extents;
    }
  );
}

//# sourceMappingURL=loadingstrategy.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/math.js":
/*!*****************************************!*\
  !*** ./node_modules/@biigle/ol/math.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "clamp": () => (/* binding */ clamp),
/* harmony export */   "cosh": () => (/* binding */ cosh),
/* harmony export */   "roundUpToPowerOfTwo": () => (/* binding */ roundUpToPowerOfTwo),
/* harmony export */   "squaredSegmentDistance": () => (/* binding */ squaredSegmentDistance),
/* harmony export */   "squaredDistance": () => (/* binding */ squaredDistance),
/* harmony export */   "solveLinearSystem": () => (/* binding */ solveLinearSystem),
/* harmony export */   "toDegrees": () => (/* binding */ toDegrees),
/* harmony export */   "toRadians": () => (/* binding */ toRadians),
/* harmony export */   "modulo": () => (/* binding */ modulo),
/* harmony export */   "lerp": () => (/* binding */ lerp)
/* harmony export */ });
/* harmony import */ var _asserts_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./asserts.js */ "./node_modules/@biigle/ol/asserts.js");
/**
 * @module ol/math
 */


/**
 * Takes a number and clamps it to within the provided bounds.
 * @param {number} value The input number.
 * @param {number} min The minimum value to return.
 * @param {number} max The maximum value to return.
 * @return {number} The input number if it is within bounds, or the nearest
 *     number within the bounds.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}


/**
 * Return the hyperbolic cosine of a given number. The method will use the
 * native `Math.cosh` function if it is available, otherwise the hyperbolic
 * cosine will be calculated via the reference implementation of the Mozilla
 * developer network.
 *
 * @param {number} x X.
 * @return {number} Hyperbolic cosine of x.
 */
var cosh = (function() {
  // Wrapped in a iife, to save the overhead of checking for the native
  // implementation on every invocation.
  var cosh;
  if ('cosh' in Math) {
    // The environment supports the native Math.cosh function, use it…
    cosh = Math.cosh;
  } else {
    // … else, use the reference implementation of MDN:
    cosh = function(x) {
      var y = /** @type {Math} */ (Math).exp(x);
      return (y + 1 / y) / 2;
    };
  }
  return cosh;
}());


/**
 * @param {number} x X.
 * @return {number} The smallest power of two greater than or equal to x.
 */
function roundUpToPowerOfTwo(x) {
  (0,_asserts_js__WEBPACK_IMPORTED_MODULE_0__.assert)(0 < x, 29); // `x` must be greater than `0`
  return Math.pow(2, Math.ceil(Math.log(x) / Math.LN2));
}


/**
 * Returns the square of the closest distance between the point (x, y) and the
 * line segment (x1, y1) to (x2, y2).
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} x1 X1.
 * @param {number} y1 Y1.
 * @param {number} x2 X2.
 * @param {number} y2 Y2.
 * @return {number} Squared distance.
 */
function squaredSegmentDistance(x, y, x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  if (dx !== 0 || dy !== 0) {
    var t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x1 = x2;
      y1 = y2;
    } else if (t > 0) {
      x1 += dx * t;
      y1 += dy * t;
    }
  }
  return squaredDistance(x, y, x1, y1);
}


/**
 * Returns the square of the distance between the points (x1, y1) and (x2, y2).
 * @param {number} x1 X1.
 * @param {number} y1 Y1.
 * @param {number} x2 X2.
 * @param {number} y2 Y2.
 * @return {number} Squared distance.
 */
function squaredDistance(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return dx * dx + dy * dy;
}


/**
 * Solves system of linear equations using Gaussian elimination method.
 *
 * @param {Array<Array<number>>} mat Augmented matrix (n x n + 1 column)
 *                                     in row-major order.
 * @return {Array<number>} The resulting vector.
 */
function solveLinearSystem(mat) {
  var n = mat.length;

  for (var i = 0; i < n; i++) {
    // Find max in the i-th column (ignoring i - 1 first rows)
    var maxRow = i;
    var maxEl = Math.abs(mat[i][i]);
    for (var r = i + 1; r < n; r++) {
      var absValue = Math.abs(mat[r][i]);
      if (absValue > maxEl) {
        maxEl = absValue;
        maxRow = r;
      }
    }

    if (maxEl === 0) {
      return null; // matrix is singular
    }

    // Swap max row with i-th (current) row
    var tmp = mat[maxRow];
    mat[maxRow] = mat[i];
    mat[i] = tmp;

    // Subtract the i-th row to make all the remaining rows 0 in the i-th column
    for (var j = i + 1; j < n; j++) {
      var coef = -mat[j][i] / mat[i][i];
      for (var k = i; k < n + 1; k++) {
        if (i == k) {
          mat[j][k] = 0;
        } else {
          mat[j][k] += coef * mat[i][k];
        }
      }
    }
  }

  // Solve Ax=b for upper triangular matrix A (mat)
  var x = new Array(n);
  for (var l = n - 1; l >= 0; l--) {
    x[l] = mat[l][n] / mat[l][l];
    for (var m = l - 1; m >= 0; m--) {
      mat[m][n] -= mat[m][l] * x[l];
    }
  }
  return x;
}


/**
 * Converts radians to to degrees.
 *
 * @param {number} angleInRadians Angle in radians.
 * @return {number} Angle in degrees.
 */
function toDegrees(angleInRadians) {
  return angleInRadians * 180 / Math.PI;
}


/**
 * Converts degrees to radians.
 *
 * @param {number} angleInDegrees Angle in degrees.
 * @return {number} Angle in radians.
 */
function toRadians(angleInDegrees) {
  return angleInDegrees * Math.PI / 180;
}

/**
 * Returns the modulo of a / b, depending on the sign of b.
 *
 * @param {number} a Dividend.
 * @param {number} b Divisor.
 * @return {number} Modulo.
 */
function modulo(a, b) {
  var r = a % b;
  return r * b < 0 ? r + b : r;
}

/**
 * Calculates the linearly interpolated value of x between a and b.
 *
 * @param {number} a Number
 * @param {number} b Number
 * @param {number} x Value to be interpolated.
 * @return {number} Interpolated value.
 */
function lerp(a, b, x) {
  return a + x * (b - a);
}

//# sourceMappingURL=math.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/obj.js":
/*!****************************************!*\
  !*** ./node_modules/@biigle/ol/obj.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "assign": () => (/* binding */ assign),
/* harmony export */   "clear": () => (/* binding */ clear),
/* harmony export */   "getValues": () => (/* binding */ getValues),
/* harmony export */   "isEmpty": () => (/* binding */ isEmpty)
/* harmony export */ });
/**
 * @module ol/obj
 */


/**
 * Polyfill for Object.assign().  Assigns enumerable and own properties from
 * one or more source objects to a target object.
 * See https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign.
 *
 * @param {!Object} target The target object.
 * @param {...Object} var_sources The source object(s).
 * @return {!Object} The modified target object.
 */
var assign = (typeof Object.assign === 'function') ? Object.assign : function(target, var_sources) {
  var arguments$1 = arguments;

  if (target === undefined || target === null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var output = Object(target);
  for (var i = 1, ii = arguments.length; i < ii; ++i) {
    var source = arguments$1[i];
    if (source !== undefined && source !== null) {
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          output[key] = source[key];
        }
      }
    }
  }
  return output;
};


/**
 * Removes all properties from an object.
 * @param {Object} object The object to clear.
 */
function clear(object) {
  for (var property in object) {
    delete object[property];
  }
}


/**
 * Get an array of property values from an object.
 * @param {Object<K,V>} object The object from which to get the values.
 * @return {!Array<V>} The property values.
 * @template K,V
 */
function getValues(object) {
  var values = [];
  for (var property in object) {
    values.push(object[property]);
  }
  return values;
}


/**
 * Determine if an object has any properties.
 * @param {Object} object The object to check.
 * @return {boolean} The object is empty.
 */
function isEmpty(object) {
  var property;
  for (property in object) {
    return false;
  }
  return !property;
}

//# sourceMappingURL=obj.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/pointer/EventSource.js":
/*!********************************************************!*\
  !*** ./node_modules/@biigle/ol/pointer/EventSource.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/pointer/EventSource
 */

var EventSource = function EventSource(dispatcher, mapping) {

  /**
   * @type {import("./PointerEventHandler.js").default}
   */
  this.dispatcher = dispatcher;

  /**
   * @private
   * @const
   * @type {!Object<string, function(Event)>}
   */
  this.mapping_ = mapping;
};

/**
 * List of events supported by this source.
 * @return {Array<string>} Event names
 */
EventSource.prototype.getEvents = function getEvents () {
  return Object.keys(this.mapping_);
};

/**
 * Returns the handler that should handle a given event type.
 * @param {string} eventType The event type.
 * @return {function(Event)} Handler
 */
EventSource.prototype.getHandlerForEvent = function getHandlerForEvent (eventType) {
  return this.mapping_[eventType];
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (EventSource);

//# sourceMappingURL=EventSource.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/pointer/MouseSource.js":
/*!********************************************************!*\
  !*** ./node_modules/@biigle/ol/pointer/MouseSource.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "POINTER_ID": () => (/* binding */ POINTER_ID),
/* harmony export */   "POINTER_TYPE": () => (/* binding */ POINTER_TYPE),
/* harmony export */   "prepareEvent": () => (/* binding */ prepareEvent),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _EventSource_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EventSource.js */ "./node_modules/@biigle/ol/pointer/EventSource.js");
/**
 * @module ol/pointer/MouseSource
 */

// Based on https://github.com/Polymer/PointerEvents

// Copyright (c) 2013 The Polymer Authors. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
// * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
// * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.




/**
 * @type {number}
 */
var POINTER_ID = 1;


/**
 * @type {string}
 */
var POINTER_TYPE = 'mouse';


/**
 * Radius around touchend that swallows mouse events.
 *
 * @type {number}
 */
var DEDUP_DIST = 25;

/**
 * Handler for `mousedown`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mousedown(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    // TODO(dfreedman) workaround for some elements not sending mouseup
    // http://crbug/149091
    if (POINTER_ID.toString() in this.pointerMap) {
      this.cancel(inEvent);
    }
    var e = prepareEvent(inEvent, this.dispatcher);
    this.pointerMap[POINTER_ID.toString()] = inEvent;
    this.dispatcher.down(e, inEvent);
  }
}

/**
 * Handler for `mousemove`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mousemove(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    var e = prepareEvent(inEvent, this.dispatcher);
    this.dispatcher.move(e, inEvent);
  }
}

/**
 * Handler for `mouseup`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mouseup(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    var p = this.pointerMap[POINTER_ID.toString()];

    if (p && p.button === inEvent.button) {
      var e = prepareEvent(inEvent, this.dispatcher);
      this.dispatcher.up(e, inEvent);
      this.cleanupMouse();
    }
  }
}

/**
 * Handler for `mouseover`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mouseover(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    var e = prepareEvent(inEvent, this.dispatcher);
    this.dispatcher.enterOver(e, inEvent);
  }
}

/**
 * Handler for `mouseout`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mouseout(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    var e = prepareEvent(inEvent, this.dispatcher);
    this.dispatcher.leaveOut(e, inEvent);
  }
}


var MouseSource = /*@__PURE__*/(function (EventSource) {
  function MouseSource(dispatcher) {
    var mapping = {
      'mousedown': mousedown,
      'mousemove': mousemove,
      'mouseup': mouseup,
      'mouseover': mouseover,
      'mouseout': mouseout
    };
    EventSource.call(this, dispatcher, mapping);

    /**
     * @const
     * @type {!Object<string, Event|Object>}
     */
    this.pointerMap = dispatcher.pointerMap;

    /**
     * @const
     * @type {Array<import("../pixel.js").Pixel>}
     */
    this.lastTouches = [];
  }

  if ( EventSource ) MouseSource.__proto__ = EventSource;
  MouseSource.prototype = Object.create( EventSource && EventSource.prototype );
  MouseSource.prototype.constructor = MouseSource;

  /**
   * Detect if a mouse event was simulated from a touch by
   * checking if previously there was a touch event at the
   * same position.
   *
   * FIXME - Known problem with the native Android browser on
   * Samsung GT-I9100 (Android 4.1.2):
   * In case the page is scrolled, this function does not work
   * correctly when a canvas is used (WebGL or canvas renderer).
   * Mouse listeners on canvas elements (for this browser), create
   * two mouse events: One 'good' and one 'bad' one (on other browsers or
   * when a div is used, there is only one event). For the 'bad' one,
   * clientX/clientY and also pageX/pageY are wrong when the page
   * is scrolled. Because of that, this function can not detect if
   * the events were simulated from a touch event. As result, a
   * pointer event at a wrong position is dispatched, which confuses
   * the map interactions.
   * It is unclear, how one can get the correct position for the event
   * or detect that the positions are invalid.
   *
   * @private
   * @param {MouseEvent} inEvent The in event.
   * @return {boolean} True, if the event was generated by a touch.
   */
  MouseSource.prototype.isEventSimulatedFromTouch_ = function isEventSimulatedFromTouch_ (inEvent) {
    var lts = this.lastTouches;
    var x = inEvent.clientX;
    var y = inEvent.clientY;
    for (var i = 0, l = lts.length, t = (void 0); i < l && (t = lts[i]); i++) {
      // simulated mouse events will be swallowed near a primary touchend
      var dx = Math.abs(x - t[0]);
      var dy = Math.abs(y - t[1]);
      if (dx <= DEDUP_DIST && dy <= DEDUP_DIST) {
        return true;
      }
    }
    return false;
  };

  /**
   * Dispatches a `pointercancel` event.
   *
   * @param {Event} inEvent The in event.
   */
  MouseSource.prototype.cancel = function cancel (inEvent) {
    var e = prepareEvent(inEvent, this.dispatcher);
    this.dispatcher.cancel(e, inEvent);
    this.cleanupMouse();
  };

  /**
   * Remove the mouse from the list of active pointers.
   */
  MouseSource.prototype.cleanupMouse = function cleanupMouse () {
    delete this.pointerMap[POINTER_ID.toString()];
  };

  return MouseSource;
}(_EventSource_js__WEBPACK_IMPORTED_MODULE_0__["default"]));


/**
 * Creates a copy of the original event that will be used
 * for the fake pointer event.
 *
 * @param {Event} inEvent The in event.
 * @param {import("./PointerEventHandler.js").default} dispatcher Event handler.
 * @return {Object} The copied event.
 */
function prepareEvent(inEvent, dispatcher) {
  var e = dispatcher.cloneEvent(inEvent, inEvent);

  // forward mouse preventDefault
  var pd = e.preventDefault;
  e.preventDefault = function() {
    inEvent.preventDefault();
    pd();
  };

  e.pointerId = POINTER_ID;
  e.isPrimary = true;
  e.pointerType = POINTER_TYPE;

  return e;
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MouseSource);

//# sourceMappingURL=MouseSource.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/proj.js":
/*!*****************************************!*\
  !*** ./node_modules/@biigle/ol/proj.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "METERS_PER_UNIT": () => (/* reexport safe */ _proj_Units_js__WEBPACK_IMPORTED_MODULE_0__.METERS_PER_UNIT),
/* harmony export */   "Projection": () => (/* reexport safe */ _proj_Projection_js__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "cloneTransform": () => (/* binding */ cloneTransform),
/* harmony export */   "identityTransform": () => (/* binding */ identityTransform),
/* harmony export */   "addProjection": () => (/* binding */ addProjection),
/* harmony export */   "addProjections": () => (/* binding */ addProjections),
/* harmony export */   "get": () => (/* binding */ get),
/* harmony export */   "getPointResolution": () => (/* binding */ getPointResolution),
/* harmony export */   "addEquivalentProjections": () => (/* binding */ addEquivalentProjections),
/* harmony export */   "addEquivalentTransforms": () => (/* binding */ addEquivalentTransforms),
/* harmony export */   "clearAllProjections": () => (/* binding */ clearAllProjections),
/* harmony export */   "createProjection": () => (/* binding */ createProjection),
/* harmony export */   "createTransformFromCoordinateTransform": () => (/* binding */ createTransformFromCoordinateTransform),
/* harmony export */   "addCoordinateTransforms": () => (/* binding */ addCoordinateTransforms),
/* harmony export */   "fromLonLat": () => (/* binding */ fromLonLat),
/* harmony export */   "toLonLat": () => (/* binding */ toLonLat),
/* harmony export */   "equivalent": () => (/* binding */ equivalent),
/* harmony export */   "getTransformFromProjections": () => (/* binding */ getTransformFromProjections),
/* harmony export */   "getTransform": () => (/* binding */ getTransform),
/* harmony export */   "transform": () => (/* binding */ transform),
/* harmony export */   "transformExtent": () => (/* binding */ transformExtent),
/* harmony export */   "transformWithProjections": () => (/* binding */ transformWithProjections),
/* harmony export */   "addCommon": () => (/* binding */ addCommon)
/* harmony export */ });
/* harmony import */ var _sphere_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./sphere.js */ "./node_modules/@biigle/ol/sphere.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./math.js */ "./node_modules/@biigle/ol/math.js");
/* harmony import */ var _proj_epsg3857_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./proj/epsg3857.js */ "./node_modules/@biigle/ol/proj/epsg3857.js");
/* harmony import */ var _proj_epsg4326_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./proj/epsg4326.js */ "./node_modules/@biigle/ol/proj/epsg4326.js");
/* harmony import */ var _proj_Projection_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./proj/Projection.js */ "./node_modules/@biigle/ol/proj/Projection.js");
/* harmony import */ var _proj_Units_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./proj/Units.js */ "./node_modules/@biigle/ol/proj/Units.js");
/* harmony import */ var _proj_projections_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./proj/projections.js */ "./node_modules/@biigle/ol/proj/projections.js");
/* harmony import */ var _proj_transforms_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./proj/transforms.js */ "./node_modules/@biigle/ol/proj/transforms.js");
/**
 * @module ol/proj
 */

/**
 * The ol/proj module stores:
 * * a list of {@link module:ol/proj/Projection}
 * objects, one for each projection supported by the application
 * * a list of transform functions needed to convert coordinates in one projection
 * into another.
 *
 * The static functions are the methods used to maintain these.
 * Each transform function can handle not only simple coordinate pairs, but also
 * large arrays of coordinates such as vector geometries.
 *
 * When loaded, the library adds projection objects for EPSG:4326 (WGS84
 * geographic coordinates) and EPSG:3857 (Web or Spherical Mercator, as used
 * for example by Bing Maps or OpenStreetMap), together with the relevant
 * transform functions.
 *
 * Additional transforms may be added by using the http://proj4js.org/
 * library (version 2.2 or later). You can use the full build supplied by
 * Proj4js, or create a custom build to support those projections you need; see
 * the Proj4js website for how to do this. You also need the Proj4js definitions
 * for the required projections. These definitions can be obtained from
 * https://epsg.io/, and are a JS function, so can be loaded in a script
 * tag (as in the examples) or pasted into your application.
 *
 * After all required projection definitions are added to proj4's registry (by
 * using `proj4.defs()`), simply call `register(proj4)` from the `ol/proj/proj4`
 * package. Existing transforms are not changed by this function. See
 * examples/wms-image-custom-proj for an example of this.
 *
 * Additional projection definitions can be registered with `proj4.defs()` any
 * time. Just make sure to call `register(proj4)` again; for example, with user-supplied data where you don't
 * know in advance what projections are needed, you can initially load minimal
 * support and then load whichever are requested.
 *
 * Note that Proj4js does not support projection extents. If you want to add
 * one for creating default tile grids, you can add it after the Projection
 * object has been created with `setExtent`, for example,
 * `get('EPSG:1234').setExtent(extent)`.
 *
 * In addition to Proj4js support, any transform functions can be added with
 * {@link module:ol/proj~addCoordinateTransforms}. To use this, you must first create
 * a {@link module:ol/proj/Projection} object for the new projection and add it with
 * {@link module:ol/proj~addProjection}. You can then add the forward and inverse
 * functions with {@link module:ol/proj~addCoordinateTransforms}. See
 * examples/wms-custom-proj for an example of this.
 *
 * Note that if no transforms are needed and you only need to define the
 * projection, just add a {@link module:ol/proj/Projection} with
 * {@link module:ol/proj~addProjection}. See examples/wms-no-proj for an example of
 * this.
 */











/**
 * A projection as {@link module:ol/proj/Projection}, SRS identifier
 * string or undefined.
 * @typedef {Projection|string|undefined} ProjectionLike
 * @api
 */


/**
 * A transform function accepts an array of input coordinate values, an optional
 * output array, and an optional dimension (default should be 2).  The function
 * transforms the input coordinate values, populates the output array, and
 * returns the output array.
 *
 * @typedef {function(Array<number>, Array<number>=, number=): Array<number>} TransformFunction
 * @api
 */






/**
 * @param {Array<number>} input Input coordinate array.
 * @param {Array<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension.
 * @return {Array<number>} Output coordinate array (new array, same coordinate
 *     values).
 */
function cloneTransform(input, opt_output, opt_dimension) {
  var output;
  if (opt_output !== undefined) {
    for (var i = 0, ii = input.length; i < ii; ++i) {
      opt_output[i] = input[i];
    }
    output = opt_output;
  } else {
    output = input.slice();
  }
  return output;
}


/**
 * @param {Array<number>} input Input coordinate array.
 * @param {Array<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension.
 * @return {Array<number>} Input coordinate array (same array as input).
 */
function identityTransform(input, opt_output, opt_dimension) {
  if (opt_output !== undefined && input !== opt_output) {
    for (var i = 0, ii = input.length; i < ii; ++i) {
      opt_output[i] = input[i];
    }
    input = opt_output;
  }
  return input;
}


/**
 * Add a Projection object to the list of supported projections that can be
 * looked up by their code.
 *
 * @param {Projection} projection Projection instance.
 * @api
 */
function addProjection(projection) {
  _proj_projections_js__WEBPACK_IMPORTED_MODULE_2__.add(projection.getCode(), projection);
  (0,_proj_transforms_js__WEBPACK_IMPORTED_MODULE_3__.add)(projection, projection, cloneTransform);
}


/**
 * @param {Array<Projection>} projections Projections.
 */
function addProjections(projections) {
  projections.forEach(addProjection);
}


/**
 * Fetches a Projection object for the code specified.
 *
 * @param {ProjectionLike} projectionLike Either a code string which is
 *     a combination of authority and identifier such as "EPSG:4326", or an
 *     existing projection object, or undefined.
 * @return {Projection} Projection object, or null if not in list.
 * @api
 */
function get(projectionLike) {
  return typeof projectionLike === 'string' ?
    _proj_projections_js__WEBPACK_IMPORTED_MODULE_2__.get(/** @type {string} */ (projectionLike)) :
    (/** @type {Projection} */ (projectionLike) || null);
}


/**
 * Get the resolution of the point in degrees or distance units.
 * For projections with degrees as the unit this will simply return the
 * provided resolution. For other projections the point resolution is
 * by default estimated by transforming the 'point' pixel to EPSG:4326,
 * measuring its width and height on the normal sphere,
 * and taking the average of the width and height.
 * A custom function can be provided for a specific projection, either
 * by setting the `getPointResolution` option in the
 * {@link module:ol/proj/Projection~Projection} constructor or by using
 * {@link module:ol/proj/Projection~Projection#setGetPointResolution} to change an existing
 * projection object.
 * @param {ProjectionLike} projection The projection.
 * @param {number} resolution Nominal resolution in projection units.
 * @param {import("./coordinate.js").Coordinate} point Point to find adjusted resolution at.
 * @param {Units=} opt_units Units to get the point resolution in.
 * Default is the projection's units.
 * @return {number} Point resolution.
 * @api
 */
function getPointResolution(projection, resolution, point, opt_units) {
  projection = get(projection);
  var pointResolution;
  var getter = projection.getPointResolutionFunc();
  if (getter) {
    pointResolution = getter(resolution, point);
  } else {
    var units = projection.getUnits();
    if (units == _proj_Units_js__WEBPACK_IMPORTED_MODULE_0__["default"].DEGREES && !opt_units || opt_units == _proj_Units_js__WEBPACK_IMPORTED_MODULE_0__["default"].DEGREES) {
      pointResolution = resolution;
    } else {
      // Estimate point resolution by transforming the center pixel to EPSG:4326,
      // measuring its width and height on the normal sphere, and taking the
      // average of the width and height.
      var toEPSG4326 = getTransformFromProjections(projection, get('EPSG:4326'));
      var vertices = [
        point[0] - resolution / 2, point[1],
        point[0] + resolution / 2, point[1],
        point[0], point[1] - resolution / 2,
        point[0], point[1] + resolution / 2
      ];
      vertices = toEPSG4326(vertices, vertices, 2);
      var width = (0,_sphere_js__WEBPACK_IMPORTED_MODULE_4__.getDistance)(vertices.slice(0, 2), vertices.slice(2, 4));
      var height = (0,_sphere_js__WEBPACK_IMPORTED_MODULE_4__.getDistance)(vertices.slice(4, 6), vertices.slice(6, 8));
      pointResolution = (width + height) / 2;
      var metersPerUnit = opt_units ?
        _proj_Units_js__WEBPACK_IMPORTED_MODULE_0__.METERS_PER_UNIT[opt_units] :
        projection.getMetersPerUnit();
      if (metersPerUnit !== undefined) {
        pointResolution /= metersPerUnit;
      }
    }
  }
  return pointResolution;
}


/**
 * Registers transformation functions that don't alter coordinates. Those allow
 * to transform between projections with equal meaning.
 *
 * @param {Array<Projection>} projections Projections.
 * @api
 */
function addEquivalentProjections(projections) {
  addProjections(projections);
  projections.forEach(function(source) {
    projections.forEach(function(destination) {
      if (source !== destination) {
        (0,_proj_transforms_js__WEBPACK_IMPORTED_MODULE_3__.add)(source, destination, cloneTransform);
      }
    });
  });
}


/**
 * Registers transformation functions to convert coordinates in any projection
 * in projection1 to any projection in projection2.
 *
 * @param {Array<Projection>} projections1 Projections with equal
 *     meaning.
 * @param {Array<Projection>} projections2 Projections with equal
 *     meaning.
 * @param {TransformFunction} forwardTransform Transformation from any
 *   projection in projection1 to any projection in projection2.
 * @param {TransformFunction} inverseTransform Transform from any projection
 *   in projection2 to any projection in projection1..
 */
function addEquivalentTransforms(projections1, projections2, forwardTransform, inverseTransform) {
  projections1.forEach(function(projection1) {
    projections2.forEach(function(projection2) {
      (0,_proj_transforms_js__WEBPACK_IMPORTED_MODULE_3__.add)(projection1, projection2, forwardTransform);
      (0,_proj_transforms_js__WEBPACK_IMPORTED_MODULE_3__.add)(projection2, projection1, inverseTransform);
    });
  });
}


/**
 * Clear all cached projections and transforms.
 */
function clearAllProjections() {
  _proj_projections_js__WEBPACK_IMPORTED_MODULE_2__.clear();
  (0,_proj_transforms_js__WEBPACK_IMPORTED_MODULE_3__.clear)();
}


/**
 * @param {Projection|string|undefined} projection Projection.
 * @param {string} defaultCode Default code.
 * @return {Projection} Projection.
 */
function createProjection(projection, defaultCode) {
  if (!projection) {
    return get(defaultCode);
  } else if (typeof projection === 'string') {
    return get(projection);
  } else {
    return (
      /** @type {Projection} */ (projection)
    );
  }
}


/**
 * Creates a {@link module:ol/proj~TransformFunction} from a simple 2D coordinate transform
 * function.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} coordTransform Coordinate
 *     transform.
 * @return {TransformFunction} Transform function.
 */
function createTransformFromCoordinateTransform(coordTransform) {
  return (
    /**
     * @param {Array<number>} input Input.
     * @param {Array<number>=} opt_output Output.
     * @param {number=} opt_dimension Dimension.
     * @return {Array<number>} Output.
     */
    function(input, opt_output, opt_dimension) {
      var length = input.length;
      var dimension = opt_dimension !== undefined ? opt_dimension : 2;
      var output = opt_output !== undefined ? opt_output : new Array(length);
      for (var i = 0; i < length; i += dimension) {
        var point = coordTransform([input[i], input[i + 1]]);
        output[i] = point[0];
        output[i + 1] = point[1];
        for (var j = dimension - 1; j >= 2; --j) {
          output[i + j] = input[i + j];
        }
      }
      return output;
    });
}


/**
 * Registers coordinate transform functions to convert coordinates between the
 * source projection and the destination projection.
 * The forward and inverse functions convert coordinate pairs; this function
 * converts these into the functions used internally which also handle
 * extents and coordinate arrays.
 *
 * @param {ProjectionLike} source Source projection.
 * @param {ProjectionLike} destination Destination projection.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} forward The forward transform
 *     function (that is, from the source projection to the destination
 *     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
 *     the transformed {@link module:ol/coordinate~Coordinate}.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} inverse The inverse transform
 *     function (that is, from the destination projection to the source
 *     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
 *     the transformed {@link module:ol/coordinate~Coordinate}.
 * @api
 */
function addCoordinateTransforms(source, destination, forward, inverse) {
  var sourceProj = get(source);
  var destProj = get(destination);
  (0,_proj_transforms_js__WEBPACK_IMPORTED_MODULE_3__.add)(sourceProj, destProj, createTransformFromCoordinateTransform(forward));
  (0,_proj_transforms_js__WEBPACK_IMPORTED_MODULE_3__.add)(destProj, sourceProj, createTransformFromCoordinateTransform(inverse));
}


/**
 * Transforms a coordinate from longitude/latitude to a different projection.
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate as longitude and latitude, i.e.
 *     an array with longitude as 1st and latitude as 2nd element.
 * @param {ProjectionLike=} opt_projection Target projection. The
 *     default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {import("./coordinate.js").Coordinate} Coordinate projected to the target projection.
 * @api
 */
function fromLonLat(coordinate, opt_projection) {
  return transform(coordinate, 'EPSG:4326',
    opt_projection !== undefined ? opt_projection : 'EPSG:3857');
}


/**
 * Transforms a coordinate to longitude/latitude.
 * @param {import("./coordinate.js").Coordinate} coordinate Projected coordinate.
 * @param {ProjectionLike=} opt_projection Projection of the coordinate.
 *     The default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {import("./coordinate.js").Coordinate} Coordinate as longitude and latitude, i.e. an array
 *     with longitude as 1st and latitude as 2nd element.
 * @api
 */
function toLonLat(coordinate, opt_projection) {
  var lonLat = transform(coordinate,
    opt_projection !== undefined ? opt_projection : 'EPSG:3857', 'EPSG:4326');
  var lon = lonLat[0];
  if (lon < -180 || lon > 180) {
    lonLat[0] = (0,_math_js__WEBPACK_IMPORTED_MODULE_5__.modulo)(lon + 180, 360) - 180;
  }
  return lonLat;
}


/**
 * Checks if two projections are the same, that is every coordinate in one
 * projection does represent the same geographic point as the same coordinate in
 * the other projection.
 *
 * @param {Projection} projection1 Projection 1.
 * @param {Projection} projection2 Projection 2.
 * @return {boolean} Equivalent.
 * @api
 */
function equivalent(projection1, projection2) {
  if (projection1 === projection2) {
    return true;
  }
  var equalUnits = projection1.getUnits() === projection2.getUnits();
  if (projection1.getCode() === projection2.getCode()) {
    return equalUnits;
  } else {
    var transformFunc = getTransformFromProjections(projection1, projection2);
    return transformFunc === cloneTransform && equalUnits;
  }
}


/**
 * Searches in the list of transform functions for the function for converting
 * coordinates from the source projection to the destination projection.
 *
 * @param {Projection} sourceProjection Source Projection object.
 * @param {Projection} destinationProjection Destination Projection
 *     object.
 * @return {TransformFunction} Transform function.
 */
function getTransformFromProjections(sourceProjection, destinationProjection) {
  var sourceCode = sourceProjection.getCode();
  var destinationCode = destinationProjection.getCode();
  var transformFunc = (0,_proj_transforms_js__WEBPACK_IMPORTED_MODULE_3__.get)(sourceCode, destinationCode);
  if (!transformFunc) {
    transformFunc = identityTransform;
  }
  return transformFunc;
}


/**
 * Given the projection-like objects, searches for a transformation
 * function to convert a coordinates array from the source projection to the
 * destination projection.
 *
 * @param {ProjectionLike} source Source.
 * @param {ProjectionLike} destination Destination.
 * @return {TransformFunction} Transform function.
 * @api
 */
function getTransform(source, destination) {
  var sourceProjection = get(source);
  var destinationProjection = get(destination);
  return getTransformFromProjections(sourceProjection, destinationProjection);
}


/**
 * Transforms a coordinate from source projection to destination projection.
 * This returns a new coordinate (and does not modify the original).
 *
 * See {@link module:ol/proj~transformExtent} for extent transformation.
 * See the transform method of {@link module:ol/geom/Geometry~Geometry} and its
 * subclasses for geometry transforms.
 *
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @param {ProjectionLike} source Source projection-like.
 * @param {ProjectionLike} destination Destination projection-like.
 * @return {import("./coordinate.js").Coordinate} Coordinate.
 * @api
 */
function transform(coordinate, source, destination) {
  var transformFunc = getTransform(source, destination);
  return transformFunc(coordinate, undefined, coordinate.length);
}


/**
 * Transforms an extent from source projection to destination projection.  This
 * returns a new extent (and does not modify the original).
 *
 * @param {import("./extent.js").Extent} extent The extent to transform.
 * @param {ProjectionLike} source Source projection-like.
 * @param {ProjectionLike} destination Destination projection-like.
 * @return {import("./extent.js").Extent} The transformed extent.
 * @api
 */
function transformExtent(extent, source, destination) {
  var transformFunc = getTransform(source, destination);
  return (0,_extent_js__WEBPACK_IMPORTED_MODULE_6__.applyTransform)(extent, transformFunc);
}


/**
 * Transforms the given point to the destination projection.
 *
 * @param {import("./coordinate.js").Coordinate} point Point.
 * @param {Projection} sourceProjection Source projection.
 * @param {Projection} destinationProjection Destination projection.
 * @return {import("./coordinate.js").Coordinate} Point.
 */
function transformWithProjections(point, sourceProjection, destinationProjection) {
  var transformFunc = getTransformFromProjections(sourceProjection, destinationProjection);
  return transformFunc(point);
}

/**
 * Add transforms to and from EPSG:4326 and EPSG:3857.  This function is called
 * by when this module is executed and should only need to be called again after
 * `clearAllProjections()` is called (e.g. in tests).
 */
function addCommon() {
  // Add transformations that don't alter coordinates to convert within set of
  // projections with equal meaning.
  addEquivalentProjections(_proj_epsg3857_js__WEBPACK_IMPORTED_MODULE_7__.PROJECTIONS);
  addEquivalentProjections(_proj_epsg4326_js__WEBPACK_IMPORTED_MODULE_8__.PROJECTIONS);
  // Add transformations to convert EPSG:4326 like coordinates to EPSG:3857 like
  // coordinates and back.
  addEquivalentTransforms(_proj_epsg4326_js__WEBPACK_IMPORTED_MODULE_8__.PROJECTIONS, _proj_epsg3857_js__WEBPACK_IMPORTED_MODULE_7__.PROJECTIONS, _proj_epsg3857_js__WEBPACK_IMPORTED_MODULE_7__.fromEPSG4326, _proj_epsg3857_js__WEBPACK_IMPORTED_MODULE_7__.toEPSG4326);
}

addCommon();

//# sourceMappingURL=proj.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/proj/Projection.js":
/*!****************************************************!*\
  !*** ./node_modules/@biigle/ol/proj/Projection.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _Units_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Units.js */ "./node_modules/@biigle/ol/proj/Units.js");
/**
 * @module ol/proj/Projection
 */



/**
 * @typedef {Object} Options
 * @property {string} code The SRS identifier code, e.g. `EPSG:4326`.
 * @property {import("./Units.js").default|string} [units] Units. Required unless a
 * proj4 projection is defined for `code`.
 * @property {import("../extent.js").Extent} [extent] The validity extent for the SRS.
 * @property {string} [axisOrientation='enu'] The axis orientation as specified in Proj4.
 * @property {boolean} [global=false] Whether the projection is valid for the whole globe.
 * @property {number} [metersPerUnit] The meters per unit for the SRS.
 * If not provided, the `units` are used to get the meters per unit from the {@link module:ol/proj/Units~METERS_PER_UNIT}
 * lookup table.
 * @property {import("../extent.js").Extent} [worldExtent] The world extent for the SRS.
 * @property {function(number, import("../coordinate.js").Coordinate):number} [getPointResolution]
 * Function to determine resolution at a point. The function is called with a
 * `{number}` view resolution and an `{import("../coordinate.js").Coordinate}` as arguments, and returns
 * the `{number}` resolution at the passed coordinate. If this is `undefined`,
 * the default {@link module:ol/proj#getPointResolution} function will be used.
 */


/**
 * @classdesc
 * Projection definition class. One of these is created for each projection
 * supported in the application and stored in the {@link module:ol/proj} namespace.
 * You can use these in applications, but this is not required, as API params
 * and options use {@link module:ol/proj~ProjectionLike} which means the simple string
 * code will suffice.
 *
 * You can use {@link module:ol/proj~get} to retrieve the object for a particular
 * projection.
 *
 * The library includes definitions for `EPSG:4326` and `EPSG:3857`, together
 * with the following aliases:
 * * `EPSG:4326`: CRS:84, urn:ogc:def:crs:EPSG:6.6:4326,
 *     urn:ogc:def:crs:OGC:1.3:CRS84, urn:ogc:def:crs:OGC:2:84,
 *     http://www.opengis.net/gml/srs/epsg.xml#4326,
 *     urn:x-ogc:def:crs:EPSG:4326
 * * `EPSG:3857`: EPSG:102100, EPSG:102113, EPSG:900913,
 *     urn:ogc:def:crs:EPSG:6.18:3:3857,
 *     http://www.opengis.net/gml/srs/epsg.xml#3857
 *
 * If you use [proj4js](https://github.com/proj4js/proj4js), aliases can
 * be added using `proj4.defs()`. After all required projection definitions are
 * added, call the {@link module:ol/proj/proj4~register} function.
 *
 * @api
 */
var Projection = function Projection(options) {
  /**
   * @private
   * @type {string}
   */
  this.code_ = options.code;

  /**
   * Units of projected coordinates. When set to `TILE_PIXELS`, a
   * `this.extent_` and `this.worldExtent_` must be configured properly for each
   * tile.
   * @private
   * @type {import("./Units.js").default}
   */
  this.units_ = /** @type {import("./Units.js").default} */ (options.units);

  /**
   * Validity extent of the projection in projected coordinates. For projections
   * with `TILE_PIXELS` units, this is the extent of the tile in
   * tile pixel space.
   * @private
   * @type {import("../extent.js").Extent}
   */
  this.extent_ = options.extent !== undefined ? options.extent : null;

  /**
   * Extent of the world in EPSG:4326. For projections with
   * `TILE_PIXELS` units, this is the extent of the tile in
   * projected coordinate space.
   * @private
   * @type {import("../extent.js").Extent}
   */
  this.worldExtent_ = options.worldExtent !== undefined ?
    options.worldExtent : null;

  /**
   * @private
   * @type {string}
   */
  this.axisOrientation_ = options.axisOrientation !== undefined ?
    options.axisOrientation : 'enu';

  /**
   * @private
   * @type {boolean}
   */
  this.global_ = options.global !== undefined ? options.global : false;

  /**
   * @private
   * @type {boolean}
   */
  this.canWrapX_ = !!(this.global_ && this.extent_);

  /**
   * @private
   * @type {function(number, import("../coordinate.js").Coordinate):number|undefined}
   */
  this.getPointResolutionFunc_ = options.getPointResolution;

  /**
   * @private
   * @type {import("../tilegrid/TileGrid.js").default}
   */
  this.defaultTileGrid_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.metersPerUnit_ = options.metersPerUnit;
};

/**
 * @return {boolean} The projection is suitable for wrapping the x-axis
 */
Projection.prototype.canWrapX = function canWrapX () {
  return this.canWrapX_;
};

/**
 * Get the code for this projection, e.g. 'EPSG:4326'.
 * @return {string} Code.
 * @api
 */
Projection.prototype.getCode = function getCode () {
  return this.code_;
};

/**
 * Get the validity extent for this projection.
 * @return {import("../extent.js").Extent} Extent.
 * @api
 */
Projection.prototype.getExtent = function getExtent () {
  return this.extent_;
};

/**
 * Get the units of this projection.
 * @return {import("./Units.js").default} Units.
 * @api
 */
Projection.prototype.getUnits = function getUnits () {
  return this.units_;
};

/**
 * Get the amount of meters per unit of this projection.If the projection is
 * not configured with `metersPerUnit` or a units identifier, the return is
 * `undefined`.
 * @return {number|undefined} Meters.
 * @api
 */
Projection.prototype.getMetersPerUnit = function getMetersPerUnit () {
  return this.metersPerUnit_ || _Units_js__WEBPACK_IMPORTED_MODULE_0__.METERS_PER_UNIT[this.units_];
};

/**
 * Get the world extent for this projection.
 * @return {import("../extent.js").Extent} Extent.
 * @api
 */
Projection.prototype.getWorldExtent = function getWorldExtent () {
  return this.worldExtent_;
};

/**
 * Get the axis orientation of this projection.
 * Example values are:
 * enu - the default easting, northing, elevation.
 * neu - northing, easting, up - useful for "lat/long" geographic coordinates,
 *   or south orientated transverse mercator.
 * wnu - westing, northing, up - some planetary coordinate systems have
 *   "west positive" coordinate systems
 * @return {string} Axis orientation.
 * @api
 */
Projection.prototype.getAxisOrientation = function getAxisOrientation () {
  return this.axisOrientation_;
};

/**
 * Is this projection a global projection which spans the whole world?
 * @return {boolean} Whether the projection is global.
 * @api
 */
Projection.prototype.isGlobal = function isGlobal () {
  return this.global_;
};

/**
 * Set if the projection is a global projection which spans the whole world
 * @param {boolean} global Whether the projection is global.
 * @api
 */
Projection.prototype.setGlobal = function setGlobal (global) {
  this.global_ = global;
  this.canWrapX_ = !!(global && this.extent_);
};

/**
 * @return {import("../tilegrid/TileGrid.js").default} The default tile grid.
 */
Projection.prototype.getDefaultTileGrid = function getDefaultTileGrid () {
  return this.defaultTileGrid_;
};

/**
 * @param {import("../tilegrid/TileGrid.js").default} tileGrid The default tile grid.
 */
Projection.prototype.setDefaultTileGrid = function setDefaultTileGrid (tileGrid) {
  this.defaultTileGrid_ = tileGrid;
};

/**
 * Set the validity extent for this projection.
 * @param {import("../extent.js").Extent} extent Extent.
 * @api
 */
Projection.prototype.setExtent = function setExtent (extent) {
  this.extent_ = extent;
  this.canWrapX_ = !!(this.global_ && extent);
};

/**
 * Set the world extent for this projection.
 * @param {import("../extent.js").Extent} worldExtent World extent
 *   [minlon, minlat, maxlon, maxlat].
 * @api
 */
Projection.prototype.setWorldExtent = function setWorldExtent (worldExtent) {
  this.worldExtent_ = worldExtent;
};

/**
 * Set the getPointResolution function (see {@link module:ol/proj~getPointResolution}
 * for this projection.
 * @param {function(number, import("../coordinate.js").Coordinate):number} func Function
 * @api
 */
Projection.prototype.setGetPointResolution = function setGetPointResolution (func) {
  this.getPointResolutionFunc_ = func;
};

/**
 * Get the custom point resolution function for this projection (if set).
 * @return {function(number, import("../coordinate.js").Coordinate):number|undefined} The custom point
 * resolution function (if set).
 */
Projection.prototype.getPointResolutionFunc = function getPointResolutionFunc () {
  return this.getPointResolutionFunc_;
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Projection);

//# sourceMappingURL=Projection.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/proj/Units.js":
/*!***********************************************!*\
  !*** ./node_modules/@biigle/ol/proj/Units.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "METERS_PER_UNIT": () => (/* binding */ METERS_PER_UNIT),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/proj/Units
 */

/**
 * Projection units: `'degrees'`, `'ft'`, `'m'`, `'pixels'`, `'tile-pixels'` or
 * `'us-ft'`.
 * @enum {string}
 */
var Units = {
  DEGREES: 'degrees',
  FEET: 'ft',
  METERS: 'm',
  PIXELS: 'pixels',
  TILE_PIXELS: 'tile-pixels',
  USFEET: 'us-ft'
};


/**
 * Meters per unit lookup table.
 * @const
 * @type {Object<Units, number>}
 * @api
 */
var METERS_PER_UNIT = {};
// use the radius of the Normal sphere
METERS_PER_UNIT[Units.DEGREES] = 2 * Math.PI * 6370997 / 360;
METERS_PER_UNIT[Units.FEET] = 0.3048;
METERS_PER_UNIT[Units.METERS] = 1;
METERS_PER_UNIT[Units.USFEET] = 1200 / 3937;

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Units);

//# sourceMappingURL=Units.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/proj/epsg3857.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/proj/epsg3857.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "RADIUS": () => (/* binding */ RADIUS),
/* harmony export */   "HALF_SIZE": () => (/* binding */ HALF_SIZE),
/* harmony export */   "EXTENT": () => (/* binding */ EXTENT),
/* harmony export */   "WORLD_EXTENT": () => (/* binding */ WORLD_EXTENT),
/* harmony export */   "PROJECTIONS": () => (/* binding */ PROJECTIONS),
/* harmony export */   "fromEPSG4326": () => (/* binding */ fromEPSG4326),
/* harmony export */   "toEPSG4326": () => (/* binding */ toEPSG4326)
/* harmony export */ });
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../math.js */ "./node_modules/@biigle/ol/math.js");
/* harmony import */ var _Projection_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Projection.js */ "./node_modules/@biigle/ol/proj/Projection.js");
/* harmony import */ var _Units_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Units.js */ "./node_modules/@biigle/ol/proj/Units.js");
/**
 * @module ol/proj/epsg3857
 */





/**
 * Radius of WGS84 sphere
 *
 * @const
 * @type {number}
 */
var RADIUS = 6378137;


/**
 * @const
 * @type {number}
 */
var HALF_SIZE = Math.PI * RADIUS;


/**
 * @const
 * @type {import("../extent.js").Extent}
 */
var EXTENT = [
  -HALF_SIZE, -HALF_SIZE,
  HALF_SIZE, HALF_SIZE
];


/**
 * @const
 * @type {import("../extent.js").Extent}
 */
var WORLD_EXTENT = [-180, -85, 180, 85];


/**
 * @classdesc
 * Projection object for web/spherical Mercator (EPSG:3857).
 */
var EPSG3857Projection = /*@__PURE__*/(function (Projection) {
  function EPSG3857Projection(code) {
    Projection.call(this, {
      code: code,
      units: _Units_js__WEBPACK_IMPORTED_MODULE_0__["default"].METERS,
      extent: EXTENT,
      global: true,
      worldExtent: WORLD_EXTENT,
      getPointResolution: function(resolution, point) {
        return resolution / (0,_math_js__WEBPACK_IMPORTED_MODULE_1__.cosh)(point[1] / RADIUS);
      }
    });

  }

  if ( Projection ) EPSG3857Projection.__proto__ = Projection;
  EPSG3857Projection.prototype = Object.create( Projection && Projection.prototype );
  EPSG3857Projection.prototype.constructor = EPSG3857Projection;

  return EPSG3857Projection;
}(_Projection_js__WEBPACK_IMPORTED_MODULE_2__["default"]));


/**
 * Projections equal to EPSG:3857.
 *
 * @const
 * @type {Array<import("./Projection.js").default>}
 */
var PROJECTIONS = [
  new EPSG3857Projection('EPSG:3857'),
  new EPSG3857Projection('EPSG:102100'),
  new EPSG3857Projection('EPSG:102113'),
  new EPSG3857Projection('EPSG:900913'),
  new EPSG3857Projection('urn:ogc:def:crs:EPSG:6.18:3:3857'),
  new EPSG3857Projection('urn:ogc:def:crs:EPSG::3857'),
  new EPSG3857Projection('http://www.opengis.net/gml/srs/epsg.xml#3857')
];


/**
 * Transformation from EPSG:4326 to EPSG:3857.
 *
 * @param {Array<number>} input Input array of coordinate values.
 * @param {Array<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is `2`).
 * @return {Array<number>} Output array of coordinate values.
 */
function fromEPSG4326(input, opt_output, opt_dimension) {
  var length = input.length;
  var dimension = opt_dimension > 1 ? opt_dimension : 2;
  var output = opt_output;
  if (output === undefined) {
    if (dimension > 2) {
      // preserve values beyond second dimension
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }
  var halfSize = HALF_SIZE;
  for (var i = 0; i < length; i += dimension) {
    output[i] = halfSize * input[i] / 180;
    var y = RADIUS *
        Math.log(Math.tan(Math.PI * (input[i + 1] + 90) / 360));
    if (y > halfSize) {
      y = halfSize;
    } else if (y < -halfSize) {
      y = -halfSize;
    }
    output[i + 1] = y;
  }
  return output;
}


/**
 * Transformation from EPSG:3857 to EPSG:4326.
 *
 * @param {Array<number>} input Input array of coordinate values.
 * @param {Array<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is `2`).
 * @return {Array<number>} Output array of coordinate values.
 */
function toEPSG4326(input, opt_output, opt_dimension) {
  var length = input.length;
  var dimension = opt_dimension > 1 ? opt_dimension : 2;
  var output = opt_output;
  if (output === undefined) {
    if (dimension > 2) {
      // preserve values beyond second dimension
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }
  for (var i = 0; i < length; i += dimension) {
    output[i] = 180 * input[i] / HALF_SIZE;
    output[i + 1] = 360 * Math.atan(
      Math.exp(input[i + 1] / RADIUS)) / Math.PI - 90;
  }
  return output;
}

//# sourceMappingURL=epsg3857.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/proj/epsg4326.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/proj/epsg4326.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "RADIUS": () => (/* binding */ RADIUS),
/* harmony export */   "EXTENT": () => (/* binding */ EXTENT),
/* harmony export */   "METERS_PER_UNIT": () => (/* binding */ METERS_PER_UNIT),
/* harmony export */   "PROJECTIONS": () => (/* binding */ PROJECTIONS)
/* harmony export */ });
/* harmony import */ var _Projection_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Projection.js */ "./node_modules/@biigle/ol/proj/Projection.js");
/* harmony import */ var _Units_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Units.js */ "./node_modules/@biigle/ol/proj/Units.js");
/**
 * @module ol/proj/epsg4326
 */




/**
 * Semi-major radius of the WGS84 ellipsoid.
 *
 * @const
 * @type {number}
 */
var RADIUS = 6378137;


/**
 * Extent of the EPSG:4326 projection which is the whole world.
 *
 * @const
 * @type {import("../extent.js").Extent}
 */
var EXTENT = [-180, -90, 180, 90];


/**
 * @const
 * @type {number}
 */
var METERS_PER_UNIT = Math.PI * RADIUS / 180;


/**
 * @classdesc
 * Projection object for WGS84 geographic coordinates (EPSG:4326).
 *
 * Note that OpenLayers does not strictly comply with the EPSG definition.
 * The EPSG registry defines 4326 as a CRS for Latitude,Longitude (y,x).
 * OpenLayers treats EPSG:4326 as a pseudo-projection, with x,y coordinates.
 */
var EPSG4326Projection = /*@__PURE__*/(function (Projection) {
  function EPSG4326Projection(code, opt_axisOrientation) {
    Projection.call(this, {
      code: code,
      units: _Units_js__WEBPACK_IMPORTED_MODULE_0__["default"].DEGREES,
      extent: EXTENT,
      axisOrientation: opt_axisOrientation,
      global: true,
      metersPerUnit: METERS_PER_UNIT,
      worldExtent: EXTENT
    });

  }

  if ( Projection ) EPSG4326Projection.__proto__ = Projection;
  EPSG4326Projection.prototype = Object.create( Projection && Projection.prototype );
  EPSG4326Projection.prototype.constructor = EPSG4326Projection;

  return EPSG4326Projection;
}(_Projection_js__WEBPACK_IMPORTED_MODULE_1__["default"]));


/**
 * Projections equal to EPSG:4326.
 *
 * @const
 * @type {Array<import("./Projection.js").default>}
 */
var PROJECTIONS = [
  new EPSG4326Projection('CRS:84'),
  new EPSG4326Projection('EPSG:4326', 'neu'),
  new EPSG4326Projection('urn:ogc:def:crs:EPSG::4326', 'neu'),
  new EPSG4326Projection('urn:ogc:def:crs:EPSG:6.6:4326', 'neu'),
  new EPSG4326Projection('urn:ogc:def:crs:OGC:1.3:CRS84'),
  new EPSG4326Projection('urn:ogc:def:crs:OGC:2:84'),
  new EPSG4326Projection('http://www.opengis.net/gml/srs/epsg.xml#4326', 'neu'),
  new EPSG4326Projection('urn:x-ogc:def:crs:EPSG:4326', 'neu')
];

//# sourceMappingURL=epsg4326.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/proj/projections.js":
/*!*****************************************************!*\
  !*** ./node_modules/@biigle/ol/proj/projections.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "clear": () => (/* binding */ clear),
/* harmony export */   "get": () => (/* binding */ get),
/* harmony export */   "add": () => (/* binding */ add)
/* harmony export */ });
/**
 * @module ol/proj/projections
 */


/**
 * @type {Object<string, import("./Projection.js").default>}
 */
var cache = {};


/**
 * Clear the projections cache.
 */
function clear() {
  cache = {};
}


/**
 * Get a cached projection by code.
 * @param {string} code The code for the projection.
 * @return {import("./Projection.js").default} The projection (if cached).
 */
function get(code) {
  return cache[code] || null;
}


/**
 * Add a projection to the cache.
 * @param {string} code The projection code.
 * @param {import("./Projection.js").default} projection The projection to cache.
 */
function add(code, projection) {
  cache[code] = projection;
}

//# sourceMappingURL=projections.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/proj/transforms.js":
/*!****************************************************!*\
  !*** ./node_modules/@biigle/ol/proj/transforms.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "clear": () => (/* binding */ clear),
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "remove": () => (/* binding */ remove),
/* harmony export */   "get": () => (/* binding */ get)
/* harmony export */ });
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../obj.js */ "./node_modules/@biigle/ol/obj.js");
/**
 * @module ol/proj/transforms
 */



/**
 * @private
 * @type {!Object<string, Object<string, import("../proj.js").TransformFunction>>}
 */
var transforms = {};


/**
 * Clear the transform cache.
 */
function clear() {
  transforms = {};
}


/**
 * Registers a conversion function to convert coordinates from the source
 * projection to the destination projection.
 *
 * @param {import("./Projection.js").default} source Source.
 * @param {import("./Projection.js").default} destination Destination.
 * @param {import("../proj.js").TransformFunction} transformFn Transform.
 */
function add(source, destination, transformFn) {
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  if (!(sourceCode in transforms)) {
    transforms[sourceCode] = {};
  }
  transforms[sourceCode][destinationCode] = transformFn;
}


/**
 * Unregisters the conversion function to convert coordinates from the source
 * projection to the destination projection.  This method is used to clean up
 * cached transforms during testing.
 *
 * @param {import("./Projection.js").default} source Source projection.
 * @param {import("./Projection.js").default} destination Destination projection.
 * @return {import("../proj.js").TransformFunction} transformFn The unregistered transform.
 */
function remove(source, destination) {
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transform = transforms[sourceCode][destinationCode];
  delete transforms[sourceCode][destinationCode];
  if ((0,_obj_js__WEBPACK_IMPORTED_MODULE_0__.isEmpty)(transforms[sourceCode])) {
    delete transforms[sourceCode];
  }
  return transform;
}


/**
 * Get a transform given a source code and a destination code.
 * @param {string} sourceCode The code for the source projection.
 * @param {string} destinationCode The code for the destination projection.
 * @return {import("../proj.js").TransformFunction|undefined} The transform function (if found).
 */
function get(sourceCode, destinationCode) {
  var transform;
  if (sourceCode in transforms && destinationCode in transforms[sourceCode]) {
    transform = transforms[sourceCode][destinationCode];
  }
  return transform;
}

//# sourceMappingURL=transforms.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/render/EventType.js":
/*!*****************************************************!*\
  !*** ./node_modules/@biigle/ol/render/EventType.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/render/EventType
 */

/**
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /**
   * @event module:ol/render/Event~RenderEvent#postcompose
   * @api
   */
  POSTCOMPOSE: 'postcompose',
  /**
   * @event module:ol/render/Event~RenderEvent#precompose
   * @api
   */
  PRECOMPOSE: 'precompose',
  /**
   * @event module:ol/render/Event~RenderEvent#render
   * @api
   */
  RENDER: 'render',
  /**
   * Triggered when rendering is complete, i.e. all sources and tiles have
   * finished loading for the current viewport, and all tiles are faded in.
   * @event module:ol/render/Event~RenderEvent#rendercomplete
   * @api
   */
  RENDERCOMPLETE: 'rendercomplete'
});

//# sourceMappingURL=EventType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/render/canvas.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/render/canvas.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultFont": () => (/* binding */ defaultFont),
/* harmony export */   "defaultFillStyle": () => (/* binding */ defaultFillStyle),
/* harmony export */   "defaultLineCap": () => (/* binding */ defaultLineCap),
/* harmony export */   "defaultLineDash": () => (/* binding */ defaultLineDash),
/* harmony export */   "defaultLineDashOffset": () => (/* binding */ defaultLineDashOffset),
/* harmony export */   "defaultLineJoin": () => (/* binding */ defaultLineJoin),
/* harmony export */   "defaultMiterLimit": () => (/* binding */ defaultMiterLimit),
/* harmony export */   "defaultStrokeStyle": () => (/* binding */ defaultStrokeStyle),
/* harmony export */   "defaultTextAlign": () => (/* binding */ defaultTextAlign),
/* harmony export */   "defaultTextBaseline": () => (/* binding */ defaultTextBaseline),
/* harmony export */   "defaultPadding": () => (/* binding */ defaultPadding),
/* harmony export */   "defaultLineWidth": () => (/* binding */ defaultLineWidth),
/* harmony export */   "labelCache": () => (/* binding */ labelCache),
/* harmony export */   "checkedFonts": () => (/* binding */ checkedFonts),
/* harmony export */   "textHeights": () => (/* binding */ textHeights),
/* harmony export */   "checkFont": () => (/* binding */ checkFont),
/* harmony export */   "measureTextHeight": () => (/* binding */ measureTextHeight),
/* harmony export */   "measureTextWidth": () => (/* binding */ measureTextWidth),
/* harmony export */   "rotateAtOffset": () => (/* binding */ rotateAtOffset),
/* harmony export */   "resetTransform": () => (/* binding */ resetTransform),
/* harmony export */   "drawImage": () => (/* binding */ drawImage)
/* harmony export */ });
/* harmony import */ var _css_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../css.js */ "./node_modules/@biigle/ol/css.js");
/* harmony import */ var _dom_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../dom.js */ "./node_modules/@biigle/ol/dom.js");
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../obj.js */ "./node_modules/@biigle/ol/obj.js");
/* harmony import */ var _structs_LRUCache_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../structs/LRUCache.js */ "./node_modules/@biigle/ol/structs/LRUCache.js");
/* harmony import */ var _transform_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../transform.js */ "./node_modules/@biigle/ol/transform.js");
/**
 * @module ol/render/canvas
 */







/**
 * @typedef {Object} FillState
 * @property {import("../colorlike.js").ColorLike} fillStyle
 */


/**
 * @typedef {Object} FillStrokeState
 * @property {import("../colorlike.js").ColorLike} [currentFillStyle]
 * @property {import("../colorlike.js").ColorLike} [currentStrokeStyle]
 * @property {string} [currentLineCap]
 * @property {Array<number>} currentLineDash
 * @property {number} [currentLineDashOffset]
 * @property {string} [currentLineJoin]
 * @property {number} [currentLineWidth]
 * @property {number} [currentMiterLimit]
 * @property {number} [lastStroke]
 * @property {import("../colorlike.js").ColorLike} [fillStyle]
 * @property {import("../colorlike.js").ColorLike} [strokeStyle]
 * @property {string} [lineCap]
 * @property {Array<number>} lineDash
 * @property {number} [lineDashOffset]
 * @property {string} [lineJoin]
 * @property {number} [lineWidth]
 * @property {number} [miterLimit]
 */


/**
 * @typedef {Object} StrokeState
 * @property {string} lineCap
 * @property {Array<number>} lineDash
 * @property {number} lineDashOffset
 * @property {string} lineJoin
 * @property {number} lineWidth
 * @property {number} miterLimit
 * @property {import("../colorlike.js").ColorLike} strokeStyle
 */


/**
 * @typedef {Object} TextState
 * @property {string} font
 * @property {string} [textAlign]
 * @property {string} textBaseline
 * @property {string} [placement]
 * @property {number} [maxAngle]
 * @property {boolean} [overflow]
 * @property {import("../style/Fill.js").default} [backgroundFill]
 * @property {import("../style/Stroke.js").default} [backgroundStroke]
 * @property {number} [scale]
 * @property {Array<number>} [padding]
 */


/**
 * Container for decluttered replay instructions that need to be rendered or
 * omitted together, i.e. when styles render both an image and text, or for the
 * characters that form text along lines. The basic elements of this array are
 * `[minX, minY, maxX, maxY, count]`, where the first four entries are the
 * rendered extent of the group in pixel space. `count` is the number of styles
 * in the group, i.e. 2 when an image and a text are grouped, or 1 otherwise.
 * In addition to these four elements, declutter instruction arrays (i.e. the
 * arguments to {@link module:ol/render/canvas~drawImage} are appended to the array.
 * @typedef {Array<*>} DeclutterGroup
 */


/**
 * @const
 * @type {string}
 */
var defaultFont = '10px sans-serif';


/**
 * @const
 * @type {import("../color.js").Color}
 */
var defaultFillStyle = [0, 0, 0, 1];


/**
 * @const
 * @type {string}
 */
var defaultLineCap = 'round';


/**
 * @const
 * @type {Array<number>}
 */
var defaultLineDash = [];


/**
 * @const
 * @type {number}
 */
var defaultLineDashOffset = 0;


/**
 * @const
 * @type {string}
 */
var defaultLineJoin = 'round';


/**
 * @const
 * @type {number}
 */
var defaultMiterLimit = 10;


/**
 * @const
 * @type {import("../color.js").Color}
 */
var defaultStrokeStyle = [0, 0, 0, 1];


/**
 * @const
 * @type {string}
 */
var defaultTextAlign = 'center';


/**
 * @const
 * @type {string}
 */
var defaultTextBaseline = 'middle';


/**
 * @const
 * @type {Array<number>}
 */
var defaultPadding = [0, 0, 0, 0];


/**
 * @const
 * @type {number}
 */
var defaultLineWidth = 1;


/**
 * The label cache for text rendering. To change the default cache size of 2048
 * entries, use {@link module:ol/structs/LRUCache#setSize}.
 * @type {LRUCache<HTMLCanvasElement>}
 * @api
 */
var labelCache = new _structs_LRUCache_js__WEBPACK_IMPORTED_MODULE_0__["default"]();


/**
 * @type {!Object<string, number>}
 */
var checkedFonts = {};


/**
 * @type {CanvasRenderingContext2D}
 */
var measureContext = null;


/**
 * @type {!Object<string, number>}
 */
var textHeights = {};


/**
 * Clears the label cache when a font becomes available.
 * @param {string} fontSpec CSS font spec.
 */
var checkFont = (function() {
  var retries = 60;
  var checked = checkedFonts;
  var size = '32px ';
  var referenceFonts = ['monospace', 'serif'];
  var len = referenceFonts.length;
  var text = 'wmytzilWMYTZIL@#/&?$%10\uF013';
  var interval, referenceWidth;

  function isAvailable(font) {
    var context = getMeasureContext();
    // Check weight ranges according to
    // https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#Fallback_weights
    for (var weight = 100; weight <= 700; weight += 300) {
      var fontWeight = weight + ' ';
      var available = true;
      for (var i = 0; i < len; ++i) {
        var referenceFont = referenceFonts[i];
        context.font = fontWeight + size + referenceFont;
        referenceWidth = context.measureText(text).width;
        if (font != referenceFont) {
          context.font = fontWeight + size + font + ',' + referenceFont;
          var width = context.measureText(text).width;
          // If width and referenceWidth are the same, then the fallback was used
          // instead of the font we wanted, so the font is not available.
          available = available && width != referenceWidth;
        }
      }
      if (available) {
        // Consider font available when it is available in one weight range.
        //FIXME With this we miss rare corner cases, so we should consider
        //FIXME checking availability for each requested weight range.
        return true;
      }
    }
    return false;
  }

  function check() {
    var done = true;
    for (var font in checked) {
      if (checked[font] < retries) {
        if (isAvailable(font)) {
          checked[font] = retries;
          (0,_obj_js__WEBPACK_IMPORTED_MODULE_1__.clear)(textHeights);
          // Make sure that loaded fonts are picked up by Safari
          measureContext = null;
          labelCache.clear();
        } else {
          ++checked[font];
          done = false;
        }
      }
    }
    if (done) {
      clearInterval(interval);
      interval = undefined;
    }
  }

  return function(fontSpec) {
    var fontFamilies = (0,_css_js__WEBPACK_IMPORTED_MODULE_2__.getFontFamilies)(fontSpec);
    if (!fontFamilies) {
      return;
    }
    for (var i = 0, ii = fontFamilies.length; i < ii; ++i) {
      var fontFamily = fontFamilies[i];
      if (!(fontFamily in checked)) {
        checked[fontFamily] = retries;
        if (!isAvailable(fontFamily)) {
          checked[fontFamily] = 0;
          if (interval === undefined) {
            interval = setInterval(check, 32);
          }
        }
      }
    }
  };
})();


/**
 * @return {CanvasRenderingContext2D} Measure context.
 */
function getMeasureContext() {
  if (!measureContext) {
    measureContext = (0,_dom_js__WEBPACK_IMPORTED_MODULE_3__.createCanvasContext2D)(1, 1);
  }
  return measureContext;
}


/**
 * @param {string} font Font to use for measuring.
 * @return {import("../size.js").Size} Measurement.
 */
var measureTextHeight = (function() {
  var span;
  var heights = textHeights;
  return function(font) {
    var height = heights[font];
    if (height == undefined) {
      if (!span) {
        span = document.createElement('span');
        span.textContent = 'M';
        span.style.margin = span.style.padding = '0 !important';
        span.style.position = 'absolute !important';
        span.style.left = '-99999px !important';
      }
      span.style.font = font;
      document.body.appendChild(span);
      height = heights[font] = span.offsetHeight;
      document.body.removeChild(span);
    }
    return height;
  };
})();


/**
 * @param {string} font Font.
 * @param {string} text Text.
 * @return {number} Width.
 */
function measureTextWidth(font, text) {
  var measureContext = getMeasureContext();
  if (font != measureContext.font) {
    measureContext.font = font;
  }
  return measureContext.measureText(text).width;
}


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} rotation Rotation.
 * @param {number} offsetX X offset.
 * @param {number} offsetY Y offset.
 */
function rotateAtOffset(context, rotation, offsetX, offsetY) {
  if (rotation !== 0) {
    context.translate(offsetX, offsetY);
    context.rotate(rotation);
    context.translate(-offsetX, -offsetY);
  }
}


var resetTransform = (0,_transform_js__WEBPACK_IMPORTED_MODULE_4__.create)();


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {import("../transform.js").Transform|null} transform Transform.
 * @param {number} opacity Opacity.
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} image Image.
 * @param {number} originX Origin X.
 * @param {number} originY Origin Y.
 * @param {number} w Width.
 * @param {number} h Height.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} scale Scale.
 */
function drawImage(context,
  transform, opacity, image, originX, originY, w, h, x, y, scale) {
  var alpha;
  if (opacity != 1) {
    alpha = context.globalAlpha;
    context.globalAlpha = alpha * opacity;
  }
  if (transform) {
    context.setTransform.apply(context, transform);
  }

  context.drawImage(image, originX, originY, w, h, x, y, w * scale, h * scale);

  if (alpha) {
    context.globalAlpha = alpha;
  }
  if (transform) {
    context.setTransform.apply(context, resetTransform);
  }
}

//# sourceMappingURL=canvas.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/source/Source.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/source/Source.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var _Object_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../Object.js */ "./node_modules/@biigle/ol/Object.js");
/* harmony import */ var _proj_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../proj.js */ "./node_modules/@biigle/ol/proj.js");
/* harmony import */ var _State_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./State.js */ "./node_modules/@biigle/ol/source/State.js");
/**
 * @module ol/source/Source
 */






/**
 * A function that returns a string or an array of strings representing source
 * attributions.
 *
 * @typedef {function(import("../PluggableMap.js").FrameState): (string|Array<string>)} Attribution
 */


/**
 * A type that can be used to provide attribution information for data sources.
 *
 * It represents either
 * * a simple string (e.g. `'© Acme Inc.'`)
 * * an array of simple strings (e.g. `['© Acme Inc.', '© Bacme Inc.']`)
 * * a function that returns a string or array of strings (`{@link module:ol/source/Source~Attribution}`)
 *
 * @typedef {string|Array<string>|Attribution} AttributionLike
 */


/**
 * @typedef {Object} Options
 * @property {AttributionLike} [attributions]
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {import("../proj.js").ProjectionLike} projection
 * @property {SourceState} [state='ready']
 * @property {boolean} [wrapX=false]
 */


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for {@link module:ol/layer/Layer~Layer} sources.
 *
 * A generic `change` event is triggered when the state of the source changes.
 * @abstract
 * @api
 */
var Source = /*@__PURE__*/(function (BaseObject) {
  function Source(options) {

    BaseObject.call(this);

    /**
     * @private
     * @type {import("../proj/Projection.js").default}
     */
    this.projection_ = (0,_proj_js__WEBPACK_IMPORTED_MODULE_0__.get)(options.projection);

    /**
     * @private
     * @type {?Attribution}
     */
    this.attributions_ = adaptAttributions(options.attributions);

    /**
     * @private
     * @type {boolean}
     */
    this.attributionsCollapsible_ = options.attributionsCollapsible !== undefined ?
      options.attributionsCollapsible : true;

    /**
     * This source is currently loading data. Sources that defer loading to the
     * map's tile queue never set this to `true`.
     * @type {boolean}
     */
    this.loading = false;

    /**
     * @private
     * @type {SourceState}
     */
    this.state_ = options.state !== undefined ?
      options.state : _State_js__WEBPACK_IMPORTED_MODULE_1__["default"].READY;

    /**
     * @private
     * @type {boolean}
     */
    this.wrapX_ = options.wrapX !== undefined ? options.wrapX : false;

  }

  if ( BaseObject ) Source.__proto__ = BaseObject;
  Source.prototype = Object.create( BaseObject && BaseObject.prototype );
  Source.prototype.constructor = Source;

  /**
   * Get the attribution function for the source.
   * @return {?Attribution} Attribution function.
   */
  Source.prototype.getAttributions = function getAttributions () {
    return this.attributions_;
  };

  /**
   * @return {boolean} Aattributions are collapsible.
   */
  Source.prototype.getAttributionsCollapsible = function getAttributionsCollapsible () {
    return this.attributionsCollapsible_;
  };

  /**
   * Get the projection of the source.
   * @return {import("../proj/Projection.js").default} Projection.
   * @api
   */
  Source.prototype.getProjection = function getProjection () {
    return this.projection_;
  };

  /**
   * @abstract
   * @return {Array<number>|undefined} Resolutions.
   */
  Source.prototype.getResolutions = function getResolutions () {
    return (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.abstract)();
  };

  /**
   * Get the state of the source, see {@link module:ol/source/State~State} for possible states.
   * @return {SourceState} State.
   * @api
   */
  Source.prototype.getState = function getState () {
    return this.state_;
  };

  /**
   * @return {boolean|undefined} Wrap X.
   */
  Source.prototype.getWrapX = function getWrapX () {
    return this.wrapX_;
  };

  /**
   * Refreshes the source and finally dispatches a 'change' event.
   * @api
   */
  Source.prototype.refresh = function refresh () {
    this.changed();
  };

  /**
   * Set the attributions of the source.
   * @param {AttributionLike|undefined} attributions Attributions.
   *     Can be passed as `string`, `Array<string>`, `{@link module:ol/source/Source~Attribution}`,
   *     or `undefined`.
   * @api
   */
  Source.prototype.setAttributions = function setAttributions (attributions) {
    this.attributions_ = adaptAttributions(attributions);
    this.changed();
  };

  /**
   * Set the state of the source.
   * @param {SourceState} state State.
   * @protected
   */
  Source.prototype.setState = function setState (state) {
    this.state_ = state;
    this.changed();
  };

  return Source;
}(_Object_js__WEBPACK_IMPORTED_MODULE_3__["default"]));


/**
 * Turns the attributions option into an attributions function.
 * @param {AttributionLike|undefined} attributionLike The attribution option.
 * @return {?Attribution} An attribution function (or null).
 */
function adaptAttributions(attributionLike) {
  if (!attributionLike) {
    return null;
  }
  if (Array.isArray(attributionLike)) {
    return function(frameState) {
      return attributionLike;
    };
  }

  if (typeof attributionLike === 'function') {
    return attributionLike;
  }

  return function(frameState) {
    return [attributionLike];
  };
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Source);

//# sourceMappingURL=Source.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/source/State.js":
/*!*************************************************!*\
  !*** ./node_modules/@biigle/ol/source/State.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/source/State
 */

/**
 * @enum {string}
 * State of the source, one of 'undefined', 'loading', 'ready' or 'error'.
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  UNDEFINED: 'undefined',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
});

//# sourceMappingURL=State.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/source/Vector.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/source/Vector.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "VectorSourceEvent": () => (/* binding */ VectorSourceEvent),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var _Collection_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../Collection.js */ "./node_modules/@biigle/ol/Collection.js");
/* harmony import */ var _CollectionEventType_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../CollectionEventType.js */ "./node_modules/@biigle/ol/CollectionEventType.js");
/* harmony import */ var _ObjectEventType_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../ObjectEventType.js */ "./node_modules/@biigle/ol/ObjectEventType.js");
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../array.js */ "./node_modules/@biigle/ol/array.js");
/* harmony import */ var _asserts_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../asserts.js */ "./node_modules/@biigle/ol/asserts.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../events.js */ "./node_modules/@biigle/ol/events.js");
/* harmony import */ var _events_Event_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/Event.js */ "./node_modules/@biigle/ol/events/Event.js");
/* harmony import */ var _events_EventType_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../events/EventType.js */ "./node_modules/@biigle/ol/events/EventType.js");
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _featureloader_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../featureloader.js */ "./node_modules/@biigle/ol/featureloader.js");
/* harmony import */ var _functions_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../functions.js */ "./node_modules/@biigle/ol/functions.js");
/* harmony import */ var _loadingstrategy_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../loadingstrategy.js */ "./node_modules/@biigle/ol/loadingstrategy.js");
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../obj.js */ "./node_modules/@biigle/ol/obj.js");
/* harmony import */ var _Source_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./Source.js */ "./node_modules/@biigle/ol/source/Source.js");
/* harmony import */ var _State_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./State.js */ "./node_modules/@biigle/ol/source/State.js");
/* harmony import */ var _VectorEventType_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./VectorEventType.js */ "./node_modules/@biigle/ol/source/VectorEventType.js");
/* harmony import */ var _structs_RBush_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../structs/RBush.js */ "./node_modules/@biigle/ol/structs/RBush.js");
/**
 * @module ol/source/Vector
 */




















/**
 * A function that takes an {@link module:ol/extent~Extent} and a resolution as arguments, and
 * returns an array of {@link module:ol/extent~Extent} with the extents to load. Usually this
 * is one of the standard {@link module:ol/loadingstrategy} strategies.
 *
 * @typedef {function(import("../extent.js").Extent, number): Array<import("../extent.js").Extent>} LoadingStrategy
 * @api
 */


/**
 * @classdesc
 * Events emitted by {@link module:ol/source/Vector} instances are instances of this
 * type.
 */
var VectorSourceEvent = /*@__PURE__*/(function (Event) {
  function VectorSourceEvent(type, opt_feature) {

    Event.call(this, type);

    /**
     * The feature being added or removed.
     * @type {import("../Feature.js").default|undefined}
     * @api
     */
    this.feature = opt_feature;

  }

  if ( Event ) VectorSourceEvent.__proto__ = Event;
  VectorSourceEvent.prototype = Object.create( Event && Event.prototype );
  VectorSourceEvent.prototype.constructor = VectorSourceEvent;

  return VectorSourceEvent;
}(_events_Event_js__WEBPACK_IMPORTED_MODULE_0__["default"]));


/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {Array<import("../Feature.js").default>|Collection<import("../Feature.js").default>} [features]
 * Features. If provided as {@link module:ol/Collection}, the features in the source
 * and the collection will stay in sync.
 * @property {import("../format/Feature.js").default} [format] The feature format used by the XHR
 * feature loader when `url` is set. Required if `url` is set, otherwise ignored.
 * @property {import("../featureloader.js").FeatureLoader} [loader]
 * The loader function used to load features, from a remote source for example.
 * If this is not set and `url` is set, the source will create and use an XHR
 * feature loader.
 *
 * Example:
 *
 * ```js
 * import {Vector} from 'ol/source';
 * import {GeoJSON} from 'ol/format';
 * import {bbox} from 'ol/loadingstrategy';
 *
 * var vectorSource = new Vector({
 *   format: new GeoJSON(),
 *   loader: function(extent, resolution, projection) {
 *      var proj = projection.getCode();
 *      var url = 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
 *          'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
 *          'outputFormat=application/json&srsname=' + proj + '&' +
 *          'bbox=' + extent.join(',') + ',' + proj;
 *      var xhr = new XMLHttpRequest();
 *      xhr.open('GET', url);
 *      var onError = function() {
 *        vectorSource.removeLoadedExtent(extent);
 *      }
 *      xhr.onerror = onError;
 *      xhr.onload = function() {
 *        if (xhr.status == 200) {
 *          vectorSource.addFeatures(
 *              vectorSource.getFormat().readFeatures(xhr.responseText));
 *        } else {
 *          onError();
 *        }
 *      }
 *      xhr.send();
 *    },
 *    strategy: bbox
 *  });
 * ```
 * @property {boolean} [overlaps=true] This source may have overlapping geometries.
 * Setting this to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @property {LoadingStrategy} [strategy] The loading strategy to use.
 * By default an {@link module:ol/loadingstrategy~all}
 * strategy is used, a one-off strategy which loads all features at once.
 * @property {string|import("../featureloader.js").FeatureUrlFunction} [url]
 * Setting this option instructs the source to load features using an XHR loader
 * (see {@link module:ol/featureloader~xhr}). Use a `string` and an
 * {@link module:ol/loadingstrategy~all} for a one-off download of all features from
 * the given URL. Use a {@link module:ol/featureloader~FeatureUrlFunction} to generate the url with
 * other loading strategies.
 * Requires `format` to be set as well.
 * When default XHR feature loader is provided, the features will
 * be transformed from the data projection to the view projection
 * during parsing. If your remote data source does not advertise its projection
 * properly, this transformation will be incorrect. For some formats, the
 * default projection (usually EPSG:4326) can be overridden by setting the
 * dataProjection constructor option on the format.
 * Note that if a source contains non-feature data, such as a GeoJSON geometry
 * or a KML NetworkLink, these will be ignored. Use a custom loader to load these.
 * @property {boolean} [useSpatialIndex=true]
 * By default, an RTree is used as spatial index. When features are removed and
 * added frequently, and the total number of features is low, setting this to
 * `false` may improve performance.
 *
 * Note that
 * {@link module:ol/source/Vector~VectorSource#getFeaturesInExtent},
 * {@link module:ol/source/Vector~VectorSource#getClosestFeatureToCoordinate} and
 * {@link module:ol/source/Vector~VectorSource#getExtent} cannot be used when `useSpatialIndex` is
 * set to `false`, and {@link module:ol/source/Vector~VectorSource#forEachFeatureInExtent} will loop
 * through all features.
 *
 * When set to `false`, the features will be maintained in an
 * {@link module:ol/Collection}, which can be retrieved through
 * {@link module:ol/source/Vector~VectorSource#getFeaturesCollection}.
 * @property {boolean} [wrapX=true] Wrap the world horizontally. For vector editing across the
 * -180° and 180° meridians to work properly, this should be set to `false`. The
 * resulting geometry coordinates will then exceed the world bounds.
 */


/**
 * @classdesc
 * Provides a source of features for vector layers. Vector features provided
 * by this source are suitable for editing. See {@link module:ol/source/VectorTile~VectorTile} for
 * vector data that is optimized for rendering.
 *
 * @fires ol/source/Vector.VectorSourceEvent
 * @api
 */
var VectorSource = /*@__PURE__*/(function (Source) {
  function VectorSource(opt_options) {

    var options = opt_options || {};

    Source.call(this, {
      attributions: options.attributions,
      projection: undefined,
      state: _State_js__WEBPACK_IMPORTED_MODULE_1__["default"].READY,
      wrapX: options.wrapX !== undefined ? options.wrapX : true
    });

    /**
     * @private
     * @type {import("../featureloader.js").FeatureLoader}
     */
    this.loader_ = _functions_js__WEBPACK_IMPORTED_MODULE_2__.VOID;

    /**
     * @private
     * @type {import("../format/Feature.js").default|undefined}
     */
    this.format_ = options.format;

    /**
     * @private
     * @type {boolean}
     */
    this.overlaps_ = options.overlaps == undefined ? true : options.overlaps;

    /**
     * @private
     * @type {string|import("../featureloader.js").FeatureUrlFunction|undefined}
     */
    this.url_ = options.url;

    if (options.loader !== undefined) {
      this.loader_ = options.loader;
    } else if (this.url_ !== undefined) {
      (0,_asserts_js__WEBPACK_IMPORTED_MODULE_3__.assert)(this.format_, 7); // `format` must be set when `url` is set
      // create a XHR feature loader for "url" and "format"
      this.loader_ = (0,_featureloader_js__WEBPACK_IMPORTED_MODULE_4__.xhr)(this.url_, /** @type {import("../format/Feature.js").default} */ (this.format_));
    }

    /**
     * @private
     * @type {LoadingStrategy}
     */
    this.strategy_ = options.strategy !== undefined ? options.strategy : _loadingstrategy_js__WEBPACK_IMPORTED_MODULE_5__.all;

    var useSpatialIndex =
        options.useSpatialIndex !== undefined ? options.useSpatialIndex : true;

    /**
     * @private
     * @type {RBush<import("../Feature.js").default>}
     */
    this.featuresRtree_ = useSpatialIndex ? new _structs_RBush_js__WEBPACK_IMPORTED_MODULE_6__["default"]() : null;

    /**
     * @private
     * @type {RBush<{extent: import("../extent.js").Extent}>}
     */
    this.loadedExtentsRtree_ = new _structs_RBush_js__WEBPACK_IMPORTED_MODULE_6__["default"]();

    /**
     * @private
     * @type {!Object<string, import("../Feature.js").default>}
     */
    this.nullGeometryFeatures_ = {};

    /**
     * A lookup of features by id (the return from feature.getId()).
     * @private
     * @type {!Object<string, import("../Feature.js").default>}
     */
    this.idIndex_ = {};

    /**
     * A lookup of features without id (keyed by getUid(feature)).
     * @private
     * @type {!Object<string, import("../Feature.js").default>}
     */
    this.undefIdIndex_ = {};

    /**
     * @private
     * @type {Object<string, Array<import("../events.js").EventsKey>>}
     */
    this.featureChangeKeys_ = {};

    /**
     * @private
     * @type {Collection<import("../Feature.js").default>}
     */
    this.featuresCollection_ = null;

    var collection, features;
    if (Array.isArray(options.features)) {
      features = options.features;
    } else if (options.features) {
      collection = options.features;
      features = collection.getArray();
    }
    if (!useSpatialIndex && collection === undefined) {
      collection = new _Collection_js__WEBPACK_IMPORTED_MODULE_7__["default"](features);
    }
    if (features !== undefined) {
      this.addFeaturesInternal(features);
    }
    if (collection !== undefined) {
      this.bindFeaturesCollection_(collection);
    }

  }

  if ( Source ) VectorSource.__proto__ = Source;
  VectorSource.prototype = Object.create( Source && Source.prototype );
  VectorSource.prototype.constructor = VectorSource;

  /**
   * Add a single feature to the source.  If you want to add a batch of features
   * at once, call {@link module:ol/source/Vector~VectorSource#addFeatures #addFeatures()}
   * instead. A feature will not be added to the source if feature with
   * the same id is already there. The reason for this behavior is to avoid
   * feature duplication when using bbox or tile loading strategies.
   * @param {import("../Feature.js").default} feature Feature to add.
   * @api
   */
  VectorSource.prototype.addFeature = function addFeature (feature) {
    this.addFeatureInternal(feature);
    this.changed();
  };


  /**
   * Add a feature without firing a `change` event.
   * @param {import("../Feature.js").default} feature Feature.
   * @protected
   */
  VectorSource.prototype.addFeatureInternal = function addFeatureInternal (feature) {
    var featureKey = (0,_util_js__WEBPACK_IMPORTED_MODULE_8__.getUid)(feature);

    if (!this.addToIndex_(featureKey, feature)) {
      return;
    }

    this.setupChangeEvents_(featureKey, feature);

    var geometry = feature.getGeometry();
    if (geometry) {
      var extent = geometry.getExtent();
      if (this.featuresRtree_) {
        this.featuresRtree_.insert(extent, feature);
      }
    } else {
      this.nullGeometryFeatures_[featureKey] = feature;
    }

    this.dispatchEvent(
      new VectorSourceEvent(_VectorEventType_js__WEBPACK_IMPORTED_MODULE_9__["default"].ADDFEATURE, feature));
  };


  /**
   * @param {string} featureKey Unique identifier for the feature.
   * @param {import("../Feature.js").default} feature The feature.
   * @private
   */
  VectorSource.prototype.setupChangeEvents_ = function setupChangeEvents_ (featureKey, feature) {
    this.featureChangeKeys_[featureKey] = [
      (0,_events_js__WEBPACK_IMPORTED_MODULE_10__.listen)(feature, _events_EventType_js__WEBPACK_IMPORTED_MODULE_11__["default"].CHANGE,
        this.handleFeatureChange_, this),
      (0,_events_js__WEBPACK_IMPORTED_MODULE_10__.listen)(feature, _ObjectEventType_js__WEBPACK_IMPORTED_MODULE_12__["default"].PROPERTYCHANGE,
        this.handleFeatureChange_, this)
    ];
  };


  /**
   * @param {string} featureKey Unique identifier for the feature.
   * @param {import("../Feature.js").default} feature The feature.
   * @return {boolean} The feature is "valid", in the sense that it is also a
   *     candidate for insertion into the Rtree.
   * @private
   */
  VectorSource.prototype.addToIndex_ = function addToIndex_ (featureKey, feature) {
    var valid = true;
    var id = feature.getId();
    if (id !== undefined) {
      if (!(id.toString() in this.idIndex_)) {
        this.idIndex_[id.toString()] = feature;
      } else {
        valid = false;
      }
    } else {
      (0,_asserts_js__WEBPACK_IMPORTED_MODULE_3__.assert)(!(featureKey in this.undefIdIndex_),
        30); // The passed `feature` was already added to the source
      this.undefIdIndex_[featureKey] = feature;
    }
    return valid;
  };


  /**
   * Add a batch of features to the source.
   * @param {Array<import("../Feature.js").default>} features Features to add.
   * @api
   */
  VectorSource.prototype.addFeatures = function addFeatures (features) {
    this.addFeaturesInternal(features);
    this.changed();
  };


  /**
   * Add features without firing a `change` event.
   * @param {Array<import("../Feature.js").default>} features Features.
   * @protected
   */
  VectorSource.prototype.addFeaturesInternal = function addFeaturesInternal (features) {
    var extents = [];
    var newFeatures = [];
    var geometryFeatures = [];

    for (var i = 0, length = features.length; i < length; i++) {
      var feature = features[i];
      var featureKey = (0,_util_js__WEBPACK_IMPORTED_MODULE_8__.getUid)(feature);
      if (this.addToIndex_(featureKey, feature)) {
        newFeatures.push(feature);
      }
    }

    for (var i$1 = 0, length$1 = newFeatures.length; i$1 < length$1; i$1++) {
      var feature$1 = newFeatures[i$1];
      var featureKey$1 = (0,_util_js__WEBPACK_IMPORTED_MODULE_8__.getUid)(feature$1);
      this.setupChangeEvents_(featureKey$1, feature$1);

      var geometry = feature$1.getGeometry();
      if (geometry) {
        var extent = geometry.getExtent();
        extents.push(extent);
        geometryFeatures.push(feature$1);
      } else {
        this.nullGeometryFeatures_[featureKey$1] = feature$1;
      }
    }
    if (this.featuresRtree_) {
      this.featuresRtree_.load(extents, geometryFeatures);
    }

    for (var i$2 = 0, length$2 = newFeatures.length; i$2 < length$2; i$2++) {
      this.dispatchEvent(new VectorSourceEvent(_VectorEventType_js__WEBPACK_IMPORTED_MODULE_9__["default"].ADDFEATURE, newFeatures[i$2]));
    }
  };


  /**
   * @param {!Collection<import("../Feature.js").default>} collection Collection.
   * @private
   */
  VectorSource.prototype.bindFeaturesCollection_ = function bindFeaturesCollection_ (collection) {
    var modifyingCollection = false;
    (0,_events_js__WEBPACK_IMPORTED_MODULE_10__.listen)(this, _VectorEventType_js__WEBPACK_IMPORTED_MODULE_9__["default"].ADDFEATURE,
      /**
       * @param {VectorSourceEvent} evt The vector source event
       */
      function(evt) {
        if (!modifyingCollection) {
          modifyingCollection = true;
          collection.push(evt.feature);
          modifyingCollection = false;
        }
      });
    (0,_events_js__WEBPACK_IMPORTED_MODULE_10__.listen)(this, _VectorEventType_js__WEBPACK_IMPORTED_MODULE_9__["default"].REMOVEFEATURE,
      /**
       * @param {VectorSourceEvent} evt The vector source event
       */
      function(evt) {
        if (!modifyingCollection) {
          modifyingCollection = true;
          collection.remove(evt.feature);
          modifyingCollection = false;
        }
      });
    (0,_events_js__WEBPACK_IMPORTED_MODULE_10__.listen)(collection, _CollectionEventType_js__WEBPACK_IMPORTED_MODULE_13__["default"].ADD,
      /**
       * @param {import("../Collection.js").CollectionEvent} evt The collection event
       */
      function(evt) {
        if (!modifyingCollection) {
          modifyingCollection = true;
          this.addFeature(/** @type {import("../Feature.js").default} */ (evt.element));
          modifyingCollection = false;
        }
      }, this);
    (0,_events_js__WEBPACK_IMPORTED_MODULE_10__.listen)(collection, _CollectionEventType_js__WEBPACK_IMPORTED_MODULE_13__["default"].REMOVE,
      /**
       * @param {import("../Collection.js").CollectionEvent} evt The collection event
       */
      function(evt) {
        if (!modifyingCollection) {
          modifyingCollection = true;
          this.removeFeature(/** @type {import("../Feature.js").default} */ (evt.element));
          modifyingCollection = false;
        }
      }, this);
    this.featuresCollection_ = collection;
  };


  /**
   * Remove all features from the source.
   * @param {boolean=} opt_fast Skip dispatching of {@link module:ol/source/Vector.VectorSourceEvent#removefeature} events.
   * @api
   */
  VectorSource.prototype.clear = function clear (opt_fast) {
    if (opt_fast) {
      for (var featureId in this.featureChangeKeys_) {
        var keys = this.featureChangeKeys_[featureId];
        keys.forEach(_events_js__WEBPACK_IMPORTED_MODULE_10__.unlistenByKey);
      }
      if (!this.featuresCollection_) {
        this.featureChangeKeys_ = {};
        this.idIndex_ = {};
        this.undefIdIndex_ = {};
      }
    } else {
      if (this.featuresRtree_) {
        this.featuresRtree_.forEach(this.removeFeatureInternal, this);
        for (var id in this.nullGeometryFeatures_) {
          this.removeFeatureInternal(this.nullGeometryFeatures_[id]);
        }
      }
    }
    if (this.featuresCollection_) {
      this.featuresCollection_.clear();
    }

    if (this.featuresRtree_) {
      this.featuresRtree_.clear();
    }
    this.loadedExtentsRtree_.clear();
    this.nullGeometryFeatures_ = {};

    var clearEvent = new VectorSourceEvent(_VectorEventType_js__WEBPACK_IMPORTED_MODULE_9__["default"].CLEAR);
    this.dispatchEvent(clearEvent);
    this.changed();
  };


  /**
   * Iterate through all features on the source, calling the provided callback
   * with each one.  If the callback returns any "truthy" value, iteration will
   * stop and the function will return the same value.
   * Note: this function only iterate through the feature that have a defined geometry.
   *
   * @param {function(import("../Feature.js").default): T} callback Called with each feature
   *     on the source.  Return a truthy value to stop iteration.
   * @return {T|undefined} The return value from the last call to the callback.
   * @template T
   * @api
   */
  VectorSource.prototype.forEachFeature = function forEachFeature (callback) {
    if (this.featuresRtree_) {
      return this.featuresRtree_.forEach(callback);
    } else if (this.featuresCollection_) {
      this.featuresCollection_.forEach(callback);
    }
  };


  /**
   * Iterate through all features whose geometries contain the provided
   * coordinate, calling the callback with each feature.  If the callback returns
   * a "truthy" value, iteration will stop and the function will return the same
   * value.
   *
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {function(import("../Feature.js").default): T} callback Called with each feature
   *     whose goemetry contains the provided coordinate.
   * @return {T|undefined} The return value from the last call to the callback.
   * @template T
   */
  VectorSource.prototype.forEachFeatureAtCoordinateDirect = function forEachFeatureAtCoordinateDirect (coordinate, callback) {
    var extent = [coordinate[0], coordinate[1], coordinate[0], coordinate[1]];
    return this.forEachFeatureInExtent(extent, function(feature) {
      var geometry = feature.getGeometry();
      if (geometry.intersectsCoordinate(coordinate)) {
        return callback(feature);
      } else {
        return undefined;
      }
    });
  };


  /**
   * Iterate through all features whose bounding box intersects the provided
   * extent (note that the feature's geometry may not intersect the extent),
   * calling the callback with each feature.  If the callback returns a "truthy"
   * value, iteration will stop and the function will return the same value.
   *
   * If you are interested in features whose geometry intersects an extent, call
   * the {@link module:ol/source/Vector~VectorSource#forEachFeatureIntersectingExtent #forEachFeatureIntersectingExtent()} method instead.
   *
   * When `useSpatialIndex` is set to false, this method will loop through all
   * features, equivalent to {@link module:ol/source/Vector~VectorSource#forEachFeature #forEachFeature()}.
   *
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {function(import("../Feature.js").default): T} callback Called with each feature
   *     whose bounding box intersects the provided extent.
   * @return {T|undefined} The return value from the last call to the callback.
   * @template T
   * @api
   */
  VectorSource.prototype.forEachFeatureInExtent = function forEachFeatureInExtent (extent, callback) {
    if (this.featuresRtree_) {
      return this.featuresRtree_.forEachInExtent(extent, callback);
    } else if (this.featuresCollection_) {
      this.featuresCollection_.forEach(callback);
    }
  };


  /**
   * Iterate through all features whose geometry intersects the provided extent,
   * calling the callback with each feature.  If the callback returns a "truthy"
   * value, iteration will stop and the function will return the same value.
   *
   * If you only want to test for bounding box intersection, call the
   * {@link module:ol/source/Vector~VectorSource#forEachFeatureInExtent #forEachFeatureInExtent()} method instead.
   *
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {function(import("../Feature.js").default): T} callback Called with each feature
   *     whose geometry intersects the provided extent.
   * @return {T|undefined} The return value from the last call to the callback.
   * @template T
   * @api
   */
  VectorSource.prototype.forEachFeatureIntersectingExtent = function forEachFeatureIntersectingExtent (extent, callback) {
    return this.forEachFeatureInExtent(extent,
      /**
       * @param {import("../Feature.js").default} feature Feature.
       * @return {T|undefined} The return value from the last call to the callback.
       */
      function(feature) {
        var geometry = feature.getGeometry();
        if (geometry.intersectsExtent(extent)) {
          var result = callback(feature);
          if (result) {
            return result;
          }
        }
      });
  };


  /**
   * Get the features collection associated with this source. Will be `null`
   * unless the source was configured with `useSpatialIndex` set to `false`, or
   * with an {@link module:ol/Collection} as `features`.
   * @return {Collection<import("../Feature.js").default>} The collection of features.
   * @api
   */
  VectorSource.prototype.getFeaturesCollection = function getFeaturesCollection () {
    return this.featuresCollection_;
  };


  /**
   * Get all features on the source in random order.
   * @return {Array<import("../Feature.js").default>} Features.
   * @api
   */
  VectorSource.prototype.getFeatures = function getFeatures () {
    var features;
    if (this.featuresCollection_) {
      features = this.featuresCollection_.getArray();
    } else if (this.featuresRtree_) {
      features = this.featuresRtree_.getAll();
      if (!(0,_obj_js__WEBPACK_IMPORTED_MODULE_14__.isEmpty)(this.nullGeometryFeatures_)) {
        (0,_array_js__WEBPACK_IMPORTED_MODULE_15__.extend)(features, (0,_obj_js__WEBPACK_IMPORTED_MODULE_14__.getValues)(this.nullGeometryFeatures_));
      }
    }
    return (
      /** @type {Array<import("../Feature.js").default>} */ (features)
    );
  };


  /**
   * Get all features whose geometry intersects the provided coordinate.
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @return {Array<import("../Feature.js").default>} Features.
   * @api
   */
  VectorSource.prototype.getFeaturesAtCoordinate = function getFeaturesAtCoordinate (coordinate) {
    var features = [];
    this.forEachFeatureAtCoordinateDirect(coordinate, function(feature) {
      features.push(feature);
    });
    return features;
  };


  /**
   * Get all features in the provided extent.  Note that this returns an array of
   * all features intersecting the given extent in random order (so it may include
   * features whose geometries do not intersect the extent).
   *
   * This method is not available when the source is configured with
   * `useSpatialIndex` set to `false`.
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {Array<import("../Feature.js").default>} Features.
   * @api
   */
  VectorSource.prototype.getFeaturesInExtent = function getFeaturesInExtent (extent) {
    return this.featuresRtree_.getInExtent(extent);
  };


  /**
   * Get the closest feature to the provided coordinate.
   *
   * This method is not available when the source is configured with
   * `useSpatialIndex` set to `false`.
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {function(import("../Feature.js").default):boolean=} opt_filter Feature filter function.
   *     The filter function will receive one argument, the {@link module:ol/Feature feature}
   *     and it should return a boolean value. By default, no filtering is made.
   * @return {import("../Feature.js").default} Closest feature.
   * @api
   */
  VectorSource.prototype.getClosestFeatureToCoordinate = function getClosestFeatureToCoordinate (coordinate, opt_filter) {
    // Find the closest feature using branch and bound.  We start searching an
    // infinite extent, and find the distance from the first feature found.  This
    // becomes the closest feature.  We then compute a smaller extent which any
    // closer feature must intersect.  We continue searching with this smaller
    // extent, trying to find a closer feature.  Every time we find a closer
    // feature, we update the extent being searched so that any even closer
    // feature must intersect it.  We continue until we run out of features.
    var x = coordinate[0];
    var y = coordinate[1];
    var closestFeature = null;
    var closestPoint = [NaN, NaN];
    var minSquaredDistance = Infinity;
    var extent = [-Infinity, -Infinity, Infinity, Infinity];
    var filter = opt_filter ? opt_filter : _functions_js__WEBPACK_IMPORTED_MODULE_2__.TRUE;
    this.featuresRtree_.forEachInExtent(extent,
      /**
       * @param {import("../Feature.js").default} feature Feature.
       */
      function(feature) {
        if (filter(feature)) {
          var geometry = feature.getGeometry();
          var previousMinSquaredDistance = minSquaredDistance;
          minSquaredDistance = geometry.closestPointXY(
            x, y, closestPoint, minSquaredDistance);
          if (minSquaredDistance < previousMinSquaredDistance) {
            closestFeature = feature;
            // This is sneaky.  Reduce the extent that it is currently being
            // searched while the R-Tree traversal using this same extent object
            // is still in progress.  This is safe because the new extent is
            // strictly contained by the old extent.
            var minDistance = Math.sqrt(minSquaredDistance);
            extent[0] = x - minDistance;
            extent[1] = y - minDistance;
            extent[2] = x + minDistance;
            extent[3] = y + minDistance;
          }
        }
      });
    return closestFeature;
  };


  /**
   * Get the extent of the features currently in the source.
   *
   * This method is not available when the source is configured with
   * `useSpatialIndex` set to `false`.
   * @param {import("../extent.js").Extent=} opt_extent Destination extent. If provided, no new extent
   *     will be created. Instead, that extent's coordinates will be overwritten.
   * @return {import("../extent.js").Extent} Extent.
   * @api
   */
  VectorSource.prototype.getExtent = function getExtent (opt_extent) {
    return this.featuresRtree_.getExtent(opt_extent);
  };


  /**
   * Get a feature by its identifier (the value returned by feature.getId()).
   * Note that the index treats string and numeric identifiers as the same.  So
   * `source.getFeatureById(2)` will return a feature with id `'2'` or `2`.
   *
   * @param {string|number} id Feature identifier.
   * @return {import("../Feature.js").default} The feature (or `null` if not found).
   * @api
   */
  VectorSource.prototype.getFeatureById = function getFeatureById (id) {
    var feature = this.idIndex_[id.toString()];
    return feature !== undefined ? feature : null;
  };


  /**
   * Get the format associated with this source.
   *
   * @return {import("../format/Feature.js").default|undefined} The feature format.
   * @api
   */
  VectorSource.prototype.getFormat = function getFormat () {
    return this.format_;
  };


  /**
   * @return {boolean} The source can have overlapping geometries.
   */
  VectorSource.prototype.getOverlaps = function getOverlaps () {
    return this.overlaps_;
  };


  /**
   * Get the url associated with this source.
   *
   * @return {string|import("../featureloader.js").FeatureUrlFunction|undefined} The url.
   * @api
   */
  VectorSource.prototype.getUrl = function getUrl () {
    return this.url_;
  };


  /**
   * @param {Event} event Event.
   * @private
   */
  VectorSource.prototype.handleFeatureChange_ = function handleFeatureChange_ (event) {
    var feature = /** @type {import("../Feature.js").default} */ (event.target);
    var featureKey = (0,_util_js__WEBPACK_IMPORTED_MODULE_8__.getUid)(feature);
    var geometry = feature.getGeometry();
    if (!geometry) {
      if (!(featureKey in this.nullGeometryFeatures_)) {
        if (this.featuresRtree_) {
          this.featuresRtree_.remove(feature);
        }
        this.nullGeometryFeatures_[featureKey] = feature;
      }
    } else {
      var extent = geometry.getExtent();
      if (featureKey in this.nullGeometryFeatures_) {
        delete this.nullGeometryFeatures_[featureKey];
        if (this.featuresRtree_) {
          this.featuresRtree_.insert(extent, feature);
        }
      } else {
        if (this.featuresRtree_) {
          this.featuresRtree_.update(extent, feature);
        }
      }
    }
    var id = feature.getId();
    if (id !== undefined) {
      var sid = id.toString();
      if (featureKey in this.undefIdIndex_) {
        delete this.undefIdIndex_[featureKey];
        this.idIndex_[sid] = feature;
      } else {
        if (this.idIndex_[sid] !== feature) {
          this.removeFromIdIndex_(feature);
          this.idIndex_[sid] = feature;
        }
      }
    } else {
      if (!(featureKey in this.undefIdIndex_)) {
        this.removeFromIdIndex_(feature);
        this.undefIdIndex_[featureKey] = feature;
      }
    }
    this.changed();
    this.dispatchEvent(new VectorSourceEvent(
      _VectorEventType_js__WEBPACK_IMPORTED_MODULE_9__["default"].CHANGEFEATURE, feature));
  };

  /**
   * Returns true if the feature is contained within the source.
   * @param {import("../Feature.js").default} feature Feature.
   * @return {boolean} Has feature.
   * @api
   */
  VectorSource.prototype.hasFeature = function hasFeature (feature) {
    var id = feature.getId();
    if (id !== undefined) {
      return id in this.idIndex_;
    } else {
      return (0,_util_js__WEBPACK_IMPORTED_MODULE_8__.getUid)(feature) in this.undefIdIndex_;
    }
  };

  /**
   * @return {boolean} Is empty.
   */
  VectorSource.prototype.isEmpty = function isEmpty$1 () {
    return this.featuresRtree_.isEmpty() && (0,_obj_js__WEBPACK_IMPORTED_MODULE_14__.isEmpty)(this.nullGeometryFeatures_);
  };


  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {import("../proj/Projection.js").default} projection Projection.
   */
  VectorSource.prototype.loadFeatures = function loadFeatures (extent, resolution, projection) {
    var this$1 = this;

    var loadedExtentsRtree = this.loadedExtentsRtree_;
    var extentsToLoad = this.strategy_(extent, resolution);
    this.loading = false;
    var loop = function ( i, ii ) {
      var extentToLoad = extentsToLoad[i];
      var alreadyLoaded = loadedExtentsRtree.forEachInExtent(extentToLoad,
        /**
         * @param {{extent: import("../extent.js").Extent}} object Object.
         * @return {boolean} Contains.
         */
        function(object) {
          return (0,_extent_js__WEBPACK_IMPORTED_MODULE_16__.containsExtent)(object.extent, extentToLoad);
        });
      if (!alreadyLoaded) {
        this$1.loader_.call(this$1, extentToLoad, resolution, projection);
        loadedExtentsRtree.insert(extentToLoad, {extent: extentToLoad.slice()});
        this$1.loading = this$1.loader_ !== _functions_js__WEBPACK_IMPORTED_MODULE_2__.VOID;
      }
    };

    for (var i = 0, ii = extentsToLoad.length; i < ii; ++i) loop( i, ii );
  };


  /**
   * Remove an extent from the list of loaded extents.
   * @param {import("../extent.js").Extent} extent Extent.
   * @api
   */
  VectorSource.prototype.removeLoadedExtent = function removeLoadedExtent (extent) {
    var loadedExtentsRtree = this.loadedExtentsRtree_;
    var obj;
    loadedExtentsRtree.forEachInExtent(extent, function(object) {
      if ((0,_extent_js__WEBPACK_IMPORTED_MODULE_16__.equals)(object.extent, extent)) {
        obj = object;
        return true;
      }
    });
    if (obj) {
      loadedExtentsRtree.remove(obj);
    }
  };


  /**
   * Remove a single feature from the source.  If you want to remove all features
   * at once, use the {@link module:ol/source/Vector~VectorSource#clear #clear()} method
   * instead.
   * @param {import("../Feature.js").default} feature Feature to remove.
   * @api
   */
  VectorSource.prototype.removeFeature = function removeFeature (feature) {
    var featureKey = (0,_util_js__WEBPACK_IMPORTED_MODULE_8__.getUid)(feature);
    if (featureKey in this.nullGeometryFeatures_) {
      delete this.nullGeometryFeatures_[featureKey];
    } else {
      if (this.featuresRtree_) {
        this.featuresRtree_.remove(feature);
      }
    }
    this.removeFeatureInternal(feature);
    this.changed();
  };


  /**
   * Remove feature without firing a `change` event.
   * @param {import("../Feature.js").default} feature Feature.
   * @protected
   */
  VectorSource.prototype.removeFeatureInternal = function removeFeatureInternal (feature) {
    var featureKey = (0,_util_js__WEBPACK_IMPORTED_MODULE_8__.getUid)(feature);
    this.featureChangeKeys_[featureKey].forEach(_events_js__WEBPACK_IMPORTED_MODULE_10__.unlistenByKey);
    delete this.featureChangeKeys_[featureKey];
    var id = feature.getId();
    if (id !== undefined) {
      delete this.idIndex_[id.toString()];
    } else {
      delete this.undefIdIndex_[featureKey];
    }
    this.dispatchEvent(new VectorSourceEvent(
      _VectorEventType_js__WEBPACK_IMPORTED_MODULE_9__["default"].REMOVEFEATURE, feature));
  };


  /**
   * Remove a feature from the id index.  Called internally when the feature id
   * may have changed.
   * @param {import("../Feature.js").default} feature The feature.
   * @return {boolean} Removed the feature from the index.
   * @private
   */
  VectorSource.prototype.removeFromIdIndex_ = function removeFromIdIndex_ (feature) {
    var removed = false;
    for (var id in this.idIndex_) {
      if (this.idIndex_[id] === feature) {
        delete this.idIndex_[id];
        removed = true;
        break;
      }
    }
    return removed;
  };


  /**
   * Set the new loader of the source. The next loadFeatures call will use the
   * new loader.
   * @param {import("../featureloader.js").FeatureLoader} loader The loader to set.
   * @api
   */
  VectorSource.prototype.setLoader = function setLoader (loader) {
    this.loader_ = loader;
  };

  return VectorSource;
}(_Source_js__WEBPACK_IMPORTED_MODULE_17__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (VectorSource);

//# sourceMappingURL=Vector.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/source/VectorEventType.js":
/*!***********************************************************!*\
  !*** ./node_modules/@biigle/ol/source/VectorEventType.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module ol/source/VectorEventType
 */

/**
 * @enum {string}
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /**
   * Triggered when a feature is added to the source.
   * @event ol/source/Vector.VectorSourceEvent#addfeature
   * @api
   */
  ADDFEATURE: 'addfeature',

  /**
   * Triggered when a feature is updated.
   * @event ol/source/Vector.VectorSourceEvent#changefeature
   * @api
   */
  CHANGEFEATURE: 'changefeature',

  /**
   * Triggered when the clear method is called on the source.
   * @event ol/source/Vector.VectorSourceEvent#clear
   * @api
   */
  CLEAR: 'clear',

  /**
   * Triggered when a feature is removed from the source.
   * See {@link module:ol/source/Vector#clear source.clear()} for exceptions.
   * @event ol/source/Vector.VectorSourceEvent#removefeature
   * @api
   */
  REMOVEFEATURE: 'removefeature'
});

//# sourceMappingURL=VectorEventType.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/sphere.js":
/*!*******************************************!*\
  !*** ./node_modules/@biigle/ol/sphere.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DEFAULT_RADIUS": () => (/* binding */ DEFAULT_RADIUS),
/* harmony export */   "getDistance": () => (/* binding */ getDistance),
/* harmony export */   "getLength": () => (/* binding */ getLength),
/* harmony export */   "getArea": () => (/* binding */ getArea),
/* harmony export */   "offset": () => (/* binding */ offset)
/* harmony export */ });
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./math.js */ "./node_modules/@biigle/ol/math.js");
/* harmony import */ var _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./geom/GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/**
 * @license
 * Latitude/longitude spherical geodesy formulae taken from
 * http://www.movable-type.co.uk/scripts/latlong.html
 * Licensed under CC-BY-3.0.
 */

/**
 * @module ol/sphere
 */




/**
 * Object literal with options for the {@link getLength} or {@link getArea}
 * functions.
 * @typedef {Object} SphereMetricOptions
 * @property {import("./proj.js").ProjectionLike} [projection='EPSG:3857']
 * Projection of the  geometry.  By default, the geometry is assumed to be in
 * Web Mercator.
 * @property {number} [radius=6371008.8] Sphere radius.  By default, the radius of the
 * earth is used (Clarke 1866 Authalic Sphere).
 */


/**
 * The mean Earth radius (1/3 * (2a + b)) for the WGS84 ellipsoid.
 * https://en.wikipedia.org/wiki/Earth_radius#Mean_radius
 * @type {number}
 */
var DEFAULT_RADIUS = 6371008.8;


/**
 * Get the great circle distance (in meters) between two geographic coordinates.
 * @param {Array} c1 Starting coordinate.
 * @param {Array} c2 Ending coordinate.
 * @param {number=} opt_radius The sphere radius to use.  Defaults to the Earth's
 *     mean radius using the WGS84 ellipsoid.
 * @return {number} The great circle distance between the points (in meters).
 * @api
 */
function getDistance(c1, c2, opt_radius) {
  var radius = opt_radius || DEFAULT_RADIUS;
  var lat1 = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toRadians)(c1[1]);
  var lat2 = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toRadians)(c2[1]);
  var deltaLatBy2 = (lat2 - lat1) / 2;
  var deltaLonBy2 = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toRadians)(c2[0] - c1[0]) / 2;
  var a = Math.sin(deltaLatBy2) * Math.sin(deltaLatBy2) +
      Math.sin(deltaLonBy2) * Math.sin(deltaLonBy2) *
      Math.cos(lat1) * Math.cos(lat2);
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


/**
 * Get the cumulative great circle length of linestring coordinates (geographic).
 * @param {Array} coordinates Linestring coordinates.
 * @param {number} radius The sphere radius to use.
 * @return {number} The length (in meters).
 */
function getLengthInternal(coordinates, radius) {
  var length = 0;
  for (var i = 0, ii = coordinates.length; i < ii - 1; ++i) {
    length += getDistance(coordinates[i], coordinates[i + 1], radius);
  }
  return length;
}


/**
 * Get the spherical length of a geometry.  This length is the sum of the
 * great circle distances between coordinates.  For polygons, the length is
 * the sum of all rings.  For points, the length is zero.  For multi-part
 * geometries, the length is the sum of the length of each part.
 * @param {import("./geom/Geometry.js").default} geometry A geometry.
 * @param {SphereMetricOptions=} opt_options Options for the
 * length calculation.  By default, geometries are assumed to be in 'EPSG:3857'.
 * You can change this by providing a `projection` option.
 * @return {number} The spherical length (in meters).
 * @api
 */
function getLength(geometry, opt_options) {
  var options = opt_options || {};
  var radius = options.radius || DEFAULT_RADIUS;
  var projection = options.projection || 'EPSG:3857';
  var type = geometry.getType();
  if (type !== _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].GEOMETRY_COLLECTION) {
    geometry = geometry.clone().transform(projection, 'EPSG:4326');
  }
  var length = 0;
  var coordinates, coords, i, ii, j, jj;
  switch (type) {
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].POINT:
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].MULTI_POINT: {
      break;
    }
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].LINE_STRING:
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].LINEAR_RING: {
      coordinates = /** @type {import("./geom/SimpleGeometry.js").default} */ (geometry).getCoordinates();
      length = getLengthInternal(coordinates, radius);
      break;
    }
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].MULTI_LINE_STRING:
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].POLYGON: {
      coordinates = /** @type {import("./geom/SimpleGeometry.js").default} */ (geometry).getCoordinates();
      for (i = 0, ii = coordinates.length; i < ii; ++i) {
        length += getLengthInternal(coordinates[i], radius);
      }
      break;
    }
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].MULTI_POLYGON: {
      coordinates = /** @type {import("./geom/SimpleGeometry.js").default} */ (geometry).getCoordinates();
      for (i = 0, ii = coordinates.length; i < ii; ++i) {
        coords = coordinates[i];
        for (j = 0, jj = coords.length; j < jj; ++j) {
          length += getLengthInternal(coords[j], radius);
        }
      }
      break;
    }
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].GEOMETRY_COLLECTION: {
      var geometries = /** @type {import("./geom/GeometryCollection.js").default} */ (geometry).getGeometries();
      for (i = 0, ii = geometries.length; i < ii; ++i) {
        length += getLength(geometries[i], opt_options);
      }
      break;
    }
    default: {
      throw new Error('Unsupported geometry type: ' + type);
    }
  }
  return length;
}


/**
 * Returns the spherical area for a list of coordinates.
 *
 * [Reference](https://trs-new.jpl.nasa.gov/handle/2014/40409)
 * Robert. G. Chamberlain and William H. Duquette, "Some Algorithms for
 * Polygons on a Sphere", JPL Publication 07-03, Jet Propulsion
 * Laboratory, Pasadena, CA, June 2007
 *
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates List of coordinates of a linear
 * ring. If the ring is oriented clockwise, the area will be positive,
 * otherwise it will be negative.
 * @param {number} radius The sphere radius.
 * @return {number} Area (in square meters).
 */
function getAreaInternal(coordinates, radius) {
  var area = 0;
  var len = coordinates.length;
  var x1 = coordinates[len - 1][0];
  var y1 = coordinates[len - 1][1];
  for (var i = 0; i < len; i++) {
    var x2 = coordinates[i][0];
    var y2 = coordinates[i][1];
    area += (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toRadians)(x2 - x1) *
        (2 + Math.sin((0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toRadians)(y1)) +
        Math.sin((0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toRadians)(y2)));
    x1 = x2;
    y1 = y2;
  }
  return area * radius * radius / 2.0;
}


/**
 * Get the spherical area of a geometry.  This is the area (in meters) assuming
 * that polygon edges are segments of great circles on a sphere.
 * @param {import("./geom/Geometry.js").default} geometry A geometry.
 * @param {SphereMetricOptions=} opt_options Options for the area
 *     calculation.  By default, geometries are assumed to be in 'EPSG:3857'.
 *     You can change this by providing a `projection` option.
 * @return {number} The spherical area (in square meters).
 * @api
 */
function getArea(geometry, opt_options) {
  var options = opt_options || {};
  var radius = options.radius || DEFAULT_RADIUS;
  var projection = options.projection || 'EPSG:3857';
  var type = geometry.getType();
  if (type !== _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].GEOMETRY_COLLECTION) {
    geometry = geometry.clone().transform(projection, 'EPSG:4326');
  }
  var area = 0;
  var coordinates, coords, i, ii, j, jj;
  switch (type) {
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].POINT:
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].MULTI_POINT:
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].LINE_STRING:
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].MULTI_LINE_STRING:
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].LINEAR_RING: {
      break;
    }
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].POLYGON: {
      coordinates = /** @type {import("./geom/Polygon.js").default} */ (geometry).getCoordinates();
      area = Math.abs(getAreaInternal(coordinates[0], radius));
      for (i = 1, ii = coordinates.length; i < ii; ++i) {
        area -= Math.abs(getAreaInternal(coordinates[i], radius));
      }
      break;
    }
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].MULTI_POLYGON: {
      coordinates = /** @type {import("./geom/SimpleGeometry.js").default} */ (geometry).getCoordinates();
      for (i = 0, ii = coordinates.length; i < ii; ++i) {
        coords = coordinates[i];
        area += Math.abs(getAreaInternal(coords[0], radius));
        for (j = 1, jj = coords.length; j < jj; ++j) {
          area -= Math.abs(getAreaInternal(coords[j], radius));
        }
      }
      break;
    }
    case _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_1__["default"].GEOMETRY_COLLECTION: {
      var geometries = /** @type {import("./geom/GeometryCollection.js").default} */ (geometry).getGeometries();
      for (i = 0, ii = geometries.length; i < ii; ++i) {
        area += getArea(geometries[i], opt_options);
      }
      break;
    }
    default: {
      throw new Error('Unsupported geometry type: ' + type);
    }
  }
  return area;
}


/**
 * Returns the coordinate at the given distance and bearing from `c1`.
 *
 * @param {import("./coordinate.js").Coordinate} c1 The origin point (`[lon, lat]` in degrees).
 * @param {number} distance The great-circle distance between the origin
 *     point and the target point.
 * @param {number} bearing The bearing (in radians).
 * @param {number=} opt_radius The sphere radius to use.  Defaults to the Earth's
 *     mean radius using the WGS84 ellipsoid.
 * @return {import("./coordinate.js").Coordinate} The target point.
 */
function offset(c1, distance, bearing, opt_radius) {
  var radius = opt_radius || DEFAULT_RADIUS;
  var lat1 = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toRadians)(c1[1]);
  var lon1 = (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toRadians)(c1[0]);
  var dByR = distance / radius;
  var lat = Math.asin(
    Math.sin(lat1) * Math.cos(dByR) +
      Math.cos(lat1) * Math.sin(dByR) * Math.cos(bearing));
  var lon = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1),
    Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat));
  return [(0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toDegrees)(lon), (0,_math_js__WEBPACK_IMPORTED_MODULE_0__.toDegrees)(lat)];
}

//# sourceMappingURL=sphere.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/string.js":
/*!*******************************************!*\
  !*** ./node_modules/@biigle/ol/string.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "padNumber": () => (/* binding */ padNumber),
/* harmony export */   "compareVersions": () => (/* binding */ compareVersions)
/* harmony export */ });
/**
 * @module ol/string
 */

/**
 * @param {number} number Number to be formatted
 * @param {number} width The desired width
 * @param {number=} opt_precision Precision of the output string (i.e. number of decimal places)
 * @returns {string} Formatted string
 */
function padNumber(number, width, opt_precision) {
  var numberString = opt_precision !== undefined ? number.toFixed(opt_precision) : '' + number;
  var decimal = numberString.indexOf('.');
  decimal = decimal === -1 ? numberString.length : decimal;
  return decimal > width ? numberString : new Array(1 + width - decimal).join('0') + numberString;
}


/**
 * Adapted from https://github.com/omichelsen/compare-versions/blob/master/index.js
 * @param {string|number} v1 First version
 * @param {string|number} v2 Second version
 * @returns {number} Value
 */
function compareVersions(v1, v2) {
  var s1 = ('' + v1).split('.');
  var s2 = ('' + v2).split('.');

  for (var i = 0; i < Math.max(s1.length, s2.length); i++) {
    var n1 = parseInt(s1[i] || '0', 10);
    var n2 = parseInt(s2[i] || '0', 10);

    if (n1 > n2) {
      return 1;
    }
    if (n2 > n1) {
      return -1;
    }
  }

  return 0;
}

//# sourceMappingURL=string.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/structs/LRUCache.js":
/*!*****************************************************!*\
  !*** ./node_modules/@biigle/ol/structs/LRUCache.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _asserts_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../asserts.js */ "./node_modules/@biigle/ol/asserts.js");
/* harmony import */ var _events_Target_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events/Target.js */ "./node_modules/@biigle/ol/events/Target.js");
/* harmony import */ var _events_EventType_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/EventType.js */ "./node_modules/@biigle/ol/events/EventType.js");
/**
 * @module ol/structs/LRUCache
 */






/**
 * @typedef {Object} Entry
 * @property {string} key_
 * @property {Object} newer
 * @property {Object} older
 * @property {*} value_
 */


/**
 * @classdesc
 * Implements a Least-Recently-Used cache where the keys do not conflict with
 * Object's properties (e.g. 'hasOwnProperty' is not allowed as a key). Expiring
 * items from the cache is the responsibility of the user.
 *
 * @fires import("../events/Event.js").Event
 * @template T
 */
var LRUCache = /*@__PURE__*/(function (EventTarget) {
  function LRUCache(opt_highWaterMark) {

    EventTarget.call(this);

    /**
     * @type {number}
     */
    this.highWaterMark = opt_highWaterMark !== undefined ? opt_highWaterMark : 2048;

    /**
     * @private
     * @type {number}
     */
    this.count_ = 0;

    /**
     * @private
     * @type {!Object<string, Entry>}
     */
    this.entries_ = {};

    /**
     * @private
     * @type {?Entry}
     */
    this.oldest_ = null;

    /**
     * @private
     * @type {?Entry}
     */
    this.newest_ = null;

  }

  if ( EventTarget ) LRUCache.__proto__ = EventTarget;
  LRUCache.prototype = Object.create( EventTarget && EventTarget.prototype );
  LRUCache.prototype.constructor = LRUCache;


  /**
   * @return {boolean} Can expire cache.
   */
  LRUCache.prototype.canExpireCache = function canExpireCache () {
    return this.getCount() > this.highWaterMark;
  };


  /**
   * FIXME empty description for jsdoc
   */
  LRUCache.prototype.clear = function clear () {
    this.count_ = 0;
    this.entries_ = {};
    this.oldest_ = null;
    this.newest_ = null;
    this.dispatchEvent(_events_EventType_js__WEBPACK_IMPORTED_MODULE_0__["default"].CLEAR);
  };


  /**
   * @param {string} key Key.
   * @return {boolean} Contains key.
   */
  LRUCache.prototype.containsKey = function containsKey (key) {
    return this.entries_.hasOwnProperty(key);
  };


  /**
   * @param {function(this: S, T, string, LRUCache): ?} f The function
   *     to call for every entry from the oldest to the newer. This function takes
   *     3 arguments (the entry value, the entry key and the LRUCache object).
   *     The return value is ignored.
   * @param {S=} opt_this The object to use as `this` in `f`.
   * @template S
   */
  LRUCache.prototype.forEach = function forEach (f, opt_this) {
    var entry = this.oldest_;
    while (entry) {
      f.call(opt_this, entry.value_, entry.key_, this);
      entry = entry.newer;
    }
  };


  /**
   * @param {string} key Key.
   * @return {T} Value.
   */
  LRUCache.prototype.get = function get (key) {
    var entry = this.entries_[key];
    (0,_asserts_js__WEBPACK_IMPORTED_MODULE_1__.assert)(entry !== undefined,
      15); // Tried to get a value for a key that does not exist in the cache
    if (entry === this.newest_) {
      return entry.value_;
    } else if (entry === this.oldest_) {
      this.oldest_ = /** @type {Entry} */ (this.oldest_.newer);
      this.oldest_.older = null;
    } else {
      entry.newer.older = entry.older;
      entry.older.newer = entry.newer;
    }
    entry.newer = null;
    entry.older = this.newest_;
    this.newest_.newer = entry;
    this.newest_ = entry;
    return entry.value_;
  };


  /**
   * Remove an entry from the cache.
   * @param {string} key The entry key.
   * @return {T} The removed entry.
   */
  LRUCache.prototype.remove = function remove (key) {
    var entry = this.entries_[key];
    (0,_asserts_js__WEBPACK_IMPORTED_MODULE_1__.assert)(entry !== undefined, 15); // Tried to get a value for a key that does not exist in the cache
    if (entry === this.newest_) {
      this.newest_ = /** @type {Entry} */ (entry.older);
      if (this.newest_) {
        this.newest_.newer = null;
      }
    } else if (entry === this.oldest_) {
      this.oldest_ = /** @type {Entry} */ (entry.newer);
      if (this.oldest_) {
        this.oldest_.older = null;
      }
    } else {
      entry.newer.older = entry.older;
      entry.older.newer = entry.newer;
    }
    delete this.entries_[key];
    --this.count_;
    return entry.value_;
  };


  /**
   * @return {number} Count.
   */
  LRUCache.prototype.getCount = function getCount () {
    return this.count_;
  };


  /**
   * @return {Array<string>} Keys.
   */
  LRUCache.prototype.getKeys = function getKeys () {
    var keys = new Array(this.count_);
    var i = 0;
    var entry;
    for (entry = this.newest_; entry; entry = entry.older) {
      keys[i++] = entry.key_;
    }
    return keys;
  };


  /**
   * @return {Array<T>} Values.
   */
  LRUCache.prototype.getValues = function getValues () {
    var values = new Array(this.count_);
    var i = 0;
    var entry;
    for (entry = this.newest_; entry; entry = entry.older) {
      values[i++] = entry.value_;
    }
    return values;
  };


  /**
   * @return {T} Last value.
   */
  LRUCache.prototype.peekLast = function peekLast () {
    return this.oldest_.value_;
  };


  /**
   * @return {string} Last key.
   */
  LRUCache.prototype.peekLastKey = function peekLastKey () {
    return this.oldest_.key_;
  };


  /**
   * Get the key of the newest item in the cache.  Throws if the cache is empty.
   * @return {string} The newest key.
   */
  LRUCache.prototype.peekFirstKey = function peekFirstKey () {
    return this.newest_.key_;
  };


  /**
   * @return {T} value Value.
   */
  LRUCache.prototype.pop = function pop () {
    var entry = this.oldest_;
    delete this.entries_[entry.key_];
    if (entry.newer) {
      entry.newer.older = null;
    }
    this.oldest_ = /** @type {Entry} */ (entry.newer);
    if (!this.oldest_) {
      this.newest_ = null;
    }
    --this.count_;
    return entry.value_;
  };


  /**
   * @param {string} key Key.
   * @param {T} value Value.
   */
  LRUCache.prototype.replace = function replace (key, value) {
    this.get(key); // update `newest_`
    this.entries_[key].value_ = value;
  };


  /**
   * @param {string} key Key.
   * @param {T} value Value.
   */
  LRUCache.prototype.set = function set (key, value) {
    (0,_asserts_js__WEBPACK_IMPORTED_MODULE_1__.assert)(!(key in this.entries_),
      16); // Tried to set a value for a key that is used already
    var entry = /** @type {Entry} */ ({
      key_: key,
      newer: null,
      older: this.newest_,
      value_: value
    });
    if (!this.newest_) {
      this.oldest_ = entry;
    } else {
      this.newest_.newer = entry;
    }
    this.newest_ = entry;
    this.entries_[key] = entry;
    ++this.count_;
  };


  /**
   * Set a maximum number of entries for the cache.
   * @param {number} size Cache size.
   * @api
   */
  LRUCache.prototype.setSize = function setSize (size) {
    this.highWaterMark = size;
  };


  /**
   * Prune the cache.
   */
  LRUCache.prototype.prune = function prune () {
    while (this.canExpireCache()) {
      this.pop();
    }
  };

  return LRUCache;
}(_events_Target_js__WEBPACK_IMPORTED_MODULE_2__["default"]));

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LRUCache);

//# sourceMappingURL=LRUCache.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/structs/RBush.js":
/*!**************************************************!*\
  !*** ./node_modules/@biigle/ol/structs/RBush.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var rbush__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! rbush */ "./node_modules/rbush/index.js");
/* harmony import */ var rbush__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(rbush__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../extent.js */ "./node_modules/@biigle/ol/extent.js");
/* harmony import */ var _obj_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../obj.js */ "./node_modules/@biigle/ol/obj.js");
/**
 * @module ol/structs/RBush
 */





/**
 * @typedef {Object} Entry
 * @property {number} minX
 * @property {number} minY
 * @property {number} maxX
 * @property {number} maxY
 * @property {Object} [value]
 */

/**
 * @classdesc
 * Wrapper around the RBush by Vladimir Agafonkin.
 * See https://github.com/mourner/rbush.
 *
 * @template T
 */
var RBush = function RBush(opt_maxEntries) {

  /**
   * @private
   */
  this.rbush_ = rbush__WEBPACK_IMPORTED_MODULE_0___default()(opt_maxEntries, undefined);

  /**
   * A mapping between the objects added to this rbush wrapper
   * and the objects that are actually added to the internal rbush.
   * @private
   * @type {Object<string, Entry>}
   */
  this.items_ = {};

};

/**
 * Insert a value into the RBush.
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {T} value Value.
 */
RBush.prototype.insert = function insert (extent, value) {
  /** @type {Entry} */
  var item = {
    minX: extent[0],
    minY: extent[1],
    maxX: extent[2],
    maxY: extent[3],
    value: value
  };

  this.rbush_.insert(item);
  this.items_[(0,_util_js__WEBPACK_IMPORTED_MODULE_1__.getUid)(value)] = item;
};


/**
 * Bulk-insert values into the RBush.
 * @param {Array<import("../extent.js").Extent>} extents Extents.
 * @param {Array<T>} values Values.
 */
RBush.prototype.load = function load (extents, values) {
  var items = new Array(values.length);
  for (var i = 0, l = values.length; i < l; i++) {
    var extent = extents[i];
    var value = values[i];

    /** @type {Entry} */
    var item = {
      minX: extent[0],
      minY: extent[1],
      maxX: extent[2],
      maxY: extent[3],
      value: value
    };
    items[i] = item;
    this.items_[(0,_util_js__WEBPACK_IMPORTED_MODULE_1__.getUid)(value)] = item;
  }
  this.rbush_.load(items);
};


/**
 * Remove a value from the RBush.
 * @param {T} value Value.
 * @return {boolean} Removed.
 */
RBush.prototype.remove = function remove (value) {
  var uid = (0,_util_js__WEBPACK_IMPORTED_MODULE_1__.getUid)(value);

  // get the object in which the value was wrapped when adding to the
  // internal rbush. then use that object to do the removal.
  var item = this.items_[uid];
  delete this.items_[uid];
  return this.rbush_.remove(item) !== null;
};


/**
 * Update the extent of a value in the RBush.
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {T} value Value.
 */
RBush.prototype.update = function update (extent, value) {
  var item = this.items_[(0,_util_js__WEBPACK_IMPORTED_MODULE_1__.getUid)(value)];
  var bbox = [item.minX, item.minY, item.maxX, item.maxY];
  if (!(0,_extent_js__WEBPACK_IMPORTED_MODULE_2__.equals)(bbox, extent)) {
    this.remove(value);
    this.insert(extent, value);
  }
};


/**
 * Return all values in the RBush.
 * @return {Array<T>} All.
 */
RBush.prototype.getAll = function getAll () {
  var items = this.rbush_.all();
  return items.map(function(item) {
    return item.value;
  });
};


/**
 * Return all values in the given extent.
 * @param {import("../extent.js").Extent} extent Extent.
 * @return {Array<T>} All in extent.
 */
RBush.prototype.getInExtent = function getInExtent (extent) {
  /** @type {Entry} */
  var bbox = {
    minX: extent[0],
    minY: extent[1],
    maxX: extent[2],
    maxY: extent[3]
  };
  var items = this.rbush_.search(bbox);
  return items.map(function(item) {
    return item.value;
  });
};


/**
 * Calls a callback function with each value in the tree.
 * If the callback returns a truthy value, this value is returned without
 * checking the rest of the tree.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @return {*} Callback return value.
 * @template S
 */
RBush.prototype.forEach = function forEach (callback, opt_this) {
  return this.forEach_(this.getAll(), callback, opt_this);
};


/**
 * Calls a callback function with each value in the provided extent.
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @return {*} Callback return value.
 * @template S
 */
RBush.prototype.forEachInExtent = function forEachInExtent (extent, callback, opt_this) {
  return this.forEach_(this.getInExtent(extent), callback, opt_this);
};


/**
 * @param {Array<T>} values Values.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @private
 * @return {*} Callback return value.
 * @template S
 */
RBush.prototype.forEach_ = function forEach_ (values, callback, opt_this) {
  var result;
  for (var i = 0, l = values.length; i < l; i++) {
    result = callback.call(opt_this, values[i]);
    if (result) {
      return result;
    }
  }
  return result;
};


/**
 * @return {boolean} Is empty.
 */
RBush.prototype.isEmpty = function isEmpty$1 () {
  return (0,_obj_js__WEBPACK_IMPORTED_MODULE_3__.isEmpty)(this.items_);
};


/**
 * Remove all values from the RBush.
 */
RBush.prototype.clear = function clear () {
  this.rbush_.clear();
  this.items_ = {};
};


/**
 * @param {import("../extent.js").Extent=} opt_extent Extent.
 * @return {import("../extent.js").Extent} Extent.
 */
RBush.prototype.getExtent = function getExtent (opt_extent) {
  var data = this.rbush_.toJSON();
  return (0,_extent_js__WEBPACK_IMPORTED_MODULE_2__.createOrUpdate)(data.minX, data.minY, data.maxX, data.maxY, opt_extent);
};


/**
 * @param {RBush} rbush R-Tree.
 */
RBush.prototype.concat = function concat (rbush) {
  this.rbush_.load(rbush.rbush_.all());
  for (var i in rbush.items_) {
    this.items_[i] = rbush.items_[i];
  }
};


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RBush);

//# sourceMappingURL=RBush.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/style/Circle.js":
/*!*************************************************!*\
  !*** ./node_modules/@biigle/ol/style/Circle.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _RegularShape_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./RegularShape.js */ "./node_modules/@biigle/ol/style/RegularShape.js");
/**
 * @module ol/style/Circle
 */




/**
 * @typedef {Object} Options
 * @property {import("./Fill.js").default} [fill] Fill style.
 * @property {number} radius Circle radius.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {import("./AtlasManager.js").default} [atlasManager] The atlas manager to use for this circle.
 * When using WebGL it is recommended to use an atlas manager to avoid texture switching. If an atlas manager is given,
 * the circle is added to an atlas. By default no atlas manager is used.
 */


/**
 * @classdesc
 * Set circle style for vector features.
 * @api
 */
var CircleStyle = /*@__PURE__*/(function (RegularShape) {
  function CircleStyle(opt_options) {

    var options = opt_options || /** @type {Options} */ ({});

    RegularShape.call(this, {
      points: Infinity,
      fill: options.fill,
      radius: options.radius,
      stroke: options.stroke,
      atlasManager: options.atlasManager
    });

  }

  if ( RegularShape ) CircleStyle.__proto__ = RegularShape;
  CircleStyle.prototype = Object.create( RegularShape && RegularShape.prototype );
  CircleStyle.prototype.constructor = CircleStyle;

  /**
  * Clones the style.  If an atlasmanager was provided to the original style it will be used in the cloned style, too.
  * @return {CircleStyle} The cloned style.
  * @override
  * @api
  */
  CircleStyle.prototype.clone = function clone () {
    var style = new CircleStyle({
      fill: this.getFill() ? this.getFill().clone() : undefined,
      stroke: this.getStroke() ? this.getStroke().clone() : undefined,
      radius: this.getRadius(),
      atlasManager: this.atlasManager_
    });
    style.setOpacity(this.getOpacity());
    style.setScale(this.getScale());
    return style;
  };

  /**
  * Set the circle radius.
  *
  * @param {number} radius Circle radius.
  * @api
  */
  CircleStyle.prototype.setRadius = function setRadius (radius) {
    this.radius_ = radius;
    this.render_(this.atlasManager_);
  };

  return CircleStyle;
}(_RegularShape_js__WEBPACK_IMPORTED_MODULE_0__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CircleStyle);

//# sourceMappingURL=Circle.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/style/Fill.js":
/*!***********************************************!*\
  !*** ./node_modules/@biigle/ol/style/Fill.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/* harmony import */ var _color_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../color.js */ "./node_modules/@biigle/ol/color.js");
/**
 * @module ol/style/Fill
 */




/**
 * @typedef {Object} Options
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [color] A color, gradient or pattern.
 * See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats.
 * Default null; if null, the Canvas/renderer default black will be used.
 */


/**
 * @classdesc
 * Set fill style for vector features.
 * @api
 */
var Fill = function Fill(opt_options) {

  var options = opt_options || {};

  /**
   * @private
   * @type {import("../color.js").Color|import("../colorlike.js").ColorLike}
   */
  this.color_ = options.color !== undefined ? options.color : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.checksum_ = undefined;
};

/**
 * Clones the style. The color is not cloned if it is an {@link module:ol/colorlike~ColorLike}.
 * @return {Fill} The cloned style.
 * @api
 */
Fill.prototype.clone = function clone () {
  var color = this.getColor();
  return new Fill({
    color: Array.isArray(color) ? color.slice() : color || undefined
  });
};

/**
 * Get the fill color.
 * @return {import("../color.js").Color|import("../colorlike.js").ColorLike} Color.
 * @api
 */
Fill.prototype.getColor = function getColor () {
  return this.color_;
};

/**
 * Set the color.
 *
 * @param {import("../color.js").Color|import("../colorlike.js").ColorLike} color Color.
 * @api
 */
Fill.prototype.setColor = function setColor (color) {
  this.color_ = color;
  this.checksum_ = undefined;
};

/**
 * @return {string} The checksum.
 */
Fill.prototype.getChecksum = function getChecksum () {
  if (this.checksum_ === undefined) {
    var color = this.color_;
    if (color) {
      if (Array.isArray(color) || typeof color == 'string') {
        this.checksum_ = 'f' + (0,_color_js__WEBPACK_IMPORTED_MODULE_0__.asString)(/** @type {import("../color.js").Color|string} */ (color));
      } else {
        this.checksum_ = (0,_util_js__WEBPACK_IMPORTED_MODULE_1__.getUid)(this.color_);
      }
    } else {
      this.checksum_ = 'f-';
    }
  }

  return this.checksum_;
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Fill);

//# sourceMappingURL=Fill.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/style/Image.js":
/*!************************************************!*\
  !*** ./node_modules/@biigle/ol/style/Image.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/**
 * @module ol/style/Image
 */



/**
 * @typedef {Object} Options
 * @property {number} opacity
 * @property {boolean} rotateWithView
 * @property {number} rotation
 * @property {number} scale
 */


/**
 * @classdesc
 * A base class used for creating subclasses and not instantiated in
 * apps. Base class for {@link module:ol/style/Icon~Icon}, {@link module:ol/style/Circle~CircleStyle} and
 * {@link module:ol/style/RegularShape~RegularShape}.
 * @abstract
 * @api
 */
var ImageStyle = function ImageStyle(options) {

  /**
   * @private
   * @type {number}
   */
  this.opacity_ = options.opacity;

  /**
   * @private
   * @type {boolean}
   */
  this.rotateWithView_ = options.rotateWithView;

  /**
   * @private
   * @type {number}
   */
  this.rotation_ = options.rotation;

  /**
   * @private
   * @type {number}
   */
  this.scale_ = options.scale;

};

/**
 * Clones the style.
 * @return {ImageStyle} The cloned style.
 * @api
 */
ImageStyle.prototype.clone = function clone () {
  return new ImageStyle({
    opacity: this.getOpacity(),
    scale: this.getScale(),
    rotation: this.getRotation(),
    rotateWithView: this.getRotateWithView()
  });
};

/**
 * Get the symbolizer opacity.
 * @return {number} Opacity.
 * @api
 */
ImageStyle.prototype.getOpacity = function getOpacity () {
  return this.opacity_;
};

/**
 * Determine whether the symbolizer rotates with the map.
 * @return {boolean} Rotate with map.
 * @api
 */
ImageStyle.prototype.getRotateWithView = function getRotateWithView () {
  return this.rotateWithView_;
};

/**
 * Get the symoblizer rotation.
 * @return {number} Rotation.
 * @api
 */
ImageStyle.prototype.getRotation = function getRotation () {
  return this.rotation_;
};

/**
 * Get the symbolizer scale.
 * @return {number} Scale.
 * @api
 */
ImageStyle.prototype.getScale = function getScale () {
  return this.scale_;
};

/**
 * This method is deprecated and always returns false.
 * @return {boolean} false.
 * @deprecated
 * @api
 */
ImageStyle.prototype.getSnapToPixel = function getSnapToPixel () {
  return false;
};

/**
 * Get the anchor point in pixels. The anchor determines the center point for the
 * symbolizer.
 * @abstract
 * @return {Array<number>} Anchor.
 */
ImageStyle.prototype.getAnchor = function getAnchor () {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * Get the image element for the symbolizer.
 * @abstract
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} Image element.
 */
ImageStyle.prototype.getImage = function getImage (pixelRatio) {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * @abstract
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} Image element.
 */
ImageStyle.prototype.getHitDetectionImage = function getHitDetectionImage (pixelRatio) {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * @abstract
 * @return {import("../ImageState.js").default} Image state.
 */
ImageStyle.prototype.getImageState = function getImageState () {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * @abstract
 * @return {import("../size.js").Size} Image size.
 */
ImageStyle.prototype.getImageSize = function getImageSize () {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * @abstract
 * @return {import("../size.js").Size} Size of the hit-detection image.
 */
ImageStyle.prototype.getHitDetectionImageSize = function getHitDetectionImageSize () {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * Get the origin of the symbolizer.
 * @abstract
 * @return {Array<number>} Origin.
 */
ImageStyle.prototype.getOrigin = function getOrigin () {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * Get the size of the symbolizer (in pixels).
 * @abstract
 * @return {import("../size.js").Size} Size.
 */
ImageStyle.prototype.getSize = function getSize () {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * Set the opacity.
 *
 * @param {number} opacity Opacity.
 * @api
 */
ImageStyle.prototype.setOpacity = function setOpacity (opacity) {
  this.opacity_ = opacity;
};

/**
 * Set whether to rotate the style with the view.
 *
 * @param {boolean} rotateWithView Rotate with map.
 * @api
 */
ImageStyle.prototype.setRotateWithView = function setRotateWithView (rotateWithView) {
  this.rotateWithView_ = rotateWithView;
};

/**
 * Set the rotation.
 *
 * @param {number} rotation Rotation.
 * @api
 */
ImageStyle.prototype.setRotation = function setRotation (rotation) {
  this.rotation_ = rotation;
};
/**
 * Set the scale.
 *
 * @param {number} scale Scale.
 * @api
 */
ImageStyle.prototype.setScale = function setScale (scale) {
  this.scale_ = scale;
};

/**
 * This method is deprecated and does nothing.
 * @param {boolean} snapToPixel Snap to pixel?
 * @deprecated
 * @api
 */
ImageStyle.prototype.setSnapToPixel = function setSnapToPixel (snapToPixel) {};

/**
 * @abstract
 * @param {function(this: T, import("../events/Event.js").default)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @return {import("../events.js").EventsKey|undefined} Listener key.
 * @template T
 */
ImageStyle.prototype.listenImageChange = function listenImageChange (listener, thisArg) {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * Load not yet loaded URI.
 * @abstract
 */
ImageStyle.prototype.load = function load () {
  (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/**
 * @abstract
 * @param {function(this: T, import("../events/Event.js").default)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @template T
 */
ImageStyle.prototype.unlistenImageChange = function unlistenImageChange (listener, thisArg) {
  (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.abstract)();
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ImageStyle);

//# sourceMappingURL=Image.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/style/RegularShape.js":
/*!*******************************************************!*\
  !*** ./node_modules/@biigle/ol/style/RegularShape.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _color_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../color.js */ "./node_modules/@biigle/ol/color.js");
/* harmony import */ var _colorlike_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../colorlike.js */ "./node_modules/@biigle/ol/colorlike.js");
/* harmony import */ var _dom_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../dom.js */ "./node_modules/@biigle/ol/dom.js");
/* harmony import */ var _has_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../has.js */ "./node_modules/@biigle/ol/has.js");
/* harmony import */ var _ImageState_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../ImageState.js */ "./node_modules/@biigle/ol/ImageState.js");
/* harmony import */ var _render_canvas_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../render/canvas.js */ "./node_modules/@biigle/ol/render/canvas.js");
/* harmony import */ var _Image_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./Image.js */ "./node_modules/@biigle/ol/style/Image.js");
/**
 * @module ol/style/RegularShape
 */










/**
 * Specify radius for regular polygons, or radius1 and radius2 for stars.
 * @typedef {Object} Options
 * @property {import("./Fill.js").default} [fill] Fill style.
 * @property {number} points Number of points for stars and regular polygons. In case of a polygon, the number of points
 * is the number of sides.
 * @property {number} [radius] Radius of a regular polygon.
 * @property {number} [radius1] Outer radius of a star.
 * @property {number} [radius2] Inner radius of a star.
 * @property {number} [angle=0] Shape's angle in radians. A value of 0 will have one of the shape's point facing up.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {boolean} [rotateWithView=false] Whether to rotate the shape with the view.
 * @property {import("./AtlasManager.js").default} [atlasManager] The atlas manager to use for this symbol. When
 * using WebGL it is recommended to use an atlas manager to avoid texture switching. If an atlas manager is given, the
 * symbol is added to an atlas. By default no atlas manager is used.
 */


/**
 * @typedef {Object} RenderOptions
 * @property {import("../colorlike.js").ColorLike} [strokeStyle]
 * @property {number} strokeWidth
 * @property {number} size
 * @property {string} lineCap
 * @property {Array<number>} lineDash
 * @property {number} lineDashOffset
 * @property {string} lineJoin
 * @property {number} miterLimit
 */


/**
 * @classdesc
 * Set regular shape style for vector features. The resulting shape will be
 * a regular polygon when `radius` is provided, or a star when `radius1` and
 * `radius2` are provided.
 * @api
 */
var RegularShape = /*@__PURE__*/(function (ImageStyle) {
  function RegularShape(options) {
    /**
     * @type {boolean}
     */
    var rotateWithView = options.rotateWithView !== undefined ?
      options.rotateWithView : false;

    ImageStyle.call(this, {
      opacity: 1,
      rotateWithView: rotateWithView,
      rotation: options.rotation !== undefined ? options.rotation : 0,
      scale: 1
    });

    /**
     * @private
     * @type {Array<string|number>}
     */
    this.checksums_ = null;

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = null;

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.hitDetectionCanvas_ = null;

    /**
     * @private
     * @type {import("./Fill.js").default}
     */
    this.fill_ = options.fill !== undefined ? options.fill : null;

    /**
     * @private
     * @type {Array<number>}
     */
    this.origin_ = [0, 0];

    /**
     * @private
     * @type {number}
     */
    this.points_ = options.points;

    /**
     * @protected
     * @type {number}
     */
    this.radius_ = /** @type {number} */ (options.radius !== undefined ?
      options.radius : options.radius1);

    /**
     * @private
     * @type {number|undefined}
     */
    this.radius2_ = options.radius2;

    /**
     * @private
     * @type {number}
     */
    this.angle_ = options.angle !== undefined ? options.angle : 0;

    /**
     * @private
     * @type {import("./Stroke.js").default}
     */
    this.stroke_ = options.stroke !== undefined ? options.stroke : null;

    /**
     * @private
     * @type {Array<number>}
     */
    this.anchor_ = null;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.size_ = null;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.imageSize_ = null;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.hitDetectionImageSize_ = null;

    /**
     * @protected
     * @type {import("./AtlasManager.js").default|undefined}
     */
    this.atlasManager_ = options.atlasManager;

    this.render_(this.atlasManager_);

  }

  if ( ImageStyle ) RegularShape.__proto__ = ImageStyle;
  RegularShape.prototype = Object.create( ImageStyle && ImageStyle.prototype );
  RegularShape.prototype.constructor = RegularShape;

  /**
   * Clones the style. If an atlasmanager was provided to the original style it will be used in the cloned style, too.
   * @return {RegularShape} The cloned style.
   * @api
   */
  RegularShape.prototype.clone = function clone () {
    var style = new RegularShape({
      fill: this.getFill() ? this.getFill().clone() : undefined,
      points: this.getPoints(),
      radius: this.getRadius(),
      radius2: this.getRadius2(),
      angle: this.getAngle(),
      stroke: this.getStroke() ? this.getStroke().clone() : undefined,
      rotation: this.getRotation(),
      rotateWithView: this.getRotateWithView(),
      atlasManager: this.atlasManager_
    });
    style.setOpacity(this.getOpacity());
    style.setScale(this.getScale());
    return style;
  };

  /**
   * @inheritDoc
   * @api
   */
  RegularShape.prototype.getAnchor = function getAnchor () {
    return this.anchor_;
  };

  /**
   * Get the angle used in generating the shape.
   * @return {number} Shape's rotation in radians.
   * @api
   */
  RegularShape.prototype.getAngle = function getAngle () {
    return this.angle_;
  };

  /**
   * Get the fill style for the shape.
   * @return {import("./Fill.js").default} Fill style.
   * @api
   */
  RegularShape.prototype.getFill = function getFill () {
    return this.fill_;
  };

  /**
   * @inheritDoc
   */
  RegularShape.prototype.getHitDetectionImage = function getHitDetectionImage (pixelRatio) {
    return this.hitDetectionCanvas_;
  };

  /**
   * @inheritDoc
   * @api
   */
  RegularShape.prototype.getImage = function getImage (pixelRatio) {
    return this.canvas_;
  };

  /**
   * @inheritDoc
   */
  RegularShape.prototype.getImageSize = function getImageSize () {
    return this.imageSize_;
  };

  /**
   * @inheritDoc
   */
  RegularShape.prototype.getHitDetectionImageSize = function getHitDetectionImageSize () {
    return this.hitDetectionImageSize_;
  };

  /**
   * @inheritDoc
   */
  RegularShape.prototype.getImageState = function getImageState () {
    return _ImageState_js__WEBPACK_IMPORTED_MODULE_0__["default"].LOADED;
  };

  /**
   * @inheritDoc
   * @api
   */
  RegularShape.prototype.getOrigin = function getOrigin () {
    return this.origin_;
  };

  /**
   * Get the number of points for generating the shape.
   * @return {number} Number of points for stars and regular polygons.
   * @api
   */
  RegularShape.prototype.getPoints = function getPoints () {
    return this.points_;
  };

  /**
   * Get the (primary) radius for the shape.
   * @return {number} Radius.
   * @api
   */
  RegularShape.prototype.getRadius = function getRadius () {
    return this.radius_;
  };

  /**
   * Get the secondary radius for the shape.
   * @return {number|undefined} Radius2.
   * @api
   */
  RegularShape.prototype.getRadius2 = function getRadius2 () {
    return this.radius2_;
  };

  /**
   * @inheritDoc
   * @api
   */
  RegularShape.prototype.getSize = function getSize () {
    return this.size_;
  };

  /**
   * Get the stroke style for the shape.
   * @return {import("./Stroke.js").default} Stroke style.
   * @api
   */
  RegularShape.prototype.getStroke = function getStroke () {
    return this.stroke_;
  };

  /**
   * @inheritDoc
   */
  RegularShape.prototype.listenImageChange = function listenImageChange (listener, thisArg) {
    return undefined;
  };

  /**
   * @inheritDoc
   */
  RegularShape.prototype.load = function load () {};

  /**
   * @inheritDoc
   */
  RegularShape.prototype.unlistenImageChange = function unlistenImageChange (listener, thisArg) {};

  /**
   * @protected
   * @param {import("./AtlasManager.js").default|undefined} atlasManager An atlas manager.
   */
  RegularShape.prototype.render_ = function render_ (atlasManager) {
    var imageSize;
    var lineCap = '';
    var lineJoin = '';
    var miterLimit = 0;
    var lineDash = null;
    var lineDashOffset = 0;
    var strokeStyle;
    var strokeWidth = 0;

    if (this.stroke_) {
      strokeStyle = this.stroke_.getColor();
      if (strokeStyle === null) {
        strokeStyle = _render_canvas_js__WEBPACK_IMPORTED_MODULE_1__.defaultStrokeStyle;
      }
      strokeStyle = (0,_colorlike_js__WEBPACK_IMPORTED_MODULE_2__.asColorLike)(strokeStyle);
      strokeWidth = this.stroke_.getWidth();
      if (strokeWidth === undefined) {
        strokeWidth = _render_canvas_js__WEBPACK_IMPORTED_MODULE_1__.defaultLineWidth;
      }
      lineDash = this.stroke_.getLineDash();
      lineDashOffset = this.stroke_.getLineDashOffset();
      if (!_has_js__WEBPACK_IMPORTED_MODULE_3__.CANVAS_LINE_DASH) {
        lineDash = null;
        lineDashOffset = 0;
      }
      lineJoin = this.stroke_.getLineJoin();
      if (lineJoin === undefined) {
        lineJoin = _render_canvas_js__WEBPACK_IMPORTED_MODULE_1__.defaultLineJoin;
      }
      lineCap = this.stroke_.getLineCap();
      if (lineCap === undefined) {
        lineCap = _render_canvas_js__WEBPACK_IMPORTED_MODULE_1__.defaultLineCap;
      }
      miterLimit = this.stroke_.getMiterLimit();
      if (miterLimit === undefined) {
        miterLimit = _render_canvas_js__WEBPACK_IMPORTED_MODULE_1__.defaultMiterLimit;
      }
    }

    var size = 2 * (this.radius_ + strokeWidth) + 1;

    /** @type {RenderOptions} */
    var renderOptions = {
      strokeStyle: strokeStyle,
      strokeWidth: strokeWidth,
      size: size,
      lineCap: lineCap,
      lineDash: lineDash,
      lineDashOffset: lineDashOffset,
      lineJoin: lineJoin,
      miterLimit: miterLimit
    };

    if (atlasManager === undefined) {
      // no atlas manager is used, create a new canvas
      var context = (0,_dom_js__WEBPACK_IMPORTED_MODULE_4__.createCanvasContext2D)(size, size);
      this.canvas_ = context.canvas;

      // canvas.width and height are rounded to the closest integer
      size = this.canvas_.width;
      imageSize = size;

      this.draw_(renderOptions, context, 0, 0);

      this.createHitDetectionCanvas_(renderOptions);
    } else {
      // an atlas manager is used, add the symbol to an atlas
      size = Math.round(size);

      var hasCustomHitDetectionImage = !this.fill_;
      var renderHitDetectionCallback;
      if (hasCustomHitDetectionImage) {
        // render the hit-detection image into a separate atlas image
        renderHitDetectionCallback =
            this.drawHitDetectionCanvas_.bind(this, renderOptions);
      }

      var id = this.getChecksum();
      var info = atlasManager.add(
        id, size, size, this.draw_.bind(this, renderOptions),
        renderHitDetectionCallback);

      this.canvas_ = info.image;
      this.origin_ = [info.offsetX, info.offsetY];
      imageSize = info.image.width;

      if (hasCustomHitDetectionImage) {
        this.hitDetectionCanvas_ = info.hitImage;
        this.hitDetectionImageSize_ =
            [info.hitImage.width, info.hitImage.height];
      } else {
        this.hitDetectionCanvas_ = this.canvas_;
        this.hitDetectionImageSize_ = [imageSize, imageSize];
      }
    }

    this.anchor_ = [size / 2, size / 2];
    this.size_ = [size, size];
    this.imageSize_ = [imageSize, imageSize];
  };

  /**
   * @private
   * @param {RenderOptions} renderOptions Render options.
   * @param {CanvasRenderingContext2D} context The rendering context.
   * @param {number} x The origin for the symbol (x).
   * @param {number} y The origin for the symbol (y).
   */
  RegularShape.prototype.draw_ = function draw_ (renderOptions, context, x, y) {
    var i, angle0, radiusC;
    // reset transform
    context.setTransform(1, 0, 0, 1, 0, 0);

    // then move to (x, y)
    context.translate(x, y);

    context.beginPath();

    var points = this.points_;
    if (points === Infinity) {
      context.arc(
        renderOptions.size / 2, renderOptions.size / 2,
        this.radius_, 0, 2 * Math.PI, true);
    } else {
      var radius2 = (this.radius2_ !== undefined) ? this.radius2_
        : this.radius_;
      if (radius2 !== this.radius_) {
        points = 2 * points;
      }
      for (i = 0; i <= points; i++) {
        angle0 = i * 2 * Math.PI / points - Math.PI / 2 + this.angle_;
        radiusC = i % 2 === 0 ? this.radius_ : radius2;
        context.lineTo(renderOptions.size / 2 + radiusC * Math.cos(angle0),
          renderOptions.size / 2 + radiusC * Math.sin(angle0));
      }
    }


    if (this.fill_) {
      var color = this.fill_.getColor();
      if (color === null) {
        color = _render_canvas_js__WEBPACK_IMPORTED_MODULE_1__.defaultFillStyle;
      }
      context.fillStyle = (0,_colorlike_js__WEBPACK_IMPORTED_MODULE_2__.asColorLike)(color);
      context.fill();
    }
    if (this.stroke_) {
      context.strokeStyle = renderOptions.strokeStyle;
      context.lineWidth = renderOptions.strokeWidth;
      if (renderOptions.lineDash) {
        context.setLineDash(renderOptions.lineDash);
        context.lineDashOffset = renderOptions.lineDashOffset;
      }
      context.lineCap = /** @type {CanvasLineCap} */ (renderOptions.lineCap);
      context.lineJoin = /** @type {CanvasLineJoin} */ (renderOptions.lineJoin);
      context.miterLimit = renderOptions.miterLimit;
      context.stroke();
    }
    context.closePath();
  };

  /**
   * @private
   * @param {RenderOptions} renderOptions Render options.
   */
  RegularShape.prototype.createHitDetectionCanvas_ = function createHitDetectionCanvas_ (renderOptions) {
    this.hitDetectionImageSize_ = [renderOptions.size, renderOptions.size];
    if (this.fill_) {
      this.hitDetectionCanvas_ = this.canvas_;
      return;
    }

    // if no fill style is set, create an extra hit-detection image with a
    // default fill style
    var context = (0,_dom_js__WEBPACK_IMPORTED_MODULE_4__.createCanvasContext2D)(renderOptions.size, renderOptions.size);
    this.hitDetectionCanvas_ = context.canvas;

    this.drawHitDetectionCanvas_(renderOptions, context, 0, 0);
  };

  /**
   * @private
   * @param {RenderOptions} renderOptions Render options.
   * @param {CanvasRenderingContext2D} context The context.
   * @param {number} x The origin for the symbol (x).
   * @param {number} y The origin for the symbol (y).
   */
  RegularShape.prototype.drawHitDetectionCanvas_ = function drawHitDetectionCanvas_ (renderOptions, context, x, y) {
    // reset transform
    context.setTransform(1, 0, 0, 1, 0, 0);

    // then move to (x, y)
    context.translate(x, y);

    context.beginPath();

    var points = this.points_;
    if (points === Infinity) {
      context.arc(
        renderOptions.size / 2, renderOptions.size / 2,
        this.radius_, 0, 2 * Math.PI, true);
    } else {
      var radius2 = (this.radius2_ !== undefined) ? this.radius2_
        : this.radius_;
      if (radius2 !== this.radius_) {
        points = 2 * points;
      }
      var i, radiusC, angle0;
      for (i = 0; i <= points; i++) {
        angle0 = i * 2 * Math.PI / points - Math.PI / 2 + this.angle_;
        radiusC = i % 2 === 0 ? this.radius_ : radius2;
        context.lineTo(renderOptions.size / 2 + radiusC * Math.cos(angle0),
          renderOptions.size / 2 + radiusC * Math.sin(angle0));
      }
    }

    context.fillStyle = (0,_color_js__WEBPACK_IMPORTED_MODULE_5__.asString)(_render_canvas_js__WEBPACK_IMPORTED_MODULE_1__.defaultFillStyle);
    context.fill();
    if (this.stroke_) {
      context.strokeStyle = renderOptions.strokeStyle;
      context.lineWidth = renderOptions.strokeWidth;
      if (renderOptions.lineDash) {
        context.setLineDash(renderOptions.lineDash);
        context.lineDashOffset = renderOptions.lineDashOffset;
      }
      context.stroke();
    }
    context.closePath();
  };

  /**
   * @return {string} The checksum.
   */
  RegularShape.prototype.getChecksum = function getChecksum () {
    var strokeChecksum = this.stroke_ ?
      this.stroke_.getChecksum() : '-';
    var fillChecksum = this.fill_ ?
      this.fill_.getChecksum() : '-';

    var recalculate = !this.checksums_ ||
        (strokeChecksum != this.checksums_[1] ||
        fillChecksum != this.checksums_[2] ||
        this.radius_ != this.checksums_[3] ||
        this.radius2_ != this.checksums_[4] ||
        this.angle_ != this.checksums_[5] ||
        this.points_ != this.checksums_[6]);

    if (recalculate) {
      var checksum = 'r' + strokeChecksum + fillChecksum +
          (this.radius_ !== undefined ? this.radius_.toString() : '-') +
          (this.radius2_ !== undefined ? this.radius2_.toString() : '-') +
          (this.angle_ !== undefined ? this.angle_.toString() : '-') +
          (this.points_ !== undefined ? this.points_.toString() : '-');
      this.checksums_ = [checksum, strokeChecksum, fillChecksum,
        this.radius_, this.radius2_, this.angle_, this.points_];
    }

    return /** @type {string} */ (this.checksums_[0]);
  };

  return RegularShape;
}(_Image_js__WEBPACK_IMPORTED_MODULE_6__["default"]));


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RegularShape);

//# sourceMappingURL=RegularShape.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/style/Stroke.js":
/*!*************************************************!*\
  !*** ./node_modules/@biigle/ol/style/Stroke.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util.js */ "./node_modules/@biigle/ol/util.js");
/**
 * @module ol/style/Stroke
 */



/**
 * @typedef {Object} Options
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [color] A color, gradient or pattern.
 * See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats.
 * Default null; if null, the Canvas/renderer default black will be used.
 * @property {string} [lineCap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {string} [lineJoin='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {Array<number>} [lineDash] Line dash pattern. Default is `undefined` (no dash).
 * Please note that Internet Explorer 10 and lower do not support the `setLineDash` method on
 * the `CanvasRenderingContext2D` and therefore this option will have no visual effect in these browsers.
 * @property {number} [lineDashOffset=0] Line dash offset.
 * @property {number} [miterLimit=10] Miter limit.
 * @property {number} [width] Width.
 */


/**
 * @classdesc
 * Set stroke style for vector features.
 * Note that the defaults given are the Canvas defaults, which will be used if
 * option is not defined. The `get` functions return whatever was entered in
 * the options; they will not return the default.
 * @api
 */
var Stroke = function Stroke(opt_options) {

  var options = opt_options || {};

  /**
   * @private
   * @type {import("../color.js").Color|import("../colorlike.js").ColorLike}
   */
  this.color_ = options.color !== undefined ? options.color : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.lineCap_ = options.lineCap;

  /**
   * @private
   * @type {Array<number>}
   */
  this.lineDash_ = options.lineDash !== undefined ? options.lineDash : null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lineDashOffset_ = options.lineDashOffset;

  /**
   * @private
   * @type {string|undefined}
   */
  this.lineJoin_ = options.lineJoin;

  /**
   * @private
   * @type {number|undefined}
   */
  this.miterLimit_ = options.miterLimit;

  /**
   * @private
   * @type {number|undefined}
   */
  this.width_ = options.width;

  /**
   * @private
   * @type {string|undefined}
   */
  this.checksum_ = undefined;
};

/**
 * Clones the style.
 * @return {Stroke} The cloned style.
 * @api
 */
Stroke.prototype.clone = function clone () {
  var color = this.getColor();
  return new Stroke({
    color: Array.isArray(color) ? color.slice() : color || undefined,
    lineCap: this.getLineCap(),
    lineDash: this.getLineDash() ? this.getLineDash().slice() : undefined,
    lineDashOffset: this.getLineDashOffset(),
    lineJoin: this.getLineJoin(),
    miterLimit: this.getMiterLimit(),
    width: this.getWidth()
  });
};

/**
 * Get the stroke color.
 * @return {import("../color.js").Color|import("../colorlike.js").ColorLike} Color.
 * @api
 */
Stroke.prototype.getColor = function getColor () {
  return this.color_;
};

/**
 * Get the line cap type for the stroke.
 * @return {string|undefined} Line cap.
 * @api
 */
Stroke.prototype.getLineCap = function getLineCap () {
  return this.lineCap_;
};

/**
 * Get the line dash style for the stroke.
 * @return {Array<number>} Line dash.
 * @api
 */
Stroke.prototype.getLineDash = function getLineDash () {
  return this.lineDash_;
};

/**
 * Get the line dash offset for the stroke.
 * @return {number|undefined} Line dash offset.
 * @api
 */
Stroke.prototype.getLineDashOffset = function getLineDashOffset () {
  return this.lineDashOffset_;
};

/**
 * Get the line join type for the stroke.
 * @return {string|undefined} Line join.
 * @api
 */
Stroke.prototype.getLineJoin = function getLineJoin () {
  return this.lineJoin_;
};

/**
 * Get the miter limit for the stroke.
 * @return {number|undefined} Miter limit.
 * @api
 */
Stroke.prototype.getMiterLimit = function getMiterLimit () {
  return this.miterLimit_;
};

/**
 * Get the stroke width.
 * @return {number|undefined} Width.
 * @api
 */
Stroke.prototype.getWidth = function getWidth () {
  return this.width_;
};

/**
 * Set the color.
 *
 * @param {import("../color.js").Color|import("../colorlike.js").ColorLike} color Color.
 * @api
 */
Stroke.prototype.setColor = function setColor (color) {
  this.color_ = color;
  this.checksum_ = undefined;
};

/**
 * Set the line cap.
 *
 * @param {string|undefined} lineCap Line cap.
 * @api
 */
Stroke.prototype.setLineCap = function setLineCap (lineCap) {
  this.lineCap_ = lineCap;
  this.checksum_ = undefined;
};

/**
 * Set the line dash.
 *
 * Please note that Internet Explorer 10 and lower [do not support][mdn] the
 * `setLineDash` method on the `CanvasRenderingContext2D` and therefore this
 * property will have no visual effect in these browsers.
 *
 * [mdn]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility
 *
 * @param {Array<number>} lineDash Line dash.
 * @api
 */
Stroke.prototype.setLineDash = function setLineDash (lineDash) {
  this.lineDash_ = lineDash;
  this.checksum_ = undefined;
};

/**
 * Set the line dash offset.
 *
 * @param {number|undefined} lineDashOffset Line dash offset.
 * @api
 */
Stroke.prototype.setLineDashOffset = function setLineDashOffset (lineDashOffset) {
  this.lineDashOffset_ = lineDashOffset;
  this.checksum_ = undefined;
};

/**
 * Set the line join.
 *
 * @param {string|undefined} lineJoin Line join.
 * @api
 */
Stroke.prototype.setLineJoin = function setLineJoin (lineJoin) {
  this.lineJoin_ = lineJoin;
  this.checksum_ = undefined;
};

/**
 * Set the miter limit.
 *
 * @param {number|undefined} miterLimit Miter limit.
 * @api
 */
Stroke.prototype.setMiterLimit = function setMiterLimit (miterLimit) {
  this.miterLimit_ = miterLimit;
  this.checksum_ = undefined;
};

/**
 * Set the width.
 *
 * @param {number|undefined} width Width.
 * @api
 */
Stroke.prototype.setWidth = function setWidth (width) {
  this.width_ = width;
  this.checksum_ = undefined;
};

/**
 * @return {string} The checksum.
 */
Stroke.prototype.getChecksum = function getChecksum () {
  if (this.checksum_ === undefined) {
    this.checksum_ = 's';
    if (this.color_) {
      if (typeof this.color_ === 'string') {
        this.checksum_ += this.color_;
      } else {
        this.checksum_ += (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.getUid)(this.color_);
      }
    } else {
      this.checksum_ += '-';
    }
    this.checksum_ += ',' +
        (this.lineCap_ !== undefined ?
          this.lineCap_.toString() : '-') + ',' +
        (this.lineDash_ ?
          this.lineDash_.toString() : '-') + ',' +
        (this.lineDashOffset_ !== undefined ?
          this.lineDashOffset_ : '-') + ',' +
        (this.lineJoin_ !== undefined ?
          this.lineJoin_ : '-') + ',' +
        (this.miterLimit_ !== undefined ?
          this.miterLimit_.toString() : '-') + ',' +
        (this.width_ !== undefined ?
          this.width_.toString() : '-');
  }

  return this.checksum_;
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Stroke);

//# sourceMappingURL=Stroke.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/style/Style.js":
/*!************************************************!*\
  !*** ./node_modules/@biigle/ol/style/Style.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "toFunction": () => (/* binding */ toFunction),
/* harmony export */   "createDefaultStyle": () => (/* binding */ createDefaultStyle),
/* harmony export */   "createEditingStyle": () => (/* binding */ createEditingStyle),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _asserts_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../asserts.js */ "./node_modules/@biigle/ol/asserts.js");
/* harmony import */ var _geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../geom/GeometryType.js */ "./node_modules/@biigle/ol/geom/GeometryType.js");
/* harmony import */ var _Circle_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Circle.js */ "./node_modules/@biigle/ol/style/Circle.js");
/* harmony import */ var _Fill_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Fill.js */ "./node_modules/@biigle/ol/style/Fill.js");
/* harmony import */ var _Stroke_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Stroke.js */ "./node_modules/@biigle/ol/style/Stroke.js");
/**
 * @module ol/style/Style
 */

/**
 * Feature styles.
 *
 * If no style is defined, the following default style is used:
 * ```js
 *  import {Fill, Stroke, Circle, Style} from 'ol/style';
 *
 *  var fill = new Fill({
 *    color: 'rgba(255,255,255,0.4)'
 *  });
 *  var stroke = new Stroke({
 *    color: '#3399CC',
 *    width: 1.25
 *  });
 *  var styles = [
 *    new Style({
 *      image: new Circle({
 *        fill: fill,
 *        stroke: stroke,
 *        radius: 5
 *      }),
 *      fill: fill,
 *      stroke: stroke
 *    })
 *  ];
 * ```
 *
 * A separate editing style has the following defaults:
 * ```js
 *  import {Fill, Stroke, Circle, Style} from 'ol/style';
 *  import GeometryType from 'ol/geom/GeometryType';
 *
 *  var white = [255, 255, 255, 1];
 *  var blue = [0, 153, 255, 1];
 *  var width = 3;
 *  styles[GeometryType.POLYGON] = [
 *    new Style({
 *      fill: new Fill({
 *        color: [255, 255, 255, 0.5]
 *      })
 *    })
 *  ];
 *  styles[GeometryType.MULTI_POLYGON] =
 *      styles[GeometryType.POLYGON];
 *  styles[GeometryType.LINE_STRING] = [
 *    new Style({
 *      stroke: new Stroke({
 *        color: white,
 *        width: width + 2
 *      })
 *    }),
 *    new Style({
 *      stroke: new Stroke({
 *        color: blue,
 *        width: width
 *      })
 *    })
 *  ];
 *  styles[GeometryType.MULTI_LINE_STRING] =
 *      styles[GeometryType.LINE_STRING];
 *  styles[GeometryType.POINT] = [
 *    new Style({
 *      image: new Circle({
 *        radius: width * 2,
 *        fill: new Fill({
 *          color: blue
 *        }),
 *        stroke: new Stroke({
 *          color: white,
 *          width: width / 2
 *        })
 *      }),
 *      zIndex: Infinity
 *    })
 *  ];
 *  styles[GeometryType.MULTI_POINT] =
 *      styles[GeometryType.POINT];
 *  styles[GeometryType.GEOMETRY_COLLECTION] =
 *      styles[GeometryType.POLYGON].concat(
 *          styles[GeometryType.LINE_STRING],
 *          styles[GeometryType.POINT]
 *      );
 * ```
 */







/**
 * A function that takes an {@link module:ol/Feature} and a `{number}`
 * representing the view's resolution. The function should return a
 * {@link module:ol/style/Style} or an array of them. This way e.g. a
 * vector layer can be styled.
 *
 * @typedef {function(import("../Feature.js").FeatureLike, number):(Style|Array<Style>)} StyleFunction
 */

/**
 * A {@link Style}, an array of {@link Style}, or a {@link StyleFunction}.
 * @typedef {Style|Array<Style>|StyleFunction} StyleLike
 */

/**
 * A function that takes an {@link module:ol/Feature} as argument and returns an
 * {@link module:ol/geom/Geometry} that will be rendered and styled for the feature.
 *
 * @typedef {function(import("../Feature.js").FeatureLike):
 *     (import("../geom/Geometry.js").default|import("../render/Feature.js").default|undefined)} GeometryFunction
 */


/**
 * Custom renderer function. Takes two arguments:
 *
 * 1. The pixel coordinates of the geometry in GeoJSON notation.
 * 2. The {@link module:ol/render~State} of the layer renderer.
 *
 * @typedef {function((import("../coordinate.js").Coordinate|Array<import("../coordinate.js").Coordinate>|Array<Array<import("../coordinate.js").Coordinate>>),import("../render.js").State)}
 * RenderFunction
 */


/**
 * @typedef {Object} Options
 * @property {string|import("../geom/Geometry.js").default|GeometryFunction} [geometry] Feature property or geometry
 * or function returning a geometry to render for this style.
 * @property {import("./Fill.js").default} [fill] Fill style.
 * @property {import("./Image.js").default} [image] Image style.
 * @property {RenderFunction} [renderer] Custom renderer. When configured, `fill`, `stroke` and `image` will be
 * ignored, and the provided function will be called with each render frame for each geometry.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {import("./Text.js").default} [text] Text style.
 * @property {number} [zIndex] Z index.
 */

/**
 * @classdesc
 * Container for vector feature rendering styles. Any changes made to the style
 * or its children through `set*()` methods will not take effect until the
 * feature or layer that uses the style is re-rendered.
 * @api
 */
var Style = function Style(opt_options) {

  var options = opt_options || {};

  /**
   * @private
   * @type {string|import("../geom/Geometry.js").default|GeometryFunction}
   */
  this.geometry_ = null;

  /**
   * @private
   * @type {!GeometryFunction}
   */
  this.geometryFunction_ = defaultGeometryFunction;

  if (options.geometry !== undefined) {
    this.setGeometry(options.geometry);
  }

  /**
   * @private
   * @type {import("./Fill.js").default}
   */
  this.fill_ = options.fill !== undefined ? options.fill : null;

  /**
     * @private
     * @type {import("./Image.js").default}
     */
  this.image_ = options.image !== undefined ? options.image : null;

  /**
   * @private
   * @type {RenderFunction|null}
   */
  this.renderer_ = options.renderer !== undefined ? options.renderer : null;

  /**
   * @private
   * @type {import("./Stroke.js").default}
   */
  this.stroke_ = options.stroke !== undefined ? options.stroke : null;

  /**
   * @private
   * @type {import("./Text.js").default}
   */
  this.text_ = options.text !== undefined ? options.text : null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.zIndex_ = options.zIndex;

};

/**
 * Clones the style.
 * @return {Style} The cloned style.
 * @api
 */
Style.prototype.clone = function clone () {
  var geometry = this.getGeometry();
  if (geometry && typeof geometry === 'object') {
    geometry = /** @type {import("../geom/Geometry.js").default} */ (geometry).clone();
  }
  return new Style({
    geometry: geometry,
    fill: this.getFill() ? this.getFill().clone() : undefined,
    image: this.getImage() ? this.getImage().clone() : undefined,
    stroke: this.getStroke() ? this.getStroke().clone() : undefined,
    text: this.getText() ? this.getText().clone() : undefined,
    zIndex: this.getZIndex()
  });
};

/**
 * Get the custom renderer function that was configured with
 * {@link #setRenderer} or the `renderer` constructor option.
 * @return {RenderFunction|null} Custom renderer function.
 * @api
 */
Style.prototype.getRenderer = function getRenderer () {
  return this.renderer_;
};

/**
 * Sets a custom renderer function for this style. When set, `fill`, `stroke`
 * and `image` options of the style will be ignored.
 * @param {RenderFunction|null} renderer Custom renderer function.
 * @api
 */
Style.prototype.setRenderer = function setRenderer (renderer) {
  this.renderer_ = renderer;
};

/**
 * Get the geometry to be rendered.
 * @return {string|import("../geom/Geometry.js").default|GeometryFunction}
 * Feature property or geometry or function that returns the geometry that will
 * be rendered with this style.
 * @api
 */
Style.prototype.getGeometry = function getGeometry () {
  return this.geometry_;
};

/**
 * Get the function used to generate a geometry for rendering.
 * @return {!GeometryFunction} Function that is called with a feature
 * and returns the geometry to render instead of the feature's geometry.
 * @api
 */
Style.prototype.getGeometryFunction = function getGeometryFunction () {
  return this.geometryFunction_;
};

/**
 * Get the fill style.
 * @return {import("./Fill.js").default} Fill style.
 * @api
 */
Style.prototype.getFill = function getFill () {
  return this.fill_;
};

/**
 * Set the fill style.
 * @param {import("./Fill.js").default} fill Fill style.
 * @api
 */
Style.prototype.setFill = function setFill (fill) {
  this.fill_ = fill;
};

/**
 * Get the image style.
 * @return {import("./Image.js").default} Image style.
 * @api
 */
Style.prototype.getImage = function getImage () {
  return this.image_;
};

/**
 * Set the image style.
 * @param {import("./Image.js").default} image Image style.
 * @api
 */
Style.prototype.setImage = function setImage (image) {
  this.image_ = image;
};

/**
 * Get the stroke style.
 * @return {import("./Stroke.js").default} Stroke style.
 * @api
 */
Style.prototype.getStroke = function getStroke () {
  return this.stroke_;
};

/**
 * Set the stroke style.
 * @param {import("./Stroke.js").default} stroke Stroke style.
 * @api
 */
Style.prototype.setStroke = function setStroke (stroke) {
  this.stroke_ = stroke;
};

/**
 * Get the text style.
 * @return {import("./Text.js").default} Text style.
 * @api
 */
Style.prototype.getText = function getText () {
  return this.text_;
};

/**
 * Set the text style.
 * @param {import("./Text.js").default} text Text style.
 * @api
 */
Style.prototype.setText = function setText (text) {
  this.text_ = text;
};

/**
 * Get the z-index for the style.
 * @return {number|undefined} ZIndex.
 * @api
 */
Style.prototype.getZIndex = function getZIndex () {
  return this.zIndex_;
};

/**
 * Set a geometry that is rendered instead of the feature's geometry.
 *
 * @param {string|import("../geom/Geometry.js").default|GeometryFunction} geometry
 *   Feature property or geometry or function returning a geometry to render
 *   for this style.
 * @api
 */
Style.prototype.setGeometry = function setGeometry (geometry) {
  if (typeof geometry === 'function') {
    this.geometryFunction_ = geometry;
  } else if (typeof geometry === 'string') {
    this.geometryFunction_ = function(feature) {
      return (
        /** @type {import("../geom/Geometry.js").default} */ (feature.get(geometry))
      );
    };
  } else if (!geometry) {
    this.geometryFunction_ = defaultGeometryFunction;
  } else if (geometry !== undefined) {
    this.geometryFunction_ = function() {
      return (
        /** @type {import("../geom/Geometry.js").default} */ (geometry)
      );
    };
  }
  this.geometry_ = geometry;
};

/**
 * Set the z-index.
 *
 * @param {number|undefined} zIndex ZIndex.
 * @api
 */
Style.prototype.setZIndex = function setZIndex (zIndex) {
  this.zIndex_ = zIndex;
};


/**
 * Convert the provided object into a style function.  Functions passed through
 * unchanged.  Arrays of Style or single style objects wrapped in a
 * new style function.
 * @param {StyleFunction|Array<Style>|Style} obj
 *     A style function, a single style, or an array of styles.
 * @return {StyleFunction} A style function.
 */
function toFunction(obj) {
  var styleFunction;

  if (typeof obj === 'function') {
    styleFunction = obj;
  } else {
    /**
     * @type {Array<Style>}
     */
    var styles;
    if (Array.isArray(obj)) {
      styles = obj;
    } else {
      (0,_asserts_js__WEBPACK_IMPORTED_MODULE_0__.assert)(typeof /** @type {?} */ (obj).getZIndex === 'function',
        41); // Expected an `Style` or an array of `Style`
      var style = /** @type {Style} */ (obj);
      styles = [style];
    }
    styleFunction = function() {
      return styles;
    };
  }
  return styleFunction;
}


/**
 * @type {Array<Style>}
 */
var defaultStyles = null;


/**
 * @param {import("../Feature.js").FeatureLike} feature Feature.
 * @param {number} resolution Resolution.
 * @return {Array<Style>} Style.
 */
function createDefaultStyle(feature, resolution) {
  // We don't use an immediately-invoked function
  // and a closure so we don't get an error at script evaluation time in
  // browsers that do not support Canvas. (import("./Circle.js").CircleStyle does
  // canvas.getContext('2d') at construction time, which will cause an.error
  // in such browsers.)
  if (!defaultStyles) {
    var fill = new _Fill_js__WEBPACK_IMPORTED_MODULE_1__["default"]({
      color: 'rgba(255,255,255,0.4)'
    });
    var stroke = new _Stroke_js__WEBPACK_IMPORTED_MODULE_2__["default"]({
      color: '#3399CC',
      width: 1.25
    });
    defaultStyles = [
      new Style({
        image: new _Circle_js__WEBPACK_IMPORTED_MODULE_3__["default"]({
          fill: fill,
          stroke: stroke,
          radius: 5
        }),
        fill: fill,
        stroke: stroke
      })
    ];
  }
  return defaultStyles;
}


/**
 * Default styles for editing features.
 * @return {Object<import("../geom/GeometryType.js").default, Array<Style>>} Styles
 */
function createEditingStyle() {
  /** @type {Object<import("../geom/GeometryType.js").default, Array<Style>>} */
  var styles = {};
  var white = [255, 255, 255, 1];
  var blue = [0, 153, 255, 1];
  var width = 3;
  styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].POLYGON] = [
    new Style({
      fill: new _Fill_js__WEBPACK_IMPORTED_MODULE_1__["default"]({
        color: [255, 255, 255, 0.5]
      })
    })
  ];
  styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].MULTI_POLYGON] =
      styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].POLYGON];

  styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].LINE_STRING] = [
    new Style({
      stroke: new _Stroke_js__WEBPACK_IMPORTED_MODULE_2__["default"]({
        color: white,
        width: width + 2
      })
    }),
    new Style({
      stroke: new _Stroke_js__WEBPACK_IMPORTED_MODULE_2__["default"]({
        color: blue,
        width: width
      })
    })
  ];
  styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].MULTI_LINE_STRING] =
      styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].LINE_STRING];

  styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].CIRCLE] =
      styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].POLYGON].concat(
        styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].LINE_STRING]
      );


  styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].POINT] = [
    new Style({
      image: new _Circle_js__WEBPACK_IMPORTED_MODULE_3__["default"]({
        radius: width * 2,
        fill: new _Fill_js__WEBPACK_IMPORTED_MODULE_1__["default"]({
          color: blue
        }),
        stroke: new _Stroke_js__WEBPACK_IMPORTED_MODULE_2__["default"]({
          color: white,
          width: width / 2
        })
      }),
      zIndex: Infinity
    })
  ];
  styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].MULTI_POINT] =
      styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].POINT];

  styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].GEOMETRY_COLLECTION] =
      styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].POLYGON].concat(
        styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].LINE_STRING],
        styles[_geom_GeometryType_js__WEBPACK_IMPORTED_MODULE_4__["default"].POINT]
      );

  return styles;
}


/**
 * Function that is called with a feature and returns its default geometry.
 * @param {import("../Feature.js").FeatureLike} feature Feature to get the geometry for.
 * @return {import("../geom/Geometry.js").default|import("../render/Feature.js").default|undefined} Geometry to render.
 */
function defaultGeometryFunction(feature) {
  return feature.getGeometry();
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Style);

//# sourceMappingURL=Style.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/transform.js":
/*!**********************************************!*\
  !*** ./node_modules/@biigle/ol/transform.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "create": () => (/* binding */ create),
/* harmony export */   "reset": () => (/* binding */ reset),
/* harmony export */   "multiply": () => (/* binding */ multiply),
/* harmony export */   "set": () => (/* binding */ set),
/* harmony export */   "setFromArray": () => (/* binding */ setFromArray),
/* harmony export */   "apply": () => (/* binding */ apply),
/* harmony export */   "rotate": () => (/* binding */ rotate),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "translate": () => (/* binding */ translate),
/* harmony export */   "compose": () => (/* binding */ compose),
/* harmony export */   "invert": () => (/* binding */ invert),
/* harmony export */   "determinant": () => (/* binding */ determinant)
/* harmony export */ });
/* harmony import */ var _asserts_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./asserts.js */ "./node_modules/@biigle/ol/asserts.js");
/**
 * @module ol/transform
 */



/**
 * An array representing an affine 2d transformation for use with
 * {@link module:ol/transform} functions. The array has 6 elements.
 * @typedef {!Array<number>} Transform
 */


/**
 * Collection of affine 2d transformation functions. The functions work on an
 * array of 6 elements. The element order is compatible with the [SVGMatrix
 * interface](https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix) and is
 * a subset (elements a to f) of a 3×3 matrix:
 * ```
 * [ a c e ]
 * [ b d f ]
 * [ 0 0 1 ]
 * ```
 */


/**
 * @private
 * @type {Transform}
 */
var tmp_ = new Array(6);


/**
 * Create an identity transform.
 * @return {!Transform} Identity transform.
 */
function create() {
  return [1, 0, 0, 1, 0, 0];
}


/**
 * Resets the given transform to an identity transform.
 * @param {!Transform} transform Transform.
 * @return {!Transform} Transform.
 */
function reset(transform) {
  return set(transform, 1, 0, 0, 1, 0, 0);
}


/**
 * Multiply the underlying matrices of two transforms and return the result in
 * the first transform.
 * @param {!Transform} transform1 Transform parameters of matrix 1.
 * @param {!Transform} transform2 Transform parameters of matrix 2.
 * @return {!Transform} transform1 multiplied with transform2.
 */
function multiply(transform1, transform2) {
  var a1 = transform1[0];
  var b1 = transform1[1];
  var c1 = transform1[2];
  var d1 = transform1[3];
  var e1 = transform1[4];
  var f1 = transform1[5];
  var a2 = transform2[0];
  var b2 = transform2[1];
  var c2 = transform2[2];
  var d2 = transform2[3];
  var e2 = transform2[4];
  var f2 = transform2[5];

  transform1[0] = a1 * a2 + c1 * b2;
  transform1[1] = b1 * a2 + d1 * b2;
  transform1[2] = a1 * c2 + c1 * d2;
  transform1[3] = b1 * c2 + d1 * d2;
  transform1[4] = a1 * e2 + c1 * f2 + e1;
  transform1[5] = b1 * e2 + d1 * f2 + f1;

  return transform1;
}

/**
 * Set the transform components a-f on a given transform.
 * @param {!Transform} transform Transform.
 * @param {number} a The a component of the transform.
 * @param {number} b The b component of the transform.
 * @param {number} c The c component of the transform.
 * @param {number} d The d component of the transform.
 * @param {number} e The e component of the transform.
 * @param {number} f The f component of the transform.
 * @return {!Transform} Matrix with transform applied.
 */
function set(transform, a, b, c, d, e, f) {
  transform[0] = a;
  transform[1] = b;
  transform[2] = c;
  transform[3] = d;
  transform[4] = e;
  transform[5] = f;
  return transform;
}


/**
 * Set transform on one matrix from another matrix.
 * @param {!Transform} transform1 Matrix to set transform to.
 * @param {!Transform} transform2 Matrix to set transform from.
 * @return {!Transform} transform1 with transform from transform2 applied.
 */
function setFromArray(transform1, transform2) {
  transform1[0] = transform2[0];
  transform1[1] = transform2[1];
  transform1[2] = transform2[2];
  transform1[3] = transform2[3];
  transform1[4] = transform2[4];
  transform1[5] = transform2[5];
  return transform1;
}


/**
 * Transforms the given coordinate with the given transform returning the
 * resulting, transformed coordinate. The coordinate will be modified in-place.
 *
 * @param {Transform} transform The transformation.
 * @param {import("./coordinate.js").Coordinate|import("./pixel.js").Pixel} coordinate The coordinate to transform.
 * @return {import("./coordinate.js").Coordinate|import("./pixel.js").Pixel} return coordinate so that operations can be
 *     chained together.
 */
function apply(transform, coordinate) {
  var x = coordinate[0];
  var y = coordinate[1];
  coordinate[0] = transform[0] * x + transform[2] * y + transform[4];
  coordinate[1] = transform[1] * x + transform[3] * y + transform[5];
  return coordinate;
}


/**
 * Applies rotation to the given transform.
 * @param {!Transform} transform Transform.
 * @param {number} angle Angle in radians.
 * @return {!Transform} The rotated transform.
 */
function rotate(transform, angle) {
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  return multiply(transform, set(tmp_, cos, sin, -sin, cos, 0, 0));
}


/**
 * Applies scale to a given transform.
 * @param {!Transform} transform Transform.
 * @param {number} x Scale factor x.
 * @param {number} y Scale factor y.
 * @return {!Transform} The scaled transform.
 */
function scale(transform, x, y) {
  return multiply(transform, set(tmp_, x, 0, 0, y, 0, 0));
}


/**
 * Applies translation to the given transform.
 * @param {!Transform} transform Transform.
 * @param {number} dx Translation x.
 * @param {number} dy Translation y.
 * @return {!Transform} The translated transform.
 */
function translate(transform, dx, dy) {
  return multiply(transform, set(tmp_, 1, 0, 0, 1, dx, dy));
}


/**
 * Creates a composite transform given an initial translation, scale, rotation, and
 * final translation (in that order only, not commutative).
 * @param {!Transform} transform The transform (will be modified in place).
 * @param {number} dx1 Initial translation x.
 * @param {number} dy1 Initial translation y.
 * @param {number} sx Scale factor x.
 * @param {number} sy Scale factor y.
 * @param {number} angle Rotation (in counter-clockwise radians).
 * @param {number} dx2 Final translation x.
 * @param {number} dy2 Final translation y.
 * @return {!Transform} The composite transform.
 */
function compose(transform, dx1, dy1, sx, sy, angle, dx2, dy2) {
  var sin = Math.sin(angle);
  var cos = Math.cos(angle);
  transform[0] = sx * cos;
  transform[1] = sy * sin;
  transform[2] = -sx * sin;
  transform[3] = sy * cos;
  transform[4] = dx2 * sx * cos - dy2 * sx * sin + dx1;
  transform[5] = dx2 * sy * sin + dy2 * sy * cos + dy1;
  return transform;
}


/**
 * Invert the given transform.
 * @param {!Transform} transform Transform.
 * @return {!Transform} Inverse of the transform.
 */
function invert(transform) {
  var det = determinant(transform);
  (0,_asserts_js__WEBPACK_IMPORTED_MODULE_0__.assert)(det !== 0, 32); // Transformation matrix cannot be inverted

  var a = transform[0];
  var b = transform[1];
  var c = transform[2];
  var d = transform[3];
  var e = transform[4];
  var f = transform[5];

  transform[0] = d / det;
  transform[1] = -b / det;
  transform[2] = -c / det;
  transform[3] = a / det;
  transform[4] = (c * f - d * e) / det;
  transform[5] = -(a * f - b * e) / det;

  return transform;
}


/**
 * Returns the determinant of the given matrix.
 * @param {!Transform} mat Matrix.
 * @return {number} Determinant.
 */
function determinant(mat) {
  return mat[0] * mat[3] - mat[1] * mat[2];
}

//# sourceMappingURL=transform.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/util.js":
/*!*****************************************!*\
  !*** ./node_modules/@biigle/ol/util.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "abstract": () => (/* binding */ abstract),
/* harmony export */   "inherits": () => (/* binding */ inherits),
/* harmony export */   "getUid": () => (/* binding */ getUid),
/* harmony export */   "VERSION": () => (/* binding */ VERSION)
/* harmony export */ });
/**
 * @module ol/util
 */

/**
 * @return {?} Any return.
 */
function abstract() {
  return /** @type {?} */ ((function() {
    throw new Error('Unimplemented abstract method.');
  })());
}

/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 *
 *     function ParentClass(a, b) { }
 *     ParentClass.prototype.foo = function(a) { }
 *
 *     function ChildClass(a, b, c) {
 *       // Call parent constructor
 *       ParentClass.call(this, a, b);
 *     }
 *     inherits(ChildClass, ParentClass);
 *
 *     var child = new ChildClass('a', 'b', 'see');
 *     child.foo(); // This works.
 *
 * @param {!Function} childCtor Child constructor.
 * @param {!Function} parentCtor Parent constructor.
 * @function module:ol.inherits
 * @deprecated
 * @api
 */
function inherits(childCtor, parentCtor) {
  childCtor.prototype = Object.create(parentCtor.prototype);
  childCtor.prototype.constructor = childCtor;
}

/**
 * Counter for getUid.
 * @type {number}
 * @private
 */
var uidCounter_ = 0;

/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. Unique IDs are generated
 * as a strictly increasing sequence. Adapted from goog.getUid.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {string} The unique ID for the object.
 * @function module:ol.getUid
 * @api
 */
function getUid(obj) {
  return obj.ol_uid || (obj.ol_uid = String(++uidCounter_));
}

/**
 * OpenLayers version.
 * @type {string}
 */
var VERSION = '5.3.1';

//# sourceMappingURL=util.js.map

/***/ }),

/***/ "./node_modules/@biigle/ol/webgl.js":
/*!******************************************!*\
  !*** ./node_modules/@biigle/ol/webgl.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ONE": () => (/* binding */ ONE),
/* harmony export */   "SRC_ALPHA": () => (/* binding */ SRC_ALPHA),
/* harmony export */   "COLOR_ATTACHMENT0": () => (/* binding */ COLOR_ATTACHMENT0),
/* harmony export */   "COLOR_BUFFER_BIT": () => (/* binding */ COLOR_BUFFER_BIT),
/* harmony export */   "TRIANGLES": () => (/* binding */ TRIANGLES),
/* harmony export */   "TRIANGLE_STRIP": () => (/* binding */ TRIANGLE_STRIP),
/* harmony export */   "ONE_MINUS_SRC_ALPHA": () => (/* binding */ ONE_MINUS_SRC_ALPHA),
/* harmony export */   "ARRAY_BUFFER": () => (/* binding */ ARRAY_BUFFER),
/* harmony export */   "ELEMENT_ARRAY_BUFFER": () => (/* binding */ ELEMENT_ARRAY_BUFFER),
/* harmony export */   "STREAM_DRAW": () => (/* binding */ STREAM_DRAW),
/* harmony export */   "STATIC_DRAW": () => (/* binding */ STATIC_DRAW),
/* harmony export */   "DYNAMIC_DRAW": () => (/* binding */ DYNAMIC_DRAW),
/* harmony export */   "CULL_FACE": () => (/* binding */ CULL_FACE),
/* harmony export */   "BLEND": () => (/* binding */ BLEND),
/* harmony export */   "STENCIL_TEST": () => (/* binding */ STENCIL_TEST),
/* harmony export */   "DEPTH_TEST": () => (/* binding */ DEPTH_TEST),
/* harmony export */   "SCISSOR_TEST": () => (/* binding */ SCISSOR_TEST),
/* harmony export */   "UNSIGNED_BYTE": () => (/* binding */ UNSIGNED_BYTE),
/* harmony export */   "UNSIGNED_SHORT": () => (/* binding */ UNSIGNED_SHORT),
/* harmony export */   "UNSIGNED_INT": () => (/* binding */ UNSIGNED_INT),
/* harmony export */   "FLOAT": () => (/* binding */ FLOAT),
/* harmony export */   "RGBA": () => (/* binding */ RGBA),
/* harmony export */   "FRAGMENT_SHADER": () => (/* binding */ FRAGMENT_SHADER),
/* harmony export */   "VERTEX_SHADER": () => (/* binding */ VERTEX_SHADER),
/* harmony export */   "LINK_STATUS": () => (/* binding */ LINK_STATUS),
/* harmony export */   "LINEAR": () => (/* binding */ LINEAR),
/* harmony export */   "TEXTURE_MAG_FILTER": () => (/* binding */ TEXTURE_MAG_FILTER),
/* harmony export */   "TEXTURE_MIN_FILTER": () => (/* binding */ TEXTURE_MIN_FILTER),
/* harmony export */   "TEXTURE_WRAP_S": () => (/* binding */ TEXTURE_WRAP_S),
/* harmony export */   "TEXTURE_WRAP_T": () => (/* binding */ TEXTURE_WRAP_T),
/* harmony export */   "TEXTURE_2D": () => (/* binding */ TEXTURE_2D),
/* harmony export */   "TEXTURE0": () => (/* binding */ TEXTURE0),
/* harmony export */   "CLAMP_TO_EDGE": () => (/* binding */ CLAMP_TO_EDGE),
/* harmony export */   "COMPILE_STATUS": () => (/* binding */ COMPILE_STATUS),
/* harmony export */   "FRAMEBUFFER": () => (/* binding */ FRAMEBUFFER),
/* harmony export */   "getContext": () => (/* binding */ getContext),
/* harmony export */   "DEBUG": () => (/* binding */ DEBUG),
/* harmony export */   "HAS": () => (/* binding */ HAS),
/* harmony export */   "MAX_TEXTURE_SIZE": () => (/* binding */ MAX_TEXTURE_SIZE),
/* harmony export */   "EXTENSIONS": () => (/* binding */ EXTENSIONS)
/* harmony export */ });
/**
 * @module ol/webgl
 */


/**
 * Constants taken from goog.webgl
 */


/**
 * @const
 * @type {number}
 */
var ONE = 1;


/**
 * @const
 * @type {number}
 */
var SRC_ALPHA = 0x0302;


/**
 * @const
 * @type {number}
 */
var COLOR_ATTACHMENT0 = 0x8CE0;


/**
 * @const
 * @type {number}
 */
var COLOR_BUFFER_BIT = 0x00004000;


/**
 * @const
 * @type {number}
 */
var TRIANGLES = 0x0004;


/**
 * @const
 * @type {number}
 */
var TRIANGLE_STRIP = 0x0005;


/**
 * @const
 * @type {number}
 */
var ONE_MINUS_SRC_ALPHA = 0x0303;


/**
 * @const
 * @type {number}
 */
var ARRAY_BUFFER = 0x8892;


/**
 * @const
 * @type {number}
 */
var ELEMENT_ARRAY_BUFFER = 0x8893;


/**
 * @const
 * @type {number}
 */
var STREAM_DRAW = 0x88E0;


/**
 * @const
 * @type {number}
 */
var STATIC_DRAW = 0x88E4;


/**
 * @const
 * @type {number}
 */
var DYNAMIC_DRAW = 0x88E8;


/**
 * @const
 * @type {number}
 */
var CULL_FACE = 0x0B44;


/**
 * @const
 * @type {number}
 */
var BLEND = 0x0BE2;


/**
 * @const
 * @type {number}
 */
var STENCIL_TEST = 0x0B90;


/**
 * @const
 * @type {number}
 */
var DEPTH_TEST = 0x0B71;


/**
 * @const
 * @type {number}
 */
var SCISSOR_TEST = 0x0C11;


/**
 * @const
 * @type {number}
 */
var UNSIGNED_BYTE = 0x1401;


/**
 * @const
 * @type {number}
 */
var UNSIGNED_SHORT = 0x1403;


/**
 * @const
 * @type {number}
 */
var UNSIGNED_INT = 0x1405;


/**
 * @const
 * @type {number}
 */
var FLOAT = 0x1406;


/**
 * @const
 * @type {number}
 */
var RGBA = 0x1908;


/**
 * @const
 * @type {number}
 */
var FRAGMENT_SHADER = 0x8B30;


/**
 * @const
 * @type {number}
 */
var VERTEX_SHADER = 0x8B31;


/**
 * @const
 * @type {number}
 */
var LINK_STATUS = 0x8B82;


/**
 * @const
 * @type {number}
 */
var LINEAR = 0x2601;


/**
 * @const
 * @type {number}
 */
var TEXTURE_MAG_FILTER = 0x2800;


/**
 * @const
 * @type {number}
 */
var TEXTURE_MIN_FILTER = 0x2801;


/**
 * @const
 * @type {number}
 */
var TEXTURE_WRAP_S = 0x2802;


/**
 * @const
 * @type {number}
 */
var TEXTURE_WRAP_T = 0x2803;


/**
 * @const
 * @type {number}
 */
var TEXTURE_2D = 0x0DE1;


/**
 * @const
 * @type {number}
 */
var TEXTURE0 = 0x84C0;


/**
 * @const
 * @type {number}
 */
var CLAMP_TO_EDGE = 0x812F;


/**
 * @const
 * @type {number}
 */
var COMPILE_STATUS = 0x8B81;


/**
 * @const
 * @type {number}
 */
var FRAMEBUFFER = 0x8D40;


/** end of goog.webgl constants
 */


/**
 * @const
 * @type {Array<string>}
 */
var CONTEXT_IDS = [
  'experimental-webgl',
  'webgl',
  'webkit-3d',
  'moz-webgl'
];


/**
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {Object=} opt_attributes Attributes.
 * @return {WebGLRenderingContext} WebGL rendering context.
 */
function getContext(canvas, opt_attributes) {
  var ii = CONTEXT_IDS.length;
  for (var i = 0; i < ii; ++i) {
    try {
      var context = canvas.getContext(CONTEXT_IDS[i], opt_attributes);
      if (context) {
        return /** @type {!WebGLRenderingContext} */ (context);
      }
    } catch (e) {
      // pass
    }
  }
  return null;
}


/**
 * Include debuggable shader sources.  Default is `true`. This should be set to
 * `false` for production builds.
 * @type {boolean}
 */
var DEBUG = true;


/**
 * The maximum supported WebGL texture size in pixels. If WebGL is not
 * supported, the value is set to `undefined`.
 * @type {number|undefined}
 */
var MAX_TEXTURE_SIZE; // value is set below


/**
 * List of supported WebGL extensions.
 * @type {Array<string>}
 */
var EXTENSIONS; // value is set below


/**
 * True if both OpenLayers and browser support WebGL.
 * @type {boolean}
 * @api
 */
var HAS = false;

//TODO Remove side effects
if (typeof window !== 'undefined' && 'WebGLRenderingContext' in window) {
  try {
    var canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    var gl = getContext(canvas, {failIfMajorPerformanceCaveat: true});
    if (gl) {
      HAS = true;
      MAX_TEXTURE_SIZE = /** @type {number} */ (gl.getParameter(gl.MAX_TEXTURE_SIZE));
      EXTENSIONS = gl.getSupportedExtensions();
    }
  } catch (e) {
    // pass
  }
}



//# sourceMappingURL=webgl.js.map

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/annotations/components/settingsTabPlugin.vue?vue&type=script&lang=js&":
/*!***********************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/annotations/components/settingsTabPlugin.vue?vue&type=script&lang=js& ***!
  \***********************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _biigle_ol_style_Circle__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @biigle/ol/style/Circle */ "./node_modules/@biigle/ol/style/Circle.js");
/* harmony import */ var _biigle_ol_Collection__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @biigle/ol/Collection */ "./node_modules/@biigle/ol/Collection.js");
/* harmony import */ var _biigle_ol_interaction_Draw__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @biigle/ol/interaction/Draw */ "./node_modules/@biigle/ol/interaction/Draw.js");
/* harmony import */ var _api_exportArea__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../api/exportArea */ "./src/resources/assets/js/annotations/api/exportArea.js");
/* harmony import */ var _biigle_ol_Feature__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @biigle/ol/Feature */ "./node_modules/@biigle/ol/Feature.js");
/* harmony import */ var _biigle_ol_style_Fill__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @biigle/ol/style/Fill */ "./node_modules/@biigle/ol/style/Fill.js");
/* harmony import */ var _biigle_ol_interaction_Modify__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @biigle/ol/interaction/Modify */ "./node_modules/@biigle/ol/interaction/Modify.js");
/* harmony import */ var _biigle_ol_geom_Rectangle__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @biigle/ol/geom/Rectangle */ "./node_modules/@biigle/ol/geom/Rectangle.js");
/* harmony import */ var _biigle_ol_style_Stroke__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @biigle/ol/style/Stroke */ "./node_modules/@biigle/ol/style/Stroke.js");
/* harmony import */ var _biigle_ol_style_Style__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @biigle/ol/style/Style */ "./node_modules/@biigle/ol/style/Style.js");
/* harmony import */ var _biigle_ol_layer_Vector__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @biigle/ol/layer/Vector */ "./node_modules/@biigle/ol/layer/Vector.js");
/* harmony import */ var _biigle_ol_source_Vector__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @biigle/ol/source/Vector */ "./node_modules/@biigle/ol/source/Vector.js");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../import */ "./src/resources/assets/js/annotations/import.js");
/* harmony import */ var _biigle_ol_events_condition__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @biigle/ol/events/condition */ "./node_modules/@biigle/ol/events/condition.js");















/**
 * The plugin component to edit the export area in the annotation tool.
 *
 * @type {Object}
 */

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  props: {
    settings: {
      type: Object,
      required: true
    }
  },
  data: function data() {
    return {
      opacityValue: '1',
      currentImage: null,
      isEditing: false,
      exportArea: null,
      volumeId: null
    };
  },
  computed: {
    opacity: function opacity() {
      return parseFloat(this.opacityValue);
    },
    shown: function shown() {
      return this.opacity > 0;
    },
    height: function height() {
      return this.currentImage ? this.currentImage.height : 0;
    },
    hasExportArea: function hasExportArea() {
      return this.exportArea !== null;
    },
    layer: function layer() {
      return new _biigle_ol_layer_Vector__WEBPACK_IMPORTED_MODULE_2__["default"]({
        source: new _biigle_ol_source_Vector__WEBPACK_IMPORTED_MODULE_3__["default"]({
          features: new _biigle_ol_Collection__WEBPACK_IMPORTED_MODULE_4__["default"]()
        }),
        style: [new _biigle_ol_style_Style__WEBPACK_IMPORTED_MODULE_5__["default"]({
          stroke: new _biigle_ol_style_Stroke__WEBPACK_IMPORTED_MODULE_6__["default"]({
            color: 'white',
            width: 4
          }),
          image: new _biigle_ol_style_Circle__WEBPACK_IMPORTED_MODULE_7__["default"]({
            radius: 6,
            fill: new _biigle_ol_style_Fill__WEBPACK_IMPORTED_MODULE_8__["default"]({
              color: '#666666'
            }),
            stroke: new _biigle_ol_style_Stroke__WEBPACK_IMPORTED_MODULE_6__["default"]({
              color: 'white',
              width: 2,
              lineDash: [2]
            })
          })
        }), new _biigle_ol_style_Style__WEBPACK_IMPORTED_MODULE_5__["default"]({
          stroke: new _biigle_ol_style_Stroke__WEBPACK_IMPORTED_MODULE_6__["default"]({
            color: '#666666',
            width: 1,
            lineDash: [2]
          })
        })],
        zIndex: 4,
        updateWhileAnimating: true,
        updateWhileInteracting: true
      });
    },
    drawInteraction: function drawInteraction() {
      return new _biigle_ol_interaction_Draw__WEBPACK_IMPORTED_MODULE_9__["default"]({
        source: this.layer.getSource(),
        type: 'Rectangle',
        style: this.layer.getStyle(),
        minPoints: 2,
        maxPoints: 2,
        geometryFunction: function geometryFunction(coordinates, opt_geometry) {
          if (coordinates.length > 1) {
            coordinates = [coordinates[0], [coordinates[0][0], coordinates[1][1]], coordinates[1], [coordinates[1][0], coordinates[0][1]]];
          }

          var geometry = opt_geometry;

          if (geometry) {
            geometry.setCoordinates([coordinates]);
          } else {
            geometry = new _biigle_ol_geom_Rectangle__WEBPACK_IMPORTED_MODULE_10__["default"]([coordinates]);
          }

          return geometry;
        }
      });
    },
    modifyInteraction: function modifyInteraction() {
      return new _biigle_ol_interaction_Modify__WEBPACK_IMPORTED_MODULE_11__["default"]({
        features: this.layer.getSource().getFeaturesCollection(),
        style: this.layer.getStyle(),
        deleteCondition: _biigle_ol_events_condition__WEBPACK_IMPORTED_MODULE_12__.never
      });
    }
  },
  methods: {
    toggleEditing: function toggleEditing() {
      this.isEditing = !this.isEditing;

      if (this.isEditing) {
        this.drawInteraction.setActive(true);
        this.modifyInteraction.setActive(true);
      } else {
        this.drawInteraction.setActive(false);
        this.modifyInteraction.setActive(false);
      }
    },
    deleteArea: function deleteArea() {
      var _this = this;

      if (this.hasExportArea && confirm('Do you really want to delete the export area?')) {
        var source = this.layer.getSource();
        var feature = source.getFeatures()[0];
        source.clear();
        _api_exportArea__WEBPACK_IMPORTED_MODULE_0__["default"]["delete"]({
          id: this.volumeId
        }).then(function () {
          return _this.exportArea = null;
        })["catch"](function (response) {
          source.addFeature(feature);
          (0,_import__WEBPACK_IMPORTED_MODULE_1__.handleErrorResponse)(response);
        });
      }
    },
    updateCurrentImage: function updateCurrentImage(id, image) {
      this.currentImage = image;
    },
    maybeDrawArea: function maybeDrawArea() {
      this.clearSource();

      if (this.exportArea && this.height > 0) {
        // Handle coordinates for tiled and regular images differently.
        var height = this.currentImage.tiled ? 0 : this.height;
        var geometry = new _biigle_ol_geom_Rectangle__WEBPACK_IMPORTED_MODULE_10__["default"]([[// Swap y coordinates for OpenLayers.
        [this.exportArea[0], height - this.exportArea[1]], [this.exportArea[0], height - this.exportArea[3]], [this.exportArea[2], height - this.exportArea[3]], [this.exportArea[2], height - this.exportArea[1]]]]);
        this.layer.getSource().addFeature(new _biigle_ol_Feature__WEBPACK_IMPORTED_MODULE_13__["default"]({
          geometry: geometry
        }));
      }
    },
    handleModifyend: function handleModifyend(e) {
      this.updateExportArea(e.features.item(0));
    },
    clearSource: function clearSource() {
      this.layer.getSource().clear();
    },
    handleDrawend: function handleDrawend(e) {
      var source = this.layer.getSource();
      var oldFeature = source.getFeatures()[0];
      source.clear(); // Remove the feature again if creating it failed.

      this.updateExportArea(e.feature)["catch"](function () {
        source.clear();

        if (oldFeature) {
          source.addFeature(oldFeature);
        }
      });
    },
    updateExportArea: function updateExportArea(feature) {
      var _this2 = this;

      var coordinates = feature.getGeometry().getCoordinates()[0]; // Handle coordinates for tiled and regular images differently.

      var height = this.currentImage.tiled ? 0 : this.height;
      coordinates = [coordinates[0][0], height - coordinates[0][1], coordinates[2][0], height - coordinates[2][1]].map(Math.round);
      var promise = _api_exportArea__WEBPACK_IMPORTED_MODULE_0__["default"].save({
        id: this.volumeId
      }, {
        coordinates: coordinates
      }).then(function () {
        return _this2.exportArea = coordinates;
      });
      promise["catch"](_import__WEBPACK_IMPORTED_MODULE_1__.handleErrorResponse);
      return promise;
    },
    extendMap: function extendMap(map) {
      map.addLayer(this.layer);
      map.addInteraction(this.drawInteraction);
      map.addInteraction(this.modifyInteraction);
    }
  },
  watch: {
    opacity: function opacity(_opacity) {
      if (_opacity < 1) {
        this.settings.set('exportAreaOpacity', _opacity);
      } else {
        this.settings["delete"]('exportAreaOpacity');
      }

      this.layer.setOpacity(_opacity);
    },
    exportArea: function exportArea() {
      this.maybeDrawArea();
    },
    height: function height() {
      this.maybeDrawArea();
    }
  },
  created: function created() {
    this.volumeId = biigle.$require('annotations.volumeId');

    if (this.settings.has('exportAreaOpacity')) {
      this.opacityValue = this.settings.get('exportAreaOpacity');
    }

    this.exportArea = biigle.$require('annotations.exportArea');
    this.drawInteraction.setActive(false);
    this.modifyInteraction.setActive(false);
    this.drawInteraction.on('drawend', this.handleDrawend);
    this.modifyInteraction.on('modifyend', this.handleModifyend);
    _import__WEBPACK_IMPORTED_MODULE_1__.Events.$on('images.change', this.updateCurrentImage);
    _import__WEBPACK_IMPORTED_MODULE_1__.Events.$on('annotations.map.init', this.extendMap);
  }
});

/***/ }),

/***/ "./src/resources/assets/js/annotations/api/exportArea.js":
/*!***************************************************************!*\
  !*** ./src/resources/assets/js/annotations/api/exportArea.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Resource for editing the export area of a volume
 *
 * let resource = biigle.$require('reports.api.volumes');
 *
 * Get the export area:
 * resource.get({id: volumeId}).then(...);
 *
 * Create/update an export area:
 * resource.save({id: volumeId}, {coordinates: [10, 10, 100, 100]}).then(...);
 *
 * Delete the export area:
 * resource.delete({id: columeId}).then(...);
 *
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Vue.resource('/api/v1/volumes{/id}/export-area'));

/***/ }),

/***/ "./src/resources/assets/js/annotations/import.js":
/*!*******************************************************!*\
  !*** ./src/resources/assets/js/annotations/import.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Events": () => (/* binding */ Events),
/* harmony export */   "handleErrorResponse": () => (/* binding */ handleErrorResponse),
/* harmony export */   "SettingsTabPlugins": () => (/* binding */ SettingsTabPlugins)
/* harmony export */ });
var Events = biigle.$require('events');
var handleErrorResponse = biigle.$require('messages').handleErrorResponse;
var SettingsTabPlugins = biigle.$require('annotations.components.settingsTabPlugins');

/***/ }),

/***/ "./src/resources/assets/js/annotations/settingsTabPlugins.js":
/*!*******************************************************************!*\
  !*** ./src/resources/assets/js/annotations/settingsTabPlugins.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _components_settingsTabPlugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components/settingsTabPlugin */ "./src/resources/assets/js/annotations/components/settingsTabPlugin.vue");
/* harmony import */ var _import__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./import */ "./src/resources/assets/js/annotations/import.js");


/**
 * The plugin component to edit the export area in the annotation tool.
 *
 * @type {Object}
 */

if (_import__WEBPACK_IMPORTED_MODULE_1__.SettingsTabPlugins) {
  _import__WEBPACK_IMPORTED_MODULE_1__.SettingsTabPlugins.exportArea = _components_settingsTabPlugin__WEBPACK_IMPORTED_MODULE_0__["default"];
}

/***/ }),

/***/ "./node_modules/quickselect/quickselect.js":
/*!*************************************************!*\
  !*** ./node_modules/quickselect/quickselect.js ***!
  \*************************************************/
/***/ (function(module) {

(function (global, factory) {
	 true ? module.exports = factory() :
	0;
}(this, (function () { 'use strict';

function quickselect(arr, k, left, right, compare) {
    quickselectStep(arr, k, left || 0, right || (arr.length - 1), compare || defaultCompare);
}

function quickselectStep(arr, k, left, right, compare) {

    while (right > left) {
        if (right - left > 600) {
            var n = right - left + 1;
            var m = k - left + 1;
            var z = Math.log(n);
            var s = 0.5 * Math.exp(2 * z / 3);
            var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
            var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
            var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
            quickselectStep(arr, k, newLeft, newRight, compare);
        }

        var t = arr[k];
        var i = left;
        var j = right;

        swap(arr, left, k);
        if (compare(arr[right], t) > 0) swap(arr, left, right);

        while (i < j) {
            swap(arr, i, j);
            i++;
            j--;
            while (compare(arr[i], t) < 0) i++;
            while (compare(arr[j], t) > 0) j--;
        }

        if (compare(arr[left], t) === 0) swap(arr, left, j);
        else {
            j++;
            swap(arr, j, right);
        }

        if (j <= k) left = j + 1;
        if (k <= j) right = j - 1;
    }
}

function swap(arr, i, j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}

function defaultCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

return quickselect;

})));


/***/ }),

/***/ "./node_modules/rbush/index.js":
/*!*************************************!*\
  !*** ./node_modules/rbush/index.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = rbush;
module.exports["default"] = rbush;

var quickselect = __webpack_require__(/*! quickselect */ "./node_modules/quickselect/quickselect.js");

function rbush(maxEntries, format) {
    if (!(this instanceof rbush)) return new rbush(maxEntries, format);

    // max entries in a node is 9 by default; min node fill is 40% for best performance
    this._maxEntries = Math.max(4, maxEntries || 9);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

    if (format) {
        this._initFormat(format);
    }

    this.clear();
}

rbush.prototype = {

    all: function () {
        return this._all(this.data, []);
    },

    search: function (bbox) {

        var node = this.data,
            result = [],
            toBBox = this.toBBox;

        if (!intersects(bbox, node)) return result;

        var nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf) result.push(child);
                    else if (contains(bbox, childBBox)) this._all(child, result);
                    else nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return result;
    },

    collides: function (bbox) {

        var node = this.data,
            toBBox = this.toBBox;

        if (!intersects(bbox, node)) return false;

        var nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf || contains(bbox, childBBox)) return true;
                    nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return false;
    },

    load: function (data) {
        if (!(data && data.length)) return this;

        if (data.length < this._minEntries) {
            for (var i = 0, len = data.length; i < len; i++) {
                this.insert(data[i]);
            }
            return this;
        }

        // recursively build the tree with the given data from scratch using OMT algorithm
        var node = this._build(data.slice(), 0, data.length - 1, 0);

        if (!this.data.children.length) {
            // save as is if tree is empty
            this.data = node;

        } else if (this.data.height === node.height) {
            // split root if trees have the same height
            this._splitRoot(this.data, node);

        } else {
            if (this.data.height < node.height) {
                // swap trees if inserted one is bigger
                var tmpNode = this.data;
                this.data = node;
                node = tmpNode;
            }

            // insert the small tree into the large tree at appropriate level
            this._insert(node, this.data.height - node.height - 1, true);
        }

        return this;
    },

    insert: function (item) {
        if (item) this._insert(item, this.data.height - 1);
        return this;
    },

    clear: function () {
        this.data = createNode([]);
        return this;
    },

    remove: function (item, equalsFn) {
        if (!item) return this;

        var node = this.data,
            bbox = this.toBBox(item),
            path = [],
            indexes = [],
            i, parent, index, goingUp;

        // depth-first iterative tree traversal
        while (node || path.length) {

            if (!node) { // go up
                node = path.pop();
                parent = path[path.length - 1];
                i = indexes.pop();
                goingUp = true;
            }

            if (node.leaf) { // check current node
                index = findItem(item, node.children, equalsFn);

                if (index !== -1) {
                    // item found, remove the item and condense tree upwards
                    node.children.splice(index, 1);
                    path.push(node);
                    this._condense(path);
                    return this;
                }
            }

            if (!goingUp && !node.leaf && contains(node, bbox)) { // go down
                path.push(node);
                indexes.push(i);
                i = 0;
                parent = node;
                node = node.children[0];

            } else if (parent) { // go right
                i++;
                node = parent.children[i];
                goingUp = false;

            } else node = null; // nothing found
        }

        return this;
    },

    toBBox: function (item) { return item; },

    compareMinX: compareNodeMinX,
    compareMinY: compareNodeMinY,

    toJSON: function () { return this.data; },

    fromJSON: function (data) {
        this.data = data;
        return this;
    },

    _all: function (node, result) {
        var nodesToSearch = [];
        while (node) {
            if (node.leaf) result.push.apply(result, node.children);
            else nodesToSearch.push.apply(nodesToSearch, node.children);

            node = nodesToSearch.pop();
        }
        return result;
    },

    _build: function (items, left, right, height) {

        var N = right - left + 1,
            M = this._maxEntries,
            node;

        if (N <= M) {
            // reached leaf level; return leaf
            node = createNode(items.slice(left, right + 1));
            calcBBox(node, this.toBBox);
            return node;
        }

        if (!height) {
            // target height of the bulk-loaded tree
            height = Math.ceil(Math.log(N) / Math.log(M));

            // target number of root entries to maximize storage utilization
            M = Math.ceil(N / Math.pow(M, height - 1));
        }

        node = createNode([]);
        node.leaf = false;
        node.height = height;

        // split the items into M mostly square tiles

        var N2 = Math.ceil(N / M),
            N1 = N2 * Math.ceil(Math.sqrt(M)),
            i, j, right2, right3;

        multiSelect(items, left, right, N1, this.compareMinX);

        for (i = left; i <= right; i += N1) {

            right2 = Math.min(i + N1 - 1, right);

            multiSelect(items, i, right2, N2, this.compareMinY);

            for (j = i; j <= right2; j += N2) {

                right3 = Math.min(j + N2 - 1, right2);

                // pack each entry recursively
                node.children.push(this._build(items, j, right3, height - 1));
            }
        }

        calcBBox(node, this.toBBox);

        return node;
    },

    _chooseSubtree: function (bbox, node, level, path) {

        var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;

        while (true) {
            path.push(node);

            if (node.leaf || path.length - 1 === level) break;

            minArea = minEnlargement = Infinity;

            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                area = bboxArea(child);
                enlargement = enlargedArea(bbox, child) - area;

                // choose entry with the least area enlargement
                if (enlargement < minEnlargement) {
                    minEnlargement = enlargement;
                    minArea = area < minArea ? area : minArea;
                    targetNode = child;

                } else if (enlargement === minEnlargement) {
                    // otherwise choose one with the smallest area
                    if (area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
                }
            }

            node = targetNode || node.children[0];
        }

        return node;
    },

    _insert: function (item, level, isNode) {

        var toBBox = this.toBBox,
            bbox = isNode ? item : toBBox(item),
            insertPath = [];

        // find the best node for accommodating the item, saving all nodes along the path too
        var node = this._chooseSubtree(bbox, this.data, level, insertPath);

        // put the item into the node
        node.children.push(item);
        extend(node, bbox);

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level);
                level--;
            } else break;
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level);
    },

    // split overflowed node into two
    _split: function (insertPath, level) {

        var node = insertPath[level],
            M = node.children.length,
            m = this._minEntries;

        this._chooseSplitAxis(node, m, M);

        var splitIndex = this._chooseSplitIndex(node, m, M);

        var newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
        newNode.height = node.height;
        newNode.leaf = node.leaf;

        calcBBox(node, this.toBBox);
        calcBBox(newNode, this.toBBox);

        if (level) insertPath[level - 1].children.push(newNode);
        else this._splitRoot(node, newNode);
    },

    _splitRoot: function (node, newNode) {
        // split root node
        this.data = createNode([node, newNode]);
        this.data.height = node.height + 1;
        this.data.leaf = false;
        calcBBox(this.data, this.toBBox);
    },

    _chooseSplitIndex: function (node, m, M) {

        var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;

        minOverlap = minArea = Infinity;

        for (i = m; i <= M - m; i++) {
            bbox1 = distBBox(node, 0, i, this.toBBox);
            bbox2 = distBBox(node, i, M, this.toBBox);

            overlap = intersectionArea(bbox1, bbox2);
            area = bboxArea(bbox1) + bboxArea(bbox2);

            // choose distribution with minimum overlap
            if (overlap < minOverlap) {
                minOverlap = overlap;
                index = i;

                minArea = area < minArea ? area : minArea;

            } else if (overlap === minOverlap) {
                // otherwise choose distribution with minimum area
                if (area < minArea) {
                    minArea = area;
                    index = i;
                }
            }
        }

        return index;
    },

    // sorts node children by the best axis for split
    _chooseSplitAxis: function (node, m, M) {

        var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX,
            compareMinY = node.leaf ? this.compareMinY : compareNodeMinY,
            xMargin = this._allDistMargin(node, m, M, compareMinX),
            yMargin = this._allDistMargin(node, m, M, compareMinY);

        // if total distributions margin value is minimal for x, sort by minX,
        // otherwise it's already sorted by minY
        if (xMargin < yMargin) node.children.sort(compareMinX);
    },

    // total margin of all possible split distributions where each node is at least m full
    _allDistMargin: function (node, m, M, compare) {

        node.children.sort(compare);

        var toBBox = this.toBBox,
            leftBBox = distBBox(node, 0, m, toBBox),
            rightBBox = distBBox(node, M - m, M, toBBox),
            margin = bboxMargin(leftBBox) + bboxMargin(rightBBox),
            i, child;

        for (i = m; i < M - m; i++) {
            child = node.children[i];
            extend(leftBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(leftBBox);
        }

        for (i = M - m - 1; i >= m; i--) {
            child = node.children[i];
            extend(rightBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(rightBBox);
        }

        return margin;
    },

    _adjustParentBBoxes: function (bbox, path, level) {
        // adjust bboxes along the given tree path
        for (var i = level; i >= 0; i--) {
            extend(path[i], bbox);
        }
    },

    _condense: function (path) {
        // go through the path, removing empty nodes and updating bboxes
        for (var i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
                if (i > 0) {
                    siblings = path[i - 1].children;
                    siblings.splice(siblings.indexOf(path[i]), 1);

                } else this.clear();

            } else calcBBox(path[i], this.toBBox);
        }
    },

    _initFormat: function (format) {
        // data format (minX, minY, maxX, maxY accessors)

        // uses eval-type function compilation instead of just accepting a toBBox function
        // because the algorithms are very sensitive to sorting functions performance,
        // so they should be dead simple and without inner calls

        var compareArr = ['return a', ' - b', ';'];

        this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
        this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));

        this.toBBox = new Function('a',
            'return {minX: a' + format[0] +
            ', minY: a' + format[1] +
            ', maxX: a' + format[2] +
            ', maxY: a' + format[3] + '};');
    }
};

function findItem(item, items, equalsFn) {
    if (!equalsFn) return items.indexOf(item);

    for (var i = 0; i < items.length; i++) {
        if (equalsFn(item, items[i])) return i;
    }
    return -1;
}

// calculate node's bbox from bboxes of its children
function calcBBox(node, toBBox) {
    distBBox(node, 0, node.children.length, toBBox, node);
}

// min bounding rectangle of node children from k to p-1
function distBBox(node, k, p, toBBox, destNode) {
    if (!destNode) destNode = createNode(null);
    destNode.minX = Infinity;
    destNode.minY = Infinity;
    destNode.maxX = -Infinity;
    destNode.maxY = -Infinity;

    for (var i = k, child; i < p; i++) {
        child = node.children[i];
        extend(destNode, node.leaf ? toBBox(child) : child);
    }

    return destNode;
}

function extend(a, b) {
    a.minX = Math.min(a.minX, b.minX);
    a.minY = Math.min(a.minY, b.minY);
    a.maxX = Math.max(a.maxX, b.maxX);
    a.maxY = Math.max(a.maxY, b.maxY);
    return a;
}

function compareNodeMinX(a, b) { return a.minX - b.minX; }
function compareNodeMinY(a, b) { return a.minY - b.minY; }

function bboxArea(a)   { return (a.maxX - a.minX) * (a.maxY - a.minY); }
function bboxMargin(a) { return (a.maxX - a.minX) + (a.maxY - a.minY); }

function enlargedArea(a, b) {
    return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) *
           (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
}

function intersectionArea(a, b) {
    var minX = Math.max(a.minX, b.minX),
        minY = Math.max(a.minY, b.minY),
        maxX = Math.min(a.maxX, b.maxX),
        maxY = Math.min(a.maxY, b.maxY);

    return Math.max(0, maxX - minX) *
           Math.max(0, maxY - minY);
}

function contains(a, b) {
    return a.minX <= b.minX &&
           a.minY <= b.minY &&
           b.maxX <= a.maxX &&
           b.maxY <= a.maxY;
}

function intersects(a, b) {
    return b.minX <= a.maxX &&
           b.minY <= a.maxY &&
           b.maxX >= a.minX &&
           b.maxY >= a.minY;
}

function createNode(children) {
    return {
        children: children,
        height: 1,
        leaf: true,
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };
}

// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
// combines selection algorithm with binary divide & conquer approach

function multiSelect(arr, left, right, n, compare) {
    var stack = [left, right],
        mid;

    while (stack.length) {
        right = stack.pop();
        left = stack.pop();

        if (right - left <= n) continue;

        mid = left + Math.ceil((right - left) / n / 2) * n;
        quickselect(arr, mid, left, right, compare);

        stack.push(left, mid, mid, right);
    }
}


/***/ }),

/***/ "./src/resources/assets/js/annotations/components/settingsTabPlugin.vue":
/*!******************************************************************************!*\
  !*** ./src/resources/assets/js/annotations/components/settingsTabPlugin.vue ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _settingsTabPlugin_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./settingsTabPlugin.vue?vue&type=script&lang=js& */ "./src/resources/assets/js/annotations/components/settingsTabPlugin.vue?vue&type=script&lang=js&");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js");
var render, staticRenderFns
;



/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_1__["default"])(
  _settingsTabPlugin_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__["default"],
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "src/resources/assets/js/annotations/components/settingsTabPlugin.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "./src/resources/assets/js/annotations/components/settingsTabPlugin.vue?vue&type=script&lang=js&":
/*!*******************************************************************************************************!*\
  !*** ./src/resources/assets/js/annotations/components/settingsTabPlugin.vue?vue&type=script&lang=js& ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_clonedRuleSet_5_0_rules_0_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_settingsTabPlugin_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../../node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!../../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./settingsTabPlugin.vue?vue&type=script&lang=js& */ "./node_modules/babel-loader/lib/index.js??clonedRuleSet-5[0].rules[0].use[0]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/resources/assets/js/annotations/components/settingsTabPlugin.vue?vue&type=script&lang=js&");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_clonedRuleSet_5_0_rules_0_use_0_node_modules_vue_loader_lib_index_js_vue_loader_options_settingsTabPlugin_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js":
/*!********************************************************************!*\
  !*** ./node_modules/vue-loader/lib/runtime/componentNormalizer.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
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
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!************************************************************!*\
  !*** ./src/resources/assets/js/annotations/annotations.js ***!
  \************************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _settingsTabPlugins__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./settingsTabPlugins */ "./src/resources/assets/js/annotations/settingsTabPlugins.js");

})();

/******/ })()
;