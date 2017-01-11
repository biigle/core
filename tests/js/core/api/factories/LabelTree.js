describe('The LabelTree resource factory', function () {
   var $httpBackend;

   beforeEach(module('biigle.api'));

    // mock URL constant which is set inline in the base template
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('URL', '');
        });
    });

   beforeEach(inject(function($injector) {
      var tree = {
         id: 1,
         name: "Test Label Tree",
         description: "Test Description",
         visibility_id: 1
      };

      // Set up the mock http service responses
      $httpBackend = $injector.get('$httpBackend');

      $httpBackend.when('GET', '/api/v1/label-trees')
                  .respond([tree]);

      $httpBackend.when('POST', '/api/v1/label-trees')
                  .respond(tree);

      $httpBackend.when('PUT', '/api/v1/label-trees/1')
                  .respond(200);

      $httpBackend.when('DELETE', '/api/v1/label-trees/1')
                  .respond(200);
   }));

   afterEach(function() {
      $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should query public label trees', inject(function (LabelTree) {
        $httpBackend.expectGET('/api/v1/label-trees');
        var trees = LabelTree.query(function () {
            var tree = trees[0];
            expect(tree instanceof LabelTree).toBe(true);
            expect(tree.id).toEqual(1);
            expect(tree.name).toEqual('Test Label Tree');
        });
   }));

   it('should create new label trees', inject(function (LabelTree) {
      $httpBackend.expectPOST('/api/v1/label-trees', {
            name: "Test Label Tree",
            visibility_id: 1
        });
      var tree = LabelTree.create({name: "Test Label Tree", visibility_id: 1}, function () {
         expect(tree.name).toEqual('Test Label Tree');
            expect(tree.visibility_id).toEqual(1);
         expect(tree.id).toBeDefined();
      });
   }));

   it('should update labek trees', inject(function (LabelTree) {
      $httpBackend.expectPUT('/api/v1/label-trees/1', {
            id: 1,
            name: "My Label Tree"
        });
      var tree = LabelTree.update({id: 1, name: 'My Label Tree'}, function () {
         expect(tree.name).toEqual('My Label Tree');
      });
   }));

   it('should delete label-trees', inject(function (LabelTree) {
      $httpBackend.expectDELETE('/api/v1/label-trees/1');
      LabelTree.delete({id: 1});
   }));
});
