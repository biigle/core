describe('The ImageLabel resource factory', function () {
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
			name: 'my label',
			user_id: 1,
			image_id: 1
		};
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/images/1/labels')
		            .respond([label]);

		$httpBackend.when('POST', '/api/v1/images/1/labels')
		            .respond(label);

		$httpBackend.when('DELETE', '/api/v1/image-labels/1')
		            .respond(200);
	}));

	afterEach(function() {
		$httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should query image labels', inject(function (ImageLabel) {
        $httpBackend.expectGET('/api/v1/images/1/labels');
        var labels = ImageLabel.query({image_id: 1}, function () {
            var label = labels[0];
            expect(label instanceof ImageLabel).toBe(true);
            expect(label.name).toEqual('my label');
        });
	}));

	it('should attach image labels', inject(function (ImageLabel) {
		$httpBackend.expectPOST('/api/v1/images/1/labels', {
			label_id: 1, image_id: 1
		});
		var label = ImageLabel.attach({label_id: 1, image_id: 1}, function () {
			expect(label.id).toEqual(1);
			expect(label.name).toEqual('my label');
		});
	}));

	it('should delete image labels', inject(function (ImageLabel) {
		$httpBackend.expectDELETE('/api/v1/image-labels/1');
		var labels = ImageLabel.query({image_id: 1}, function () {
			var label = labels[0];
			label.$delete();
		});

		$httpBackend.expectDELETE('/api/v1/image-labels/1');
		ImageLabel.delete({id: 1});
	}));
});
