describe('The dias.core module', function () {

	it('should have the angular variable', function () {
		expect(angular).toBeDefined();
	});

	it('should know the module', function () {
		expect(angular.module('dias.core')).toBeDefined();
	});

});