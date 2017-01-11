module.exports = function (config) {
	return config.set({

		basePath: '',

		frameworks: ['jasmine'],

		files: [
			'public/assets/scripts/angular.min.js',
			'public/assets/scripts/angular-resource.min.js',
			'public/assets/scripts/ui-bootstrap-tpls.min.js',
			'resources/assets/js/core/main.js',
			'resources/assets/js/core/api/**/*.js',
            'resources/assets/js/core/ui/**/*.js',
			'tests/js/**/*.js',
		],

		reporters: ['dots'],

		colors: true,

		browsers: ['PhantomJS'],

		autoWatch: true
	});
};
