describe('The OwnUser resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

	beforeEach(inject(function($injector) {
		var user = {id: 1, firstname: 'joe', lastname: 'user', role_id: 2};

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/users/my')
		            .respond(user);

		$httpBackend.when('PUT', '/api/v1/users/my')
		            .respond(200);

		$httpBackend.when('DELETE', '/api/v1/users/my')
		            .respond(200);
	}));

	afterEach(function() {
		$httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should show the own user', inject(function (OwnUser) {
        $httpBackend.expectGET('/api/v1/users/my');
        var user = OwnUser.get(function () {
            expect(user.id).toEqual(1);
        });
	}));

	it('should update the own user', inject(function (OwnUser) {
		$httpBackend.expectPUT('/api/v1/users/my', {
			firstname: 'jack'
		});
		var user = OwnUser.save({firstname: 'jack'}, function () {
			expect(user.firstname).toEqual('jack');
		});
	}));

	it('should destroy the own user', inject(function (OwnUser) {
		$httpBackend.expectDELETE('/api/v1/users/my');
		OwnUser.delete();
	}));

});
