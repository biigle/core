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
   annotation.points = [{x: 10, y: 10}];
   annotation.$save();
});
// or directly
Annotation.save({
   id: 1, points: [{x: 10, y: 10}]
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
   points: [
      { x: 10, y: 20 }
   ]
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
 * @name Attribute
 * @memberOf dias.api
 * @description Provides the resource for attributes.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// list all attributes
var attributes = Attribute.query(function () {
   console.log(attributes); // [{id: 1, type: 'boolean', ...}, ...]
});

// get a specific attribute
var attribute = Attribute.get({id: 1}, function () {
   console.log(attribute); // {id: 1, type: 'boolean', ...}
});

// create a new attribute
var attribute = Attribute.add({
      name: 'bad_quality', type: 'boolean'
   }, function () {
      console.log(attribute); // {id: 1, name: 'bad_quality', ...}
});

// delete an attribute
var attributes = Attribute.query(function () {
   var attribute = attributes[0];
   attribute.$delete();
});
// or directly
Attribute.delete({id: 1});
 *
 */
angular.module('dias.api').factory('Attribute', ["$resource", "URL", function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/attributes/:id', { id: '@id' }, {
		add: {method: 'POST'}
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
 * @ngdoc constant
 * @name MAX_MSG
 * @memberOf dias.ui.messages
 * @description The maximum number of info messages to display.
 * @returns {Integer}
 *
 */
angular.module('dias.ui.messages').constant('MAX_MSG', 1);
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

			template: '<input type="text" data-ng-model="selected" data-uib-typeahead="user.name for user in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

			controller: ["$scope", "User", function ($scope, User) {
				$scope.find = function (query) {
					return User.find({query: query}).$promise;
				};
			}]
		};
	}
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJhcGkvY29uc3RhbnRzL1VSTC5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbi5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbkxhYmVsLmpzIiwiYXBpL2ZhY3Rvcmllcy9BdHRyaWJ1dGUuanMiLCJhcGkvZmFjdG9yaWVzL0ltYWdlLmpzIiwiYXBpL2ZhY3Rvcmllcy9MYWJlbC5qcyIsImFwaS9mYWN0b3JpZXMvTWVkaWFUeXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9Pd25Vc2VyLmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0LmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0TGFiZWwuanMiLCJhcGkvZmFjdG9yaWVzL1Byb2plY3RUcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvUHJvamVjdFVzZXIuanMiLCJhcGkvZmFjdG9yaWVzL1JvbGUuanMiLCJhcGkvZmFjdG9yaWVzL1NoYXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9UcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvVHJhbnNlY3RJbWFnZS5qcyIsImFwaS9mYWN0b3JpZXMvVXNlci5qcyIsImFwaS9zZXJ2aWNlcy9yb2xlcy5qcyIsImFwaS9zZXJ2aWNlcy9zaGFwZXMuanMiLCJ1aS9tZXNzYWdlcy9jb25zdGFudHMvTUFYX01TRy5qcyIsInVpL21lc3NhZ2VzL3NlcnZpY2VzL21zZy5qcyIsInVpL3VzZXJzL2RpcmVjdGl2ZXMvdXNlckNob29zZXIuanMiLCJ1aS9tZXNzYWdlcy9jb250cm9sbGVyL01lc3NhZ2VzQ29udHJvbGxlci5qcyIsInVpL3V0aWxzL2ZhY3Rvcmllcy9maWx0ZXJFeGNsdWRlLmpzIiwidWkvdXRpbHMvZmFjdG9yaWVzL2ZpbHRlclN1YnNldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxZQUFBLENBQUE7O0FBRUEsUUFBQSxPQUFBLFlBQUEseUJBQUEsVUFBQSxlQUFBO0NBQ0E7O0NBRUEsY0FBQSxTQUFBLFFBQUEsT0FBQTtFQUNBOzs7Ozs7O0FBT0EsUUFBQSxPQUFBLG9CQUFBLENBQUE7OztBQUdBLFFBQUEsUUFBQSxVQUFBLE1BQUEsWUFBQTtDQUNBOztDQUVBLFFBQUE7RUFDQSxTQUFBLGNBQUE7RUFDQSxDQUFBOzs7Ozs7OztBQVFBLFFBQUEsT0FBQSxpQkFBQSxDQUFBLGdCQUFBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsaUJBQUE7Ozs7OztBQU1BLFFBQUEsT0FBQSxXQUFBLENBQUEsZ0JBQUEsb0JBQUEsaUJBQUEsaUJBQUE7Ozs7Ozs7Ozs7O0FDckNBLFFBQUEsT0FBQSxZQUFBLFNBQUEsT0FBQSxPQUFBLGdCQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDMkNBLFFBQUEsT0FBQSxZQUFBLFFBQUEsbUNBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTtFQUNBLEVBQUEsSUFBQTtFQUNBO0dBQ0EsTUFBQTtJQUNBLFFBQUE7O0dBRUEsT0FBQTtJQUNBLFFBQUE7Z0JBQ0EsS0FBQSxNQUFBO0lBQ0EsU0FBQTs7R0FFQSxLQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNsQ0EsUUFBQSxPQUFBLFlBQUEsUUFBQSx3Q0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLGlDQUFBO0dBQ0EsSUFBQTtHQUNBLGVBQUE7S0FDQTtHQUNBLE9BQUE7SUFDQSxRQUFBO2dCQUNBLEtBQUEsTUFBQTtJQUNBLFNBQUE7O0dBRUEsUUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLE1BQUE7O0dBRUEsTUFBQTtJQUNBLFFBQUE7Z0JBQ0EsUUFBQSxDQUFBLGVBQUE7O1lBRUEsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUEsQ0FBQSxlQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNyQkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxrQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLDBCQUFBLEVBQUEsSUFBQSxTQUFBO0VBQ0EsS0FBQSxDQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN0QkEsUUFBQSxPQUFBLFlBQUEsUUFBQSw4QkFBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ29CQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDhCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsc0JBQUEsRUFBQSxJQUFBO0VBQ0E7R0FDQSxLQUFBLENBQUEsUUFBQTtHQUNBLE1BQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzFCQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGtDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsMkJBQUEsRUFBQSxJQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDT0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxnQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLG9CQUFBLElBQUE7RUFDQSxNQUFBLENBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNRQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsd0JBQUEsRUFBQSxJQUFBO0VBQ0E7O0dBRUEsT0FBQSxFQUFBLFFBQUEsT0FBQSxRQUFBLEVBQUEsSUFBQSxRQUFBLFNBQUE7R0FDQSxLQUFBLEVBQUEsUUFBQTtHQUNBLE1BQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxxQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLHVDQUFBLENBQUEsWUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2dDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7RUFDQSxFQUFBLElBQUE7RUFDQTtHQUNBLEtBQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7R0FDQSxRQUFBLEVBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM3QkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxvQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBO0VBQ0EsRUFBQSxJQUFBO0VBQ0E7R0FDQSxNQUFBLEVBQUEsUUFBQTtHQUNBLFFBQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDakJBLFFBQUEsT0FBQSxZQUFBLFFBQUEsNkJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxxQkFBQSxFQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0hBLFFBQUEsT0FBQSxZQUFBLFFBQUEsOEJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxzQkFBQSxFQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0FBLFFBQUEsT0FBQSxZQUFBLFFBQUEsaUNBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTtFQUNBLEVBQUEsSUFBQTtFQUNBO0dBQ0EsTUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNkQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHNDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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LFFBQUE7WUFDQSxJQUFBLENBQUEsUUFBQTs7Z0JBRUEsV0FBQSxTQUFBLE1BQUEsR0FBQSxLQUFBOzs7WUFHQSxJQUFBLGVBQUEsT0FBQSxNQUFBLEdBQUEsS0FBQTs7WUFFQSxJQUFBLFdBQUE7WUFDQSxJQUFBLElBQUEsR0FBQSxJQUFBO1lBQ0EsT0FBQSxJQUFBLFNBQUEsVUFBQSxJQUFBLGFBQUEsUUFBQTtnQkFDQSxJQUFBLFNBQUEsS0FBQSxhQUFBLElBQUE7b0JBQ0E7dUJBQ0EsSUFBQSxTQUFBLE9BQUEsYUFBQSxJQUFBO29CQUNBO29CQUNBO3VCQUNBO29CQUNBLFNBQUEsS0FBQSxhQUFBOzs7O1lBSUEsT0FBQSxJQUFBLGFBQUEsUUFBQTtnQkFDQSxTQUFBLEtBQUEsYUFBQTs7Ozs7WUFLQSxLQUFBLElBQUEsR0FBQSxJQUFBLFNBQUEsUUFBQSxLQUFBOztnQkFFQSxPQUFBLE9BQUEsT0FBQSxRQUFBLFNBQUEsS0FBQTs7OztRQUlBLE9BQUE7OztBQUdBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBhcGkgQW5ndWxhckpTIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJywgWyduZ1Jlc291cmNlJ10pO1xuXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0JGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbltcIlgtUmVxdWVzdGVkLVdpdGhcIl0gPVxuXHRcdFwiWE1MSHR0cFJlcXVlc3RcIjtcbn0pO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS5tZXNzYWdlc1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHVzZXIgZmVlZGJhY2sgbWVzc2FnZXMgQW5ndWxhckpTIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnLCBbJ3VpLmJvb3RzdHJhcCddKTtcblxuLy8gYm9vdHN0cmFwIHRoZSBtZXNzYWdlcyBtb2R1bGVcbmFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRhbmd1bGFyLmJvb3RzdHJhcChcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1uZy1jb250cm9sbGVyPVwiTWVzc2FnZXNDb250cm9sbGVyXCJdJyksXG5cdFx0WydkaWFzLnVpLm1lc3NhZ2VzJ11cblx0KTtcbn0pO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS51c2Vyc1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHVzZXJzIFVJIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLnVzZXJzJywgWyd1aS5ib290c3RyYXAnLCAnZGlhcy5hcGknXSk7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLnV0aWxzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdXRpbHMgVUkgQW5ndWxhckpTIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkudXRpbHMnLCBbXSk7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgVUkgQW5ndWxhckpTIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWknLCBbJ3VpLmJvb3RzdHJhcCcsICdkaWFzLnVpLm1lc3NhZ2VzJywgJ2RpYXMudWkudXNlcnMnLCAnZGlhcy51aS51dGlscycsICduZ0FuaW1hdGUnXSk7XG5cbiIsIi8qKlxuICogQG5nZG9jIGNvbnN0YW50XG4gKiBAbmFtZSBVUkxcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFRoZSBiYXNlIHVybCBvZiB0aGUgYXBwbGljYXRpb24uXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuY29uc3RhbnQoJ1VSTCcsIHdpbmRvdy4kZGlhc0Jhc2VVcmwgfHwgJycpOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEFubm90YXRpb25cbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgYW5ub3RhdGlvbnMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIHJldHJpZXZpbmcgdGhlIHNoYXBlIElEIG9mIGFuIGFubm90YXRpb25cbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5nZXQoe2lkOiAxMjN9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhbm5vdGF0aW9uLnNoYXBlX2lkKTtcbn0pO1xuXG4vLyBzYXZpbmcgYW4gYW5ub3RhdGlvbiAodXBkYXRpbmcgdGhlIGFubm90YXRpb24gcG9pbnRzKVxudmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBhbm5vdGF0aW9uLnBvaW50cyA9IFt7eDogMTAsIHk6IDEwfV07XG4gICBhbm5vdGF0aW9uLiRzYXZlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Bbm5vdGF0aW9uLnNhdmUoe1xuICAgaWQ6IDEsIHBvaW50czogW3t4OiAxMCwgeTogMTB9XVxufSk7XG5cbi8vIGRlbGV0aW5nIGFuIGFubm90YXRpb25cbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5nZXQoe2lkOiAxMjN9LCBmdW5jdGlvbiAoKSB7XG4gICBhbm5vdGF0aW9uLiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbkFubm90YXRpb24uZGVsZXRlKHtpZDogMTIzfSk7XG5cbi8vIGdldCBhbGwgYW5ub3RhdGlvbnMgb2YgYW4gaW1hZ2Vcbi8vIG5vdGUsIHRoYXQgdGhlIGBpZGAgaXMgbm93IHRoZSBpbWFnZSBJRCBhbmQgbm90IHRoZSBhbm5vdGF0aW9uIElEIGZvciB0aGVcbi8vIHF1ZXJ5IVxudmFyIGFubm90YXRpb25zID0gQW5ub3RhdGlvbi5xdWVyeSh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhbm5vdGF0aW9ucyk7IC8vIFt7aWQ6IDEsIHNoYXBlX2lkOiAxLCAuLi59LCAuLi5dXG59KTtcblxuLy8gYWRkIGEgbmV3IGFubm90YXRpb24gdG8gYW4gaW1hZ2Vcbi8vIG5vdGUsIHRoYXQgdGhlIGBpZGAgaXMgbm93IHRoZSBpbWFnZSBJRCBhbmQgbm90IHRoZSBhbm5vdGF0aW9uIElEIGZvciB0aGVcbi8vIHF1ZXJ5IVxudmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmFkZCh7XG4gICBpZDogMSxcbiAgIHNoYXBlX2lkOiAxLFxuICAgbGFiZWxfaWQ6IDEsXG4gICBjb25maWRlbmNlOiAwLjVcbiAgIHBvaW50czogW1xuICAgICAgeyB4OiAxMCwgeTogMjAgfVxuICAgXVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdBbm5vdGF0aW9uJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvYW5ub3RhdGlvbnMvOmlkJyxcblx0XHR7IGlkOiAnQGlkJ1x0fSxcblx0XHR7XG5cdFx0XHRzYXZlOiB7XG5cdFx0XHRcdG1ldGhvZDogJ1BVVCdcblx0XHRcdH0sXG5cdFx0XHRxdWVyeToge1xuXHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogVVJMICsgJy9hcGkvdjEvaW1hZ2VzLzppZC9hbm5vdGF0aW9ucycsXG5cdFx0XHRcdGlzQXJyYXk6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRhZGQ6IHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogVVJMICsgJy9hcGkvdjEvaW1hZ2VzLzppZC9hbm5vdGF0aW9ucycsXG5cdFx0XHR9XG5cdFx0fSk7XG59KTtcbiIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEFubm90YXRpb25MYWJlbFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBhbm5vdGF0aW9uIGxhYmVscy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBsYWJlbHMgb2YgYW4gYW5ub3RhdGlvbiBhbmQgdXBkYXRlIG9uZSBvZiB0aGVtXG52YXIgbGFiZWxzID0gQW5ub3RhdGlvbkxhYmVsLnF1ZXJ5KHthbm5vdGF0aW9uX2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIGxhYmVsID0gbGFiZWxzWzBdO1xuICAgbGFiZWwuY29uZmlkZW5jZSA9IDAuOTtcbiAgIGxhYmVsLiRzYXZlKCk7XG59KTtcblxuLy8gZGlyZWN0bHkgdXBkYXRlIGEgbGFiZWxcbkFubm90YXRpb25MYWJlbC5zYXZlKHtjb25maWRlbmNlOiAwLjEsIGFubm90YXRpb25faWQ6IDEsIGlkOiAxfSk7XG5cbi8vIGF0dGFjaCBhIG5ldyBsYWJlbCB0byBhbiBhbm5vdGF0aW9uXG52YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHtsYWJlbF9pZDogMSwgY29uZmlkZW5jZTogMC41LCBhbm5vdGF0aW9uX2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWwpOyAvLyB7aWQ6IDEsIG5hbWU6ICdteSBsYWJlbCcsIHVzZXJfaWQ6IDEsIC4uLn1cbn0pO1xuXG5cbi8vIGRldGFjaCBhIGxhYmVsXG52YXIgbGFiZWxzID0gQW5ub3RhdGlvbkxhYmVsLnF1ZXJ5KHthbm5vdGF0aW9uX2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIGxhYmVsID0gbGFiZWxzWzBdO1xuICAgbGFiZWwuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuQW5ub3RhdGlvbkxhYmVsLmRlbGV0ZSh7aWQ6IDF9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0Fubm90YXRpb25MYWJlbCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2Fubm90YXRpb24tbGFiZWxzLzppZCcsIHtcblx0XHRcdGlkOiAnQGlkJyxcblx0XHRcdGFubm90YXRpb25faWQ6ICdAYW5ub3RhdGlvbl9pZCdcblx0XHR9LCB7XG5cdFx0XHRxdWVyeToge1xuXHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogVVJMICsgJy9hcGkvdjEvYW5ub3RhdGlvbnMvOmFubm90YXRpb25faWQvbGFiZWxzJyxcblx0XHRcdFx0aXNBcnJheTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGF0dGFjaDoge1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBVUkwgKyAnL2FwaS92MS9hbm5vdGF0aW9ucy86YW5ub3RhdGlvbl9pZC9sYWJlbHMnLFxuXHRcdFx0fSxcblx0XHRcdHNhdmU6IHtcblx0XHRcdFx0bWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHthbm5vdGF0aW9uX2lkOiBudWxsfVxuXHRcdFx0fSxcbiAgICAgICAgICAgIGRlbGV0ZToge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7YW5ub3RhdGlvbl9pZDogbnVsbH1cbiAgICAgICAgICAgIH1cblx0fSk7XG59KTtcbiIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEF0dHJpYnV0ZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBhdHRyaWJ1dGVzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBsaXN0IGFsbCBhdHRyaWJ1dGVzXG52YXIgYXR0cmlidXRlcyA9IEF0dHJpYnV0ZS5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhdHRyaWJ1dGVzKTsgLy8gW3tpZDogMSwgdHlwZTogJ2Jvb2xlYW4nLCAuLi59LCAuLi5dXG59KTtcblxuLy8gZ2V0IGEgc3BlY2lmaWMgYXR0cmlidXRlXG52YXIgYXR0cmlidXRlID0gQXR0cmlidXRlLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhdHRyaWJ1dGUpOyAvLyB7aWQ6IDEsIHR5cGU6ICdib29sZWFuJywgLi4ufVxufSk7XG5cbi8vIGNyZWF0ZSBhIG5ldyBhdHRyaWJ1dGVcbnZhciBhdHRyaWJ1dGUgPSBBdHRyaWJ1dGUuYWRkKHtcbiAgICAgIG5hbWU6ICdiYWRfcXVhbGl0eScsIHR5cGU6ICdib29sZWFuJ1xuICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coYXR0cmlidXRlKTsgLy8ge2lkOiAxLCBuYW1lOiAnYmFkX3F1YWxpdHknLCAuLi59XG59KTtcblxuLy8gZGVsZXRlIGFuIGF0dHJpYnV0ZVxudmFyIGF0dHJpYnV0ZXMgPSBBdHRyaWJ1dGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgdmFyIGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbMF07XG4gICBhdHRyaWJ1dGUuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuQXR0cmlidXRlLmRlbGV0ZSh7aWQ6IDF9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0F0dHJpYnV0ZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2F0dHJpYnV0ZXMvOmlkJywgeyBpZDogJ0BpZCcgfSwge1xuXHRcdGFkZDoge21ldGhvZDogJ1BPU1QnfVxuXHR9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGltYWdlcy4gVGhpcyByZXNvdXJjZSBpcyBvbmx5IGZvciBcbiAqIGZpbmRpbmcgb3V0IHdoaWNoIHRyYW5zZWN0IGFuIGltYWdlIGJlbG9uZ3MgdG8uIFRoZSBpbWFnZSBmaWxlcyBhcmVcbiAqIGRpcmVjdGx5IGNhbGxlZCBmcm9tIHRoZSBBUEkuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbiBpbWFnZVxudmFyIGltYWdlID0gSW1hZ2UuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGltYWdlKTsgLy8ge2lkOiAxLCB3aWR0aDogMTAwMCwgaGVpZ2h0OiA3NTAsIHRyYW5zZWN0OiB7Li4ufSwgLi4ufVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdJbWFnZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2ltYWdlcy86aWQnKTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIExhYmVsXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGxhYmVscy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBsYWJlbHNcbnZhciBsYWJlbHMgPSBMYWJlbC5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcIkJlbnRoaWMgT2JqZWN0XCIsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIGxhYmVsXG52YXIgbGFiZWwgPSBMYWJlbC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWwpOyAvLyB7aWQ6IDEsIG5hbWU6IFwiQmVudGhpYyBPYmplY3RcIiwgLi4ufVxufSk7XG5cbi8vIGNyZWF0ZSBhIG5ldyBsYWJlbFxudmFyIGxhYmVsID0gTGFiZWwuYWRkKHtuYW1lOiBcIlRyYXNoXCIsIHBhcmVudF9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGxhYmVsKTsgLy8ge2lkOiAyLCBuYW1lOiBcIlRyYXNoXCIsIHBhcmVudF9pZDogMSwgLi4ufVxufSk7XG5cbi8vIHVwZGF0ZSBhIGxhYmVsXG52YXIgbGFiZWwgPSBMYWJlbC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgbGFiZWwubmFtZSA9ICdUcmFzaCc7XG4gICBsYWJlbC4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuTGFiZWwuc2F2ZSh7aWQ6IDEsIG5hbWU6ICdUcmFzaCd9KTtcblxuLy8gZGVsZXRlIGEgbGFiZWxcbnZhciBsYWJlbCA9IExhYmVsLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBsYWJlbC4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5MYWJlbC5kZWxldGUoe2lkOiAxfSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdMYWJlbCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2xhYmVscy86aWQnLCB7IGlkOiAnQGlkJyB9LFxuXHRcdHtcblx0XHRcdGFkZDoge21ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIE1lZGlhVHlwZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBtZWRpYSB0eXBlcy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBtZWRpYSB0eXBlc1xudmFyIG1lZGlhVHlwZXMgPSBNZWRpYVR5cGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobWVkaWFUeXBlcyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwidGltZS1zZXJpZXNcIn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIG1lZGlhIHR5cGVcbnZhciBtZWRpYVR5cGUgPSBNZWRpYVR5cGUuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKG1lZGlhVHlwZSk7IC8vIHtpZDogMSwgbmFtZTogXCJ0aW1lLXNlcmllc1wifVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdNZWRpYVR5cGUnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9tZWRpYS10eXBlcy86aWQnLCB7IGlkOiAnQGlkJyB9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIE93blVzZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgdGhlIGxvZ2dlZCBpbiB1c2VyLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyByZXRyaWV2aW5nIHRoZSB1c2VybmFtZVxudmFyIHVzZXIgPSBPd25Vc2VyLmdldChmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2VyLmZpcnN0bmFtZSk7XG59KTtcblxuLy8gY2hhbmdpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IE93blVzZXIuZ2V0KGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuZmlyc3RuYW1lID09ICdKb2VsJztcbiAgIHVzZXIuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbk93blVzZXIuc2F2ZSh7Zmlyc3RuYW1lOiAnSm9lbCd9KTtcblxuLy8gZGVsZXRpbmcgdGhlIHVzZXJcbnZhciB1c2VyID0gT3duVXNlci5nZXQoZnVuY3Rpb24gKCkge1xuICAgdXNlci4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Pd25Vc2VyLmRlbGV0ZSgpO1xuICogXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ093blVzZXInLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS91c2Vycy9teScsIHt9LCB7XG5cdFx0c2F2ZToge21ldGhvZDogJ1BVVCd9XG5cdH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgUHJvamVjdFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBwcm9qZWN0cy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBwcm9qZWN0cywgdGhlIGN1cnJlbnQgdXNlciBiZWxvbmdzIHRvXG52YXIgcHJvamVjdHMgPSBQcm9qZWN0LnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHByb2plY3RzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJUZXN0IFByb2plY3RcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhwcm9qZWN0KTsgLy8ge2lkOiAxLCBuYW1lOiBcIlRlc3QgUHJvamVjdFwiLCAuLi59XG59KTtcblxuLy8gY3JlYXRlIGEgbmV3IHByb2plY3RcbnZhciBwcm9qZWN0ID0gUHJvamVjdC5hZGQoe25hbWU6IFwiTXkgUHJvamVjdFwiLCBkZXNjcmlwdGlvbjogXCJteSBwcm9qZWN0XCJ9LFxuICAgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2cocHJvamVjdCk7IC8vIHtpZDogMiwgbmFtZTogXCJNeSBQcm9qZWN0XCIsIC4uLn1cbiAgIH1cbik7XG5cbi8vIHVwZGF0ZSBhIHByb2plY3RcbnZhciBwcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgcHJvamVjdC5uYW1lID0gJ05ldyBQcm9qZWN0JztcbiAgIHByb2plY3QuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblByb2plY3Quc2F2ZSh7aWQ6IDEsIG5hbWU6ICdOZXcgUHJvamVjdCd9KTtcblxuLy8gZGVsZXRlIGEgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBwcm9qZWN0LiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblByb2plY3QuZGVsZXRlKHtpZDogMX0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUHJvamVjdCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzppZCcsIHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0Ly8gYSB1c2VyIGNhbiBvbmx5IHF1ZXJ5IHRoZWlyIG93biBwcm9qZWN0c1xuXHRcdFx0cXVlcnk6IHsgbWV0aG9kOiAnR0VUJywgcGFyYW1zOiB7IGlkOiAnbXknIH0sIGlzQXJyYXk6IHRydWUgfSxcblx0XHRcdGFkZDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0c2F2ZTogeyBtZXRob2Q6ICdQVVQnIH1cblx0XHR9XG5cdCk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBQcm9qZWN0TGFiZWxcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgbGFiZWxzIGJlbG9uZ2luZyB0byBhIHByb2plY3QuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgbGFiZWxzIG9mIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIGxhYmVscyA9IFByb2plY3RMYWJlbC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWxzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJDb3JhbFwiLCAuLi59LCAuLi5dXG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1Byb2plY3RMYWJlbCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzpwcm9qZWN0X2lkL2xhYmVscycsIHtwcm9qZWN0X2lkOiAnQHByb2plY3RfaWQnfSk7XG59KTtcbiIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFByb2plY3RUcmFuc2VjdFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0cmFuc2VjdHMgYmVsb25naW5nIHRvIGEgcHJvamVjdC5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCB0cmFuc2VjdHMgb2YgdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdHJhbnNlY3RzID0gUHJvamVjdFRyYW5zZWN0LnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh0cmFuc2VjdHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcInRyYW5zZWN0IDFcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGFkZCBhIG5ldyB0cmFuc2VjdCB0byB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciB0cmFuc2VjdCA9IFByb2plY3RUcmFuc2VjdC5hZGQoe3Byb2plY3RfaWQ6IDF9LFxuICAge1xuICAgICAgbmFtZTogXCJ0cmFuc2VjdCAxXCIsXG4gICAgICB1cmw6IFwiL3ZvbC90cmFuc2VjdHMvMVwiLFxuICAgICAgbWVkaWFfdHlwZV9pZDogMSxcbiAgICAgIGltYWdlczogW1wiMS5qcGdcIiwgXCIyLmpwZ1wiXVxuICAgfSxcbiAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHRyYW5zZWN0KTsgLy8ge2lkOiAxLCBuYW1lOiBcInRyYW5zZWN0IDFcIiwgLi4ufVxuICAgfVxuKTtcblxuLy8gYXR0YWNoIGFuIGV4aXN0aW5nIHRyYW5zZWN0IHRvIGFub3RoZXIgcHJvamVjdFxudmFyIHRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIHRyYW5zZWN0ID0gdHJhbnNlY3RzWzBdO1xuICAgLy8gdHJhbnNlY3QgaXMgbm93IGF0dGFjaGVkIHRvIHByb2plY3QgMSAqYW5kKiAyXG4gICB0cmFuc2VjdC4kYXR0YWNoKHtwcm9qZWN0X2lkOiAyfSk7XG59KTtcbi8vIG9yIGRpcmVjdGx5ICh0cmFuc2VjdCAxIHdpbGwgYmUgYXR0YWNoZWQgdG8gcHJvamVjdCAyKVxuUHJvamVjdFRyYW5zZWN0LmF0dGFjaCh7cHJvamVjdF9pZDogMn0sIHtpZDogMX0pO1xuXG4vLyBkZXRhY2ggYSB0cmFuc2VjdCBmcm9tIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIHRyYW5zZWN0ID0gdHJhbnNlY3RzWzBdO1xuICAgdHJhbnNlY3QuJGRldGFjaCh7cHJvamVjdF9pZDogMX0pO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdFRyYW5zZWN0LmRldGFjaCh7cHJvamVjdF9pZDogMX0sIHtpZDogMX0pO1xuXG4vLyBhdHRhY2hpbmcgYW5kIGRldGFjaGluZyBjYW4gYmUgZG9uZSB1c2luZyBhIFRyYW5zZWN0IG9iamVjdCBhcyB3ZWxsOlxudmFyIHRyYW5zZWN0ID0gVHJhbnNlY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIFByb2plY3RUcmFuc2VjdC5hdHRhY2goe3Byb2plY3RfaWQ6IDJ9LCB0cmFuc2VjdCk7XG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1Byb2plY3RUcmFuc2VjdCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzpwcm9qZWN0X2lkL3RyYW5zZWN0cy86aWQnLFxuXHRcdHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0YWRkOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRhdHRhY2g6IHsgbWV0aG9kOiAnUE9TVCcgfSxcblx0XHRcdGRldGFjaDogeyBtZXRob2Q6ICdERUxFVEUnIH1cblx0XHR9XG5cdCk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBQcm9qZWN0VXNlclxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB1c2VycyBiZWxvbmdpbmcgdG8gYSBwcm9qZWN0LlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHVzZXJzIG9mIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHVzZXJzID0gUHJvamVjdFVzZXIucXVlcnkoeyBwcm9qZWN0X2lkOiAxIH0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXJzKTsgLy8gW3tpZDogMSwgZmlyc3RuYW1lOiBcIkphbmVcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIHVwZGF0ZSB0aGUgcHJvamVjdCByb2xlIG9mIGEgdXNlclxuUHJvamVjdFVzZXIuc2F2ZSh7cHJvamVjdF9pZDogMX0sIHtpZDogMSwgcHJvamVjdF9yb2xlX2lkOiAxfSk7XG5cbi8vIGF0dGFjaCBhIHVzZXIgdG8gYW5vdGhlciBwcm9qZWN0XG5Qcm9qZWN0VXNlci5hdHRhY2goe3Byb2plY3RfaWQ6IDJ9LCB7aWQ6IDEsIHByb2plY3Rfcm9sZV9pZDogMn0pO1xuXG4vLyBkZXRhY2ggYSB1c2VyIGZyb20gdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdXNlcnMgPSBQcm9qZWN0VXNlci5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIHVzZXIgPSB1c2Vyc1swXTtcbiAgIHVzZXIuJGRldGFjaCh7cHJvamVjdF9pZDogMX0pO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdFVzZXIuZGV0YWNoKHtwcm9qZWN0X2lkOiAxfSwge2lkOiAxfSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdQcm9qZWN0VXNlcicsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzpwcm9qZWN0X2lkL3VzZXJzLzppZCcsXG5cdFx0eyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfSxcblx0XHRcdGF0dGFjaDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0ZGV0YWNoOiB7IG1ldGhvZDogJ0RFTEVURScgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFJvbGVcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3Igcm9sZXMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgcm9sZXNcbnZhciByb2xlcyA9IFJvbGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cocm9sZXMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcImFkbWluXCJ9LCAuLi5dXG59KTtcblxuLy8gZ2V0IG9uZSByb2xlXG52YXIgcm9sZSA9IFJvbGUuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHJvbGUpOyAvLyB7aWQ6IDEsIG5hbWU6IFwiYWRtaW5cIn1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUm9sZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3JvbGVzLzppZCcsIHsgaWQ6ICdAaWQnIH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgU2hhcGVcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3Igc2hhcGVzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHNoYXBlc1xudmFyIHNoYXBlcyA9IFNoYXBlLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHNoYXBlcyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwicG9pbnRcIn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIHNoYXBlXG52YXIgc2hhcGUgPSBTaGFwZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coc2hhcGUpOyAvLyB7aWQ6IDEsIG5hbWU6IFwicG9pbnRcIn1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnU2hhcGUnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9zaGFwZXMvOmlkJywgeyBpZDogJ0BpZCcgfSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBUcmFuc2VjdFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0cmFuc2VjdHMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBvbmUgdHJhbnNlY3RcbnZhciB0cmFuc2VjdCA9IFRyYW5zZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh0cmFuc2VjdCk7IC8vIHtpZDogMSwgbmFtZTogXCJ0cmFuc2VjdCAxXCJ9XG59KTtcblxuLy8gdXBkYXRlIGEgdHJhbnNlY3RcbnZhciB0cmFuc2VjdCA9IFRyYW5zZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICB0cmFuc2VjdC5uYW1lID0gXCJteSB0cmFuc2VjdFwiO1xuICAgdHJhbnNlY3QuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblRyYW5zZWN0LnNhdmUoe2lkOiAxLCBuYW1lOiBcIm15IHRyYW5zZWN0XCJ9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1RyYW5zZWN0JywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvdHJhbnNlY3RzLzppZCcsXG5cdFx0eyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfVxuXHRcdH1cblx0KTtcbn0pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgVHJhbnNlY3RJbWFnZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBpbWFnZXMgb2YgdHJhbnNlY3RzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgdGhlIElEcyBvZiBhbGwgaW1hZ2VzIG9mIHRoZSB0cmFuc2VjdCB3aXRoIElEIDFcbnZhciBpbWFnZXMgPSBUcmFuc2VjdEltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGltYWdlcyk7IC8vIFsxLCAxMiwgMTQsIC4uLl1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnVHJhbnNlY3RJbWFnZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3RyYW5zZWN0cy86dHJhbnNlY3RfaWQvaW1hZ2VzJyk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBVc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHVzZXJzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYSBsaXN0IG9mIGFsbCB1c2Vyc1xudmFyIHVzZXJzID0gVXNlci5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2Vycyk7IC8vIFt7aWQ6IDEsIGZpcnN0bmFtZTogXCJKYW5lXCIsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyByZXRyaWV2aW5nIHRoZSB1c2VybmFtZVxudmFyIHVzZXIgPSBVc2VyLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2VyLmZpcnN0bmFtZSk7XG59KTtcblxuLy8gY3JlYXRpbmcgYSBuZXcgdXNlclxudmFyIHVzZXIgPSBVc2VyLmFkZChcbiAgIHtcbiAgICAgIGVtYWlsOiAnbXlAbWFpbC5jb20nLFxuICAgICAgcGFzc3dvcmQ6ICcxMjM0NTZwdycsXG4gICAgICBwYXNzd29yZF9jb25maXJtYXRpb246ICcxMjM0NTZwdycsXG4gICAgICBmaXJzdG5hbWU6ICdqYW5lJyxcbiAgICAgIGxhc3RuYW1lOiAndXNlcidcbiAgIH0sXG4gICBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyh1c2VyKTsgLy8ge2lkOiAxLCBmaXJzdG5hbWU6ICdqYW5lJywgLi4ufVxuICAgfVxuKTtcblxuLy8gY2hhbmdpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IFVzZXIuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuZmlyc3RuYW1lID09ICdKb2VsJztcbiAgIHVzZXIuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblVzZXIuc2F2ZSh7aWQ6IDEsIGZpcnN0bmFtZTogJ0pvZWwnfSk7XG5cbi8vIGRlbGV0aW5nIHRoZSB1c2VyXG52YXIgdXNlciA9IFVzZXIuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuVXNlci5kZWxldGUoe2lkOiAxfSk7XG5cbi8vIHF1ZXJ5IGZvciBhIHVzZXJuYW1lXG52YXIgdXNlcnMgPSBVc2VyLmZpbmQoe3F1ZXJ5OiAnamEnIH0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXJzKTsgLy8gW3tpZDogMSwgZmlyc3RuYW1lOiBcImphbmVcIiwgLi4ufSwgLi4uXVxufSk7XG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnVXNlcicsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3VzZXJzLzppZC86cXVlcnknLCB7IGlkOiAnQGlkJyB9LCB7XG5cdFx0c2F2ZTogeyBtZXRob2Q6ICdQVVQnIH0sXG5cdFx0YWRkOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG4gICAgICBmaW5kOiB7IG1ldGhvZDogJ0dFVCcsIHBhcmFtczogeyBpZDogJ2ZpbmQnIH0sIGlzQXJyYXk6IHRydWUgfVxuXHR9KTtcbn0pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFwaVxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHJvbGVzXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIHRoZSBhdmFpbGFibGUgcm9sZXNcbiAqIEBleGFtcGxlXG52YXIgYWRtaW5Sb2xlSWQgPSByb2xlLmdldElkKCdhZG1pbicpOyAvLyAxXG52YXIgYWRtaW5Sb2xlTmFtZSA9IHJvbGUuZ2V0TmFtZSgxKTsgLy8gJ2FkbWluJ1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5zZXJ2aWNlKCdyb2xlcycsIGZ1bmN0aW9uIChSb2xlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgcm9sZXMgPSB7fTtcblx0XHR2YXIgcm9sZXNJbnZlcnNlID0ge307XG5cblx0XHRSb2xlLnF1ZXJ5KGZ1bmN0aW9uIChyKSB7XG5cdFx0XHRyLmZvckVhY2goZnVuY3Rpb24gKHJvbGUpIHtcblx0XHRcdFx0cm9sZXNbcm9sZS5pZF0gPSByb2xlLm5hbWU7XG5cdFx0XHRcdHJvbGVzSW52ZXJzZVtyb2xlLm5hbWVdID0gcm9sZS5pZDtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5nZXROYW1lID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRyZXR1cm4gcm9sZXNbaWRdO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldElkID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdHJldHVybiByb2xlc0ludmVyc2VbbmFtZV07XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hcGlcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzaGFwZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIGF2YWlsYWJsZSBzaGFwZXNcbiAqIEBleGFtcGxlXG52YXIgc2hhcGVzQXJyYXkgPSBzcGFoZXMuZ2V0QWxsKCk7IC8vIFt7aWQ6IDEsIG5hbWU6ICdQb2ludCd9LCAuLi5dXG5zaGFwZXMuZ2V0SWQoJ1BvaW50Jyk7IC8vIDFcbnNoYXBlcy5nZXROYW1lKDEpOyAvLyAnUG9pbnQnXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLnNlcnZpY2UoJ3NoYXBlcycsIGZ1bmN0aW9uIChTaGFwZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHNoYXBlcyA9IHt9O1xuXHRcdHZhciBzaGFwZXNJbnZlcnNlID0ge307XG5cblx0XHR2YXIgcmVzb3VyY2VzID0gU2hhcGUucXVlcnkoZnVuY3Rpb24gKHMpIHtcblx0XHRcdHMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcblx0XHRcdFx0c2hhcGVzW3NoYXBlLmlkXSA9IHNoYXBlLm5hbWU7XG5cdFx0XHRcdHNoYXBlc0ludmVyc2Vbc2hhcGUubmFtZV0gPSBzaGFwZS5pZDtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5nZXROYW1lID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRyZXR1cm4gc2hhcGVzW2lkXTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRJZCA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRyZXR1cm4gc2hhcGVzSW52ZXJzZVtuYW1lXTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gcmVzb3VyY2VzO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmdkb2MgY29uc3RhbnRcbiAqIEBuYW1lIE1BWF9NU0dcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAZGVzY3JpcHRpb24gVGhlIG1heGltdW0gbnVtYmVyIG9mIGluZm8gbWVzc2FnZXMgdG8gZGlzcGxheS5cbiAqIEByZXR1cm5zIHtJbnRlZ2VyfVxuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5jb25zdGFudCgnTUFYX01TRycsIDEpOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbXNnXG4gKiBAbWVtYmVyT2YgZGlhcy51aS5tZXNzYWdlc1xuICogQGRlc2NyaXB0aW9uIEVuYWJsZXMgYXJiaXRyYXJ5IEFuZ3VsYXJKUyBtb2R1bGVzIHRvIHBvc3QgdXNlciBmZWVkYmFjayBtZXNzYWdlcyB1c2luZyB0aGUgRElBUyBVSSBtZXNzYWdpbmcgc3lzdGVtLiBTZWUgdGhlIFtCb290c3RyYXAgYWxlcnRzXShodHRwOi8vZ2V0Ym9vdHN0cmFwLmNvbS9jb21wb25lbnRzLyNhbGVydHMpIGZvciBhdmFpbGFibGUgbWVzc2FnZSB0eXBlcyBhbmQgdGhlaXIgc3R5bGUuIEluIGFkZGl0aW9uIHRvIGFjdGl2ZWx5IHBvc3RpbmcgbWVzc2FnZXMsIGl0IHByb3ZpZGVzIHRoZSBgcmVzcG9uc2VFcnJvcmAgbWV0aG9kIHRvIGNvbnZlbmllbnRseSBkaXNwbGF5IGVycm9yIG1lc3NhZ2VzIGluIGNhc2UgYW4gQUpBWCByZXF1ZXN0IHdlbnQgd3JvbmcuXG4gKiBAZXhhbXBsZVxubXNnLnBvc3QoJ2RhbmdlcicsICdEbyB5b3UgcmVhbGx5IHdhbnQgdG8gZGVsZXRlIHRoaXM/IEV2ZXJ5dGhpbmcgd2lsbCBiZSBsb3N0LicpO1xuXG5tc2cuZGFuZ2VyKCdEbyB5b3UgcmVhbGx5IHdhbnQgdG8gZGVsZXRlIHRoaXM/IEV2ZXJ5dGhpbmcgd2lsbCBiZSBsb3N0LicpO1xubXNnLndhcm5pbmcoJ0xlYXZpbmcgdGhlIHByb2plY3QgaXMgbm90IHJldmVyc2libGUuJyk7XG5tc2cuc3VjY2VzcygnVGhlIHByb2plY3Qgd2FzIGNyZWF0ZWQuJyk7XG5tc2cuaW5mbygnWW91IHdpbGwgcmVjZWl2ZSBhbiBlbWFpbCBhYm91dCB0aGlzLicpO1xuXG52YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHsgLi4uIH0pO1xuLy8gaGFuZGxlcyBhbGwgZXJyb3IgcmVzcG9uc2VzIGF1dG9tYXRpY2FsbHlcbmxhYmVsLiRwcm9taXNlLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5zZXJ2aWNlKCdtc2cnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMucG9zdCA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCB0eXBlO1xuICAgICAgICAgICAgd2luZG93LiRkaWFzUG9zdE1lc3NhZ2UodHlwZSwgbWVzc2FnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kYW5nZXIgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgX3RoaXMucG9zdCgnZGFuZ2VyJywgbWVzc2FnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy53YXJuaW5nID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIF90aGlzLnBvc3QoJ3dhcm5pbmcnLCBtZXNzYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnN1Y2Nlc3MgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgX3RoaXMucG9zdCgnc3VjY2VzcycsIG1lc3NhZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaW5mbyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICBfdGhpcy5wb3N0KCdpbmZvJywgbWVzc2FnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZXNwb25zZUVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cbiAgICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgIF90aGlzLmRhbmdlcihcIlRoZSBzZXJ2ZXIgZGlkbid0IHJlc3BvbmQsIHNvcnJ5LlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgLy8gZXJyb3IgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICBfdGhpcy5kYW5nZXIoZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5kYW5nZXIoXCJQbGVhc2UgbG9nIGluIChhZ2FpbikuXCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvLyB1bmtub3duIGVycm9yIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgX3RoaXMuZGFuZ2VyKGRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB2YWxpZGF0aW9uIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGFuZ2VyKGRhdGFba2V5XVswXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS51c2Vyc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgdXNlckNob29zZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLnVzZXJzXG4gKiBAZGVzY3JpcHRpb24gQW4gaW5wdXQgZmllbGQgdG8gZmluZCBhIHVzZXIuXG4gKiBAZXhhbXBsZVxuLy8gSFRNTFxuPGlucHV0IHBsYWNlaG9sZGVyPVwiU2VhcmNoIGJ5IHVzZXJuYW1lXCIgZGF0YS11c2VyLWNob29zZXI9XCJhZGRVc2VyXCIgLz5cblxuLy8gQ29udHJvbGxlciAoZXhhbXBsZSBmb3IgYWRkaW5nIGEgdXNlciB0byBhIHByb2plY3QpXG4kc2NvcGUuYWRkVXNlciA9IGZ1bmN0aW9uICh1c2VyKSB7XG5cdC8vIG5ldyB1c2VycyBhcmUgZ3Vlc3RzIGJ5IGRlZmF1bHRcblx0dmFyIHJvbGVJZCA9ICRzY29wZS5yb2xlcy5ndWVzdDtcblxuXHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHR1c2VyLnByb2plY3Rfcm9sZV9pZCA9IHJvbGVJZDtcblx0XHQkc2NvcGUudXNlcnMucHVzaCh1c2VyKTtcblx0fTtcblxuXHQvLyB1c2VyIHNob3VsZG4ndCBhbHJlYWR5IGV4aXN0XG5cdGlmICghZ2V0VXNlcih1c2VyLmlkKSkge1xuXHRcdFByb2plY3RVc2VyLmF0dGFjaChcblx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfSxcblx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0c3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3Jcblx0XHQpO1xuXHR9XG59O1xuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLnVzZXJzJykuZGlyZWN0aXZlKCd1c2VyQ2hvb3NlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXG5cdFx0XHRzY29wZToge1xuXHRcdFx0XHRzZWxlY3Q6ICc9dXNlckNob29zZXInXG5cdFx0XHR9LFxuXG5cdFx0XHRyZXBsYWNlOiB0cnVlLFxuXG5cdFx0XHR0ZW1wbGF0ZTogJzxpbnB1dCB0eXBlPVwidGV4dFwiIGRhdGEtbmctbW9kZWw9XCJzZWxlY3RlZFwiIGRhdGEtdWliLXR5cGVhaGVhZD1cInVzZXIubmFtZSBmb3IgdXNlciBpbiBmaW5kKCR2aWV3VmFsdWUpXCIgZGF0YS10eXBlYWhlYWQtd2FpdC1tcz1cIjI1MFwiIGRhdGEtdHlwZWFoZWFkLW9uLXNlbGVjdD1cInNlbGVjdCgkaXRlbSlcIi8+JyxcblxuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgVXNlcikge1xuXHRcdFx0XHQkc2NvcGUuZmluZCA9IGZ1bmN0aW9uIChxdWVyeSkge1xuXHRcdFx0XHRcdHJldHVybiBVc2VyLmZpbmQoe3F1ZXJ5OiBxdWVyeX0pLiRwcm9taXNlO1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS5tZXNzYWdlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIE1lc3NhZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudWkubWVzc2FnZXNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSBsaXZlIGRpc3BsYXkgb2YgdXNlciBmZWVkYmFjayBtZXNzYWdlcyB2aWEgSlNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5jb250cm9sbGVyKCdNZXNzYWdlc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBNQVhfTVNHKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuYWxlcnRzID0gW107XG5cbiAgICAgICAgdmFyIGNsb3NlRnVsbHNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4pIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuXHRcdC8vIG1ha2UgbWV0aG9kIGFjY2Vzc2libGUgYnkgb3RoZXIgbW9kdWxlc1xuXHRcdHdpbmRvdy4kZGlhc1Bvc3RNZXNzYWdlID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNsb3NlRnVsbHNjcmVlbigpO1xuXHRcdFx0JHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdFx0JHNjb3BlLmFsZXJ0cy51bnNoaWZ0KHtcblx0XHRcdFx0XHRtZXNzYWdlOiBtZXNzYWdlLFxuXHRcdFx0XHRcdHR5cGU6IHR5cGUgfHwgJ2luZm8nXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmICgkc2NvcGUuYWxlcnRzLmxlbmd0aCA+IE1BWF9NU0cpIHtcblx0XHRcdFx0XHQkc2NvcGUuYWxlcnRzLnBvcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlID0gZnVuY3Rpb24gKGluZGV4KSB7XG5cdFx0XHQkc2NvcGUuYWxlcnRzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLnV0aWxzXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgZmlsdGVyRXhjbHVkZVxuICogQG1lbWJlck9mIGRpYXMudWkudXRpbHNcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyBhIGZ1bmN0aW9uIHRoYXQgcmVtb3ZlcyBhbGwgbnVtYmVycyBvZiB0aGUgZmlyc3QgYXJndW1lbnQgYXJyYXkgKGluIHBsYWNlISkgdGhhdCBhcmUgbm90IHByZXNlbnQgaW4gdGhlIHNlY29uZCBhcmd1bWVudCBhcnJheS4gQWNjZXB0cyBhIHRoaXJkIGFyZ3VtZW50IGJvb2xlYW4gYXMgdG8gd2hldGhlciB0aGUgc2Vjb25kIGFyZ3VtZW50IGFycmF5IGlzIGFscmVhZHkgc29ydGVkLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS51dGlscycpLmZhY3RvcnkoJ2ZpbHRlckV4Y2x1ZGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuICAgICAgICAvLyBjb21wYXJpc29uIGZ1bmN0aW9uIGZvciBhcnJheS5zb3J0KCkgd2l0aCBudW1iZXJzXG4gICAgICAgIHZhciBjb21wYXJlTnVtYmVycyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyB0aGUgYXJyYXkgY29udGFpbmluZyBvbmx5IGVsZW1lbnRzIHRoYXQgYXJlIG5vdCBwcmVzZW50IGluIHN1cGVyc2V0XG4gICAgICAgIC8vIGFzc3VtZXMgdGhhdCBzdXBlcnNldCBpcyBzb3J0ZWQgaWYgc29ydGVkIGV2YWx1YXRlcyB0byB0cnVlXG4gICAgICAgIC8vIGRvZXNuJ3QgY2hhbmdlIHRoZSBvcmRlcmluZyBvZiBlbGVtZW50cyBpbiB0aGUgc3Vic2V0IGFycmF5XG4gICAgICAgIHZhciBmaWx0ZXJFeGNsdWRlID0gZnVuY3Rpb24gKHN1YnNldCwgc3VwZXJzZXQsIHNvcnRlZCkge1xuICAgICAgICAgICAgaWYgKCFzb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBjbG9uZSBhcnJheSBzbyBzb3J0aW5nIGRvZXNuJ3QgYWZmZWN0IG9yaWdpbmFsXG4gICAgICAgICAgICAgICAgc3VwZXJzZXQgPSBzdXBlcnNldC5zbGljZSgwKS5zb3J0KGNvbXBhcmVOdW1iZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNsb25lIHRoZSBpbnB1dCBhcnJheSAoc28gaXQgaXNuJ3QgY2hhbmdlZCBieSBzb3J0aW5nKSwgdGhlbiBzb3J0IGl0XG4gICAgICAgICAgICB2YXIgc29ydGVkU3Vic2V0ID0gc3Vic2V0LnNsaWNlKDApLnNvcnQoY29tcGFyZU51bWJlcnMpO1xuICAgICAgICAgICAgdmFyIGkgPSAwLCBqID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChpIDwgc3VwZXJzZXQubGVuZ3RoICYmIGogPCBzb3J0ZWRTdWJzZXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1cGVyc2V0W2ldIDwgc29ydGVkU3Vic2V0W2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN1cGVyc2V0W2ldID09PSBzb3J0ZWRTdWJzZXRbal0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoYSB2YWx1ZSB0aGF0IGlzIGJvdGggaW4gc3Vic2V0IGFuZCBzdXBlcnNldFxuICAgICAgICAgICAgICAgICAgICBzdWJzZXQuc3BsaWNlKHN1YnNldC5pbmRleE9mKHNvcnRlZFN1YnNldFtqXSksIDEpO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBqKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBmaWx0ZXJFeGNsdWRlO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS51dGlsc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIGZpbHRlclN1YnNldFxuICogQG1lbWJlck9mIGRpYXMudWkudXRpbHNcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyBhIGZ1bmN0aW9uIHRoYXQgcmVtb3ZlcyBhbGwgbnVtYmVycyBvZiB0aGUgZmlyc3QgYXJndW1lbnQgYXJyYXkgKGluIHBsYWNlISkgdGhhdCBhcmUgbm90IHByZXNlbnQgaW4gdGhlIHNlY29uZCBhcmd1bWVudCBhcnJheS4gQWNjZXB0cyBhIHRoaXJkIGFyZ3VtZW50IGJvb2xlYW4gYXMgdG8gd2hldGhlciB0aGUgc2Vjb25kIGFyZ3VtZW50IGFycmF5IGlzIGFscmVhZHkgc29ydGVkLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS51dGlscycpLmZhY3RvcnkoJ2ZpbHRlclN1YnNldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgICAgIC8vIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGFycmF5LnNvcnQoKSB3aXRoIG51bWJlcnNcbiAgICAgICAgdmFyIGNvbXBhcmVOdW1iZXJzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhIC0gYjtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIHRoZSBzdWJzZXQgYXJyYXkgd2l0aG91dCB0aGUgZWxlbWVudHMgdGhhdCBhcmUgbm90IHByZXNlbnQgaW4gc3VwZXJzZXRcbiAgICAgICAgLy8gYXNzdW1lcyB0aGF0IHN1cGVyc2V0IGlzIHNvcnRlZCBpZiBzb3J0ZWQgZXZhbHVhdGVzIHRvIHRydWVcbiAgICAgICAgLy8gZG9lc24ndCBjaGFuZ2UgdGhlIG9yZGVyaW5nIG9mIGVsZW1lbnRzIGluIHRoZSBzdWJzZXQgYXJyYXlcbiAgICAgICAgdmFyIGZpbHRlclN1YnNldCA9IGZ1bmN0aW9uIChzdWJzZXQsIHN1cGVyc2V0LCBzb3J0ZWQpIHtcbiAgICAgICAgICAgIGlmICghc29ydGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gY2xvbmUgYXJyYXkgc28gc29ydGluZyBkb2Vzbid0IGFmZmVjdCBvcmlnaW5hbFxuICAgICAgICAgICAgICAgIHN1cGVyc2V0ID0gc3VwZXJzZXQuc2xpY2UoMCkuc29ydChjb21wYXJlTnVtYmVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjbG9uZSB0aGUgaW5wdXQgYXJyYXkgKHNvIGl0IGlzbid0IGNoYW5nZWQgYnkgc29ydGluZyksIHRoZW4gc29ydCBpdFxuICAgICAgICAgICAgdmFyIHNvcnRlZFN1YnNldCA9IHN1YnNldC5zbGljZSgwKS5zb3J0KGNvbXBhcmVOdW1iZXJzKTtcbiAgICAgICAgICAgIC8vIGhlcmUgd2Ugd2lsbCBwdXQgYWxsIGl0ZW1zIG9mIHN1YnNldCB0aGF0IGFyZSBub3QgcHJlc2VudCBpbiBzdXBlcnNldFxuICAgICAgICAgICAgdmFyIG5vdFRoZXJlID0gW107XG4gICAgICAgICAgICB2YXIgaSA9IDAsIGogPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGkgPCBzdXBlcnNldC5sZW5ndGggJiYgaiA8IHNvcnRlZFN1YnNldC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VwZXJzZXRbaV0gPCBzb3J0ZWRTdWJzZXRbal0pIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3VwZXJzZXRbaV0gPT09IHNvcnRlZFN1YnNldFtqXSkge1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub3RUaGVyZS5wdXNoKHNvcnRlZFN1YnNldFtqKytdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBhZGQgcG9zc2libGUgbWlzc2luZyBpdGVtcyBpZiBzb3J0ZWRTdWJzZXQgaXMgbG9uZ2VyIHRoYW4gc3VwZXJzZXRcbiAgICAgICAgICAgIHdoaWxlIChqIDwgc29ydGVkU3Vic2V0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIG5vdFRoZXJlLnB1c2goc29ydGVkU3Vic2V0W2orK10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBub3cgcmVtb3ZlIGFsbCBlbGVtZW50cyBmcm9tIHN1YnNldCB0aGF0IGFyZSBub3QgaW4gc3VwZXJzZXRcbiAgICAgICAgICAgIC8vIHdlIGRvIGl0IHRoaXMgd2F5IGJlY2F1c2UgdGhlIG5vdFRoZXJlIGFycmF5IHdpbGwgcHJvYmFibHkgYWx3YXlzIGJlIHZlcnkgc21hbGxcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBub3RUaGVyZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIHdlIGNhbiBhc3N1bWUgdGhhdCBpbmRleE9mIGlzIG5ldmVyIDwwXG4gICAgICAgICAgICAgICAgc3Vic2V0LnNwbGljZShzdWJzZXQuaW5kZXhPZihub3RUaGVyZVtpXSksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBmaWx0ZXJTdWJzZXQ7XG4gICAgfVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
