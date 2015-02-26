describe('The Annotation resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.core'));

	beforeEach(inject(function($injector) {
		var annotation = {id: 1, points: [], labels: []};
		var point = {x: 50, y: 40, id: 1, index: 1};
		var annotationWithPoint = {id: 1, points: [point], labels: []};
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');
		
		$httpBackend.when('GET', '/api/v1/annotations/1')
		            .respond(annotation);
		
		$httpBackend.when('POST', '/api/v1/annotations/1/points')
		            .respond(200, annotationWithPoint);

		$httpBackend.when('DELETE', '/api/v1/annotations/1')
		            .respond(200);

		$httpBackend.when('DELETE', '/api/v1/annotations/1/points/1')
		            .respond(annotation);
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

	it('should add an annotation point', inject(function (Annotation) {
		$httpBackend.expectPOST('/api/v1/annotations/1/points', {
			x: 50,
			y: 40
		});

		var annotation = Annotation.addPoint({id: 1}, {x:50, y:40}, function () {
			// the annotation object should be returned, not the point
			expect(annotation.points).toBeDefined();
			expect(annotation.points[0].x).toEqual(50);
		});
		$httpBackend.flush();
	}));

	it('should delete an annotation point', inject(function (Annotation) {
		$httpBackend.expectDELETE('/api/v1/annotations/1/points/1');
		var annotation = Annotation.deletePoint({id: 1, attributeId: 1}, function () {
			expect(annotation.points).toEqual([]);
		});
		$httpBackend.flush();
	}));
});