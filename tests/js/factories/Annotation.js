describe('The Annotation resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.core'));

	beforeEach(inject(function($injector) {
		var annotation = {id: 1};

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');
		
		$httpBackend.when('GET', '/api/v1/annotations/1')
		            .respond(annotation);

		$httpBackend.when('DELETE', '/api/v1/annotations/1')
		            .respond(200);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should show an annotation', inject(function (Annotation) {
		$httpBackend.expectGET('/api/v1/annotations/1');
		var annotation = Annotation.get({id: 1}, function () {
			expect(annotation.id).toEqual(1);
		});
		$httpBackend.flush();
	}));

	it('should delete an annotation', inject(function (Annotation) {
		$httpBackend.expectDELETE('/api/v1/annotations/1');
		Annotation.delete({id: 1});
		$httpBackend.flush();
	}));
});