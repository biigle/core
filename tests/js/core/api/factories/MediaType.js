describe('The MediaType resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

	beforeEach(inject(function($injector) {
		var mediaType = {
			id: 1,
			name: "time-series"
		};

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/media-types')
		            .respond([mediaType]);

		$httpBackend.when('GET', '/api/v1/media-types/1')
		            .respond(mediaType);
	}));

	afterEach(function() {
		$httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should query media types', inject(function (MediaType) {
        $httpBackend.expectGET('/api/v1/media-types');
        var mediaTypes = MediaType.query(function () {
            var mediaType = mediaTypes[0];
            expect(mediaType instanceof MediaType).toBe(true);
            expect(mediaType.name).toEqual('time-series');
        });
	}));

	it('should show a media type', inject(function (MediaType) {
		$httpBackend.expectGET('/api/v1/media-types/1');
		var mediaType = MediaType.get({id: 1}, function () {
			expect(mediaType.name).toEqual('time-series');
		});
	}));
});
