describe('The ImageAnnotation resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

	beforeEach(inject(function($injector) {
		var annotation = {
			id: 1,
			image_id: 1,
			shape_id: 2
		};
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/images/1/annotations')
		            .respond([annotation]);
		
		$httpBackend.when('POST', '/api/v1/images/1/annotations')
		            .respond(annotation);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should query image annotations', inject(function (ImageAnnotation) {
		$httpBackend.expectGET('/api/v1/images/1/annotations');
		var annotations = ImageAnnotation.query({image_id: 1}, function () {
			var annotation = annotations[0];
			expect(annotation instanceof ImageAnnotation).toBe(true);
			expect(annotation.shape_id).toEqual(2);
		});
		$httpBackend.flush();
	}));

	it('should add new annotations', inject(function (ImageAnnotation) {
		$httpBackend.expectPOST('/api/v1/images/1/annotations', {
			shape_id: 2, points: [{x: 10, y: 20}], image_id: 1
		});
		var annotation = ImageAnnotation.add(
			{shape_id: 2, points: [{x: 10, y: 20}], image_id: 1},
			function () { expect(annotation.id).toEqual(1); }
		);
		$httpBackend.flush();
	}));
});