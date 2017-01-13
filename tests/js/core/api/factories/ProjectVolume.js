describe('The ProjectVolume resource factory', function () {
   var $httpBackend;

   beforeEach(module('biigle.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

   beforeEach(inject(function($injector) {
      var volume = {
         id: 1,
         name: "volume 1"
      };

      // Set up the mock http service responses
      $httpBackend = $injector.get('$httpBackend');

      $httpBackend.when('GET', '/api/v1/projects/1/volumes')
                  .respond([volume]);

      $httpBackend.when('POST', '/api/v1/projects/1/volumes')
                  .respond(volume);

      $httpBackend.when('POST', '/api/v1/projects/2/volumes/1')
                  .respond(200);

      $httpBackend.when('DELETE', '/api/v1/projects/1/volumes/1')
                  .respond(200);
   }));

    afterEach(function() {
      $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should query project volumes', inject(function (ProjectVolume) {
        $httpBackend.expectGET('/api/v1/projects/1/volumes');
        var volumes = ProjectVolume.query({ project_id: 1 }, function () {
            var volume = volumes[0];
            expect(volume instanceof ProjectVolume).toBe(true);
            expect(volume.id).toEqual(1);
            expect(volume.name).toEqual('volume 1');
        });
   }));

   it('should add new volumes projects', inject(function (ProjectVolume) {
      $httpBackend.expectPOST('/api/v1/projects/1/volumes',
         {name: "volume 1"}
      );
      var volume = ProjectVolume.add({project_id: 1},
         {name: "volume 1"},
         function () {
            expect(volume.name).toEqual('volume 1');
            expect(volume.id).toBeDefined();
         }
      );
   }));

   it('should attach existing volumes to projects', inject(function (ProjectVolume) {
      $httpBackend.expectPOST('/api/v1/projects/2/volumes/1');
      var volumes = ProjectVolume.query({ project_id: 1 }, function () {
         var volume = volumes[0];
         volume.$attach({project_id: 2});
      });

      $httpBackend.expectPOST('/api/v1/projects/2/volumes/1');
      ProjectVolume.attach({project_id: 2}, {id: 1});
   }));

   it('should detach volumes from projects', inject(function (ProjectVolume) {
      $httpBackend.expectDELETE('/api/v1/projects/1/volumes/1');
      var volumes = ProjectVolume.query({ project_id: 1 }, function () {
         var volume = volumes[0];
         volume.$detach({project_id: 1});
      });

      $httpBackend.expectDELETE('/api/v1/projects/1/volumes/1');
      ProjectVolume.detach({project_id: 1}, {id: 1});
   }));
});
