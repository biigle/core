describe('The ProjectUser resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.core'));

	beforeEach(inject(function($injector) {
		var user = {
			id: 1,
			firstname: "Joe"
		};

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/projects/1/users')
		            .respond([user]);

		$httpBackend.when('PUT', '/api/v1/projects/1/users/1')
		            .respond(200);

		$httpBackend.when('POST', '/api/v1/projects/2/users/1')
		            .respond(200);
	
		$httpBackend.when('DELETE', '/api/v1/projects/1/users/1')
		            .respond(200);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should query project users', inject(function (ProjectUser) {
		$httpBackend.expectGET('/api/v1/projects/1/users');
		var users = ProjectUser.query({ project_id: 1 }, function () {
			var user = users[0];
			expect(user instanceof ProjectUser).toBe(true);
			expect(user.id).toEqual(1);
			expect(user.firstname).toEqual('Joe');
		});
		$httpBackend.flush();
	}));

	it('should update project users', inject(function (ProjectUser) {
		$httpBackend.expectPUT('/api/v1/projects/1/users/1',
			{id: 1, project_role_id: 1}
		);
		var user = ProjectUser.save({project_id: 1},
			{id: 1, project_role_id: 1},
			function () {
				expect(user.project_role_id).toEqual(1);
				expect(user.id).toBeDefined();
			}
		);
		$httpBackend.flush();
	}));

	it('should attach users to projects', inject(function (ProjectUser) {
		$httpBackend.expectPOST('/api/v1/projects/2/users/1',
			{id: 1, project_role_id: 2}
		);

		ProjectUser.attach({project_id: 2}, {id: 1, project_role_id: 2});
		$httpBackend.flush();
	}));

	it('should detach users from projects', inject(function (ProjectUser) {
		$httpBackend.expectDELETE('/api/v1/projects/1/users/1');
		var users = ProjectUser.query({ project_id: 1 }, function () {
			var user = users[0];
			user.$detach({project_id: 1});
		});

		$httpBackend.expectDELETE('/api/v1/projects/1/users/1');
		ProjectUser.detach({project_id: 1}, {id: 1});
		$httpBackend.flush();
	}));
});