describe('The LabelSource resource factory', function () {
    var $httpBackend;

    beforeEach(module('dias.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

    beforeEach(inject(function($injector) {
        var labels = [{
            name: 'Kolga hyalina',
            aphia_id: 124731
        }];

        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');

        $httpBackend.when('GET', '/api/v1/label-sources/1/find?query=Kolga+h')
                    .respond(labels);
    }));

    afterEach(function() {
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should find labels', inject(function (LabelSource) {
        $httpBackend.expectGET('/api/v1/label-sources/1/find?query=Kolga+h');
        var labels = LabelSource.query({id: 1, query: 'Kolga h'}, function () {
            expect(labels[0].name).toEqual('Kolga hyalina');
            expect(labels[0].aphia_id).toEqual(124731);
        });
    }));
});
