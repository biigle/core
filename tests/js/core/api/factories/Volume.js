describe('The Volume resource factory', function () {
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

      $httpBackend.when('GET', '/api/v1/volumes/1')
                  .respond(volume);

      $httpBackend.when('PUT', '/api/v1/volumes/1')
                  .respond(200);
   }));

   afterEach(function() {
      $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should show a volume', inject(function (Volume) {
        $httpBackend.expectGET('/api/v1/volumes/1');
        var volume = Volume.get({id: 1}, function () {
            expect(volume.name).toEqual('volume 1');
        });
   }));

   it('should update a volume', inject(function (Volume) {
      $httpBackend.expectPUT('/api/v1/volumes/1',
         {id: 1, name: "my volume"}
      );
      var volume = Volume.get({id: 1}, function () {
         volume.name = "my volume";
         volume.$save();
      });

      $httpBackend.expectPUT('/api/v1/volumes/1',
         {id: 1, name: "my volume"}
      );
      Volume.save({id: 1, name: "my volume"});
   }));
});
