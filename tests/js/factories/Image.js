describe('The Image resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

	beforeEach(inject(function($injector) {
		var image = {
			id: 1,
			transect_id: 1
		};
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/images/1')
		            .respond(image);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should show images', inject(function (Image) {
		$httpBackend.expectGET('/api/v1/images/1');
		var image = Image.get({id: 1}, function () {
			expect(image.transect_id).toEqual(1);
		});
		$httpBackend.flush();
	}));
});