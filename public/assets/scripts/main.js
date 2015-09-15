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
 * @namespace dias.ui
 * @description The DIAS UI AngularJS module.
 */
angular.module('dias.ui', ['dias.ui.messages', 'dias.ui.users']);


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

	return $resource(URL + '/api/v1/:endpoint/:id/:slug',
		{ id: '@id'	},
		{
			get: {
				method: 'GET',
				params: { endpoint: 'annotations' }
			},
			save: {
				method: 'PUT',
				params: { endpoint: 'annotations' }
			},
			delete: {
				method: 'DELETE',
				params: { endpoint: 'annotations' }
			},
			query: {
				method: 'GET',
				params: { endpoint: 'images', slug: 'annotations' },
				isArray: true
			},
			add: {
				method: 'POST',
				params: { endpoint: 'images', slug: 'annotations' }
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

	return $resource(URL + '/api/v1/:prefix/:annotation_id/:suffix/:id', {
			id: '@id',
			annotation_id: '@annotation_id'
		}, {
			query: {
				method: 'GET',
				params: { prefix: 'annotations', suffix: 'labels' },
				isArray: true
			},
			attach: {
				method: 'POST',
				params: { prefix: 'annotations', suffix: 'labels' }
			},
			save: {
				method: 'PUT',
				params: { prefix: 'annotation-labels', annotation_id: null, suffix: null }
			},
			delete: {
				method: 'DELETE',
				params: { prefix: 'annotation-labels', annotation_id: null, suffix: null }
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

			template: '<input type="text" data-ng-model="selected" data-typeahead="user.name for user in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

			controller: ["$scope", "User", function ($scope, User) {
				$scope.find = function (query) {
					return User.find({query: query}).$promise;
				};
			}]
		};
	}
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
 * @ngdoc controller
 * @name MessagesController
 * @memberOf dias.ui.messages
 * @description Handles the live display of user feedback messages via JS
 */
angular.module('dias.ui.messages').controller('MessagesController', ["$scope", "MAX_MSG", function ($scope, MAX_MSG) {
		"use strict";

		$scope.alerts = [];

		// make method accessible by other modules
		window.$diasPostMessage = function (type, message) {
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

			if (response.status === 401) {
				_this.danger("Please log in (again).");
			} else if (!data) {
				_this.danger("The server didn't respond, sorry.");
			} else if (data.message) {
				// error response
				_this.danger(data.message);
			} else if (data) {
				// validation response
				for (var key in data) {
					_this.danger(data[key][0]);
				}
			} else {
				// unknown error response
				_this.danger("There was an error, sorry.");
			}
		};
	}
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJhcGkvY29uc3RhbnRzL1VSTC5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbi5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbkxhYmVsLmpzIiwiYXBpL2ZhY3Rvcmllcy9BdHRyaWJ1dGUuanMiLCJhcGkvZmFjdG9yaWVzL0ltYWdlLmpzIiwiYXBpL2ZhY3Rvcmllcy9MYWJlbC5qcyIsImFwaS9mYWN0b3JpZXMvTWVkaWFUeXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9Pd25Vc2VyLmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0LmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0TGFiZWwuanMiLCJhcGkvZmFjdG9yaWVzL1Byb2plY3RUcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvUHJvamVjdFVzZXIuanMiLCJhcGkvZmFjdG9yaWVzL1JvbGUuanMiLCJhcGkvZmFjdG9yaWVzL1NoYXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9UcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvVHJhbnNlY3RJbWFnZS5qcyIsImFwaS9mYWN0b3JpZXMvVXNlci5qcyIsImFwaS9zZXJ2aWNlcy9yb2xlcy5qcyIsImFwaS9zZXJ2aWNlcy9zaGFwZXMuanMiLCJ1aS91c2Vycy9kaXJlY3RpdmVzL3VzZXJDaG9vc2VyLmpzIiwidWkvbWVzc2FnZXMvY29uc3RhbnRzL01BWF9NU0cuanMiLCJ1aS9tZXNzYWdlcy9jb250cm9sbGVyL01lc3NhZ2VzQ29udHJvbGxlci5qcyIsInVpL21lc3NhZ2VzL3NlcnZpY2VzL21zZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxZQUFBLENBQUE7O0FBRUEsUUFBQSxPQUFBLFlBQUEseUJBQUEsVUFBQSxlQUFBO0NBQ0E7O0NBRUEsY0FBQSxTQUFBLFFBQUEsT0FBQTtFQUNBOzs7Ozs7O0FBT0EsUUFBQSxPQUFBLG9CQUFBLENBQUE7OztBQUdBLFFBQUEsUUFBQSxVQUFBLE1BQUEsWUFBQTtDQUNBOztDQUVBLFFBQUE7RUFDQSxTQUFBLGNBQUE7RUFDQSxDQUFBOzs7Ozs7OztBQVFBLFFBQUEsT0FBQSxpQkFBQSxDQUFBLGdCQUFBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsV0FBQSxDQUFBLG9CQUFBOzs7Ozs7Ozs7OztBQy9CQSxRQUFBLE9BQUEsWUFBQSxTQUFBLE9BQUEsT0FBQSxnQkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzJDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLG1DQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7RUFDQSxFQUFBLElBQUE7RUFDQTtHQUNBLEtBQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFVBQUE7O0dBRUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsVUFBQTs7R0FFQSxRQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxVQUFBOztHQUVBLE9BQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFVBQUEsVUFBQSxNQUFBO0lBQ0EsU0FBQTs7R0FFQSxLQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxVQUFBLFVBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzNDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsOENBQUE7R0FDQSxJQUFBO0dBQ0EsZUFBQTtLQUNBO0dBQ0EsT0FBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsUUFBQSxlQUFBLFFBQUE7SUFDQSxTQUFBOztHQUVBLFFBQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFFBQUEsZUFBQSxRQUFBOztHQUVBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFFBQUEscUJBQUEsZUFBQSxNQUFBLFFBQUE7O0dBRUEsUUFBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsUUFBQSxxQkFBQSxlQUFBLE1BQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNyQkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxrQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLDBCQUFBLEVBQUEsSUFBQSxTQUFBO0VBQ0EsS0FBQSxDQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN0QkEsUUFBQSxPQUFBLFlBQUEsUUFBQSw4QkFBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ29CQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDhCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsc0JBQUEsRUFBQSxJQUFBO0VBQ0E7R0FDQSxLQUFBLENBQUEsUUFBQTtHQUNBLE1BQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzFCQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGtDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsMkJBQUEsRUFBQSxJQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDT0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxnQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLG9CQUFBLElBQUE7RUFDQSxNQUFBLENBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNRQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsd0JBQUEsRUFBQSxJQUFBO0VBQ0E7O0dBRUEsT0FBQSxFQUFBLFFBQUEsT0FBQSxRQUFBLEVBQUEsSUFBQSxRQUFBLFNBQUE7R0FDQSxLQUFBLEVBQUEsUUFBQTtHQUNBLE1BQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxxQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLHVDQUFBLENBQUEsWUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2dDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7RUFDQSxFQUFBLElBQUE7RUFDQTtHQUNBLEtBQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7R0FDQSxRQUFBLEVBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM3QkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxvQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBO0VBQ0EsRUFBQSxJQUFBO0VBQ0E7R0FDQSxNQUFBLEVBQUEsUUFBQTtHQUNBLFFBQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDakJBLFFBQUEsT0FBQSxZQUFBLFFBQUEsNkJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxxQkFBQSxFQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0hBLFFBQUEsT0FBQSxZQUFBLFFBQUEsOEJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxzQkFBQSxFQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0FBLFFBQUEsT0FBQSxZQUFBLFFBQUEsaUNBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTtFQUNBLEVBQUEsSUFBQTtFQUNBO0dBQ0EsTUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2RBLFFBQUEsT0FBQSxZQUFBLFFBQUEsc0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ29DQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDZCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsNEJBQUEsRUFBQSxJQUFBLFNBQUE7RUFDQSxNQUFBLEVBQUEsUUFBQTtFQUNBLEtBQUEsRUFBQSxRQUFBO01BQ0EsTUFBQSxFQUFBLFFBQUEsT0FBQSxRQUFBLEVBQUEsSUFBQSxVQUFBLFNBQUE7Ozs7Ozs7Ozs7Ozs7QUNqREEsUUFBQSxPQUFBLFlBQUEsUUFBQSxrQkFBQSxVQUFBLE1BQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7RUFDQSxJQUFBLGVBQUE7O0VBRUEsS0FBQSxNQUFBLFVBQUEsR0FBQTtHQUNBLEVBQUEsUUFBQSxVQUFBLE1BQUE7SUFDQSxNQUFBLEtBQUEsTUFBQSxLQUFBO0lBQ0EsYUFBQSxLQUFBLFFBQUEsS0FBQTs7OztFQUlBLEtBQUEsVUFBQSxVQUFBLElBQUE7R0FDQSxPQUFBLE1BQUE7OztFQUdBLEtBQUEsUUFBQSxVQUFBLE1BQUE7R0FDQSxPQUFBLGFBQUE7Ozs7Ozs7Ozs7Ozs7OztBQ2pCQSxRQUFBLE9BQUEsWUFBQSxRQUFBLG9CQUFBLFVBQUEsT0FBQTtFQUNBOztFQUVBLElBQUEsU0FBQTtFQUNBLElBQUEsZ0JBQUE7O0VBRUEsSUFBQSxZQUFBLE1BQUEsTUFBQSxVQUFBLEdBQUE7R0FDQSxFQUFBLFFBQUEsVUFBQSxPQUFBO0lBQ0EsT0FBQSxNQUFBLE1BQUEsTUFBQTtJQUNBLGNBQUEsTUFBQSxRQUFBLE1BQUE7Ozs7RUFJQSxLQUFBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsT0FBQSxPQUFBOzs7RUFHQSxLQUFBLFFBQUEsVUFBQSxNQUFBO0dBQ0EsT0FBQSxjQUFBOzs7RUFHQSxLQUFBLFNBQUEsWUFBQTtHQUNBLE9BQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDRkEsUUFBQSxPQUFBLGlCQUFBLFVBQUEsZUFBQSxZQUFBO0VBQ0E7O0VBRUEsT0FBQTtHQUNBLFVBQUE7O0dBRUEsT0FBQTtJQUNBLFFBQUE7OztHQUdBLFNBQUE7O0dBRUEsVUFBQTs7R0FFQSwrQkFBQSxVQUFBLFFBQUEsTUFBQTtJQUNBLE9BQUEsT0FBQSxVQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsS0FBQSxDQUFBLE9BQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7O0FDdkNBLFFBQUEsT0FBQSxvQkFBQSxTQUFBLFdBQUE7Ozs7Ozs7O0FDREEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsNENBQUEsVUFBQSxRQUFBLFNBQUE7RUFDQTs7RUFFQSxPQUFBLFNBQUE7OztFQUdBLE9BQUEsbUJBQUEsVUFBQSxNQUFBLFNBQUE7R0FDQSxPQUFBLE9BQUEsV0FBQTtJQUNBLE9BQUEsT0FBQSxRQUFBO0tBQ0EsU0FBQTtLQUNBLE1BQUEsUUFBQTs7O0lBR0EsSUFBQSxPQUFBLE9BQUEsU0FBQSxTQUFBO0tBQ0EsT0FBQSxPQUFBOzs7OztFQUtBLE9BQUEsUUFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLE9BQUEsT0FBQSxPQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ1RBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLE9BQUEsWUFBQTtFQUNBO0VBQ0EsSUFBQSxRQUFBOztFQUVBLEtBQUEsT0FBQSxVQUFBLE1BQUEsU0FBQTtHQUNBLFVBQUEsV0FBQTtHQUNBLE9BQUEsaUJBQUEsTUFBQTs7O0VBR0EsS0FBQSxTQUFBLFVBQUEsU0FBQTtHQUNBLE1BQUEsS0FBQSxVQUFBOzs7RUFHQSxLQUFBLFVBQUEsVUFBQSxTQUFBO0dBQ0EsTUFBQSxLQUFBLFdBQUE7OztFQUdBLEtBQUEsVUFBQSxVQUFBLFNBQUE7R0FDQSxNQUFBLEtBQUEsV0FBQTs7O0VBR0EsS0FBQSxPQUFBLFVBQUEsU0FBQTtHQUNBLE1BQUEsS0FBQSxRQUFBOzs7RUFHQSxLQUFBLGdCQUFBLFVBQUEsVUFBQTtHQUNBLElBQUEsT0FBQSxTQUFBOztHQUVBLElBQUEsU0FBQSxXQUFBLEtBQUE7SUFDQSxNQUFBLE9BQUE7VUFDQSxJQUFBLENBQUEsTUFBQTtJQUNBLE1BQUEsT0FBQTtVQUNBLElBQUEsS0FBQSxTQUFBOztJQUVBLE1BQUEsT0FBQSxLQUFBO1VBQ0EsSUFBQSxNQUFBOztJQUVBLEtBQUEsSUFBQSxPQUFBLE1BQUE7S0FDQSxNQUFBLE9BQUEsS0FBQSxLQUFBOztVQUVBOztJQUVBLE1BQUEsT0FBQTs7Ozs7QUFLQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgYXBpIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScsIFsnbmdSZXNvdXJjZSddKTtcblxuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdCRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bXCJYLVJlcXVlc3RlZC1XaXRoXCJdID1cblx0XHRcIlhNTEh0dHBSZXF1ZXN0XCI7XG59KTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkubWVzc2FnZXNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB1c2VyIGZlZWRiYWNrIG1lc3NhZ2VzIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLm1lc3NhZ2VzJywgWyd1aS5ib290c3RyYXAnXSk7XG5cbi8vIGJvb3RzdHJhcCB0aGUgbWVzc2FnZXMgbW9kdWxlXG5hbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0YW5ndWxhci5ib290c3RyYXAoXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtbmctY29udHJvbGxlcj1cIk1lc3NhZ2VzQ29udHJvbGxlclwiXScpLFxuXHRcdFsnZGlhcy51aS5tZXNzYWdlcyddXG5cdCk7XG59KTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkudXNlcnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB1c2VycyBVSSBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS51c2VycycsIFsndWkuYm9vdHN0cmFwJywgJ2RpYXMuYXBpJ10pO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aVxuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIFVJIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpJywgWydkaWFzLnVpLm1lc3NhZ2VzJywgJ2RpYXMudWkudXNlcnMnXSk7XG5cbiIsIi8qKlxuICogQG5nZG9jIGNvbnN0YW50XG4gKiBAbmFtZSBVUkxcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFRoZSBiYXNlIHVybCBvZiB0aGUgYXBwbGljYXRpb24uXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuY29uc3RhbnQoJ1VSTCcsIHdpbmRvdy4kZGlhc0Jhc2VVcmwgfHwgJycpOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEFubm90YXRpb25cbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgYW5ub3RhdGlvbnMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIHJldHJpZXZpbmcgdGhlIHNoYXBlIElEIG9mIGFuIGFubm90YXRpb25cbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5nZXQoe2lkOiAxMjN9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhbm5vdGF0aW9uLnNoYXBlX2lkKTtcbn0pO1xuXG4vLyBzYXZpbmcgYW4gYW5ub3RhdGlvbiAodXBkYXRpbmcgdGhlIGFubm90YXRpb24gcG9pbnRzKVxudmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBhbm5vdGF0aW9uLnBvaW50cyA9IFt7eDogMTAsIHk6IDEwfV07XG4gICBhbm5vdGF0aW9uLiRzYXZlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Bbm5vdGF0aW9uLnNhdmUoe1xuICAgaWQ6IDEsIHBvaW50czogW3t4OiAxMCwgeTogMTB9XVxufSk7XG5cbi8vIGRlbGV0aW5nIGFuIGFubm90YXRpb25cbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5nZXQoe2lkOiAxMjN9LCBmdW5jdGlvbiAoKSB7XG4gICBhbm5vdGF0aW9uLiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbkFubm90YXRpb24uZGVsZXRlKHtpZDogMTIzfSk7XG5cbi8vIGdldCBhbGwgYW5ub3RhdGlvbnMgb2YgYW4gaW1hZ2Vcbi8vIG5vdGUsIHRoYXQgdGhlIGBpZGAgaXMgbm93IHRoZSBpbWFnZSBJRCBhbmQgbm90IHRoZSBhbm5vdGF0aW9uIElEIGZvciB0aGVcbi8vIHF1ZXJ5IVxudmFyIGFubm90YXRpb25zID0gQW5ub3RhdGlvbi5xdWVyeSh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhbm5vdGF0aW9ucyk7IC8vIFt7aWQ6IDEsIHNoYXBlX2lkOiAxLCAuLi59LCAuLi5dXG59KTtcblxuLy8gYWRkIGEgbmV3IGFubm90YXRpb24gdG8gYW4gaW1hZ2Vcbi8vIG5vdGUsIHRoYXQgdGhlIGBpZGAgaXMgbm93IHRoZSBpbWFnZSBJRCBhbmQgbm90IHRoZSBhbm5vdGF0aW9uIElEIGZvciB0aGVcbi8vIHF1ZXJ5IVxudmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmFkZCh7XG4gICBpZDogMSxcbiAgIHNoYXBlX2lkOiAxLFxuICAgbGFiZWxfaWQ6IDEsXG4gICBjb25maWRlbmNlOiAwLjVcbiAgIHBvaW50czogW1xuICAgICAgeyB4OiAxMCwgeTogMjAgfVxuICAgXVxufSk7XG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnQW5ub3RhdGlvbicsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxLzplbmRwb2ludC86aWQvOnNsdWcnLFxuXHRcdHsgaWQ6ICdAaWQnXHR9LFxuXHRcdHtcblx0XHRcdGdldDoge1xuXHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHRwYXJhbXM6IHsgZW5kcG9pbnQ6ICdhbm5vdGF0aW9ucycgfVxuXHRcdFx0fSxcblx0XHRcdHNhdmU6IHtcblx0XHRcdFx0bWV0aG9kOiAnUFVUJyxcblx0XHRcdFx0cGFyYW1zOiB7IGVuZHBvaW50OiAnYW5ub3RhdGlvbnMnIH1cblx0XHRcdH0sXG5cdFx0XHRkZWxldGU6IHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0cGFyYW1zOiB7IGVuZHBvaW50OiAnYW5ub3RhdGlvbnMnIH1cblx0XHRcdH0sXG5cdFx0XHRxdWVyeToge1xuXHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHRwYXJhbXM6IHsgZW5kcG9pbnQ6ICdpbWFnZXMnLCBzbHVnOiAnYW5ub3RhdGlvbnMnIH0sXG5cdFx0XHRcdGlzQXJyYXk6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRhZGQ6IHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHBhcmFtczogeyBlbmRwb2ludDogJ2ltYWdlcycsIHNsdWc6ICdhbm5vdGF0aW9ucycgfVxuXHRcdFx0fVxuXHRcdH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgQW5ub3RhdGlvbkxhYmVsXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGFubm90YXRpb24gbGFiZWxzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIGxhYmVscyBvZiBhbiBhbm5vdGF0aW9uIGFuZCB1cGRhdGUgb25lIG9mIHRoZW1cbnZhciBsYWJlbHMgPSBBbm5vdGF0aW9uTGFiZWwucXVlcnkoe2Fubm90YXRpb25faWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgbGFiZWwgPSBsYWJlbHNbMF07XG4gICBsYWJlbC5jb25maWRlbmNlID0gMC45O1xuICAgbGFiZWwuJHNhdmUoKTtcbn0pO1xuXG4vLyBkaXJlY3RseSB1cGRhdGUgYSBsYWJlbFxuQW5ub3RhdGlvbkxhYmVsLnNhdmUoe2NvbmZpZGVuY2U6IDAuMSwgYW5ub3RhdGlvbl9pZDogMSwgaWQ6IDF9KTtcblxuLy8gYXR0YWNoIGEgbmV3IGxhYmVsIHRvIGFuIGFubm90YXRpb25cbnZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goe2xhYmVsX2lkOiAxLCBjb25maWRlbmNlOiAwLjUsIGFubm90YXRpb25faWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbCk7IC8vIHtpZDogMSwgbmFtZTogJ215IGxhYmVsJywgdXNlcl9pZDogMSwgLi4ufVxufSk7XG5cblxuLy8gZGV0YWNoIGEgbGFiZWxcbnZhciBsYWJlbHMgPSBBbm5vdGF0aW9uTGFiZWwucXVlcnkoe2Fubm90YXRpb25faWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgbGFiZWwgPSBsYWJlbHNbMF07XG4gICBsYWJlbC4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Bbm5vdGF0aW9uTGFiZWwuZGVsZXRlKHtpZDogMX0pO1xuICogXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0Fubm90YXRpb25MYWJlbCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxLzpwcmVmaXgvOmFubm90YXRpb25faWQvOnN1ZmZpeC86aWQnLCB7XG5cdFx0XHRpZDogJ0BpZCcsXG5cdFx0XHRhbm5vdGF0aW9uX2lkOiAnQGFubm90YXRpb25faWQnXG5cdFx0fSwge1xuXHRcdFx0cXVlcnk6IHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0cGFyYW1zOiB7IHByZWZpeDogJ2Fubm90YXRpb25zJywgc3VmZml4OiAnbGFiZWxzJyB9LFxuXHRcdFx0XHRpc0FycmF5OiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YXR0YWNoOiB7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHRwYXJhbXM6IHsgcHJlZml4OiAnYW5ub3RhdGlvbnMnLCBzdWZmaXg6ICdsYWJlbHMnIH1cblx0XHRcdH0sXG5cdFx0XHRzYXZlOiB7XG5cdFx0XHRcdG1ldGhvZDogJ1BVVCcsXG5cdFx0XHRcdHBhcmFtczogeyBwcmVmaXg6ICdhbm5vdGF0aW9uLWxhYmVscycsIGFubm90YXRpb25faWQ6IG51bGwsIHN1ZmZpeDogbnVsbCB9XG5cdFx0XHR9LFxuXHRcdFx0ZGVsZXRlOiB7XG5cdFx0XHRcdG1ldGhvZDogJ0RFTEVURScsXG5cdFx0XHRcdHBhcmFtczogeyBwcmVmaXg6ICdhbm5vdGF0aW9uLWxhYmVscycsIGFubm90YXRpb25faWQ6IG51bGwsIHN1ZmZpeDogbnVsbCB9XG5cdFx0XHR9XG5cdH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgQXR0cmlidXRlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGF0dHJpYnV0ZXMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGxpc3QgYWxsIGF0dHJpYnV0ZXNcbnZhciBhdHRyaWJ1dGVzID0gQXR0cmlidXRlLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGF0dHJpYnV0ZXMpOyAvLyBbe2lkOiAxLCB0eXBlOiAnYm9vbGVhbicsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgYSBzcGVjaWZpYyBhdHRyaWJ1dGVcbnZhciBhdHRyaWJ1dGUgPSBBdHRyaWJ1dGUuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGF0dHJpYnV0ZSk7IC8vIHtpZDogMSwgdHlwZTogJ2Jvb2xlYW4nLCAuLi59XG59KTtcblxuLy8gY3JlYXRlIGEgbmV3IGF0dHJpYnV0ZVxudmFyIGF0dHJpYnV0ZSA9IEF0dHJpYnV0ZS5hZGQoe1xuICAgICAgbmFtZTogJ2JhZF9xdWFsaXR5JywgdHlwZTogJ2Jvb2xlYW4nXG4gICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyhhdHRyaWJ1dGUpOyAvLyB7aWQ6IDEsIG5hbWU6ICdiYWRfcXVhbGl0eScsIC4uLn1cbn0pO1xuXG4vLyBkZWxldGUgYW4gYXR0cmlidXRlXG52YXIgYXR0cmlidXRlcyA9IEF0dHJpYnV0ZS5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICB2YXIgYXR0cmlidXRlID0gYXR0cmlidXRlc1swXTtcbiAgIGF0dHJpYnV0ZS4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5BdHRyaWJ1dGUuZGVsZXRlKHtpZDogMX0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnQXR0cmlidXRlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvYXR0cmlidXRlcy86aWQnLCB7IGlkOiAnQGlkJyB9LCB7XG5cdFx0YWRkOiB7bWV0aG9kOiAnUE9TVCd9XG5cdH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgSW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgaW1hZ2VzLiBUaGlzIHJlc291cmNlIGlzIG9ubHkgZm9yIFxuICogZmluZGluZyBvdXQgd2hpY2ggdHJhbnNlY3QgYW4gaW1hZ2UgYmVsb25ncyB0by4gVGhlIGltYWdlIGZpbGVzIGFyZVxuICogZGlyZWN0bHkgY2FsbGVkIGZyb20gdGhlIEFQSS5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFuIGltYWdlXG52YXIgaW1hZ2UgPSBJbWFnZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coaW1hZ2UpOyAvLyB7aWQ6IDEsIHdpZHRoOiAxMDAwLCBoZWlnaHQ6IDc1MCwgdHJhbnNlY3Q6IHsuLi59LCAuLi59XG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0ltYWdlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvaW1hZ2VzLzppZCcpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgTGFiZWxcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgbGFiZWxzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIGxhYmVsc1xudmFyIGxhYmVscyA9IExhYmVsLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGxhYmVscyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwiQmVudGhpYyBPYmplY3RcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgbGFiZWxcbnZhciBsYWJlbCA9IExhYmVsLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbCk7IC8vIHtpZDogMSwgbmFtZTogXCJCZW50aGljIE9iamVjdFwiLCAuLi59XG59KTtcblxuLy8gY3JlYXRlIGEgbmV3IGxhYmVsXG52YXIgbGFiZWwgPSBMYWJlbC5hZGQoe25hbWU6IFwiVHJhc2hcIiwgcGFyZW50X2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWwpOyAvLyB7aWQ6IDIsIG5hbWU6IFwiVHJhc2hcIiwgcGFyZW50X2lkOiAxLCAuLi59XG59KTtcblxuLy8gdXBkYXRlIGEgbGFiZWxcbnZhciBsYWJlbCA9IExhYmVsLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBsYWJlbC5uYW1lID0gJ1RyYXNoJztcbiAgIGxhYmVsLiRzYXZlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5MYWJlbC5zYXZlKHtpZDogMSwgbmFtZTogJ1RyYXNoJ30pO1xuXG4vLyBkZWxldGUgYSBsYWJlbFxudmFyIGxhYmVsID0gTGFiZWwuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGxhYmVsLiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbkxhYmVsLmRlbGV0ZSh7aWQ6IDF9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0xhYmVsJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvbGFiZWxzLzppZCcsIHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0YWRkOiB7bWV0aG9kOiAnUE9TVCcgfSxcblx0XHRcdHNhdmU6IHsgbWV0aG9kOiAnUFVUJyB9XG5cdFx0fVxuXHQpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgTWVkaWFUeXBlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIG1lZGlhIHR5cGVzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIG1lZGlhIHR5cGVzXG52YXIgbWVkaWFUeXBlcyA9IE1lZGlhVHlwZS5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhtZWRpYVR5cGVzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJ0aW1lLXNlcmllc1wifSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgbWVkaWEgdHlwZVxudmFyIG1lZGlhVHlwZSA9IE1lZGlhVHlwZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobWVkaWFUeXBlKTsgLy8ge2lkOiAxLCBuYW1lOiBcInRpbWUtc2VyaWVzXCJ9XG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ01lZGlhVHlwZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL21lZGlhLXR5cGVzLzppZCcsIHsgaWQ6ICdAaWQnIH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgT3duVXNlclxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0aGUgbG9nZ2VkIGluIHVzZXIuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIHJldHJpZXZpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IE93blVzZXIuZ2V0KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXIuZmlyc3RuYW1lKTtcbn0pO1xuXG4vLyBjaGFuZ2luZyB0aGUgdXNlcm5hbWVcbnZhciB1c2VyID0gT3duVXNlci5nZXQoZnVuY3Rpb24gKCkge1xuICAgdXNlci5maXJzdG5hbWUgPT0gJ0pvZWwnO1xuICAgdXNlci4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuT3duVXNlci5zYXZlKHtmaXJzdG5hbWU6ICdKb2VsJ30pO1xuXG4vLyBkZWxldGluZyB0aGUgdXNlclxudmFyIHVzZXIgPSBPd25Vc2VyLmdldChmdW5jdGlvbiAoKSB7XG4gICB1c2VyLiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbk93blVzZXIuZGVsZXRlKCk7XG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnT3duVXNlcicsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3VzZXJzL215Jywge30sIHtcblx0XHRzYXZlOiB7bWV0aG9kOiAnUFVUJ31cblx0fSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBQcm9qZWN0XG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHByb2plY3RzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHByb2plY3RzLCB0aGUgY3VycmVudCB1c2VyIGJlbG9uZ3MgdG9cbnZhciBwcm9qZWN0cyA9IFByb2plY3QucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cocHJvamVjdHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcIlRlc3QgUHJvamVjdFwiLCAuLi59LCAuLi5dXG59KTtcblxuLy8gZ2V0IG9uZSBwcm9qZWN0XG52YXIgcHJvamVjdCA9IFByb2plY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHByb2plY3QpOyAvLyB7aWQ6IDEsIG5hbWU6IFwiVGVzdCBQcm9qZWN0XCIsIC4uLn1cbn0pO1xuXG4vLyBjcmVhdGUgYSBuZXcgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmFkZCh7bmFtZTogXCJNeSBQcm9qZWN0XCIsIGRlc2NyaXB0aW9uOiBcIm15IHByb2plY3RcIn0sXG4gICBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyhwcm9qZWN0KTsgLy8ge2lkOiAyLCBuYW1lOiBcIk15IFByb2plY3RcIiwgLi4ufVxuICAgfVxuKTtcblxuLy8gdXBkYXRlIGEgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBwcm9qZWN0Lm5hbWUgPSAnTmV3IFByb2plY3QnO1xuICAgcHJvamVjdC4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdC5zYXZlKHtpZDogMSwgbmFtZTogJ05ldyBQcm9qZWN0J30pO1xuXG4vLyBkZWxldGUgYSBwcm9qZWN0XG52YXIgcHJvamVjdCA9IFByb2plY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHByb2plY3QuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdC5kZWxldGUoe2lkOiAxfSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdQcm9qZWN0JywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcHJvamVjdHMvOmlkJywgeyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHQvLyBhIHVzZXIgY2FuIG9ubHkgcXVlcnkgdGhlaXIgb3duIHByb2plY3RzXG5cdFx0XHRxdWVyeTogeyBtZXRob2Q6ICdHRVQnLCBwYXJhbXM6IHsgaWQ6ICdteScgfSwgaXNBcnJheTogdHJ1ZSB9LFxuXHRcdFx0YWRkOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFByb2plY3RMYWJlbFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBsYWJlbHMgYmVsb25naW5nIHRvIGEgcHJvamVjdC5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBsYWJlbHMgb2YgdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgbGFiZWxzID0gUHJvamVjdExhYmVsLnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcIkNvcmFsXCIsIC4uLn0sIC4uLl1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUHJvamVjdExhYmVsJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcHJvamVjdHMvOnByb2plY3RfaWQvbGFiZWxzJywge3Byb2plY3RfaWQ6ICdAcHJvamVjdF9pZCd9KTtcbn0pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgUHJvamVjdFRyYW5zZWN0XG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHRyYW5zZWN0cyBiZWxvbmdpbmcgdG8gYSBwcm9qZWN0LlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHRyYW5zZWN0cyBvZiB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciB0cmFuc2VjdHMgPSBQcm9qZWN0VHJhbnNlY3QucXVlcnkoeyBwcm9qZWN0X2lkOiAxIH0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHRyYW5zZWN0cyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwidHJhbnNlY3QgMVwiLCAuLi59LCAuLi5dXG59KTtcblxuLy8gYWRkIGEgbmV3IHRyYW5zZWN0IHRvIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHRyYW5zZWN0ID0gUHJvamVjdFRyYW5zZWN0LmFkZCh7cHJvamVjdF9pZDogMX0sXG4gICB7XG4gICAgICBuYW1lOiBcInRyYW5zZWN0IDFcIixcbiAgICAgIHVybDogXCIvdm9sL3RyYW5zZWN0cy8xXCIsXG4gICAgICBtZWRpYV90eXBlX2lkOiAxLFxuICAgICAgaW1hZ2VzOiBbXCIxLmpwZ1wiLCBcIjIuanBnXCJdXG4gICB9LFxuICAgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2codHJhbnNlY3QpOyAvLyB7aWQ6IDEsIG5hbWU6IFwidHJhbnNlY3QgMVwiLCAuLi59XG4gICB9XG4pO1xuXG4vLyBhdHRhY2ggYW4gZXhpc3RpbmcgdHJhbnNlY3QgdG8gYW5vdGhlciBwcm9qZWN0XG52YXIgdHJhbnNlY3RzID0gUHJvamVjdFRyYW5zZWN0LnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgdHJhbnNlY3QgPSB0cmFuc2VjdHNbMF07XG4gICAvLyB0cmFuc2VjdCBpcyBub3cgYXR0YWNoZWQgdG8gcHJvamVjdCAxICphbmQqIDJcbiAgIHRyYW5zZWN0LiRhdHRhY2goe3Byb2plY3RfaWQ6IDJ9KTtcbn0pO1xuLy8gb3IgZGlyZWN0bHkgKHRyYW5zZWN0IDEgd2lsbCBiZSBhdHRhY2hlZCB0byBwcm9qZWN0IDIpXG5Qcm9qZWN0VHJhbnNlY3QuYXR0YWNoKHtwcm9qZWN0X2lkOiAyfSwge2lkOiAxfSk7XG5cbi8vIGRldGFjaCBhIHRyYW5zZWN0IGZyb20gdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdHJhbnNlY3RzID0gUHJvamVjdFRyYW5zZWN0LnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgdHJhbnNlY3QgPSB0cmFuc2VjdHNbMF07XG4gICB0cmFuc2VjdC4kZGV0YWNoKHtwcm9qZWN0X2lkOiAxfSk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Qcm9qZWN0VHJhbnNlY3QuZGV0YWNoKHtwcm9qZWN0X2lkOiAxfSwge2lkOiAxfSk7XG5cbi8vIGF0dGFjaGluZyBhbmQgZGV0YWNoaW5nIGNhbiBiZSBkb25lIHVzaW5nIGEgVHJhbnNlY3Qgb2JqZWN0IGFzIHdlbGw6XG52YXIgdHJhbnNlY3QgPSBUcmFuc2VjdC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgUHJvamVjdFRyYW5zZWN0LmF0dGFjaCh7cHJvamVjdF9pZDogMn0sIHRyYW5zZWN0KTtcbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUHJvamVjdFRyYW5zZWN0JywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcHJvamVjdHMvOnByb2plY3RfaWQvdHJhbnNlY3RzLzppZCcsXG5cdFx0eyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHRhZGQ6IHsgbWV0aG9kOiAnUE9TVCcgfSxcblx0XHRcdGF0dGFjaDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0ZGV0YWNoOiB7IG1ldGhvZDogJ0RFTEVURScgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFByb2plY3RVc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHVzZXJzIGJlbG9uZ2luZyB0byBhIHByb2plY3QuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgdXNlcnMgb2YgdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdXNlcnMgPSBQcm9qZWN0VXNlci5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2codXNlcnMpOyAvLyBbe2lkOiAxLCBmaXJzdG5hbWU6IFwiSmFuZVwiLCAuLi59LCAuLi5dXG59KTtcblxuLy8gdXBkYXRlIHRoZSBwcm9qZWN0IHJvbGUgb2YgYSB1c2VyXG5Qcm9qZWN0VXNlci5zYXZlKHtwcm9qZWN0X2lkOiAxfSwge2lkOiAxLCBwcm9qZWN0X3JvbGVfaWQ6IDF9KTtcblxuLy8gYXR0YWNoIGEgdXNlciB0byBhbm90aGVyIHByb2plY3RcblByb2plY3RVc2VyLmF0dGFjaCh7cHJvamVjdF9pZDogMn0sIHtpZDogMSwgcHJvamVjdF9yb2xlX2lkOiAyfSk7XG5cbi8vIGRldGFjaCBhIHVzZXIgZnJvbSB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciB1c2VycyA9IFByb2plY3RVc2VyLnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICB2YXIgdXNlciA9IHVzZXJzWzBdO1xuICAgdXNlci4kZGV0YWNoKHtwcm9qZWN0X2lkOiAxfSk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Qcm9qZWN0VXNlci5kZXRhY2goe3Byb2plY3RfaWQ6IDF9LCB7aWQ6IDF9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1Byb2plY3RVc2VyJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcHJvamVjdHMvOnByb2plY3RfaWQvdXNlcnMvOmlkJyxcblx0XHR7IGlkOiAnQGlkJyB9LFxuXHRcdHtcblx0XHRcdHNhdmU6IHsgbWV0aG9kOiAnUFVUJyB9LFxuXHRcdFx0YXR0YWNoOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRkZXRhY2g6IHsgbWV0aG9kOiAnREVMRVRFJyB9XG5cdFx0fVxuXHQpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgUm9sZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciByb2xlcy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCByb2xlc1xudmFyIHJvbGVzID0gUm9sZS5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhyb2xlcyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwiYWRtaW5cIn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIHJvbGVcbnZhciByb2xlID0gUm9sZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cocm9sZSk7IC8vIHtpZDogMSwgbmFtZTogXCJhZG1pblwifVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdSb2xlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvcm9sZXMvOmlkJywgeyBpZDogJ0BpZCcgfSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBTaGFwZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBzaGFwZXMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgc2hhcGVzXG52YXIgc2hhcGVzID0gU2hhcGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coc2hhcGVzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJwb2ludFwifSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgc2hhcGVcbnZhciBzaGFwZSA9IFNoYXBlLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhzaGFwZSk7IC8vIHtpZDogMSwgbmFtZTogXCJwb2ludFwifVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdTaGFwZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3NoYXBlcy86aWQnLCB7IGlkOiAnQGlkJyB9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFRyYW5zZWN0XG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHRyYW5zZWN0cy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IG9uZSB0cmFuc2VjdFxudmFyIHRyYW5zZWN0ID0gVHJhbnNlY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHRyYW5zZWN0KTsgLy8ge2lkOiAxLCBuYW1lOiBcInRyYW5zZWN0IDFcIn1cbn0pO1xuXG4vLyB1cGRhdGUgYSB0cmFuc2VjdFxudmFyIHRyYW5zZWN0ID0gVHJhbnNlY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHRyYW5zZWN0Lm5hbWUgPSBcIm15IHRyYW5zZWN0XCI7XG4gICB0cmFuc2VjdC4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuVHJhbnNlY3Quc2F2ZSh7aWQ6IDEsIG5hbWU6IFwibXkgdHJhbnNlY3RcIn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnVHJhbnNlY3QnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS90cmFuc2VjdHMvOmlkJyxcblx0XHR7IGlkOiAnQGlkJyB9LFxuXHRcdHtcblx0XHRcdHNhdmU6IHsgbWV0aG9kOiAnUFVUJyB9XG5cdFx0fVxuXHRcdCk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBUcmFuc2VjdEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGltYWdlcyBvZiB0cmFuc2VjdHMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCB0aGUgSURzIG9mIGFsbCBpbWFnZXMgb2YgdGhlIHRyYW5zZWN0IHdpdGggSUQgMVxudmFyIGltYWdlcyA9IFRyYW5zZWN0SW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coaW1hZ2VzKTsgLy8gWzEsIDEyLCAxNCwgLi4uXVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdUcmFuc2VjdEltYWdlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvdHJhbnNlY3RzLzp0cmFuc2VjdF9pZC9pbWFnZXMnKTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFVzZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgdXNlcnMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhIGxpc3Qgb2YgYWxsIHVzZXJzXG52YXIgdXNlcnMgPSBVc2VyLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXJzKTsgLy8gW3tpZDogMSwgZmlyc3RuYW1lOiBcIkphbmVcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIHJldHJpZXZpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IFVzZXIuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXIuZmlyc3RuYW1lKTtcbn0pO1xuXG4vLyBjcmVhdGluZyBhIG5ldyB1c2VyXG52YXIgdXNlciA9IFVzZXIuYWRkKFxuICAge1xuICAgICAgZW1haWw6ICdteUBtYWlsLmNvbScsXG4gICAgICBwYXNzd29yZDogJzEyMzQ1NnB3JyxcbiAgICAgIHBhc3N3b3JkX2NvbmZpcm1hdGlvbjogJzEyMzQ1NnB3JyxcbiAgICAgIGZpcnN0bmFtZTogJ2phbmUnLFxuICAgICAgbGFzdG5hbWU6ICd1c2VyJ1xuICAgfSxcbiAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHVzZXIpOyAvLyB7aWQ6IDEsIGZpcnN0bmFtZTogJ2phbmUnLCAuLi59XG4gICB9XG4pO1xuXG4vLyBjaGFuZ2luZyB0aGUgdXNlcm5hbWVcbnZhciB1c2VyID0gVXNlci5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdXNlci5maXJzdG5hbWUgPT0gJ0pvZWwnO1xuICAgdXNlci4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuVXNlci5zYXZlKHtpZDogMSwgZmlyc3RuYW1lOiAnSm9lbCd9KTtcblxuLy8gZGVsZXRpbmcgdGhlIHVzZXJcbnZhciB1c2VyID0gVXNlci5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdXNlci4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Vc2VyLmRlbGV0ZSh7aWQ6IDF9KTtcblxuLy8gcXVlcnkgZm9yIGEgdXNlcm5hbWVcbnZhciB1c2VycyA9IFVzZXIuZmluZCh7cXVlcnk6ICdqYScgfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2codXNlcnMpOyAvLyBbe2lkOiAxLCBmaXJzdG5hbWU6IFwiamFuZVwiLCAuLi59LCAuLi5dXG59KTtcbiAqIFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdVc2VyJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvdXNlcnMvOmlkLzpxdWVyeScsIHsgaWQ6ICdAaWQnIH0sIHtcblx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfSxcblx0XHRhZGQ6IHsgbWV0aG9kOiAnUE9TVCcgfSxcbiAgICAgIGZpbmQ6IHsgbWV0aG9kOiAnR0VUJywgcGFyYW1zOiB7IGlkOiAnZmluZCcgfSwgaXNBcnJheTogdHJ1ZSB9XG5cdH0pO1xufSk7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYXBpXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgcm9sZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIGF2YWlsYWJsZSByb2xlc1xuICogQGV4YW1wbGVcbnZhciBhZG1pblJvbGVJZCA9IHJvbGUuZ2V0SWQoJ2FkbWluJyk7IC8vIDFcbnZhciBhZG1pblJvbGVOYW1lID0gcm9sZS5nZXROYW1lKDEpOyAvLyAnYWRtaW4nXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLnNlcnZpY2UoJ3JvbGVzJywgZnVuY3Rpb24gKFJvbGUpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciByb2xlcyA9IHt9O1xuXHRcdHZhciByb2xlc0ludmVyc2UgPSB7fTtcblxuXHRcdFJvbGUucXVlcnkoZnVuY3Rpb24gKHIpIHtcblx0XHRcdHIuZm9yRWFjaChmdW5jdGlvbiAocm9sZSkge1xuXHRcdFx0XHRyb2xlc1tyb2xlLmlkXSA9IHJvbGUubmFtZTtcblx0XHRcdFx0cm9sZXNJbnZlcnNlW3JvbGUubmFtZV0gPSByb2xlLmlkO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmdldE5hbWUgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHJldHVybiByb2xlc1tpZF07XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0SWQgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0cmV0dXJuIHJvbGVzSW52ZXJzZVtuYW1lXTtcblx0XHR9O1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFwaVxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHNoYXBlc1xuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciB0aGUgYXZhaWxhYmxlIHNoYXBlc1xuICogQGV4YW1wbGVcbnZhciBzaGFwZXNBcnJheSA9IHNwYWhlcy5nZXRBbGwoKTsgLy8gW3tpZDogMSwgbmFtZTogJ1BvaW50J30sIC4uLl1cbnNoYXBlcy5nZXRJZCgnUG9pbnQnKTsgLy8gMVxuc2hhcGVzLmdldE5hbWUoMSk7IC8vICdQb2ludCdcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuc2VydmljZSgnc2hhcGVzJywgZnVuY3Rpb24gKFNoYXBlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgc2hhcGVzID0ge307XG5cdFx0dmFyIHNoYXBlc0ludmVyc2UgPSB7fTtcblxuXHRcdHZhciByZXNvdXJjZXMgPSBTaGFwZS5xdWVyeShmdW5jdGlvbiAocykge1xuXHRcdFx0cy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xuXHRcdFx0XHRzaGFwZXNbc2hhcGUuaWRdID0gc2hhcGUubmFtZTtcblx0XHRcdFx0c2hhcGVzSW52ZXJzZVtzaGFwZS5uYW1lXSA9IHNoYXBlLmlkO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmdldE5hbWUgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHJldHVybiBzaGFwZXNbaWRdO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldElkID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdHJldHVybiBzaGFwZXNJbnZlcnNlW25hbWVdO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiByZXNvdXJjZXM7XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS51c2Vyc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgdXNlckNob29zZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLnVzZXJzXG4gKiBAZGVzY3JpcHRpb24gQW4gaW5wdXQgZmllbGQgdG8gZmluZCBhIHVzZXIuXG4gKiBAZXhhbXBsZVxuLy8gSFRNTFxuPGlucHV0IHBsYWNlaG9sZGVyPVwiU2VhcmNoIGJ5IHVzZXJuYW1lXCIgZGF0YS11c2VyLWNob29zZXI9XCJhZGRVc2VyXCIgLz5cblxuLy8gQ29udHJvbGxlciAoZXhhbXBsZSBmb3IgYWRkaW5nIGEgdXNlciB0byBhIHByb2plY3QpXG4kc2NvcGUuYWRkVXNlciA9IGZ1bmN0aW9uICh1c2VyKSB7XG5cdC8vIG5ldyB1c2VycyBhcmUgZ3Vlc3RzIGJ5IGRlZmF1bHRcblx0dmFyIHJvbGVJZCA9ICRzY29wZS5yb2xlcy5ndWVzdDtcblxuXHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHR1c2VyLnByb2plY3Rfcm9sZV9pZCA9IHJvbGVJZDtcblx0XHQkc2NvcGUudXNlcnMucHVzaCh1c2VyKTtcblx0fTtcblxuXHQvLyB1c2VyIHNob3VsZG4ndCBhbHJlYWR5IGV4aXN0XG5cdGlmICghZ2V0VXNlcih1c2VyLmlkKSkge1xuXHRcdFByb2plY3RVc2VyLmF0dGFjaChcblx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfSxcblx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0c3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3Jcblx0XHQpO1xuXHR9XG59O1xuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLnVzZXJzJykuZGlyZWN0aXZlKCd1c2VyQ2hvb3NlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXG5cdFx0XHRzY29wZToge1xuXHRcdFx0XHRzZWxlY3Q6ICc9dXNlckNob29zZXInXG5cdFx0XHR9LFxuXG5cdFx0XHRyZXBsYWNlOiB0cnVlLFxuXG5cdFx0XHR0ZW1wbGF0ZTogJzxpbnB1dCB0eXBlPVwidGV4dFwiIGRhdGEtbmctbW9kZWw9XCJzZWxlY3RlZFwiIGRhdGEtdHlwZWFoZWFkPVwidXNlci5uYW1lIGZvciB1c2VyIGluIGZpbmQoJHZpZXdWYWx1ZSlcIiBkYXRhLXR5cGVhaGVhZC13YWl0LW1zPVwiMjUwXCIgZGF0YS10eXBlYWhlYWQtb24tc2VsZWN0PVwic2VsZWN0KCRpdGVtKVwiLz4nLFxuXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBVc2VyKSB7XG5cdFx0XHRcdCRzY29wZS5maW5kID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG5cdFx0XHRcdFx0cmV0dXJuIFVzZXIuZmluZCh7cXVlcnk6IHF1ZXJ5fSkuJHByb21pc2U7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5nZG9jIGNvbnN0YW50XG4gKiBAbmFtZSBNQVhfTVNHXG4gKiBAbWVtYmVyT2YgZGlhcy51aS5tZXNzYWdlc1xuICogQGRlc2NyaXB0aW9uIFRoZSBtYXhpbXVtIG51bWJlciBvZiBpbmZvIG1lc3NhZ2VzIHRvIGRpc3BsYXkuXG4gKiBAcmV0dXJucyB7SW50ZWdlcn1cbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLm1lc3NhZ2VzJykuY29uc3RhbnQoJ01BWF9NU0cnLCAxKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS5tZXNzYWdlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIE1lc3NhZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudWkubWVzc2FnZXNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSBsaXZlIGRpc3BsYXkgb2YgdXNlciBmZWVkYmFjayBtZXNzYWdlcyB2aWEgSlNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5jb250cm9sbGVyKCdNZXNzYWdlc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBNQVhfTVNHKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuYWxlcnRzID0gW107XG5cblx0XHQvLyBtYWtlIG1ldGhvZCBhY2Nlc3NpYmxlIGJ5IG90aGVyIG1vZHVsZXNcblx0XHR3aW5kb3cuJGRpYXNQb3N0TWVzc2FnZSA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkc2NvcGUuYWxlcnRzLnVuc2hpZnQoe1xuXHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXG5cdFx0XHRcdFx0dHlwZTogdHlwZSB8fCAnaW5mbydcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aWYgKCRzY29wZS5hbGVydHMubGVuZ3RoID4gTUFYX01TRykge1xuXHRcdFx0XHRcdCRzY29wZS5hbGVydHMucG9wKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbiAoaW5kZXgpIHtcblx0XHRcdCRzY29wZS5hbGVydHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkubWVzc2FnZXNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtc2dcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAZGVzY3JpcHRpb24gRW5hYmxlcyBhcmJpdHJhcnkgQW5ndWxhckpTIG1vZHVsZXMgdG8gcG9zdCB1c2VyIGZlZWRiYWNrIG1lc3NhZ2VzIHVzaW5nIHRoZSBESUFTIFVJIG1lc3NhZ2luZyBzeXN0ZW0uIFNlZSB0aGUgW0Jvb3RzdHJhcCBhbGVydHNdKGh0dHA6Ly9nZXRib290c3RyYXAuY29tL2NvbXBvbmVudHMvI2FsZXJ0cykgZm9yIGF2YWlsYWJsZSBtZXNzYWdlIHR5cGVzIGFuZCB0aGVpciBzdHlsZS4gSW4gYWRkaXRpb24gdG8gYWN0aXZlbHkgcG9zdGluZyBtZXNzYWdlcywgaXQgcHJvdmlkZXMgdGhlIGByZXNwb25zZUVycm9yYCBtZXRob2QgdG8gY29udmVuaWVudGx5IGRpc3BsYXkgZXJyb3IgbWVzc2FnZXMgaW4gY2FzZSBhbiBBSkFYIHJlcXVlc3Qgd2VudCB3cm9uZy5cbiAqIEBleGFtcGxlXG5tc2cucG9zdCgnZGFuZ2VyJywgJ0RvIHlvdSByZWFsbHkgd2FudCB0byBkZWxldGUgdGhpcz8gRXZlcnl0aGluZyB3aWxsIGJlIGxvc3QuJyk7XG5cbm1zZy5kYW5nZXIoJ0RvIHlvdSByZWFsbHkgd2FudCB0byBkZWxldGUgdGhpcz8gRXZlcnl0aGluZyB3aWxsIGJlIGxvc3QuJyk7XG5tc2cud2FybmluZygnTGVhdmluZyB0aGUgcHJvamVjdCBpcyBub3QgcmV2ZXJzaWJsZS4nKTtcbm1zZy5zdWNjZXNzKCdUaGUgcHJvamVjdCB3YXMgY3JlYXRlZC4nKTtcbm1zZy5pbmZvKCdZb3Ugd2lsbCByZWNlaXZlIGFuIGVtYWlsIGFib3V0IHRoaXMuJyk7XG5cbnZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goeyAuLi4gfSk7XG4vLyBoYW5kbGVzIGFsbCBlcnJvciByZXNwb25zZXMgYXV0b21hdGljYWxseVxubGFiZWwuJHByb21pc2UuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS5tZXNzYWdlcycpLnNlcnZpY2UoJ21zZycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0dGhpcy5wb3N0ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlIHx8IHR5cGU7XG5cdFx0XHR3aW5kb3cuJGRpYXNQb3N0TWVzc2FnZSh0eXBlLCBtZXNzYWdlKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5kYW5nZXIgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0X3RoaXMucG9zdCgnZGFuZ2VyJywgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMud2FybmluZyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cdFx0XHRfdGhpcy5wb3N0KCd3YXJuaW5nJywgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc3VjY2VzcyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cdFx0XHRfdGhpcy5wb3N0KCdzdWNjZXNzJywgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuaW5mbyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cdFx0XHRfdGhpcy5wb3N0KCdpbmZvJywgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucmVzcG9uc2VFcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0dmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuXG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcblx0XHRcdFx0X3RoaXMuZGFuZ2VyKFwiUGxlYXNlIGxvZyBpbiAoYWdhaW4pLlwiKTtcblx0XHRcdH0gZWxzZSBpZiAoIWRhdGEpIHtcblx0XHRcdFx0X3RoaXMuZGFuZ2VyKFwiVGhlIHNlcnZlciBkaWRuJ3QgcmVzcG9uZCwgc29ycnkuXCIpO1xuXHRcdFx0fSBlbHNlIGlmIChkYXRhLm1lc3NhZ2UpIHtcblx0XHRcdFx0Ly8gZXJyb3IgcmVzcG9uc2Vcblx0XHRcdFx0X3RoaXMuZGFuZ2VyKGRhdGEubWVzc2FnZSk7XG5cdFx0XHR9IGVsc2UgaWYgKGRhdGEpIHtcblx0XHRcdFx0Ly8gdmFsaWRhdGlvbiByZXNwb25zZVxuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuXHRcdFx0XHRcdF90aGlzLmRhbmdlcihkYXRhW2tleV1bMF0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyB1bmtub3duIGVycm9yIHJlc3BvbnNlXG5cdFx0XHRcdF90aGlzLmRhbmdlcihcIlRoZXJlIHdhcyBhbiBlcnJvciwgc29ycnkuXCIpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=