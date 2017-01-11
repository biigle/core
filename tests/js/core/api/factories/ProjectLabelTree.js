describe('The ProjectLabelTree resource factory', function () {
	var $httpBackend;

	beforeEach(module('biigle.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

	beforeEach(inject(function($injector) {
        var trees = [
            {id: 1, name: 'my labels', description: 'labels'}
        ];
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/projects/1/label-trees')
		            .respond(trees);

        $httpBackend.when('GET', '/api/v1/projects/1/label-trees/available')
                    .respond(trees);

        $httpBackend.when('POST', '/api/v1/projects/1/label-trees')
                    .respond(200);

        $httpBackend.when('DELETE', '/api/v1/projects/1/label-trees/1')
                    .respond(200);
	}));

	afterEach(function() {
		$httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

	it('should list all trees used by the project', inject(function (ProjectLabelTree) {
		$httpBackend.expectGET('/api/v1/projects/1/label-trees');
        var trees = ProjectLabelTree.query({project_id: 1}, function () {
            expect(trees[0].name).toEqual('my labels');
        });
	}));

    it('should list all trees available for the project', inject(function (ProjectLabelTree) {
        $httpBackend.expectGET('/api/v1/projects/1/label-trees/available');
        var trees = ProjectLabelTree.available({project_id: 1}, function () {
            expect(trees[0].name).toEqual('my labels');
        });
    }));

    it('should attach label trees', inject(function (ProjectLabelTree) {
        $httpBackend.expectPOST('/api/v1/projects/1/label-trees', {id: 1});
        ProjectLabelTree.attach({project_id: 1}, {id: 1});
    }));

    it('should detach label trees', inject(function (ProjectLabelTree) {
        $httpBackend.expectDELETE('/api/v1/projects/1/label-trees/1');
        ProjectLabelTree.detach({project_id: 1}, {id: 1});
    }));
});
