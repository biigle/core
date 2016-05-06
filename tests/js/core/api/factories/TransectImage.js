describe('The TransectImage resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

	beforeEach(inject(function($injector) {
		var image = 1;
        var images = [
            {id: 1, filename: '1.jpg'},
            {id: 2, filename: '2.jpg'}
        ];

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/transects/1/images')
		            .respond([image]);

        $httpBackend.when('POST', '/api/v1/transects/1/images')
                    .respond(images);
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should query transect images', inject(function (TransectImage) {
		$httpBackend.expectGET('/api/v1/transects/1/images');
		var images = TransectImage.query({transect_id: 1}, function () {
			expect(images[0]).toEqual(1);
		});
		$httpBackend.flush();
	}));

    it('should add transect images', inject(function (TransectImage) {
        $httpBackend.expectPOST('/api/v1/transects/1/images', {
            filenames: '1.jpg,2.jpg'
        });
        var images = TransectImage.save({transect_id: 1}, {filenames: '1.jpg,2.jpg'}, function () {
            expect(images[0].id).toEqual(1);
            expect(images[0].filename).toEqual('1.jpg');
            expect(images[1].id).toEqual(2);
            expect(images[1].filename).toEqual('2.jpg');
        });
        $httpBackend.flush();
    }));
});
