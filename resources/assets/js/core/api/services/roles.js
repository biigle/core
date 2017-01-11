/**
 * @namespace biigle.api
 * @ngdoc service
 * @name roles
 * @memberOf biigle.api
 * @description Wrapper service for the available roles
 * @example
var adminRoleId = role.getId('admin'); // 1
var adminRoleName = role.getName(1); // 'admin'
 */
angular.module('biigle.api').service('roles', function (Role) {
      "use strict";

      var roles = {};
      var rolesInverse = {};

      Role.query(function (r) {
         r.forEach(function (role) {
            roles[role.id] = role.name;
            rolesInverse[role.name] = role.id;
         });
      });

      this.getName = function (id) {
         return roles[id];
      };

      this.getId = function (name) {
         return rolesInverse[name];
      };
   }
);
