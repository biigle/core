describe('The TransectImage resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.core'));

	beforeEach(inject(function($injector) {
		var image = 1;

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');
		
		$httpBackend.when('GET', '/api/v1/transects/1/images')
		            .respond([image]);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should query transect images', inject(function (TransectImage) {
		$httpBackend.expectGET('/api/v1/transects/1/images');
		var images = TransectImage.query({transect_id: 1}, function () {
			expect(images[0]).toEqual(1);
		});
		$httpBackend.flush();
	}));
});