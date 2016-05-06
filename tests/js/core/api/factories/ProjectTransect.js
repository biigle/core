describe('The ProjectTransect resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

	beforeEach(inject(function($injector) {
		var transect = {
			id: 1,
			name: "transect 1"
		};

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/projects/1/transects')
		            .respond([transect]);

		$httpBackend.when('POST', '/api/v1/projects/1/transects')
		            .respond(transect);

		$httpBackend.when('POST', '/api/v1/projects/2/transects/1')
		            .respond(200);

		$httpBackend.when('DELETE', '/api/v1/projects/1/transects/1')
		            .respond(200);
	}));

    afterEach(function() {
		$httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should query project transects', inject(function (ProjectTransect) {
        $httpBackend.expectGET('/api/v1/projects/1/transects');
        var transects = ProjectTransect.query({ project_id: 1 }, function () {
            var transect = transects[0];
            expect(transect instanceof ProjectTransect).toBe(true);
            expect(transect.id).toEqual(1);
            expect(transect.name).toEqual('transect 1');
        });
	}));

	it('should add new transects projects', inject(function (ProjectTransect) {
		$httpBackend.expectPOST('/api/v1/projects/1/transects',
			{name: "transect 1"}
		);
		var transect = ProjectTransect.add({project_id: 1},
			{name: "transect 1"},
			function () {
				expect(transect.name).toEqual('transect 1');
				expect(transect.id).toBeDefined();
			}
		);
	}));

	it('should attach existing transects to projects', inject(function (ProjectTransect) {
		$httpBackend.expectPOST('/api/v1/projects/2/transects/1');
		var transects = ProjectTransect.query({ project_id: 1 }, function () {
			var transect = transects[0];
			transect.$attach({project_id: 2});
		});

		$httpBackend.expectPOST('/api/v1/projects/2/transects/1');
		ProjectTransect.attach({project_id: 2}, {id: 1});
	}));

	it('should detach transects from projects', inject(function (ProjectTransect) {
		$httpBackend.expectDELETE('/api/v1/projects/1/transects/1');
		var transects = ProjectTransect.query({ project_id: 1 }, function () {
			var transect = transects[0];
			transect.$detach({project_id: 1});
		});

		$httpBackend.expectDELETE('/api/v1/projects/1/transects/1');
		ProjectTransect.detach({project_id: 1}, {id: 1});
	}));
});
