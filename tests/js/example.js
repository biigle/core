describe('the base application', function () {

	it('should have the angular variable', function () {
		expect(angular).toBeDefined();
	});

	it('should know the dias module', function () {
		expect(angular.module('dias')).toBeDefined();
	});

});