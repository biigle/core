/**
 * @namespace dias.api
 * @description The DIAS api AngularJS module.
 */
angular.module('dias.api', ['ngResource']);

angular.module('dias.api').config(["$httpProvider", function ($httpProvider) {
	"use strict";

	$httpProvider.defaults.headers.common["X-Requested-With"] =
		"XMLHttpRequest";
}]);

/**
 * @namespace dias.ui.messages
 * @description The DIAS user feedback messages AngularJS module.
 */
angular.module('dias.ui.messages', ['ui.bootstrap']);

// bootstrap the messages module
angular.element(document).ready(function () {
	"use strict";

	angular.bootstrap(
		document.querySelector('[data-ng-controller="MessagesController"]'),
		['dias.ui.messages']
	);
});

/**
 * @namespace dias.ui.users
 * @description The DIAS users UI AngularJS module.
 */
angular.module('dias.ui.users', ['ui.bootstrap', 'dias.api']);

/**
 * @namespace dias.ui.utils
 * @description The DIAS utils UI AngularJS module.
 */
angular.module('dias.ui.utils', []);

/**
 * @namespace dias.ui
 * @description The DIAS UI AngularJS module.
 */
angular.module('dias.ui', ['ui.bootstrap', 'dias.ui.messages', 'dias.ui.users', 'dias.ui.utils', 'ngAnimate']);


/**
 * @ngdoc constant
 * @name URL
 * @memberOf dias.api
 * @description The base url of the application.
 * @returns {String}
 *
 */
angular.module('dias.api').constant('URL', window.$diasBaseUrl || '');
/**
 * @ngdoc factory
 * @name Annotation
 * @memberOf dias.api
 * @description Provides the resource for annotations.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// retrieving the shape ID of an annotation
var annotation = Annotation.get({id: 123}, function () {
   console.log(annotation.shape_id);
});

// saving an annotation (updating the annotation points)
var annotation = Annotation.get({id: 1}, function () {
   annotation.points = [10, 10];
   annotation.$save();
});
// or directly
Annotation.save({
   id: 1, points: [10, 10]
});

// deleting an annotation
var annotation = Annotation.get({id: 123}, function () {
   annotation.$delete();
});
// or directly
Annotation.delete({id: 123});

// get all annotations of an image
// note, that the `id` is now the image ID and not the annotation ID for the
// query!
var annotations = Annotation.query({id: 1}, function () {
   console.log(annotations); // [{id: 1, shape_id: 1, ...}, ...]
});

// add a new annotation to an image
// note, that the `id` is now the image ID and not the annotation ID for the
// query!
var annotation = Annotation.add({
   id: 1,
   shape_id: 1,
   label_id: 1,
   confidence: 0.5
   points: [10, 20]
});
 *
 */
angular.module('dias.api').factory('Annotation', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/annotations/:id',
		{ id: '@id'	},
		{
			save: {
				method: 'PUT'
			},
			query: {
				method: 'GET',
                url: URL + '/api/v1/images/:id/annotations',
				isArray: true
			},
			add: {
				method: 'POST',
				url: URL + '/api/v1/images/:id/annotations',
			}
		});
}]);

/**
 * @ngdoc factory
 * @name AnnotationLabel
 * @memberOf dias.api
 * @description Provides the resource for annotation labels.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all labels of an annotation and update one of them
var labels = AnnotationLabel.query({annotation_id: 1}, function () {
   var label = labels[0];
   label.confidence = 0.9;
   label.$save();
});

// directly update a label
AnnotationLabel.save({confidence: 0.1, annotation_id: 1, id: 1});

// attach a new label to an annotation
var label = AnnotationLabel.attach({label_id: 1, confidence: 0.5, annotation_id: 1}, function () {
   console.log(label); // {id: 1, name: 'my label', user_id: 1, ...}
});


// detach a label
var labels = AnnotationLabel.query({annotation_id: 1}, function () {
   var label = labels[0];
   label.$delete();
});
// or directly
AnnotationLabel.delete({id: 1});
 *
 */
angular.module('dias.api').factory('AnnotationLabel', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/annotation-labels/:id', {
			id: '@id',
			annotation_id: '@annotation_id'
		}, {
			query: {
				method: 'GET',
                url: URL + '/api/v1/annotations/:annotation_id/labels',
				isArray: true
			},
			attach: {
				method: 'POST',
				url: URL + '/api/v1/annotations/:annotation_id/labels',
			},
			save: {
				method: 'PUT',
                params: {annotation_id: null}
			},
            delete: {
                method: 'DELETE',
                params: {annotation_id: null}
            }
	});
}]);

/**
 * @ngdoc factory
 * @name Image
 * @memberOf dias.api
 * @description Provides the resource for images. This resource is only for 
 * finding out which transect an image belongs to. The image files are
 * directly called from the API.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get an image
var image = Image.get({id: 1}, function () {
   console.log(image); // {id: 1, width: 1000, height: 750, transect: {...}, ...}
});
 *
 */
angular.module('dias.api').factory('Image', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/images/:id');
}]);
/**
 * @ngdoc factory
 * @name Label
 * @memberOf dias.api
 * @description Provides the resource for labels.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all labels
var labels = Label.query(function () {
   console.log(labels); // [{id: 1, name: "Benthic Object", ...}, ...]
});

// get one label
var label = Label.get({id: 1}, function () {
   console.log(label); // {id: 1, name: "Benthic Object", ...}
});

// create a new label
var label = Label.add({name: "Trash", parent_id: 1}, function () {
   console.log(label); // {id: 2, name: "Trash", parent_id: 1, ...}
});

// update a label
var label = Label.get({id: 1}, function () {
   label.name = 'Trash';
   label.$save();
});
// or directly
Label.save({id: 1, name: 'Trash'});

// delete a label
var label = Label.get({id: 1}, function () {
   label.$delete();
});
// or directly
Label.delete({id: 1});
 *
 */
angular.module('dias.api').factory('Label', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/labels/:id', { id: '@id' },
		{
			add: {method: 'POST' },
			save: { method: 'PUT' }
		}
	);
}]);
/**
 * @ngdoc factory
 * @name MediaType
 * @memberOf dias.api
 * @description Provides the resource for media types.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all media types
var mediaTypes = MediaType.query(function () {
   console.log(mediaTypes); // [{id: 1, name: "time-series"}, ...]
});

// get one media type
var mediaType = MediaType.get({id: 1}, function () {
   console.log(mediaType); // {id: 1, name: "time-series"}
});
 *
 */
angular.module('dias.api').factory('MediaType', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/media-types/:id', { id: '@id' });
}]);
/**
 * @ngdoc factory
 * @name OwnUser
 * @memberOf dias.api
 * @description Provides the resource for the logged in user.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// retrieving the username
var user = OwnUser.get(function () {
   console.log(user.firstname);
});

// changing the username
var user = OwnUser.get(function () {
   user.firstname == 'Joel';
   user.$save();
});
// or directly
OwnUser.save({firstname: 'Joel'});

// deleting the user
var user = OwnUser.get(function () {
   user.$delete();
});
// or directly
OwnUser.delete();
 * 
 */
angular.module('dias.api').factory('OwnUser', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/users/my', {}, {
		save: {method: 'PUT'}
	});
}]);
/**
 * @ngdoc factory
 * @name Project
 * @memberOf dias.api
 * @description Provides the resource for projects.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all projects, the current user belongs to
var projects = Project.query(function () {
   console.log(projects); // [{id: 1, name: "Test Project", ...}, ...]
});

// get one project
var project = Project.get({id: 1}, function () {
   console.log(project); // {id: 1, name: "Test Project", ...}
});

// create a new project
var project = Project.add({name: "My Project", description: "my project"},
   function () {
      console.log(project); // {id: 2, name: "My Project", ...}
   }
);

// update a project
var project = Project.get({id: 1}, function () {
   project.name = 'New Project';
   project.$save();
});
// or directly
Project.save({id: 1, name: 'New Project'});

// delete a project
var project = Project.get({id: 1}, function () {
   project.$delete();
});
// or directly
Project.delete({id: 1});
 *
 */
angular.module('dias.api').factory('Project', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/projects/:id', { id: '@id' },
		{
			// a user can only query their own projects
			query: { method: 'GET', params: { id: 'my' }, isArray: true },
			add: { method: 'POST' },
			save: { method: 'PUT' }
		}
	);
}]);
/**
 * @ngdoc factory
 * @name ProjectLabel
 * @memberOf dias.api
 * @description Provides the resource for labels belonging to a project.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all labels of the project with ID 1
var labels = ProjectLabel.query({ project_id: 1 }, function () {
   console.log(labels); // [{id: 1, name: "Coral", ...}, ...]
});
 *
 */
angular.module('dias.api').factory('ProjectLabel', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/projects/:project_id/labels', {project_id: '@project_id'});
}]);

/**
 * @ngdoc factory
 * @name ProjectTransect
 * @memberOf dias.api
 * @description Provides the resource for transects belonging to a project.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all transects of the project with ID 1
var transects = ProjectTransect.query({ project_id: 1 }, function () {
   console.log(transects); // [{id: 1, name: "transect 1", ...}, ...]
});

// add a new transect to the project with ID 1
var transect = ProjectTransect.add({project_id: 1},
   {
      name: "transect 1",
      url: "/vol/transects/1",
      media_type_id: 1,
      images: ["1.jpg", "2.jpg"]
   },
   function () {
      console.log(transect); // {id: 1, name: "transect 1", ...}
   }
);

// attach an existing transect to another project
var transects = ProjectTransect.query({ project_id: 1 }, function () {
   var transect = transects[0];
   // transect is now attached to project 1 *and* 2
   transect.$attach({project_id: 2});
});
// or directly (transect 1 will be attached to project 2)
ProjectTransect.attach({project_id: 2}, {id: 1});

// detach a transect from the project with ID 1
var transects = ProjectTransect.query({ project_id: 1 }, function () {
   var transect = transects[0];
   transect.$detach({project_id: 1});
});
// or directly
ProjectTransect.detach({project_id: 1}, {id: 1});

// attaching and detaching can be done using a Transect object as well:
var transect = Transect.get({id: 1}, function () {
   ProjectTransect.attach({project_id: 2}, transect);
});
 *
 */
angular.module('dias.api').factory('ProjectTransect', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/projects/:project_id/transects/:id',
		{ id: '@id' },
		{
			add: { method: 'POST' },
			attach: { method: 'POST' },
			detach: { method: 'DELETE' }
		}
	);
}]);
/**
 * @ngdoc factory
 * @name ProjectUser
 * @memberOf dias.api
 * @description Provides the resource for users belonging to a project.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all users of the project with ID 1
var users = ProjectUser.query({ project_id: 1 }, function () {
   console.log(users); // [{id: 1, firstname: "Jane", ...}, ...]
});

// update the project role of a user
ProjectUser.save({project_id: 1}, {id: 1, project_role_id: 1});

// attach a user to another project
ProjectUser.attach({project_id: 2}, {id: 1, project_role_id: 2});

// detach a user from the project with ID 1
var users = ProjectUser.query({ project_id: 1 }, function () {
   var user = users[0];
   user.$detach({project_id: 1});
});
// or directly
ProjectUser.detach({project_id: 1}, {id: 1});
 *
 */
angular.module('dias.api').factory('ProjectUser', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/projects/:project_id/users/:id',
		{ id: '@id' },
		{
			save: { method: 'PUT' },
			attach: { method: 'POST' },
			detach: { method: 'DELETE' }
		}
	);
}]);
/**
 * @ngdoc factory
 * @name Role
 * @memberOf dias.api
 * @description Provides the resource for roles.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all roles
var roles = Role.query(function () {
   console.log(roles); // [{id: 1, name: "admin"}, ...]
});

// get one role
var role = Role.get({id: 1}, function () {
   console.log(role); // {id: 1, name: "admin"}
});
 *
 */
angular.module('dias.api').factory('Role', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/roles/:id', { id: '@id' });
}]);
/**
 * @ngdoc factory
 * @name Shape
 * @memberOf dias.api
 * @description Provides the resource for shapes.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all shapes
var shapes = Shape.query(function () {
   console.log(shapes); // [{id: 1, name: "point"}, ...]
});

// get one shape
var shape = Shape.get({id: 1}, function () {
   console.log(shape); // {id: 1, name: "point"}
});
 *
 */
angular.module('dias.api').factory('Shape', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/shapes/:id', { id: '@id' });
}]);
/**
 * @ngdoc factory
 * @name Transect
 * @memberOf dias.api
 * @description Provides the resource for transects.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get one transect
var transect = Transect.get({id: 1}, function () {
   console.log(transect); // {id: 1, name: "transect 1"}
});

// update a transect
var transect = Transect.get({id: 1}, function () {
   transect.name = "my transect";
   transect.$save();
});
// or directly
Transect.save({id: 1, name: "my transect"});
 *
 */
angular.module('dias.api').factory('Transect', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/transects/:id',
		{ id: '@id' },
		{
			save: { method: 'PUT' }
		}
	);
}]);

/**
 * @ngdoc factory
 * @name TransectImage
 * @memberOf dias.api
 * @description Provides the resource for images of transects.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the IDs of all images of the transect with ID 1
var images = TransectImage.query({transect_id: 1}, function () {
   console.log(images); // [1, 12, 14, ...]
});
 *
 */
angular.module('dias.api').factory('TransectImage', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/transects/:transect_id/images');
}]);
/**
 * @ngdoc factory
 * @name User
 * @memberOf dias.api
 * @description Provides the resource for users.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get a list of all users
var users = User.query(function () {
   console.log(users); // [{id: 1, firstname: "Jane", ...}, ...]
});

// retrieving the username
var user = User.get({id: 1}, function () {
   console.log(user.firstname);
});

// creating a new user
var user = User.add(
   {
      email: 'my@mail.com',
      password: '123456pw',
      password_confirmation: '123456pw',
      firstname: 'jane',
      lastname: 'user'
   },
   function () {
      console.log(user); // {id: 1, firstname: 'jane', ...}
   }
);

// changing the username
var user = User.get({id: 1}, function () {
   user.firstname == 'Joel';
   user.$save();
});
// or directly
User.save({id: 1, firstname: 'Joel'});

// deleting the user
var user = User.get({id: 1}, function () {
   user.$delete();
});
// or directly
User.delete({id: 1});

// query for a username
var users = User.find({query: 'ja' }, function () {
   console.log(users); // [{id: 1, firstname: "jane", ...}, ...]
});
 * 
 */
angular.module('dias.api').factory('User', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/users/:id/:query', { id: '@id' }, {
		save: { method: 'PUT' },
		add: { method: 'POST' },
      find: { method: 'GET', params: { id: 'find' }, isArray: true }
	});
}]);
/**
 * @namespace dias.api
 * @ngdoc service
 * @name roles
 * @memberOf dias.api
 * @description Wrapper service for the available roles
 * @example
var adminRoleId = role.getId('admin'); // 1
var adminRoleName = role.getName(1); // 'admin'
 */
angular.module('dias.api').service('roles', ["Role", function (Role) {
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
	}]
);
/**
 * @namespace dias.api
 * @ngdoc service
 * @name shapes
 * @memberOf dias.api
 * @description Wrapper service for the available shapes
 * @example
var shapesArray = spahes.getAll(); // [{id: 1, name: 'Point'}, ...]
shapes.getId('Point'); // 1
shapes.getName(1); // 'Point'
 */
angular.module('dias.api').service('shapes', ["Shape", function (Shape) {
		"use strict";

		var shapes = {};
		var shapesInverse = {};

		var resources = Shape.query(function (s) {
			s.forEach(function (shape) {
				shapes[shape.id] = shape.name;
				shapesInverse[shape.name] = shape.id;
			});
		});

		this.getName = function (id) {
			return shapes[id];
		};

		this.getId = function (name) {
			return shapesInverse[name];
		};

		this.getAll = function () {
			return resources;
		};
	}]
);
/**
 * @namespace dias.ui.messages
 * @ngdoc controller
 * @name MessagesController
 * @memberOf dias.ui.messages
 * @description Handles the live display of user feedback messages via JS
 */
angular.module('dias.ui.messages').controller('MessagesController', ["$scope", "MAX_MSG", function ($scope, MAX_MSG) {
		"use strict";

		$scope.alerts = [];

        var closeFullscreen = function () {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        };

		// make method accessible by other modules
		window.$diasPostMessage = function (type, message) {
            closeFullscreen();
			$scope.$apply(function() {
				$scope.alerts.unshift({
					message: message,
					type: type || 'info'
				});

				if ($scope.alerts.length > MAX_MSG) {
					$scope.alerts.pop();
				}
			});
		};

		$scope.close = function (index) {
			$scope.alerts.splice(index, 1);
		};
	}]
);

/**
 * @ngdoc constant
 * @name MAX_MSG
 * @memberOf dias.ui.messages
 * @description The maximum number of info messages to display.
 * @returns {Integer}
 *
 */
angular.module('dias.ui.messages').constant('MAX_MSG', 1);
/**
 * @namespace dias.ui.utils
 * @ngdoc factory
 * @name filterExclude
 * @memberOf dias.ui.utils
 * @description Provides a function that removes all numbers of the first argument array (in place!) that are not present in the second argument array. Accepts a third argument boolean as to whether the second argument array is already sorted.
 */
angular.module('dias.ui.utils').factory('filterExclude', function () {
        "use strict";
        // comparison function for array.sort() with numbers
        var compareNumbers = function (a, b) {
            return a - b;
        };

        // returns the array containing only elements that are not present in superset
        // assumes that superset is sorted if sorted evaluates to true
        // doesn't change the ordering of elements in the subset array
        var filterExclude = function (subset, superset, sorted) {
            if (!sorted) {
                // clone array so sorting doesn't affect original
                superset = superset.slice(0).sort(compareNumbers);
            }
            // clone the input array (so it isn't changed by sorting), then sort it
            var sortedSubset = subset.slice(0).sort(compareNumbers);
            var i = 0, j = 0;
            while (i < superset.length && j < sortedSubset.length) {
                if (superset[i] < sortedSubset[j]) {
                    i++;
                } else if (superset[i] === sortedSubset[j]) {
                    // remove tha value that is both in subset and superset
                    subset.splice(subset.indexOf(sortedSubset[j]), 1);
                    i++;
                    j++;
                } else {
                    j++;
                }
            }
        };

        return filterExclude;
    }
);

/**
 * @namespace dias.ui.utils
 * @ngdoc factory
 * @name filterSubset
 * @memberOf dias.ui.utils
 * @description Provides a function that removes all numbers of the first argument array (in place!) that are not present in the second argument array. Accepts a third argument boolean as to whether the second argument array is already sorted.
 */
angular.module('dias.ui.utils').factory('filterSubset', function () {
        "use strict";
        // comparison function for array.sort() with numbers
        var compareNumbers = function (a, b) {
            return a - b;
        };

        // returns the subset array without the elements that are not present in superset
        // assumes that superset is sorted if sorted evaluates to true
        // doesn't change the ordering of elements in the subset array
        var filterSubset = function (subset, superset, sorted) {
            if (!sorted) {
                // clone array so sorting doesn't affect original
                superset = superset.slice(0).sort(compareNumbers);
            }
            // clone the input array (so it isn't changed by sorting), then sort it
            var sortedSubset = subset.slice(0).sort(compareNumbers);
            // here we will put all items of subset that are not present in superset
            var notThere = [];
            var i = 0, j = 0;
            while (i < superset.length && j < sortedSubset.length) {
                if (superset[i] < sortedSubset[j]) {
                    i++;
                } else if (superset[i] === sortedSubset[j]) {
                    i++;
                    j++;
                } else {
                    notThere.push(sortedSubset[j++]);
                }
            }
            // add possible missing items if sortedSubset is longer than superset
            while (j < sortedSubset.length) {
                notThere.push(sortedSubset[j++]);
            }

            // now remove all elements from subset that are not in superset
            // we do it this way because the notThere array will probably always be very small
            for (i = 0; i < notThere.length; i++) {
                // we can assume that indexOf is never <0
                subset.splice(subset.indexOf(notThere[i]), 1);
            }
        };

        return filterSubset;
    }
);

/**
 * @namespace dias.ui.messages
 * @ngdoc service
 * @name msg
 * @memberOf dias.ui.messages
 * @description Enables arbitrary AngularJS modules to post user feedback messages using the DIAS UI messaging system. See the [Bootstrap alerts](http://getbootstrap.com/components/#alerts) for available message types and their style. In addition to actively posting messages, it provides the `responseError` method to conveniently display error messages in case an AJAX request went wrong.
 * @example
msg.post('danger', 'Do you really want to delete this? Everything will be lost.');

msg.danger('Do you really want to delete this? Everything will be lost.');
msg.warning('Leaving the project is not reversible.');
msg.success('The project was created.');
msg.info('You will receive an email about this.');

var label = AnnotationLabel.attach({ ... });
// handles all error responses automatically
label.$promise.catch(msg.responseError);
 */
angular.module('dias.ui.messages').service('msg', function () {
        "use strict";
        var _this = this;

        this.post = function (type, message) {
            message = message || type;
            window.$diasPostMessage(type, message);
        };

        this.danger = function (message) {
            _this.post('danger', message);
        };

        this.warning = function (message) {
            _this.post('warning', message);
        };

        this.success = function (message) {
            _this.post('success', message);
        };

        this.info = function (message) {
            _this.post('info', message);
        };

        this.responseError = function (response) {
            var data = response.data;

            if (!data) {
                _this.danger("The server didn't respond, sorry.");
            } else if (data.message) {
                // error response
                _this.danger(data.message);
            } else if (response.status === 401) {
                _this.danger("Please log in (again).");
            } else if (typeof data === 'string') {
                // unknown error response
                _this.danger(data);
            } else {
                // validation response
                for (var key in data) {
                    _this.danger(data[key][0]);
                }
            }
        };
    }
);

/**
 * @namespace dias.ui.users
 * @ngdoc directive
 * @name userChooser
 * @memberOf dias.ui.users
 * @description An input field to find a user.
 * @example
// HTML
<input placeholder="Search by username" data-user-chooser="addUser" />

// Controller (example for adding a user to a project)
$scope.addUser = function (user) {
	// new users are guests by default
	var roleId = $scope.roles.guest;

	var success = function () {
		user.project_role_id = roleId;
		$scope.users.push(user);
	};

	// user shouldn't already exist
	if (!getUser(user.id)) {
		ProjectUser.attach(
			{project_id: $scope.projectId},
			{id: user.id, project_role_id: roleId},
			success, msg.responseError
		);
	}
};

 */
angular.module('dias.ui.users').directive('userChooser', function () {
		"use strict";

		return {
			restrict: 'A',

			scope: {
				select: '=userChooser'
			},

			replace: true,

			template: '<input type="text" data-ng-model="selected" data-uib-typeahead="name(user) for user in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

			controller: ["$scope", "User", function ($scope, User) {
                $scope.name = function (user) {
                    return user ? (user.firstname + ' ' + user.lastname) : '';
                };

				$scope.find = function (query) {
					return User.find({query: query}).$promise;
				};
			}]
		};
	}
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJhcGkvY29uc3RhbnRzL1VSTC5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbi5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbkxhYmVsLmpzIiwiYXBpL2ZhY3Rvcmllcy9JbWFnZS5qcyIsImFwaS9mYWN0b3JpZXMvTGFiZWwuanMiLCJhcGkvZmFjdG9yaWVzL01lZGlhVHlwZS5qcyIsImFwaS9mYWN0b3JpZXMvT3duVXNlci5qcyIsImFwaS9mYWN0b3JpZXMvUHJvamVjdC5qcyIsImFwaS9mYWN0b3JpZXMvUHJvamVjdExhYmVsLmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0VHJhbnNlY3QuanMiLCJhcGkvZmFjdG9yaWVzL1Byb2plY3RVc2VyLmpzIiwiYXBpL2ZhY3Rvcmllcy9Sb2xlLmpzIiwiYXBpL2ZhY3Rvcmllcy9TaGFwZS5qcyIsImFwaS9mYWN0b3JpZXMvVHJhbnNlY3QuanMiLCJhcGkvZmFjdG9yaWVzL1RyYW5zZWN0SW1hZ2UuanMiLCJhcGkvZmFjdG9yaWVzL1VzZXIuanMiLCJhcGkvc2VydmljZXMvcm9sZXMuanMiLCJhcGkvc2VydmljZXMvc2hhcGVzLmpzIiwidWkvbWVzc2FnZXMvY29udHJvbGxlci9NZXNzYWdlc0NvbnRyb2xsZXIuanMiLCJ1aS9tZXNzYWdlcy9jb25zdGFudHMvTUFYX01TRy5qcyIsInVpL3V0aWxzL2ZhY3Rvcmllcy9maWx0ZXJFeGNsdWRlLmpzIiwidWkvdXRpbHMvZmFjdG9yaWVzL2ZpbHRlclN1YnNldC5qcyIsInVpL21lc3NhZ2VzL3NlcnZpY2VzL21zZy5qcyIsInVpL3VzZXJzL2RpcmVjdGl2ZXMvdXNlckNob29zZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsWUFBQSxDQUFBOztBQUVBLFFBQUEsT0FBQSxZQUFBLHlCQUFBLFVBQUEsZUFBQTtDQUNBOztDQUVBLGNBQUEsU0FBQSxRQUFBLE9BQUE7RUFDQTs7Ozs7OztBQU9BLFFBQUEsT0FBQSxvQkFBQSxDQUFBOzs7QUFHQSxRQUFBLFFBQUEsVUFBQSxNQUFBLFlBQUE7Q0FDQTs7Q0FFQSxRQUFBO0VBQ0EsU0FBQSxjQUFBO0VBQ0EsQ0FBQTs7Ozs7Ozs7QUFRQSxRQUFBLE9BQUEsaUJBQUEsQ0FBQSxnQkFBQTs7Ozs7O0FBTUEsUUFBQSxPQUFBLGlCQUFBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsV0FBQSxDQUFBLGdCQUFBLG9CQUFBLGlCQUFBLGlCQUFBOzs7Ozs7Ozs7OztBQ3JDQSxRQUFBLE9BQUEsWUFBQSxTQUFBLE9BQUEsT0FBQSxnQkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN5Q0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxtQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBO0VBQ0EsRUFBQSxJQUFBO0VBQ0E7R0FDQSxNQUFBO0lBQ0EsUUFBQTs7R0FFQSxPQUFBO0lBQ0EsUUFBQTtnQkFDQSxLQUFBLE1BQUE7SUFDQSxTQUFBOztHQUVBLEtBQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxNQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2hDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsaUNBQUE7R0FDQSxJQUFBO0dBQ0EsZUFBQTtLQUNBO0dBQ0EsT0FBQTtJQUNBLFFBQUE7Z0JBQ0EsS0FBQSxNQUFBO0lBQ0EsU0FBQTs7R0FFQSxRQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsTUFBQTs7R0FFQSxNQUFBO0lBQ0EsUUFBQTtnQkFDQSxRQUFBLENBQUEsZUFBQTs7WUFFQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQSxDQUFBLGVBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3ZDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDhCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDb0JBLFFBQUEsT0FBQSxZQUFBLFFBQUEsOEJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxzQkFBQSxFQUFBLElBQUE7RUFDQTtHQUNBLEtBQUEsQ0FBQSxRQUFBO0dBQ0EsTUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDMUJBLFFBQUEsT0FBQSxZQUFBLFFBQUEsa0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSwyQkFBQSxFQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNPQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsb0JBQUEsSUFBQTtFQUNBLE1BQUEsQ0FBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ1FBLFFBQUEsT0FBQSxZQUFBLFFBQUEsZ0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSx3QkFBQSxFQUFBLElBQUE7RUFDQTs7R0FFQSxPQUFBLEVBQUEsUUFBQSxPQUFBLFFBQUEsRUFBQSxJQUFBLFFBQUEsU0FBQTtHQUNBLEtBQUEsRUFBQSxRQUFBO0dBQ0EsTUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ25DQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHFDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsdUNBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDZ0NBLFFBQUEsT0FBQSxZQUFBLFFBQUEsd0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTtFQUNBLEVBQUEsSUFBQTtFQUNBO0dBQ0EsS0FBQSxFQUFBLFFBQUE7R0FDQSxRQUFBLEVBQUEsUUFBQTtHQUNBLFFBQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzdCQSxRQUFBLE9BQUEsWUFBQSxRQUFBLG9DQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7RUFDQSxFQUFBLElBQUE7RUFDQTtHQUNBLE1BQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7R0FDQSxRQUFBLEVBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNqQkEsUUFBQSxPQUFBLFlBQUEsUUFBQSw2QkFBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLHFCQUFBLEVBQUEsSUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDSEEsUUFBQSxPQUFBLFlBQUEsUUFBQSw4QkFBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLHNCQUFBLEVBQUEsSUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUEsUUFBQSxPQUFBLFlBQUEsUUFBQSxpQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBO0VBQ0EsRUFBQSxJQUFBO0VBQ0E7R0FDQSxNQUFBLEVBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2RBLFFBQUEsT0FBQSxZQUFBLFFBQUEsc0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ29DQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDZCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsNEJBQUEsRUFBQSxJQUFBLFNBQUE7RUFDQSxNQUFBLEVBQUEsUUFBQTtFQUNBLEtBQUEsRUFBQSxRQUFBO01BQ0EsTUFBQSxFQUFBLFFB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LEtBQUEsS0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM1QkEsUUFBQSxPQUFBLGlCQUFBLFVBQUEsZUFBQSxZQUFBO0VBQ0E7O0VBRUEsT0FBQTtHQUNBLFVBQUE7O0dBRUEsT0FBQTtJQUNBLFFBQUE7OztHQUdBLFNBQUE7O0dBRUEsVUFBQTs7R0FFQSwrQkFBQSxVQUFBLFFBQUEsTUFBQTtnQkFDQSxPQUFBLE9BQUEsVUFBQSxNQUFBO29CQUNBLE9BQUEsUUFBQSxLQUFBLFlBQUEsTUFBQSxLQUFBLFlBQUE7OztJQUdBLE9BQUEsT0FBQSxVQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsS0FBQSxDQUFBLE9BQUEsUUFBQTs7Ozs7O0FBTUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIGFwaSBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknLCBbJ25nUmVzb3VyY2UnXSk7XG5cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uW1wiWC1SZXF1ZXN0ZWQtV2l0aFwiXSA9XG5cdFx0XCJYTUxIdHRwUmVxdWVzdFwiO1xufSk7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdXNlciBmZWVkYmFjayBtZXNzYWdlcyBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS5tZXNzYWdlcycsIFsndWkuYm9vdHN0cmFwJ10pO1xuXG4vLyBib290c3RyYXAgdGhlIG1lc3NhZ2VzIG1vZHVsZVxuYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdGFuZ3VsYXIuYm9vdHN0cmFwKFxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW5nLWNvbnRyb2xsZXI9XCJNZXNzYWdlc0NvbnRyb2xsZXJcIl0nKSxcblx0XHRbJ2RpYXMudWkubWVzc2FnZXMnXVxuXHQpO1xufSk7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLnVzZXJzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdXNlcnMgVUkgQW5ndWxhckpTIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkudXNlcnMnLCBbJ3VpLmJvb3RzdHJhcCcsICdkaWFzLmFwaSddKTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkudXRpbHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB1dGlscyBVSSBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS51dGlscycsIFtdKTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWlcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBVSSBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aScsIFsndWkuYm9vdHN0cmFwJywgJ2RpYXMudWkubWVzc2FnZXMnLCAnZGlhcy51aS51c2VycycsICdkaWFzLnVpLnV0aWxzJywgJ25nQW5pbWF0ZSddKTtcblxuIiwiLyoqXG4gKiBAbmdkb2MgY29uc3RhbnRcbiAqIEBuYW1lIFVSTFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gVGhlIGJhc2UgdXJsIG9mIHRoZSBhcHBsaWNhdGlvbi5cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5jb25zdGFudCgnVVJMJywgd2luZG93LiRkaWFzQmFzZVVybCB8fCAnJyk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgQW5ub3RhdGlvblxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBhbm5vdGF0aW9ucy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gcmV0cmlldmluZyB0aGUgc2hhcGUgSUQgb2YgYW4gYW5ub3RhdGlvblxudmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmdldCh7aWQ6IDEyM30sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGFubm90YXRpb24uc2hhcGVfaWQpO1xufSk7XG5cbi8vIHNhdmluZyBhbiBhbm5vdGF0aW9uICh1cGRhdGluZyB0aGUgYW5ub3RhdGlvbiBwb2ludHMpXG52YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGFubm90YXRpb24ucG9pbnRzID0gWzEwLCAxMF07XG4gICBhbm5vdGF0aW9uLiRzYXZlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Bbm5vdGF0aW9uLnNhdmUoe1xuICAgaWQ6IDEsIHBvaW50czogWzEwLCAxMF1cbn0pO1xuXG4vLyBkZWxldGluZyBhbiBhbm5vdGF0aW9uXG52YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uZ2V0KHtpZDogMTIzfSwgZnVuY3Rpb24gKCkge1xuICAgYW5ub3RhdGlvbi4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Bbm5vdGF0aW9uLmRlbGV0ZSh7aWQ6IDEyM30pO1xuXG4vLyBnZXQgYWxsIGFubm90YXRpb25zIG9mIGFuIGltYWdlXG4vLyBub3RlLCB0aGF0IHRoZSBgaWRgIGlzIG5vdyB0aGUgaW1hZ2UgSUQgYW5kIG5vdCB0aGUgYW5ub3RhdGlvbiBJRCBmb3IgdGhlXG4vLyBxdWVyeSFcbnZhciBhbm5vdGF0aW9ucyA9IEFubm90YXRpb24ucXVlcnkoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coYW5ub3RhdGlvbnMpOyAvLyBbe2lkOiAxLCBzaGFwZV9pZDogMSwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGFkZCBhIG5ldyBhbm5vdGF0aW9uIHRvIGFuIGltYWdlXG4vLyBub3RlLCB0aGF0IHRoZSBgaWRgIGlzIG5vdyB0aGUgaW1hZ2UgSUQgYW5kIG5vdCB0aGUgYW5ub3RhdGlvbiBJRCBmb3IgdGhlXG4vLyBxdWVyeSFcbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5hZGQoe1xuICAgaWQ6IDEsXG4gICBzaGFwZV9pZDogMSxcbiAgIGxhYmVsX2lkOiAxLFxuICAgY29uZmlkZW5jZTogMC41XG4gICBwb2ludHM6IFsxMCwgMjBdXG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0Fubm90YXRpb24nLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9hbm5vdGF0aW9ucy86aWQnLFxuXHRcdHsgaWQ6ICdAaWQnXHR9LFxuXHRcdHtcblx0XHRcdHNhdmU6IHtcblx0XHRcdFx0bWV0aG9kOiAnUFVUJ1xuXHRcdFx0fSxcblx0XHRcdHF1ZXJ5OiB7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBVUkwgKyAnL2FwaS92MS9pbWFnZXMvOmlkL2Fubm90YXRpb25zJyxcblx0XHRcdFx0aXNBcnJheTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGFkZDoge1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBVUkwgKyAnL2FwaS92MS9pbWFnZXMvOmlkL2Fubm90YXRpb25zJyxcblx0XHRcdH1cblx0XHR9KTtcbn0pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgQW5ub3RhdGlvbkxhYmVsXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGFubm90YXRpb24gbGFiZWxzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIGxhYmVscyBvZiBhbiBhbm5vdGF0aW9uIGFuZCB1cGRhdGUgb25lIG9mIHRoZW1cbnZhciBsYWJlbHMgPSBBbm5vdGF0aW9uTGFiZWwucXVlcnkoe2Fubm90YXRpb25faWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgbGFiZWwgPSBsYWJlbHNbMF07XG4gICBsYWJlbC5jb25maWRlbmNlID0gMC45O1xuICAgbGFiZWwuJHNhdmUoKTtcbn0pO1xuXG4vLyBkaXJlY3RseSB1cGRhdGUgYSBsYWJlbFxuQW5ub3RhdGlvbkxhYmVsLnNhdmUoe2NvbmZpZGVuY2U6IDAuMSwgYW5ub3RhdGlvbl9pZDogMSwgaWQ6IDF9KTtcblxuLy8gYXR0YWNoIGEgbmV3IGxhYmVsIHRvIGFuIGFubm90YXRpb25cbnZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goe2xhYmVsX2lkOiAxLCBjb25maWRlbmNlOiAwLjUsIGFubm90YXRpb25faWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbCk7IC8vIHtpZDogMSwgbmFtZTogJ215IGxhYmVsJywgdXNlcl9pZDogMSwgLi4ufVxufSk7XG5cblxuLy8gZGV0YWNoIGEgbGFiZWxcbnZhciBsYWJlbHMgPSBBbm5vdGF0aW9uTGFiZWwucXVlcnkoe2Fubm90YXRpb25faWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgbGFiZWwgPSBsYWJlbHNbMF07XG4gICBsYWJlbC4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Bbm5vdGF0aW9uTGFiZWwuZGVsZXRlKHtpZDogMX0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnQW5ub3RhdGlvbkxhYmVsJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvYW5ub3RhdGlvbi1sYWJlbHMvOmlkJywge1xuXHRcdFx0aWQ6ICdAaWQnLFxuXHRcdFx0YW5ub3RhdGlvbl9pZDogJ0Bhbm5vdGF0aW9uX2lkJ1xuXHRcdH0sIHtcblx0XHRcdHF1ZXJ5OiB7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBVUkwgKyAnL2FwaS92MS9hbm5vdGF0aW9ucy86YW5ub3RhdGlvbl9pZC9sYWJlbHMnLFxuXHRcdFx0XHRpc0FycmF5OiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YXR0YWNoOiB7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHR1cmw6IFVSTCArICcvYXBpL3YxL2Fubm90YXRpb25zLzphbm5vdGF0aW9uX2lkL2xhYmVscycsXG5cdFx0XHR9LFxuXHRcdFx0c2F2ZToge1xuXHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHBhcmFtczoge2Fubm90YXRpb25faWQ6IG51bGx9XG5cdFx0XHR9LFxuICAgICAgICAgICAgZGVsZXRlOiB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHthbm5vdGF0aW9uX2lkOiBudWxsfVxuICAgICAgICAgICAgfVxuXHR9KTtcbn0pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgSW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgaW1hZ2VzLiBUaGlzIHJlc291cmNlIGlzIG9ubHkgZm9yIFxuICogZmluZGluZyBvdXQgd2hpY2ggdHJhbnNlY3QgYW4gaW1hZ2UgYmVsb25ncyB0by4gVGhlIGltYWdlIGZpbGVzIGFyZVxuICogZGlyZWN0bHkgY2FsbGVkIGZyb20gdGhlIEFQSS5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFuIGltYWdlXG52YXIgaW1hZ2UgPSBJbWFnZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coaW1hZ2UpOyAvLyB7aWQ6IDEsIHdpZHRoOiAxMDAwLCBoZWlnaHQ6IDc1MCwgdHJhbnNlY3Q6IHsuLi59LCAuLi59XG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0ltYWdlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvaW1hZ2VzLzppZCcpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgTGFiZWxcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgbGFiZWxzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIGxhYmVsc1xudmFyIGxhYmVscyA9IExhYmVsLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGxhYmVscyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwiQmVudGhpYyBPYmplY3RcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgbGFiZWxcbnZhciBsYWJlbCA9IExhYmVsLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbCk7IC8vIHtpZDogMSwgbmFtZTogXCJCZW50aGljIE9iamVjdFwiLCAuLi59XG59KTtcblxuLy8gY3JlYXRlIGEgbmV3IGxhYmVsXG52YXIgbGFiZWwgPSBMYWJlbC5hZGQoe25hbWU6IFwiVHJhc2hcIiwgcGFyZW50X2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWwpOyAvLyB7aWQ6IDIsIG5hbWU6IFwiVHJhc2hcIiwgcGFyZW50X2lkOiAxLCAuLi59XG59KTtcblxuLy8gdXBkYXRlIGEgbGFiZWxcbnZhciBsYWJlbCA9IExhYmVsLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBsYWJlbC5uYW1lID0gJ1RyYXNoJztcbiAgIGxhYmVsLiRzYXZlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5MYWJlbC5zYXZlKHtpZDogMSwgbmFtZTogJ1RyYXNoJ30pO1xuXG4vLyBkZWxldGUgYSBsYWJlbFxudmFyIGxhYmVsID0gTGFiZWwuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGxhYmVsLiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbkxhYmVsLmRlbGV0ZSh7aWQ6IDF9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0xhYmVsJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvbGFiZWxzLzppZCcsIHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0YWRkOiB7bWV0aG9kOiAnUE9TVCcgfSxcblx0XHRcdHNhdmU6IHsgbWV0aG9kOiAnUFVUJyB9XG5cdFx0fVxuXHQpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgTWVkaWFUeXBlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIG1lZGlhIHR5cGVzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIG1lZGlhIHR5cGVzXG52YXIgbWVkaWFUeXBlcyA9IE1lZGlhVHlwZS5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhtZWRpYVR5cGVzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJ0aW1lLXNlcmllc1wifSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgbWVkaWEgdHlwZVxudmFyIG1lZGlhVHlwZSA9IE1lZGlhVHlwZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobWVkaWFUeXBlKTsgLy8ge2lkOiAxLCBuYW1lOiBcInRpbWUtc2VyaWVzXCJ9XG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ01lZGlhVHlwZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL21lZGlhLXR5cGVzLzppZCcsIHsgaWQ6ICdAaWQnIH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgT3duVXNlclxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0aGUgbG9nZ2VkIGluIHVzZXIuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIHJldHJpZXZpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IE93blVzZXIuZ2V0KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXIuZmlyc3RuYW1lKTtcbn0pO1xuXG4vLyBjaGFuZ2luZyB0aGUgdXNlcm5hbWVcbnZhciB1c2VyID0gT3duVXNlci5nZXQoZnVuY3Rpb24gKCkge1xuICAgdXNlci5maXJzdG5hbWUgPT0gJ0pvZWwnO1xuICAgdXNlci4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuT3duVXNlci5zYXZlKHtmaXJzdG5hbWU6ICdKb2VsJ30pO1xuXG4vLyBkZWxldGluZyB0aGUgdXNlclxudmFyIHVzZXIgPSBPd25Vc2VyLmdldChmdW5jdGlvbiAoKSB7XG4gICB1c2VyLiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbk93blVzZXIuZGVsZXRlKCk7XG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnT3duVXNlcicsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3VzZXJzL215Jywge30sIHtcblx0XHRzYXZlOiB7bWV0aG9kOiAnUFVUJ31cblx0fSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBQcm9qZWN0XG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHByb2plY3RzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHByb2plY3RzLCB0aGUgY3VycmVudCB1c2VyIGJlbG9uZ3MgdG9cbnZhciBwcm9qZWN0cyA9IFByb2plY3QucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cocHJvamVjdHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcIlRlc3QgUHJvamVjdFwiLCAuLi59LCAuLi5dXG59KTtcblxuLy8gZ2V0IG9uZSBwcm9qZWN0XG52YXIgcHJvamVjdCA9IFByb2plY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHByb2plY3QpOyAvLyB7aWQ6IDEsIG5hbWU6IFwiVGVzdCBQcm9qZWN0XCIsIC4uLn1cbn0pO1xuXG4vLyBjcmVhdGUgYSBuZXcgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmFkZCh7bmFtZTogXCJNeSBQcm9qZWN0XCIsIGRlc2NyaXB0aW9uOiBcIm15IHByb2plY3RcIn0sXG4gICBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyhwcm9qZWN0KTsgLy8ge2lkOiAyLCBuYW1lOiBcIk15IFByb2plY3RcIiwgLi4ufVxuICAgfVxuKTtcblxuLy8gdXBkYXRlIGEgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBwcm9qZWN0Lm5hbWUgPSAnTmV3IFByb2plY3QnO1xuICAgcHJvamVjdC4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdC5zYXZlKHtpZDogMSwgbmFtZTogJ05ldyBQcm9qZWN0J30pO1xuXG4vLyBkZWxldGUgYSBwcm9qZWN0XG52YXIgcHJvamVjdCA9IFByb2plY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHByb2plY3QuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdC5kZWxldGUoe2lkOiAxfSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdQcm9qZWN0JywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcHJvamVjdHMvOmlkJywgeyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHQvLyBhIHVzZXIgY2FuIG9ubHkgcXVlcnkgdGhlaXIgb3duIHByb2plY3RzXG5cdFx0XHRxdWVyeTogeyBtZXRob2Q6ICdHRVQnLCBwYXJhbXM6IHsgaWQ6ICdteScgfSwgaXNBcnJheTogdHJ1ZSB9LFxuXHRcdFx0YWRkOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFByb2plY3RMYWJlbFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBsYWJlbHMgYmVsb25naW5nIHRvIGEgcHJvamVjdC5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBsYWJlbHMgb2YgdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgbGFiZWxzID0gUHJvamVjdExhYmVsLnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcIkNvcmFsXCIsIC4uLn0sIC4uLl1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUHJvamVjdExhYmVsJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcHJvamVjdHMvOnByb2plY3RfaWQvbGFiZWxzJywge3Byb2plY3RfaWQ6ICdAcHJvamVjdF9pZCd9KTtcbn0pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgUHJvamVjdFRyYW5zZWN0XG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHRyYW5zZWN0cyBiZWxvbmdpbmcgdG8gYSBwcm9qZWN0LlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHRyYW5zZWN0cyBvZiB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciB0cmFuc2VjdHMgPSBQcm9qZWN0VHJhbnNlY3QucXVlcnkoeyBwcm9qZWN0X2lkOiAxIH0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHRyYW5zZWN0cyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwidHJhbnNlY3QgMVwiLCAuLi59LCAuLi5dXG59KTtcblxuLy8gYWRkIGEgbmV3IHRyYW5zZWN0IHRvIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHRyYW5zZWN0ID0gUHJvamVjdFRyYW5zZWN0LmFkZCh7cHJvamVjdF9pZDogMX0sXG4gICB7XG4gICAgICBuYW1lOiBcInRyYW5zZWN0IDFcIixcbiAgICAgIHVybDogXCIvdm9sL3RyYW5zZWN0cy8xXCIsXG4gICAgICBtZWRpYV90eXBlX2lkOiAxLFxuICAgICAgaW1hZ2VzOiBbXCIxLmpwZ1wiLCBcIjIuanBnXCJdXG4gICB9LFxuICAgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2codHJhbnNlY3QpOyAvLyB7aWQ6IDEsIG5hbWU6IFwidHJhbnNlY3QgMVwiLCAuLi59XG4gICB9XG4pO1xuXG4vLyBhdHRhY2ggYW4gZXhpc3RpbmcgdHJhbnNlY3QgdG8gYW5vdGhlciBwcm9qZWN0XG52YXIgdHJhbnNlY3RzID0gUHJvamVjdFRyYW5zZWN0LnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgdHJhbnNlY3QgPSB0cmFuc2VjdHNbMF07XG4gICAvLyB0cmFuc2VjdCBpcyBub3cgYXR0YWNoZWQgdG8gcHJvamVjdCAxICphbmQqIDJcbiAgIHRyYW5zZWN0LiRhdHRhY2goe3Byb2plY3RfaWQ6IDJ9KTtcbn0pO1xuLy8gb3IgZGlyZWN0bHkgKHRyYW5zZWN0IDEgd2lsbCBiZSBhdHRhY2hlZCB0byBwcm9qZWN0IDIpXG5Qcm9qZWN0VHJhbnNlY3QuYXR0YWNoKHtwcm9qZWN0X2lkOiAyfSwge2lkOiAxfSk7XG5cbi8vIGRldGFjaCBhIHRyYW5zZWN0IGZyb20gdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdHJhbnNlY3RzID0gUHJvamVjdFRyYW5zZWN0LnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgdHJhbnNlY3QgPSB0cmFuc2VjdHNbMF07XG4gICB0cmFuc2VjdC4kZGV0YWNoKHtwcm9qZWN0X2lkOiAxfSk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Qcm9qZWN0VHJhbnNlY3QuZGV0YWNoKHtwcm9qZWN0X2lkOiAxfSwge2lkOiAxfSk7XG5cbi8vIGF0dGFjaGluZyBhbmQgZGV0YWNoaW5nIGNhbiBiZSBkb25lIHVzaW5nIGEgVHJhbnNlY3Qgb2JqZWN0IGFzIHdlbGw6XG52YXIgdHJhbnNlY3QgPSBUcmFuc2VjdC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgUHJvamVjdFRyYW5zZWN0LmF0dGFjaCh7cHJvamVjdF9pZDogMn0sIHRyYW5zZWN0KTtcbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUHJvamVjdFRyYW5zZWN0JywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcHJvamVjdHMvOnByb2plY3RfaWQvdHJhbnNlY3RzLzppZCcsXG5cdFx0eyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHRhZGQ6IHsgbWV0aG9kOiAnUE9TVCcgfSxcblx0XHRcdGF0dGFjaDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0ZGV0YWNoOiB7IG1ldGhvZDogJ0RFTEVURScgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFByb2plY3RVc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHVzZXJzIGJlbG9uZ2luZyB0byBhIHByb2plY3QuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgdXNlcnMgb2YgdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdXNlcnMgPSBQcm9qZWN0VXNlci5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2codXNlcnMpOyAvLyBbe2lkOiAxLCBmaXJzdG5hbWU6IFwiSmFuZVwiLCAuLi59LCAuLi5dXG59KTtcblxuLy8gdXBkYXRlIHRoZSBwcm9qZWN0IHJvbGUgb2YgYSB1c2VyXG5Qcm9qZWN0VXNlci5zYXZlKHtwcm9qZWN0X2lkOiAxfSwge2lkOiAxLCBwcm9qZWN0X3JvbGVfaWQ6IDF9KTtcblxuLy8gYXR0YWNoIGEgdXNlciB0byBhbm90aGVyIHByb2plY3RcblByb2plY3RVc2VyLmF0dGFjaCh7cHJvamVjdF9pZDogMn0sIHtpZDogMSwgcHJvamVjdF9yb2xlX2lkOiAyfSk7XG5cbi8vIGRldGFjaCBhIHVzZXIgZnJvbSB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciB1c2VycyA9IFByb2plY3RVc2VyLnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgdXNlciA9IHVzZXJzWzBdO1xuICAgdXNlci4kZGV0YWNoKHtwcm9qZWN0X2lkOiAxfSk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Qcm9qZWN0VXNlci5kZXRhY2goe3Byb2plY3RfaWQ6IDF9LCB7aWQ6IDF9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1Byb2plY3RVc2VyJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcHJvamVjdHMvOnByb2plY3RfaWQvdXNlcnMvOmlkJyxcblx0XHR7IGlkOiAnQGlkJyB9LFxuXHRcdHtcblx0XHRcdHNhdmU6IHsgbWV0aG9kOiAnUFVUJyB9LFxuXHRcdFx0YXR0YWNoOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRkZXRhY2g6IHsgbWV0aG9kOiAnREVMRVRFJyB9XG5cdFx0fVxuXHQpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgUm9sZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciByb2xlcy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCByb2xlc1xudmFyIHJvbGVzID0gUm9sZS5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhyb2xlcyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwiYWRtaW5cIn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIHJvbGVcbnZhciByb2xlID0gUm9sZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cocm9sZSk7IC8vIHtpZDogMSwgbmFtZTogXCJhZG1pblwifVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdSb2xlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcm9sZXMvOmlkJywgeyBpZDogJ0BpZCcgfSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBTaGFwZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBzaGFwZXMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgc2hhcGVzXG52YXIgc2hhcGVzID0gU2hhcGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coc2hhcGVzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJwb2ludFwifSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgc2hhcGVcbnZhciBzaGFwZSA9IFNoYXBlLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhzaGFwZSk7IC8vIHtpZDogMSwgbmFtZTogXCJwb2ludFwifVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdTaGFwZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3NoYXBlcy86aWQnLCB7IGlkOiAnQGlkJyB9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFRyYW5zZWN0XG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHRyYW5zZWN0cy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IG9uZSB0cmFuc2VjdFxudmFyIHRyYW5zZWN0ID0gVHJhbnNlY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHRyYW5zZWN0KTsgLy8ge2lkOiAxLCBuYW1lOiBcInRyYW5zZWN0IDFcIn1cbn0pO1xuXG4vLyB1cGRhdGUgYSB0cmFuc2VjdFxudmFyIHRyYW5zZWN0ID0gVHJhbnNlY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHRyYW5zZWN0Lm5hbWUgPSBcIm15IHRyYW5zZWN0XCI7XG4gICB0cmFuc2VjdC4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuVHJhbnNlY3Quc2F2ZSh7aWQ6IDEsIG5hbWU6IFwibXkgdHJhbnNlY3RcIn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnVHJhbnNlY3QnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS90cmFuc2VjdHMvOmlkJyxcblx0XHR7IGlkOiAnQGlkJyB9LFxuXHRcdHtcblx0XHRcdHNhdmU6IHsgbWV0aG9kOiAnUFVUJyB9XG5cdFx0fVxuXHQpO1xufSk7XG4iLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBUcmFuc2VjdEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGltYWdlcyBvZiB0cmFuc2VjdHMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCB0aGUgSURzIG9mIGFsbCBpbWFnZXMgb2YgdGhlIHRyYW5zZWN0IHdpdGggSUQgMVxudmFyIGltYWdlcyA9IFRyYW5zZWN0SW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coaW1hZ2VzKTsgLy8gWzEsIDEyLCAxNCwgLi4uXVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdUcmFuc2VjdEltYWdlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvdHJhbnNlY3RzLzp0cmFuc2VjdF9pZC9pbWFnZXMnKTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFVzZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgdXNlcnMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhIGxpc3Qgb2YgYWxsIHVzZXJzXG52YXIgdXNlcnMgPSBVc2VyLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXJzKTsgLy8gW3tpZDogMSwgZmlyc3RuYW1lOiBcIkphbmVcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIHJldHJpZXZpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IFVzZXIuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXIuZmlyc3RuYW1lKTtcbn0pO1xuXG4vLyBjcmVhdGluZyBhIG5ldyB1c2VyXG52YXIgdXNlciA9IFVzZXIuYWRkKFxuICAge1xuICAgICAgZW1haWw6ICdteUBtYWlsLmNvbScsXG4gICAgICBwYXNzd29yZDogJzEyMzQ1NnB3JyxcbiAgICAgIHBhc3N3b3JkX2NvbmZpcm1hdGlvbjogJzEyMzQ1NnB3JyxcbiAgICAgIGZpcnN0bmFtZTogJ2phbmUnLFxuICAgICAgbGFzdG5hbWU6ICd1c2VyJ1xuICAgfSxcbiAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHVzZXIpOyAvLyB7aWQ6IDEsIGZpcnN0bmFtZTogJ2phbmUnLCAuLi59XG4gICB9XG4pO1xuXG4vLyBjaGFuZ2luZyB0aGUgdXNlcm5hbWVcbnZhciB1c2VyID0gVXNlci5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdXNlci5maXJzdG5hbWUgPT0gJ0pvZWwnO1xuICAgdXNlci4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuVXNlci5zYXZlKHtpZDogMSwgZmlyc3RuYW1lOiAnSm9lbCd9KTtcblxuLy8gZGVsZXRpbmcgdGhlIHVzZXJcbnZhciB1c2VyID0gVXNlci5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdXNlci4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Vc2VyLmRlbGV0ZSh7aWQ6IDF9KTtcblxuLy8gcXVlcnkgZm9yIGEgdXNlcm5hbWVcbnZhciB1c2VycyA9IFVzZXIuZmluZCh7cXVlcnk6ICdqYScgfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2codXNlcnMpOyAvLyBbe2lkOiAxLCBmaXJzdG5hbWU6IFwiamFuZVwiLCAuLi59LCAuLi5dXG59KTtcbiAqIFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdVc2VyJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvdXNlcnMvOmlkLzpxdWVyeScsIHsgaWQ6ICdAaWQnIH0sIHtcblx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfSxcblx0XHRhZGQ6IHsgbWV0aG9kOiAnUE9TVCcgfSxcbiAgICAgIGZpbmQ6IHsgbWV0aG9kOiAnR0VUJywgcGFyYW1zOiB7IGlkOiAnZmluZCcgfSwgaXNBcnJheTogdHJ1ZSB9XG5cdH0pO1xufSk7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYXBpXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgcm9sZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIGF2YWlsYWJsZSByb2xlc1xuICogQGV4YW1wbGVcbnZhciBhZG1pblJvbGVJZCA9IHJvbGUuZ2V0SWQoJ2FkbWluJyk7IC8vIDFcbnZhciBhZG1pblJvbGVOYW1lID0gcm9sZS5nZXROYW1lKDEpOyAvLyAnYWRtaW4nXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLnNlcnZpY2UoJ3JvbGVzJywgZnVuY3Rpb24gKFJvbGUpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciByb2xlcyA9IHt9O1xuXHRcdHZhciByb2xlc0ludmVyc2UgPSB7fTtcblxuXHRcdFJvbGUucXVlcnkoZnVuY3Rpb24gKHIpIHtcblx0XHRcdHIuZm9yRWFjaChmdW5jdGlvbiAocm9sZSkge1xuXHRcdFx0XHRyb2xlc1tyb2xlLmlkXSA9IHJvbGUubmFtZTtcblx0XHRcdFx0cm9sZXNJbnZlcnNlW3JvbGUubmFtZV0gPSByb2xlLmlkO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmdldE5hbWUgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHJldHVybiByb2xlc1tpZF07XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0SWQgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0cmV0dXJuIHJvbGVzSW52ZXJzZVtuYW1lXTtcblx0XHR9O1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFwaVxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHNoYXBlc1xuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciB0aGUgYXZhaWxhYmxlIHNoYXBlc1xuICogQGV4YW1wbGVcbnZhciBzaGFwZXNBcnJheSA9IHNwYWhlcy5nZXRBbGwoKTsgLy8gW3tpZDogMSwgbmFtZTogJ1BvaW50J30sIC4uLl1cbnNoYXBlcy5nZXRJZCgnUG9pbnQnKTsgLy8gMVxuc2hhcGVzLmdldE5hbWUoMSk7IC8vICdQb2ludCdcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuc2VydmljZSgnc2hhcGVzJywgZnVuY3Rpb24gKFNoYXBlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgc2hhcGVzID0ge307XG5cdFx0dmFyIHNoYXBlc0ludmVyc2UgPSB7fTtcblxuXHRcdHZhciByZXNvdXJjZXMgPSBTaGFwZS5xdWVyeShmdW5jdGlvbiAocykge1xuXHRcdFx0cy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xuXHRcdFx0XHRzaGFwZXNbc2hhcGUuaWRdID0gc2hhcGUubmFtZTtcblx0XHRcdFx0c2hhcGVzSW52ZXJzZVtzaGFwZS5uYW1lXSA9IHNoYXBlLmlkO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmdldE5hbWUgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHJldHVybiBzaGFwZXNbaWRdO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldElkID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdHJldHVybiBzaGFwZXNJbnZlcnNlW25hbWVdO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiByZXNvdXJjZXM7XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS5tZXNzYWdlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIE1lc3NhZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudWkubWVzc2FnZXNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSBsaXZlIGRpc3BsYXkgb2YgdXNlciBmZWVkYmFjayBtZXNzYWdlcyB2aWEgSlNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5jb250cm9sbGVyKCdNZXNzYWdlc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBNQVhfTVNHKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuYWxlcnRzID0gW107XG5cbiAgICAgICAgdmFyIGNsb3NlRnVsbHNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4pIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuXHRcdC8vIG1ha2UgbWV0aG9kIGFjY2Vzc2libGUgYnkgb3RoZXIgbW9kdWxlc1xuXHRcdHdpbmRvdy4kZGlhc1Bvc3RNZXNzYWdlID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNsb3NlRnVsbHNjcmVlbigpO1xuXHRcdFx0JHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdFx0JHNjb3BlLmFsZXJ0cy51bnNoaWZ0KHtcblx0XHRcdFx0XHRtZXNzYWdlOiBtZXNzYWdlLFxuXHRcdFx0XHRcdHR5cGU6IHR5cGUgfHwgJ2luZm8nXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmICgkc2NvcGUuYWxlcnRzLmxlbmd0aCA+IE1BWF9NU0cpIHtcblx0XHRcdFx0XHQkc2NvcGUuYWxlcnRzLnBvcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlID0gZnVuY3Rpb24gKGluZGV4KSB7XG5cdFx0XHQkc2NvcGUuYWxlcnRzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5nZG9jIGNvbnN0YW50XG4gKiBAbmFtZSBNQVhfTVNHXG4gKiBAbWVtYmVyT2YgZGlhcy51aS5tZXNzYWdlc1xuICogQGRlc2NyaXB0aW9uIFRoZSBtYXhpbXVtIG51bWJlciBvZiBpbmZvIG1lc3NhZ2VzIHRvIGRpc3BsYXkuXG4gKiBAcmV0dXJucyB7SW50ZWdlcn1cbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLm1lc3NhZ2VzJykuY29uc3RhbnQoJ01BWF9NU0cnLCAxKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS51dGlsc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIGZpbHRlckV4Y2x1ZGVcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLnV0aWxzXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgYSBmdW5jdGlvbiB0aGF0IHJlbW92ZXMgYWxsIG51bWJlcnMgb2YgdGhlIGZpcnN0IGFyZ3VtZW50IGFycmF5IChpbiBwbGFjZSEpIHRoYXQgYXJlIG5vdCBwcmVzZW50IGluIHRoZSBzZWNvbmQgYXJndW1lbnQgYXJyYXkuIEFjY2VwdHMgYSB0aGlyZCBhcmd1bWVudCBib29sZWFuIGFzIHRvIHdoZXRoZXIgdGhlIHNlY29uZCBhcmd1bWVudCBhcnJheSBpcyBhbHJlYWR5IHNvcnRlZC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkudXRpbHMnKS5mYWN0b3J5KCdmaWx0ZXJFeGNsdWRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAgICAgLy8gY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYXJyYXkuc29ydCgpIHdpdGggbnVtYmVyc1xuICAgICAgICB2YXIgY29tcGFyZU51bWJlcnMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgLSBiO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgdGhlIGFycmF5IGNvbnRhaW5pbmcgb25seSBlbGVtZW50cyB0aGF0IGFyZSBub3QgcHJlc2VudCBpbiBzdXBlcnNldFxuICAgICAgICAvLyBhc3N1bWVzIHRoYXQgc3VwZXJzZXQgaXMgc29ydGVkIGlmIHNvcnRlZCBldmFsdWF0ZXMgdG8gdHJ1ZVxuICAgICAgICAvLyBkb2Vzbid0IGNoYW5nZSB0aGUgb3JkZXJpbmcgb2YgZWxlbWVudHMgaW4gdGhlIHN1YnNldCBhcnJheVxuICAgICAgICB2YXIgZmlsdGVyRXhjbHVkZSA9IGZ1bmN0aW9uIChzdWJzZXQsIHN1cGVyc2V0LCBzb3J0ZWQpIHtcbiAgICAgICAgICAgIGlmICghc29ydGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gY2xvbmUgYXJyYXkgc28gc29ydGluZyBkb2Vzbid0IGFmZmVjdCBvcmlnaW5hbFxuICAgICAgICAgICAgICAgIHN1cGVyc2V0ID0gc3VwZXJzZXQuc2xpY2UoMCkuc29ydChjb21wYXJlTnVtYmVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjbG9uZSB0aGUgaW5wdXQgYXJyYXkgKHNvIGl0IGlzbid0IGNoYW5nZWQgYnkgc29ydGluZyksIHRoZW4gc29ydCBpdFxuICAgICAgICAgICAgdmFyIHNvcnRlZFN1YnNldCA9IHN1YnNldC5zbGljZSgwKS5zb3J0KGNvbXBhcmVOdW1iZXJzKTtcbiAgICAgICAgICAgIHZhciBpID0gMCwgaiA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaSA8IHN1cGVyc2V0Lmxlbmd0aCAmJiBqIDwgc29ydGVkU3Vic2V0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmIChzdXBlcnNldFtpXSA8IHNvcnRlZFN1YnNldFtqXSkge1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdXBlcnNldFtpXSA9PT0gc29ydGVkU3Vic2V0W2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGEgdmFsdWUgdGhhdCBpcyBib3RoIGluIHN1YnNldCBhbmQgc3VwZXJzZXRcbiAgICAgICAgICAgICAgICAgICAgc3Vic2V0LnNwbGljZShzdWJzZXQuaW5kZXhPZihzb3J0ZWRTdWJzZXRbal0pLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICBqKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyRXhjbHVkZTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkudXRpbHNcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBmaWx0ZXJTdWJzZXRcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLnV0aWxzXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgYSBmdW5jdGlvbiB0aGF0IHJlbW92ZXMgYWxsIG51bWJlcnMgb2YgdGhlIGZpcnN0IGFyZ3VtZW50IGFycmF5IChpbiBwbGFjZSEpIHRoYXQgYXJlIG5vdCBwcmVzZW50IGluIHRoZSBzZWNvbmQgYXJndW1lbnQgYXJyYXkuIEFjY2VwdHMgYSB0aGlyZCBhcmd1bWVudCBib29sZWFuIGFzIHRvIHdoZXRoZXIgdGhlIHNlY29uZCBhcmd1bWVudCBhcnJheSBpcyBhbHJlYWR5IHNvcnRlZC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkudXRpbHMnKS5mYWN0b3J5KCdmaWx0ZXJTdWJzZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuICAgICAgICAvLyBjb21wYXJpc29uIGZ1bmN0aW9uIGZvciBhcnJheS5zb3J0KCkgd2l0aCBudW1iZXJzXG4gICAgICAgIHZhciBjb21wYXJlTnVtYmVycyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyB0aGUgc3Vic2V0IGFycmF5IHdpdGhvdXQgdGhlIGVsZW1lbnRzIHRoYXQgYXJlIG5vdCBwcmVzZW50IGluIHN1cGVyc2V0XG4gICAgICAgIC8vIGFzc3VtZXMgdGhhdCBzdXBlcnNldCBpcyBzb3J0ZWQgaWYgc29ydGVkIGV2YWx1YXRlcyB0byB0cnVlXG4gICAgICAgIC8vIGRvZXNuJ3QgY2hhbmdlIHRoZSBvcmRlcmluZyBvZiBlbGVtZW50cyBpbiB0aGUgc3Vic2V0IGFycmF5XG4gICAgICAgIHZhciBmaWx0ZXJTdWJzZXQgPSBmdW5jdGlvbiAoc3Vic2V0LCBzdXBlcnNldCwgc29ydGVkKSB7XG4gICAgICAgICAgICBpZiAoIXNvcnRlZCkge1xuICAgICAgICAgICAgICAgIC8vIGNsb25lIGFycmF5IHNvIHNvcnRpbmcgZG9lc24ndCBhZmZlY3Qgb3JpZ2luYWxcbiAgICAgICAgICAgICAgICBzdXBlcnNldCA9IHN1cGVyc2V0LnNsaWNlKDApLnNvcnQoY29tcGFyZU51bWJlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY2xvbmUgdGhlIGlucHV0IGFycmF5IChzbyBpdCBpc24ndCBjaGFuZ2VkIGJ5IHNvcnRpbmcpLCB0aGVuIHNvcnQgaXRcbiAgICAgICAgICAgIHZhciBzb3J0ZWRTdWJzZXQgPSBzdWJzZXQuc2xpY2UoMCkuc29ydChjb21wYXJlTnVtYmVycyk7XG4gICAgICAgICAgICAvLyBoZXJlIHdlIHdpbGwgcHV0IGFsbCBpdGVtcyBvZiBzdWJzZXQgdGhhdCBhcmUgbm90IHByZXNlbnQgaW4gc3VwZXJzZXRcbiAgICAgICAgICAgIHZhciBub3RUaGVyZSA9IFtdO1xuICAgICAgICAgICAgdmFyIGkgPSAwLCBqID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChpIDwgc3VwZXJzZXQubGVuZ3RoICYmIGogPCBzb3J0ZWRTdWJzZXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1cGVyc2V0W2ldIDwgc29ydGVkU3Vic2V0W2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN1cGVyc2V0W2ldID09PSBzb3J0ZWRTdWJzZXRbal0pIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICBqKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm90VGhlcmUucHVzaChzb3J0ZWRTdWJzZXRbaisrXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gYWRkIHBvc3NpYmxlIG1pc3NpbmcgaXRlbXMgaWYgc29ydGVkU3Vic2V0IGlzIGxvbmdlciB0aGFuIHN1cGVyc2V0XG4gICAgICAgICAgICB3aGlsZSAoaiA8IHNvcnRlZFN1YnNldC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBub3RUaGVyZS5wdXNoKHNvcnRlZFN1YnNldFtqKytdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbm93IHJlbW92ZSBhbGwgZWxlbWVudHMgZnJvbSBzdWJzZXQgdGhhdCBhcmUgbm90IGluIHN1cGVyc2V0XG4gICAgICAgICAgICAvLyB3ZSBkbyBpdCB0aGlzIHdheSBiZWNhdXNlIHRoZSBub3RUaGVyZSBhcnJheSB3aWxsIHByb2JhYmx5IGFsd2F5cyBiZSB2ZXJ5IHNtYWxsXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbm90VGhlcmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4gYXNzdW1lIHRoYXQgaW5kZXhPZiBpcyBuZXZlciA8MFxuICAgICAgICAgICAgICAgIHN1YnNldC5zcGxpY2Uoc3Vic2V0LmluZGV4T2Yobm90VGhlcmVbaV0pLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyU3Vic2V0O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS5tZXNzYWdlc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1zZ1xuICogQG1lbWJlck9mIGRpYXMudWkubWVzc2FnZXNcbiAqIEBkZXNjcmlwdGlvbiBFbmFibGVzIGFyYml0cmFyeSBBbmd1bGFySlMgbW9kdWxlcyB0byBwb3N0IHVzZXIgZmVlZGJhY2sgbWVzc2FnZXMgdXNpbmcgdGhlIERJQVMgVUkgbWVzc2FnaW5nIHN5c3RlbS4gU2VlIHRoZSBbQm9vdHN0cmFwIGFsZXJ0c10oaHR0cDovL2dldGJvb3RzdHJhcC5jb20vY29tcG9uZW50cy8jYWxlcnRzKSBmb3IgYXZhaWxhYmxlIG1lc3NhZ2UgdHlwZXMgYW5kIHRoZWlyIHN0eWxlLiBJbiBhZGRpdGlvbiB0byBhY3RpdmVseSBwb3N0aW5nIG1lc3NhZ2VzLCBpdCBwcm92aWRlcyB0aGUgYHJlc3BvbnNlRXJyb3JgIG1ldGhvZCB0byBjb252ZW5pZW50bHkgZGlzcGxheSBlcnJvciBtZXNzYWdlcyBpbiBjYXNlIGFuIEFKQVggcmVxdWVzdCB3ZW50IHdyb25nLlxuICogQGV4YW1wbGVcbm1zZy5wb3N0KCdkYW5nZXInLCAnRG8geW91IHJlYWxseSB3YW50IHRvIGRlbGV0ZSB0aGlzPyBFdmVyeXRoaW5nIHdpbGwgYmUgbG9zdC4nKTtcblxubXNnLmRhbmdlcignRG8geW91IHJlYWxseSB3YW50IHRvIGRlbGV0ZSB0aGlzPyBFdmVyeXRoaW5nIHdpbGwgYmUgbG9zdC4nKTtcbm1zZy53YXJuaW5nKCdMZWF2aW5nIHRoZSBwcm9qZWN0IGlzIG5vdCByZXZlcnNpYmxlLicpO1xubXNnLnN1Y2Nlc3MoJ1RoZSBwcm9qZWN0IHdhcyBjcmVhdGVkLicpO1xubXNnLmluZm8oJ1lvdSB3aWxsIHJlY2VpdmUgYW4gZW1haWwgYWJvdXQgdGhpcy4nKTtcblxudmFyIGxhYmVsID0gQW5ub3RhdGlvbkxhYmVsLmF0dGFjaCh7IC4uLiB9KTtcbi8vIGhhbmRsZXMgYWxsIGVycm9yIHJlc3BvbnNlcyBhdXRvbWF0aWNhbGx5XG5sYWJlbC4kcHJvbWlzZS5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLm1lc3NhZ2VzJykuc2VydmljZSgnbXNnJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB0aGlzLnBvc3QgPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuICAgICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UgfHwgdHlwZTtcbiAgICAgICAgICAgIHdpbmRvdy4kZGlhc1Bvc3RNZXNzYWdlKHR5cGUsIG1lc3NhZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGFuZ2VyID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIF90aGlzLnBvc3QoJ2RhbmdlcicsIG1lc3NhZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMud2FybmluZyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICBfdGhpcy5wb3N0KCd3YXJuaW5nJywgbWVzc2FnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zdWNjZXNzID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIF90aGlzLnBvc3QoJ3N1Y2Nlc3MnLCBtZXNzYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmluZm8gPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgX3RoaXMucG9zdCgnaW5mbycsIG1lc3NhZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVzcG9uc2VFcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuXG4gICAgICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5kYW5nZXIoXCJUaGUgc2VydmVyIGRpZG4ndCByZXNwb25kLCBzb3JyeS5cIik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIC8vIGVycm9yIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgX3RoaXMuZGFuZ2VyKGRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuZGFuZ2VyKFwiUGxlYXNlIGxvZyBpbiAoYWdhaW4pLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgLy8gdW5rbm93biBlcnJvciByZXNwb25zZVxuICAgICAgICAgICAgICAgIF90aGlzLmRhbmdlcihkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gdmFsaWRhdGlvbiByZXNwb25zZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmRhbmdlcihkYXRhW2tleV1bMF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkudXNlcnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIHVzZXJDaG9vc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy51aS51c2Vyc1xuICogQGRlc2NyaXB0aW9uIEFuIGlucHV0IGZpZWxkIHRvIGZpbmQgYSB1c2VyLlxuICogQGV4YW1wbGVcbi8vIEhUTUxcbjxpbnB1dCBwbGFjZWhvbGRlcj1cIlNlYXJjaCBieSB1c2VybmFtZVwiIGRhdGEtdXNlci1jaG9vc2VyPVwiYWRkVXNlclwiIC8+XG5cbi8vIENvbnRyb2xsZXIgKGV4YW1wbGUgZm9yIGFkZGluZyBhIHVzZXIgdG8gYSBwcm9qZWN0KVxuJHNjb3BlLmFkZFVzZXIgPSBmdW5jdGlvbiAodXNlcikge1xuXHQvLyBuZXcgdXNlcnMgYXJlIGd1ZXN0cyBieSBkZWZhdWx0XG5cdHZhciByb2xlSWQgPSAkc2NvcGUucm9sZXMuZ3Vlc3Q7XG5cblx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dXNlci5wcm9qZWN0X3JvbGVfaWQgPSByb2xlSWQ7XG5cdFx0JHNjb3BlLnVzZXJzLnB1c2godXNlcik7XG5cdH07XG5cblx0Ly8gdXNlciBzaG91bGRuJ3QgYWxyZWFkeSBleGlzdFxuXHRpZiAoIWdldFVzZXIodXNlci5pZCkpIHtcblx0XHRQcm9qZWN0VXNlci5hdHRhY2goXG5cdFx0XHR7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZH0sXG5cdFx0XHR7aWQ6IHVzZXIuaWQsIHByb2plY3Rfcm9sZV9pZDogcm9sZUlkfSxcblx0XHRcdHN1Y2Nlc3MsIG1zZy5yZXNwb25zZUVycm9yXG5cdFx0KTtcblx0fVxufTtcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS51c2VycycpLmRpcmVjdGl2ZSgndXNlckNob29zZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdBJyxcblxuXHRcdFx0c2NvcGU6IHtcblx0XHRcdFx0c2VsZWN0OiAnPXVzZXJDaG9vc2VyJ1xuXHRcdFx0fSxcblxuXHRcdFx0cmVwbGFjZTogdHJ1ZSxcblxuXHRcdFx0dGVtcGxhdGU6ICc8aW5wdXQgdHlwZT1cInRleHRcIiBkYXRhLW5nLW1vZGVsPVwic2VsZWN0ZWRcIiBkYXRhLXVpYi10eXBlYWhlYWQ9XCJuYW1lKHVzZXIpIGZvciB1c2VyIGluIGZpbmQoJHZpZXdWYWx1ZSlcIiBkYXRhLXR5cGVhaGVhZC13YWl0LW1zPVwiMjUwXCIgZGF0YS10eXBlYWhlYWQtb24tc2VsZWN0PVwic2VsZWN0KCRpdGVtKVwiLz4nLFxuXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBVc2VyKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm5hbWUgPSBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlciA/ICh1c2VyLmZpcnN0bmFtZSArICcgJyArIHVzZXIubGFzdG5hbWUpIDogJyc7XG4gICAgICAgICAgICAgICAgfTtcblxuXHRcdFx0XHQkc2NvcGUuZmluZCA9IGZ1bmN0aW9uIChxdWVyeSkge1xuXHRcdFx0XHRcdHJldHVybiBVc2VyLmZpbmQoe3F1ZXJ5OiBxdWVyeX0pLiRwcm9taXNlO1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
