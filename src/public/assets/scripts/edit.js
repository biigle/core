/**
 * @namespace dias.transects.edit
 * @description The DIAS transects module.
 */
angular.module('dias.transects.edit', ['dias.api']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.transects').config(["$compileProvider", function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
}]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsdUJBQUEsQ0FBQTs7Ozs7O0FBTUEsUUFBQSxPQUFBLGtCQUFBLDRCQUFBLFVBQUEsa0JBQUE7SUFDQTs7SUFFQSxpQkFBQSxpQkFBQTs7QUFFQSIsImZpbGUiOiJlZGl0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzLmVkaXRcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMuZWRpdCcsIFsnZGlhcy5hcGknXSk7XG5cbi8qXG4gKiBEaXNhYmxlIGRlYnVnIGluZm8gaW4gcHJvZHVjdGlvbiBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICogc2VlOiBodHRwczovL2NvZGUuYW5ndWxhcmpzLm9yZy8xLjQuNy9kb2NzL2d1aWRlL3Byb2R1Y3Rpb25cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29uZmlnKGZ1bmN0aW9uICgkY29tcGlsZVByb3ZpZGVyKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAkY29tcGlsZVByb3ZpZGVyLmRlYnVnSW5mb0VuYWJsZWQoZmFsc2UpO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
