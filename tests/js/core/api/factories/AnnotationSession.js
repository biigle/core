describe('The AnnotationSession resource factory', function () {
	var $httpBackend;

	beforeEach(module('dias.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

	beforeEach(inject(function($injector) {
        var session = {
            id: 12,
            name: 'My session'
        };

		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.when('GET', '/api/v1/transects/3/annotation-sessions')
		            .respond([session]);

		$httpBackend.when('POST', '/api/v1/transects/3/annotation-sessions')
                    .respond(session);

        $httpBackend.when('PUT', '/api/v1/annotation-sessions/12')
                    .respond(200);

		$httpBackend.when('DELETE', '/api/v1/annotation-sessions/12')
		            .respond(200);
	}));

	afterEach(function() {
		$httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should show sessions of a transect', inject(function (AnnotationSession) {
        $httpBackend.expectGET('/api/v1/transects/3/annotation-sessions');
        var sessions = AnnotationSession.query({transect_id: 3}, function () {
            expect(sessions[0].id).toEqual(12);
        });
	}));

    it('should create an annotation session', inject(function (AnnotationSession) {
        $httpBackend.expectPOST('/api/v1/transects/3/annotation-sessions', {
            name: 'My new session'
        });
        var session = AnnotationSession.create({transect_id: 3}, {name: 'My new session'}, function () {
            expect(session.id).toEqual(12);
        });
    }));

	it('should update an annotation session', inject(function (AnnotationSession) {
		$httpBackend.expectPUT('/api/v1/annotation-sessions/12', {
			id: 12, name: 'My new session'
		});
        var sessions = AnnotationSession.query({transect_id: 3}, function () {
            var session = sessions[0];
            session.name = 'My new session';
            session.$save();
        });
	}));

    it('should update an annotation session directly', inject(function (AnnotationSession) {
        $httpBackend.expectPUT('/api/v1/annotation-sessions/12', {
            id: 12, name: 'My session'
        });
        AnnotationSession.save({id: 12, name: 'My session'});
    }));

    it('should delete an annotation session', inject(function (AnnotationSession) {
        $httpBackend.expectDELETE('/api/v1/annotation-sessions/12');
        var sessions = AnnotationSession.query({transect_id: 3}, function () {
            sessions[0].$delete();
        });
    }));

    it('should delete an annotation session directly', inject(function (AnnotationSession) {
        $httpBackend.expectDELETE('/api/v1/annotation-sessions/12');
        AnnotationSession.delete({id: 12});
    }));
});
