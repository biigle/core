describe('The Attribute resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

	beforeEach(inject(function($injector) {
		var attribute = {
			id: 1,
			name: 'bad_quality',
			type: 'boolean'
		};
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/attributes')
		            .respond([attribute]);
	
		$httpBackend.when('GET', '/api/v1/attributes/1')
		            .respond(attribute);

		$httpBackend.when('POST', '/api/v1/attributes')
		            .respond(attribute);

		$httpBackend.when('DELETE', '/api/v1/attributes/1')
		            .respond(200);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should query attributes', inject(function (Attribute) {
		$httpBackend.expectGET('/api/v1/attributes');
		var attributes = Attribute.query(function () {
			var attribute = attributes[0];
			expect(attribute instanceof Attribute).toBe(true);
			expect(attribute.name).toEqual('bad_quality');
		});
		$httpBackend.flush();
	}));

	it('should show attributes', inject(function (Attribute) {
		$httpBackend.expectGET('/api/v1/attributes/1');
		var attribute = Attribute.get({id: 1}, function () {
			expect(attribute.name).toEqual('bad_quality');
		});
		$httpBackend.flush();
	}));

	it('should add attributes', inject(function (Attribute) {
		$httpBackend.expectPOST('/api/v1/attributes', {
			name: 'bad_quality', type: 'boolean'
		});
		var attribute = Attribute.add({
				name: 'bad_quality', type: 'boolean'
			}, function () {
				expect(attribute.type).toEqual('boolean');
				expect(attribute.id).toBeDefined();
		});
		$httpBackend.flush();
	}));

	it('should delete attributes', inject(function (Attribute) {
		$httpBackend.expectDELETE('/api/v1/attributes/1');
		Attribute.delete({id: 1});

		$httpBackend.expectDELETE('/api/v1/attributes/1');
		var attributes = Attribute.query(function () {
			var attribute = attributes[0];
			attribute.$delete();
		});
		$httpBackend.flush();
	}));
});