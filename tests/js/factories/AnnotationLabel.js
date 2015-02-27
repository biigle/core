describe('The AnnotationLabel resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.core'));

	beforeEach(inject(function($injector) {
		var label = {
			id: 1,
			name: 'my label',
			user_id: 1,
			confidence: 0.5,
			annotation_id: 1
		};
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/annotations/1/labels')
		            .respond([label]);
		
		$httpBackend.when('POST', '/api/v1/annotations/1/labels')
		            .respond(label);

		$httpBackend.when('PUT', '/api/v1/annotations/1/labels/1')
		            .respond(200);

		$httpBackend.when('DELETE', '/api/v1/annotations/1/labels/1')
		            .respond(200);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should query annotation labels', inject(function (AnnotationLabel) {
		$httpBackend.expectGET('/api/v1/annotations/1/labels');
		var labels = AnnotationLabel.query({annotation_id: 1}, function () {
			var label = labels[0];
			expect(label instanceof AnnotationLabel).toBe(true);
			expect(label.name).toEqual('my label');
		});
		$httpBackend.flush();
	}));

	it('should attach annotation labels', inject(function (AnnotationLabel) {
		$httpBackend.expectPOST('/api/v1/annotations/1/labels', {
			label_id: 1, confidence: 0.5, annotation_id: 1
		});
		var label = AnnotationLabel.attach({label_id: 1, confidence: 0.5, annotation_id: 1}, function () {
			expect(label.id).toEqual(1);
			expect(label.name).toEqual('my label');
		});
		$httpBackend.flush();
	}));

	it('should update annotation labels', inject(function (AnnotationLabel) {
		$httpBackend.expectPUT('/api/v1/annotations/1/labels/1', {
			confidence: 0.1, annotation_id: 1, id: 1
		});
		AnnotationLabel.save({confidence: 0.1, annotation_id: 1, id: 1});

		$httpBackend.expectPUT('/api/v1/annotations/1/labels/1', {
			id: 1,
			name: 'my label',
			user_id: 1,
			confidence: 0.1,
			annotation_id: 1
		});
		var labels = AnnotationLabel.query({annotation_id: 1}, function () {
			var label = labels[0];
			label.confidence = 0.1;
			label.$save();
		});
		$httpBackend.flush();
	}));

	it('should detach annotation points', inject(function (AnnotationLabel) {
		$httpBackend.expectDELETE('/api/v1/annotations/1/labels/1');
		var labels = AnnotationLabel.query({annotation_id: 1}, function () {
			var label = labels[0];
			label.$detach();
		});

		$httpBackend.expectDELETE('/api/v1/annotations/1/labels/1');
		AnnotationLabel.detach({id: 1, annotation_id: 1});
		$httpBackend.flush();
	}));
});