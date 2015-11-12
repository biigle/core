describe('The Label resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

	beforeEach(inject(function($injector) {
		var label = {
			id: 1,
			name: "Benthic Object"
		};

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/labels')
		            .respond([label]);
		
		$httpBackend.when('GET', '/api/v1/labels/1')
		            .respond(label);

		$httpBackend.when('POST', '/api/v1/labels')
		            .respond(label);

		$httpBackend.when('PUT', '/api/v1/labels/1')
		            .respond(200);
	
		$httpBackend.when('DELETE', '/api/v1/labels/1')
		            .respond(200);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should query labels', inject(function (Label) {
		$httpBackend.expectGET('/api/v1/labels');
		var labels = Label.query(function () {
			var label = labels[0];
			expect(label instanceof Label).toBe(true);
			expect(label.name).toEqual('Benthic Object');
		});
		$httpBackend.flush();
	}));

	it('should show a label', inject(function (Label) {
		$httpBackend.expectGET('/api/v1/labels/1');
		var label = Label.get({id: 1}, function () {
			expect(label.name).toEqual('Benthic Object');
		});
		$httpBackend.flush();
	}));

	it('should add new labels', inject(function (Label) {
		$httpBackend.expectPOST('/api/v1/labels', {name: "Benthic Object"});
		var label = Label.add({name: "Benthic Object"}, function () {
			expect(label.name).toEqual('Benthic Object');
			expect(label.id).toBeDefined();
		});
		$httpBackend.flush();
	}));

	it('should update labels', inject(function (Label) {
		$httpBackend.expectPUT('/api/v1/labels/1',
			{id:1, name: "Trash"}
		);
		var label = Label.get({id: 1}, function () {
			label.name = 'Trash';
			label.$save();
		});

		$httpBackend.expectPUT('/api/v1/labels/1', {id:1, name: "Trash"});
		var label = Label.save({id: 1, name: 'Trash'}, function () {
			expect(label.name).toEqual('Trash');
		});
		$httpBackend.flush();
	}));

	it('should delete labels', inject(function (Label) {
		$httpBackend.expectDELETE('/api/v1/labels/1');
		var label = Label.get({id: 1}, function () {
			label.$delete();
		});

		$httpBackend.expectDELETE('/api/v1/labels/1');
		Label.delete({id: 1});
		$httpBackend.flush();
	}));
});