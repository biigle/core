describe('The LabelTreeUser resource factory', function () {
   var $httpBackend;

   beforeEach(module('biigle.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

   beforeEach(inject(function($injector) {
      // Set up the mock http service responses
      $httpBackend = $injector.get('$httpBackend');

      $httpBackend.when('PUT', '/api/v1/label-trees/1/users/1')
                  .respond(200);

      $httpBackend.when('POST', '/api/v1/label-trees/2/users')
                  .respond(200);

      $httpBackend.when('DELETE', '/api/v1/label-trees/1/users/1')
                  .respond(200);
   }));

   afterEach(function() {
      $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

   it('should update label tree users', inject(function (LabelTreeUser) {
      $httpBackend.expectPUT('/api/v1/label-trees/1/users/1',
         {id: 1, role_id: 1}
      );
      var user = LabelTreeUser.update({label_tree_id: 1},
         {id: 1, role_id: 1},
         function () {
            expect(user.role_id).toEqual(1);
            expect(user.id).toBeDefined();
         }
      );
   }));

   it('should attach users to projects', inject(function (LabelTreeUser) {
      $httpBackend.expectPOST('/api/v1/label-trees/2/users',
         {id: 1, role_id: 2}
      );

      LabelTreeUser.attach({label_tree_id: 2}, {id: 1, role_id: 2});
   }));

   it('should detach users from projects', inject(function (LabelTreeUser) {
      $httpBackend.expectDELETE('/api/v1/label-trees/1/users/1');
      LabelTreeUser.detach({label_tree_id: 1}, {id: 1});
   }));
});
