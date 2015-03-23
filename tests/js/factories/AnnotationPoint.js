describe('The AnnotationPoint resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

	beforeEach(inject(function($injector) {
		var point = {x: 50, y: 40, id: 1, index: 1, annotation_id: 1};
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/annotations/1/points')
		            .respond([point]);
		
		$httpBackend.when('POST', '/api/v1/annotations/1/points')
		            .respond(point);

		$httpBackend.when('PUT', '/api/v1/annotations/1/points/1')
		            .respond(200);

		$httpBackend.when('DELETE', '/api/v1/annotations/1/points/1')
		            .respond(200);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should query annotation points', inject(function (AnnotationPoint) {
		$httpBackend.expectGET('/api/v1/annotations/1/points');
		var points = AnnotationPoint.query({annotation_id: 1}, function () {
			var point = points[0];
			expect(point instanceof AnnotationPoint).toBe(true);
			expect(point.x).toEqual(50);
		});
		$httpBackend.flush();
	}));

	it('should add annotation points', inject(function (AnnotationPoint) {
		$httpBackend.expectPOST('/api/v1/annotations/1/points', {
			x: 50, y: 40, annotation_id: 1
		});
		var point = AnnotationPoint.add({x: 50, y: 40, annotation_id: 1}, function () {
			expect(point.id).toBeDefined();
			expect(point.x).toEqual(50);
		});
		$httpBackend.flush();
	}));

	it('should update annotation points', inject(function (AnnotationPoint) {
		$httpBackend.expectPUT('/api/v1/annotations/1/points/1', {
			x: 10, y: 10, annotation_id: 1, id: 1
		});
		AnnotationPoint.save({x: 10, y: 10, annotation_id: 1, id: 1})

		$httpBackend.expectPUT('/api/v1/annotations/1/points/1', {
			x: 10, y: 10, annotation_id: 1, id: 1, index: 1
		});
		var points = AnnotationPoint.query({annotation_id: 1}, function () {
			var point = points[0];
			point.x = 10;
			point.y = 10;
			point.$save();
		});
		$httpBackend.flush();
	}));

	it('should delete annotation points', inject(function (AnnotationPoint) {
		$httpBackend.expectDELETE('/api/v1/annotations/1/points/1');
		var points = AnnotationPoint.query({annotation_id: 1}, function () {
			var point = points[0];
			point.$delete();
		});

		$httpBackend.expectDELETE('/api/v1/annotations/1/points/1');
		AnnotationPoint.delete({id: 1, annotation_id: 1});
		$httpBackend.flush();
	}));
});