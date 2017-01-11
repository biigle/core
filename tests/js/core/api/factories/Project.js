describe('The Project resource factory', function () {
   var $httpBackend;

   beforeEach(module('biigle.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

   beforeEach(inject(function($injector) {
      var project = {
         id: 1,
         name: "Test Project",
         description: "",
         creator_id: 1
      };

      // Set up the mock http service responses
      $httpBackend = $injector.get('$httpBackend');

      $httpBackend.when('GET', '/api/v1/projects/my')
                  .respond([project]);

      $httpBackend.when('GET', '/api/v1/projects/1')
                  .respond(project);

      $httpBackend.when('POST', '/api/v1/projects')
                  .respond(project);

      $httpBackend.when('PUT', '/api/v1/projects/1')
                  .respond(200);

      $httpBackend.when('DELETE', '/api/v1/projects/1')
                  .respond(200);
   }));

   afterEach(function() {
      $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should query my projects', inject(function (Project) {
        $httpBackend.expectGET('/api/v1/projects/my');
        var projects = Project.query(function () {
            var project = projects[0];
            expect(project instanceof Project).toBe(true);
            expect(project.id).toEqual(1);
            expect(project.name).toEqual('Test Project');
        });
   }));

   it('should show a project', inject(function (Project) {
      $httpBackend.expectGET('/api/v1/projects/1');
      var project = Project.get({id: 1}, function () {
         expect(project.name).toEqual('Test Project');
      });
   }));

   it('should add new projects', inject(function (Project) {
      $httpBackend.expectPOST('/api/v1/projects', {name: "Test Project"});
      var project = Project.add({name: "Test Project"}, function () {
         expect(project.name).toEqual('Test Project');
         expect(project.id).toBeDefined();
      });
   }));

   it('should update projects', inject(function (Project) {
      $httpBackend.expectPUT('/api/v1/projects/1',
         {id:1, name: "My Project"}
      );
      var project = Project.get({id: 1}, function () {
         project.name = 'My Project';
         project.$save();
      });

      $httpBackend.expectPUT('/api/v1/projects/1', {id:1, name: "My Project"});
      var project = Project.save({id: 1, name: 'My Project'}, function () {
         expect(project.name).toEqual('My Project');
      });
   }));

   it('should delete projects', inject(function (Project) {
      $httpBackend.expectDELETE('/api/v1/projects/1');
      var project = Project.get({id: 1}, function () {
         project.$delete();
      });

      $httpBackend.expectDELETE('/api/v1/projects/1');
      Project.delete({id: 1});
   }));
});
