describe('The Label resource factory', function () {
    var $httpBackend;

    beforeEach(module('dias.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

    beforeEach(inject(function($injector) {
        var label = {
            id: 1,
            name: "Benthic Object"
        };

        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');

        $httpBackend.when('POST', '/api/v1/label-trees/1/labels')
                    .respond([label]);

        $httpBackend.when('DELETE', '/api/v1/labels/1')
                    .respond(200);
    }));

    afterEach(function() {
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should add new labels', inject(function (Label) {
        $httpBackend.expectPOST('/api/v1/label-trees/1/labels', {
            name: "Benthic Object",
            label_tree_id: 1
        });
        var labels = Label.create({name: "Benthic Object", label_tree_id: 1}, function () {
            expect(labels[0].name).toEqual('Benthic Object');
            expect(labels[0].id).toBeDefined();
        });
    }));

    it('should delete labels', inject(function (Label) {
        $httpBackend.expectDELETE('/api/v1/labels/1');
        Label.delete({id: 1});
    }));
});
