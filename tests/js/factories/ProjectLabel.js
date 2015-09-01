describe('The ProjectTransect resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

	beforeEach(inject(function($injector) {
		var labels = [
            {id: 1, name: 'coral'}
        ];

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/projects/1/labels')
		            .respond(labels);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should query project labels', inject(function (ProjectLabel) {
		$httpBackend.expectGET('/api/v1/projects/1/labels');
		var labels = ProjectLabel.query({ project_id: 1 }, function () {
			var label = labels[0];
			expect(label instanceof ProjectLabel).toBe(true);
			expect(label.id).toEqual(1);
			expect(label.name).toEqual('coral');
		});
		$httpBackend.flush();
	}));
});
