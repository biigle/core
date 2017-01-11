/**
 * @namespace biigle.api
 * @description The BIIGLE api AngularJS module.
 */
angular.module('biigle.api', ['ngResource']);

angular.module('biigle.api').config(function ($httpProvider, $compileProvider) {
	"use strict";

	$httpProvider.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

    /*
     * Disable debug info in production for better performance.
     * see: https://code.angularjs.org/1.4.7/docs/guide/production
     */
    $compileProvider.debugInfoEnabled(false);
});

/**
 * @namespace biigle.ui.messages
 * @description The BIIGLE user feedback messages AngularJS module.
 */
angular.module('biigle.ui.messages', ['ui.bootstrap']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.ui.messages').config(function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
});

// bootstrap the messages module
angular.element(document).ready(function () {
	"use strict";

	angular.bootstrap(
		document.querySelector('[data-ng-controller="MessagesController"]'),
		['biigle.ui.messages']
	);
});

/**
 * @namespace biigle.ui.users
 * @description The BIIGLE users UI AngularJS module.
 */
angular.module('biigle.ui.users', ['ui.bootstrap', 'biigle.api']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.ui.users').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});

/**
 * @namespace biigle.ui.utils
 * @description The BIIGLE utils UI AngularJS module.
 */
angular.module('biigle.ui.utils', []);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.ui.utils').config(function ($compileProvider, $locationProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);

    // configuration for the urlParams service
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false
    });
});

/**
 * @namespace biigle.ui
 * @description The BIIGLE UI AngularJS module.
 */
angular.module('biigle.ui', ['ui.bootstrap', 'biigle.ui.messages', 'biigle.ui.users', 'biigle.ui.utils', 'ngAnimate']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.ui').config(function ($compileProvider, $animateProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);

    // By default, the $animate service will check for animation styling
    // on every structural change. This requires a lot of animateFrame-based
    // DOM-inspection. However, we can tell $animate to only check for
    // animations on elements that have a specific class name RegExp pattern
    // present. In this case, we are requiring the "animated" class.
    // --
    // see: http://www.bennadel.com/blog/2935-enable-animations-explicitly-for-a-performance-boost-in-angularjs.htm
    $animateProvider.classNameFilter( /\banimated\b/ );
});
