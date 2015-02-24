module.exports = function (config) {
	return config.set({
		
		basePath: '',

		frameworks: ['jasmine'],

		files: [
			'public/assets/scripts/angular.min.js',
			'public/assets/scripts/angular-resource.min.js',
			'public/assets/scripts/ui-bootstrap-tpls.min.js',
			'resources/assets/js/main.js',
			'resources/assets/js/**/*.js',
			'tests/js/**/*.js',
		],

		reporters: ['dots'],

		colors: true,

		browsers: ['PhantomJS'],

		autoWatch: true
	});
};