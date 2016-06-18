/**
 * @namespace dias.api
 * @description The DIAS api AngularJS module.
 */
angular.module('dias.api', ['ngResource']);

angular.module('dias.api').config(function ($httpProvider, $compileProvider) {
	"use strict";

	$httpProvider.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

    /*
     * Disable debug info in production for better performance.
     * see: https://code.angularjs.org/1.4.7/docs/guide/production
     */
    $compileProvider.debugInfoEnabled(false);
});

/**
 * @namespace dias.ui.messages
 * @description The DIAS user feedback messages AngularJS module.
 */
angular.module('dias.ui.messages', ['ui.bootstrap']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.ui.messages').config(function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
});

// bootstrap the messages module
angular.element(document).ready(function () {
	"use strict";

	angular.bootstrap(
		document.querySelector('[data-ng-controller="MessagesController"]'),
		['dias.ui.messages']
	);
});

/**
 * @namespace dias.ui.users
 * @description The DIAS users UI AngularJS module.
 */
angular.module('dias.ui.users', ['ui.bootstrap', 'dias.api']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.ui.users').config(function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
});

/**
 * @namespace dias.ui.utils
 * @description The DIAS utils UI AngularJS module.
 */
angular.module('dias.ui.utils', []);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.ui.utils').config(function ($compileProvider, $locationProvider) {
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
 * @namespace dias.ui
 * @description The DIAS UI AngularJS module.
 */
angular.module('dias.ui', ['ui.bootstrap', 'dias.ui.messages', 'dias.ui.users', 'dias.ui.utils', 'ngAnimate']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.ui').config(function ($compileProvider, $animateProvider) {
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
