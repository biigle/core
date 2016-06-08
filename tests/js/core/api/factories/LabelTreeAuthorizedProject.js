describe('The LabelTreeAuthorizedProject resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

	beforeEach(inject(function($injector) {
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('POST', '/api/v1/label-trees/1/authorized-projects')
		            .respond(200);

        $httpBackend.when('DELETE', '/api/v1/label-trees/1/authorized-projects/4')
                    .respond(200);
	}));

	afterEach(function() {
		$httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

	it('should add authorized projects', inject(function (LabelTreeAuthorizedProject) {
		$httpBackend.expectPOST('/api/v1/label-trees/1/authorized-projects', {
            id: 4
        });
        LabelTreeAuthorizedProject.addAuthorized({id: 1}, {id: 4});
	}));

    it('should remove authorized projects', inject(function (LabelTreeAuthorizedProject) {
        $httpBackend.expectDELETE('/api/v1/label-trees/1/authorized-projects/4');
        LabelTreeAuthorizedProject.removeAuthorized({id: 1}, {id: 4});
    }));
});
