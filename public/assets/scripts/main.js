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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJhcGkvY29uc3RhbnRzL1VSTC5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbi5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbkxhYmVsLmpzIiwiYXBpL2ZhY3Rvcmllcy9BdHRyaWJ1dGUuanMiLCJhcGkvZmFjdG9yaWVzL0ltYWdlLmpzIiwiYXBpL2ZhY3Rvcmllcy9MYWJlbC5qcyIsImFwaS9mYWN0b3JpZXMvTWVkaWFUeXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9Pd25Vc2VyLmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0LmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0TGFiZWwuanMiLCJhcGkvZmFjdG9yaWVzL1Byb2plY3RUcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvUHJvamVjdFVzZXIuanMiLCJhcGkvZmFjdG9yaWVzL1JvbGUuanMiLCJhcGkvZmFjdG9yaWVzL1NoYXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9UcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvVHJhbnNlY3RJbWFnZS5qcyIsImFwaS9mYWN0b3JpZXMvVXNlci5qcyIsImFwaS9zZXJ2aWNlcy9yb2xlcy5qcyIsImFwaS9zZXJ2aWNlcy9zaGFwZXMuanMiLCJ1aS9tZXNzYWdlcy9jb25zdGFudHMvTUFYX01TRy5qcyIsInVpL21lc3NhZ2VzL2NvbnRyb2xsZXIvTWVzc2FnZXNDb250cm9sbGVyLmpzIiwidWkvdXNlcnMvZGlyZWN0aXZlcy91c2VyQ2hvb3Nlci5qcyIsInVpL21lc3NhZ2VzL3NlcnZpY2VzL21zZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxZQUFBLENBQUE7O0FBRUEsUUFBQSxPQUFBLFlBQUEseUJBQUEsVUFBQSxlQUFBO0NBQ0E7O0NBRUEsY0FBQSxTQUFBLFFBQUEsT0FBQTtFQUNBOzs7Ozs7O0FBT0EsUUFBQSxPQUFBLG9CQUFBLENBQUE7OztBQUdBLFFBQUEsUUFBQSxVQUFBLE1BQUEsWUFBQTtDQUNBOztDQUVBLFFBQUE7RUFDQSxTQUFBLGNBQUE7RUFDQSxDQUFBOzs7Ozs7OztBQVFBLFFBQUEsT0FBQSxpQkFBQSxDQUFBLGdCQUFBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsV0FBQSxDQUFBLG9CQUFBOzs7Ozs7Ozs7OztBQy9CQSxRQUFBLE9BQUEsWUFBQSxTQUFBLE9BQUEsT0FBQSxnQkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzJDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLG1DQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7RUFDQSxFQUFBLElBQUE7RUFDQTtHQUNBLEtBQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFVBQUE7O0dBRUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsVUFBQTs7R0FFQSxRQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxVQUFBOztHQUVBLE9BQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFVBQUEsVUFBQSxNQUFBO0lBQ0EsU0FBQTs7R0FFQSxLQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxVQUFBLFVBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzNDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsOENBQUE7R0FDQSxJQUFBO0dBQ0EsZUFBQTtLQUNBO0dBQ0EsT0FBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsUUFBQSxlQUFBLFFBQUE7SUFDQSxTQUFBOztHQUVBLFFBQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFFBQUEsZUFBQSxRQUFBOztHQUVBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFFBQUEscUJBQUEsZUFBQSxNQUFBLFFBQUE7O0dBRUEsUUFBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsUUFBQSxxQkFBQSxlQUFBLE1BQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNyQkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxrQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLDBCQUFBLEVBQUEsSUFBQSxTQUFBO0VBQ0EsS0FBQSxDQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN0QkEsUUFBQSxPQUFBLFlBQUEsUUFBQSw4QkFBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ29CQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDhCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsc0JBQUEsRUFBQSxJQUFBO0VBQ0E7R0FDQSxLQUFBLENBQUEsUUFBQTtHQUNBLE1BQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzFCQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGtDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsMkJBQUEsRUFBQSxJQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDT0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxnQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLG9CQUFBLElBQUE7RUFDQSxNQUFBLENBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNRQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsd0JBQUEsRUFBQSxJQUFBO0VBQ0E7O0dBRUEsT0FBQSxFQUFBLFFBQUEsT0FBQSxRQUFBLEVBQUEsSUFBQSxRQUFBLFNBQUE7R0FDQSxLQUFBLEVBQUEsUUFBQTtHQUNBLE1BQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxxQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLHVDQUFBLENBQUEsWUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2dDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7RUFDQSxFQUFBLElBQUE7RUFDQTtHQUNBLEtBQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7R0FDQSxRQUFBLEVBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM3QkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxvQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBO0VBQ0EsRUFBQSxJQUFBO0VBQ0E7R0FDQSxNQUFBLEVBQUEsUUFBQTtHQUNBLFFBQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDakJBLFFBQUEsT0FBQSxZQUFBLFFBQUEsNkJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxxQkFBQSxFQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0hBLFFBQUEsT0FBQSxZQUFBLFFBQUEsOEJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxzQkFBQSxFQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0FBLFFBQUEsT0FBQSxZQUFBLFFBQUEsaUNBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTtFQUNBLEVBQUEsSUFBQTtFQUNBO0dBQ0EsTUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2RBLFFBQUEsT0FBQSxZQUFBLFFBQUEsc0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ29DQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDZCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsNEJBQUEsRUFBQSxJQUFBLFNBQUE7RUFDQSxNQUFBLEVBQUEsUUFBQTtFQUNBLEtBQUEsRUFBQSxRQUFBO01BQ0EsTUFBQSxFQUFBLFFBQUEsT0FBQSxRQUFBLEVBQUEsSUFBQSxVQUFBLFNBQUE7Ozs7Ozs7Ozs7Ozs7QUNqREEsUUFBQSxPQUFBLFlBQUEsUUFBQSxrQkFBQSxVQUFBLE1BQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7RUFDQSxJQUFBLGVBQUE7O0VBRUEsS0FBQSxNQUFBLFVBQUEsR0FBQTtHQUNBLEVBQUEsUUFBQSxVQUFBLE1BQUE7SUFDQSxNQUFBLEtBQUEsTUFBQSxLQUFBO0lBQ0EsYUFBQSxLQUFBLFFBQUEsS0FBQTs7OztFQUlBLEtBQUEsVUFBQSxVQUFBLElBQUE7R0FDQSxPQUFBLE1BQUE7OztFQUdBLEtBQUEsUUFBQSxVQUFBLE1BQUE7R0FDQSxPQUFBLGFBQUE7Ozs7Ozs7Ozs7Ozs7OztBQ2pCQSxRQUFBLE9BQUEsWUFBQSxRQUFBLG9CQUFBLFVBQUEsT0FBQTtFQUNBOztFQUVBLElBQUEsU0FBQTtFQUNBLElBQUEsZ0JBQUE7O0VBRUEsSUFBQSxZQUFBLE1BQUEsTUFBQSxVQUFBLEdBQUE7R0FDQSxFQUFBLFFBQUEsVUFBQSxPQUFBO0lBQ0EsT0FBQSxNQUFBLE1BQUEsTUFBQTtJQUNBLGNBQUEsTUFBQSxRQUFBLE1BQUE7Ozs7RUFJQSxLQUFBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsT0FBQSxPQUFBOzs7RUFHQSxLQUFBLFFBQUEsVUFBQSxNQUFBO0dBQ0EsT0FBQSxjQUFBOzs7RUFHQSxLQUFBLFNBQUEsWUFBQTtHQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQ3pCQSxRQUFBLE9BQUEsb0JBQUEsU0FBQSxXQUFBOzs7Ozs7OztBQ0RBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDRDQUFBLFVBQUEsUUFBQSxTQUFBO0VBQ0E7O0VBRUEsT0FBQSxTQUFBOzs7RUFHQSxPQUFBLG1CQUFBLFVBQUEsTUFBQSxTQUFBO0dBQ0EsT0FBQSxPQUFBLFdBQUE7SUFDQSxPQUFBLE9BQUEsUUFBQTtLQUNBLFNBQUE7S0FDQSxNQUFBLFFBQUE7OztJQUdBLElBQUEsT0FBQSxPQUFBLFNBQUEsU0FBQTtLQUNBLE9BQUEsT0FBQTs7Ozs7RUFLQSxPQUFBLFFBQUEsVUFBQSxPQUFBO0dBQ0EsT0FBQSxPQUFBLE9BQUEsT0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDSUEsUUFBQSxPQUFBLGlCQUFBLFVBQUEsZUFBQSxZQUFBO0VBQ0E7O0VBRUEsT0FBQTtHQUNBLFVBQUE7O0dBRUEsT0FBQTtJQUNBLFFBQUE7OztHQUdBLFNBQUE7O0dBRUEsVUFBQTs7R0FFQSwrQkFBQSxVQUFBLFFBQUEsTUFBQTtJQUNBLE9BQUEsT0FBQSxVQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsS0FBQSxDQUFBLE9BQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzdCQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxPQUFBLFlBQUE7RUFDQTtFQUNBLElBQUEsUUFBQTs7RUFFQSxLQUFBLE9BQUEsVUFBQSxNQUFBLFNBQUE7R0FDQSxVQUFBLFdBQUE7R0FDQSxPQUFBLGlCQUFBLE1BQUE7OztFQUdBLEtBQUEsU0FBQSxVQUFBLFNBQUE7R0FDQSxNQUFBLEtBQUEsVUFBQTs7O0VBR0EsS0FBQSxVQUFBLFVBQUEsU0FBQTtHQUNBLE1BQUEsS0FBQSxXQUFBOzs7RUFHQSxLQUFBLFVBQUEsVUFBQSxTQUFBO0dBQ0EsTUFBQSxLQUFBLFdBQUE7OztFQUdBLEtBQUEsT0FBQSxVQUFBLFNBQUE7R0FDQSxNQUFBLEtBQUEsUUFBQTs7O0VBR0EsS0FBQSxnQkFBQSxVQUFBLFVBQUE7R0FDQSxJQUFBLE9BQUEsU0FBQTs7R0FFQSxJQUFBLFNBQUEsV0FBQSxLQUFBO0lBQ0EsTUFBQSxPQUFBO1VBQ0EsSUFBQSxDQUFBLE1BQUE7SUFDQSxNQUFBLE9BQUE7VUFDQSxJQUFBLEtBQUEsU0FBQTs7SUFFQSxNQUFBLE9BQUEsS0FBQTtVQUNBLElBQUEsTUFBQTs7SUFFQSxLQUFBLElBQUEsT0FBQSxNQUFBO0tBQ0EsTUFBQSxPQUFBLEtBQUEsS0FBQTs7VUFFQTs7SUFFQSxNQUFBLE9BQUE7Ozs7O0FBS0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIGFwaSBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknLCBbJ25nUmVzb3VyY2UnXSk7XG5cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uW1wiWC1SZXF1ZXN0ZWQtV2l0aFwiXSA9XG5cdFx0XCJYTUxIdHRwUmVxdWVzdFwiO1xufSk7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdXNlciBmZWVkYmFjayBtZXNzYWdlcyBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS5tZXNzYWdlcycsIFsndWkuYm9vdHN0cmFwJ10pO1xuXG4vLyBib290c3RyYXAgdGhlIG1lc3NhZ2VzIG1vZHVsZVxuYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdGFuZ3VsYXIuYm9vdHN0cmFwKFxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW5nLWNvbnRyb2xsZXI9XCJNZXNzYWdlc0NvbnRyb2xsZXJcIl0nKSxcblx0XHRbJ2RpYXMudWkubWVzc2FnZXMnXVxuXHQpO1xufSk7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLnVzZXJzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgdXNlcnMgVUkgQW5ndWxhckpTIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkudXNlcnMnLCBbJ3VpLmJvb3RzdHJhcCcsICdkaWFzLmFwaSddKTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWlcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBVSSBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aScsIFsnZGlhcy51aS5tZXNzYWdlcycsICdkaWFzLnVpLnVzZXJzJ10pO1xuXG4iLCIvKipcbiAqIEBuZ2RvYyBjb25zdGFudFxuICogQG5hbWUgVVJMXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBUaGUgYmFzZSB1cmwgb2YgdGhlIGFwcGxpY2F0aW9uLlxuICogQHJldHVybnMge1N0cmluZ31cbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmNvbnN0YW50KCdVUkwnLCB3aW5kb3cuJGRpYXNCYXNlVXJsIHx8ICcnKTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBBbm5vdGF0aW9uXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGFubm90YXRpb25zLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyByZXRyaWV2aW5nIHRoZSBzaGFwZSBJRCBvZiBhbiBhbm5vdGF0aW9uXG52YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uZ2V0KHtpZDogMTIzfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coYW5ub3RhdGlvbi5zaGFwZV9pZCk7XG59KTtcblxuLy8gc2F2aW5nIGFuIGFubm90YXRpb24gKHVwZGF0aW5nIHRoZSBhbm5vdGF0aW9uIHBvaW50cylcbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgYW5ub3RhdGlvbi5wb2ludHMgPSBbe3g6IDEwLCB5OiAxMH1dO1xuICAgYW5ub3RhdGlvbi4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuQW5ub3RhdGlvbi5zYXZlKHtcbiAgIGlkOiAxLCBwb2ludHM6IFt7eDogMTAsIHk6IDEwfV1cbn0pO1xuXG4vLyBkZWxldGluZyBhbiBhbm5vdGF0aW9uXG52YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uZ2V0KHtpZDogMTIzfSwgZnVuY3Rpb24gKCkge1xuICAgYW5ub3RhdGlvbi4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Bbm5vdGF0aW9uLmRlbGV0ZSh7aWQ6IDEyM30pO1xuXG4vLyBnZXQgYWxsIGFubm90YXRpb25zIG9mIGFuIGltYWdlXG4vLyBub3RlLCB0aGF0IHRoZSBgaWRgIGlzIG5vdyB0aGUgaW1hZ2UgSUQgYW5kIG5vdCB0aGUgYW5ub3RhdGlvbiBJRCBmb3IgdGhlXG4vLyBxdWVyeSFcbnZhciBhbm5vdGF0aW9ucyA9IEFubm90YXRpb24ucXVlcnkoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coYW5ub3RhdGlvbnMpOyAvLyBbe2lkOiAxLCBzaGFwZV9pZDogMSwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGFkZCBhIG5ldyBhbm5vdGF0aW9uIHRvIGFuIGltYWdlXG4vLyBub3RlLCB0aGF0IHRoZSBgaWRgIGlzIG5vdyB0aGUgaW1hZ2UgSUQgYW5kIG5vdCB0aGUgYW5ub3RhdGlvbiBJRCBmb3IgdGhlXG4vLyBxdWVyeSFcbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5hZGQoe1xuICAgaWQ6IDEsXG4gICBzaGFwZV9pZDogMSxcbiAgIGxhYmVsX2lkOiAxLFxuICAgY29uZmlkZW5jZTogMC41XG4gICBwb2ludHM6IFtcbiAgICAgIHsgeDogMTAsIHk6IDIwIH1cbiAgIF1cbn0pO1xuICogXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0Fubm90YXRpb24nLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS86ZW5kcG9pbnQvOmlkLzpzbHVnJyxcblx0XHR7IGlkOiAnQGlkJ1x0fSxcblx0XHR7XG5cdFx0XHRnZXQ6IHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0cGFyYW1zOiB7IGVuZHBvaW50OiAnYW5ub3RhdGlvbnMnIH1cblx0XHRcdH0sXG5cdFx0XHRzYXZlOiB7XG5cdFx0XHRcdG1ldGhvZDogJ1BVVCcsXG5cdFx0XHRcdHBhcmFtczogeyBlbmRwb2ludDogJ2Fubm90YXRpb25zJyB9XG5cdFx0XHR9LFxuXHRcdFx0ZGVsZXRlOiB7XG5cdFx0XHRcdG1ldGhvZDogJ0RFTEVURScsXG5cdFx0XHRcdHBhcmFtczogeyBlbmRwb2ludDogJ2Fubm90YXRpb25zJyB9XG5cdFx0XHR9LFxuXHRcdFx0cXVlcnk6IHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0cGFyYW1zOiB7IGVuZHBvaW50OiAnaW1hZ2VzJywgc2x1ZzogJ2Fubm90YXRpb25zJyB9LFxuXHRcdFx0XHRpc0FycmF5OiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YWRkOiB7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHRwYXJhbXM6IHsgZW5kcG9pbnQ6ICdpbWFnZXMnLCBzbHVnOiAnYW5ub3RhdGlvbnMnIH1cblx0XHRcdH1cblx0XHR9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEFubm90YXRpb25MYWJlbFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBhbm5vdGF0aW9uIGxhYmVscy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBsYWJlbHMgb2YgYW4gYW5ub3RhdGlvbiBhbmQgdXBkYXRlIG9uZSBvZiB0aGVtXG52YXIgbGFiZWxzID0gQW5ub3RhdGlvbkxhYmVsLnF1ZXJ5KHthbm5vdGF0aW9uX2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIGxhYmVsID0gbGFiZWxzWzBdO1xuICAgbGFiZWwuY29uZmlkZW5jZSA9IDAuOTtcbiAgIGxhYmVsLiRzYXZlKCk7XG59KTtcblxuLy8gZGlyZWN0bHkgdXBkYXRlIGEgbGFiZWxcbkFubm90YXRpb25MYWJlbC5zYXZlKHtjb25maWRlbmNlOiAwLjEsIGFubm90YXRpb25faWQ6IDEsIGlkOiAxfSk7XG5cbi8vIGF0dGFjaCBhIG5ldyBsYWJlbCB0byBhbiBhbm5vdGF0aW9uXG52YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHtsYWJlbF9pZDogMSwgY29uZmlkZW5jZTogMC41LCBhbm5vdGF0aW9uX2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWwpOyAvLyB7aWQ6IDEsIG5hbWU6ICdteSBsYWJlbCcsIHVzZXJfaWQ6IDEsIC4uLn1cbn0pO1xuXG5cbi8vIGRldGFjaCBhIGxhYmVsXG52YXIgbGFiZWxzID0gQW5ub3RhdGlvbkxhYmVsLnF1ZXJ5KHthbm5vdGF0aW9uX2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIGxhYmVsID0gbGFiZWxzWzBdO1xuICAgbGFiZWwuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuQW5ub3RhdGlvbkxhYmVsLmRlbGV0ZSh7aWQ6IDF9KTtcbiAqIFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdBbm5vdGF0aW9uTGFiZWwnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS86cHJlZml4Lzphbm5vdGF0aW9uX2lkLzpzdWZmaXgvOmlkJywge1xuXHRcdFx0aWQ6ICdAaWQnLFxuXHRcdFx0YW5ub3RhdGlvbl9pZDogJ0Bhbm5vdGF0aW9uX2lkJ1xuXHRcdH0sIHtcblx0XHRcdHF1ZXJ5OiB7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHBhcmFtczogeyBwcmVmaXg6ICdhbm5vdGF0aW9ucycsIHN1ZmZpeDogJ2xhYmVscycgfSxcblx0XHRcdFx0aXNBcnJheTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGF0dGFjaDoge1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0cGFyYW1zOiB7IHByZWZpeDogJ2Fubm90YXRpb25zJywgc3VmZml4OiAnbGFiZWxzJyB9XG5cdFx0XHR9LFxuXHRcdFx0c2F2ZToge1xuXHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxuXHRcdFx0XHRwYXJhbXM6IHsgcHJlZml4OiAnYW5ub3RhdGlvbi1sYWJlbHMnLCBhbm5vdGF0aW9uX2lkOiBudWxsLCBzdWZmaXg6IG51bGwgfVxuXHRcdFx0fSxcblx0XHRcdGRlbGV0ZToge1xuXHRcdFx0XHRtZXRob2Q6ICdERUxFVEUnLFxuXHRcdFx0XHRwYXJhbXM6IHsgcHJlZml4OiAnYW5ub3RhdGlvbi1sYWJlbHMnLCBhbm5vdGF0aW9uX2lkOiBudWxsLCBzdWZmaXg6IG51bGwgfVxuXHRcdFx0fVxuXHR9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEF0dHJpYnV0ZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBhdHRyaWJ1dGVzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBsaXN0IGFsbCBhdHRyaWJ1dGVzXG52YXIgYXR0cmlidXRlcyA9IEF0dHJpYnV0ZS5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhdHRyaWJ1dGVzKTsgLy8gW3tpZDogMSwgdHlwZTogJ2Jvb2xlYW4nLCAuLi59LCAuLi5dXG59KTtcblxuLy8gZ2V0IGEgc3BlY2lmaWMgYXR0cmlidXRlXG52YXIgYXR0cmlidXRlID0gQXR0cmlidXRlLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhdHRyaWJ1dGUpOyAvLyB7aWQ6IDEsIHR5cGU6ICdib29sZWFuJywgLi4ufVxufSk7XG5cbi8vIGNyZWF0ZSBhIG5ldyBhdHRyaWJ1dGVcbnZhciBhdHRyaWJ1dGUgPSBBdHRyaWJ1dGUuYWRkKHtcbiAgICAgIG5hbWU6ICdiYWRfcXVhbGl0eScsIHR5cGU6ICdib29sZWFuJ1xuICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coYXR0cmlidXRlKTsgLy8ge2lkOiAxLCBuYW1lOiAnYmFkX3F1YWxpdHknLCAuLi59XG59KTtcblxuLy8gZGVsZXRlIGFuIGF0dHJpYnV0ZVxudmFyIGF0dHJpYnV0ZXMgPSBBdHRyaWJ1dGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgdmFyIGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbMF07XG4gICBhdHRyaWJ1dGUuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuQXR0cmlidXRlLmRlbGV0ZSh7aWQ6IDF9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0F0dHJpYnV0ZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2F0dHJpYnV0ZXMvOmlkJywgeyBpZDogJ0BpZCcgfSwge1xuXHRcdGFkZDoge21ldGhvZDogJ1BPU1QnfVxuXHR9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGltYWdlcy4gVGhpcyByZXNvdXJjZSBpcyBvbmx5IGZvciBcbiAqIGZpbmRpbmcgb3V0IHdoaWNoIHRyYW5zZWN0IGFuIGltYWdlIGJlbG9uZ3MgdG8uIFRoZSBpbWFnZSBmaWxlcyBhcmVcbiAqIGRpcmVjdGx5IGNhbGxlZCBmcm9tIHRoZSBBUEkuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbiBpbWFnZVxudmFyIGltYWdlID0gSW1hZ2UuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGltYWdlKTsgLy8ge2lkOiAxLCB3aWR0aDogMTAwMCwgaGVpZ2h0OiA3NTAsIHRyYW5zZWN0OiB7Li4ufSwgLi4ufVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdJbWFnZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2ltYWdlcy86aWQnKTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIExhYmVsXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGxhYmVscy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBsYWJlbHNcbnZhciBsYWJlbHMgPSBMYWJlbC5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcIkJlbnRoaWMgT2JqZWN0XCIsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIGxhYmVsXG52YXIgbGFiZWwgPSBMYWJlbC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWwpOyAvLyB7aWQ6IDEsIG5hbWU6IFwiQmVudGhpYyBPYmplY3RcIiwgLi4ufVxufSk7XG5cbi8vIGNyZWF0ZSBhIG5ldyBsYWJlbFxudmFyIGxhYmVsID0gTGFiZWwuYWRkKHtuYW1lOiBcIlRyYXNoXCIsIHBhcmVudF9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGxhYmVsKTsgLy8ge2lkOiAyLCBuYW1lOiBcIlRyYXNoXCIsIHBhcmVudF9pZDogMSwgLi4ufVxufSk7XG5cbi8vIHVwZGF0ZSBhIGxhYmVsXG52YXIgbGFiZWwgPSBMYWJlbC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgbGFiZWwubmFtZSA9ICdUcmFzaCc7XG4gICBsYWJlbC4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuTGFiZWwuc2F2ZSh7aWQ6IDEsIG5hbWU6ICdUcmFzaCd9KTtcblxuLy8gZGVsZXRlIGEgbGFiZWxcbnZhciBsYWJlbCA9IExhYmVsLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBsYWJlbC4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5MYWJlbC5kZWxldGUoe2lkOiAxfSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdMYWJlbCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2xhYmVscy86aWQnLCB7IGlkOiAnQGlkJyB9LFxuXHRcdHtcblx0XHRcdGFkZDoge21ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIE1lZGlhVHlwZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBtZWRpYSB0eXBlcy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBtZWRpYSB0eXBlc1xudmFyIG1lZGlhVHlwZXMgPSBNZWRpYVR5cGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobWVkaWFUeXBlcyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwidGltZS1zZXJpZXNcIn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIG1lZGlhIHR5cGVcbnZhciBtZWRpYVR5cGUgPSBNZWRpYVR5cGUuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKG1lZGlhVHlwZSk7IC8vIHtpZDogMSwgbmFtZTogXCJ0aW1lLXNlcmllc1wifVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdNZWRpYVR5cGUnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9tZWRpYS10eXBlcy86aWQnLCB7IGlkOiAnQGlkJyB9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIE93blVzZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgdGhlIGxvZ2dlZCBpbiB1c2VyLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyByZXRyaWV2aW5nIHRoZSB1c2VybmFtZVxudmFyIHVzZXIgPSBPd25Vc2VyLmdldChmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2VyLmZpcnN0bmFtZSk7XG59KTtcblxuLy8gY2hhbmdpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IE93blVzZXIuZ2V0KGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuZmlyc3RuYW1lID09ICdKb2VsJztcbiAgIHVzZXIuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbk93blVzZXIuc2F2ZSh7Zmlyc3RuYW1lOiAnSm9lbCd9KTtcblxuLy8gZGVsZXRpbmcgdGhlIHVzZXJcbnZhciB1c2VyID0gT3duVXNlci5nZXQoZnVuY3Rpb24gKCkge1xuICAgdXNlci4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Pd25Vc2VyLmRlbGV0ZSgpO1xuICogXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ093blVzZXInLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS91c2Vycy9teScsIHt9LCB7XG5cdFx0c2F2ZToge21ldGhvZDogJ1BVVCd9XG5cdH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgUHJvamVjdFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBwcm9qZWN0cy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBwcm9qZWN0cywgdGhlIGN1cnJlbnQgdXNlciBiZWxvbmdzIHRvXG52YXIgcHJvamVjdHMgPSBQcm9qZWN0LnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHByb2plY3RzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJUZXN0IFByb2plY3RcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhwcm9qZWN0KTsgLy8ge2lkOiAxLCBuYW1lOiBcIlRlc3QgUHJvamVjdFwiLCAuLi59XG59KTtcblxuLy8gY3JlYXRlIGEgbmV3IHByb2plY3RcbnZhciBwcm9qZWN0ID0gUHJvamVjdC5hZGQoe25hbWU6IFwiTXkgUHJvamVjdFwiLCBkZXNjcmlwdGlvbjogXCJteSBwcm9qZWN0XCJ9LFxuICAgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2cocHJvamVjdCk7IC8vIHtpZDogMiwgbmFtZTogXCJNeSBQcm9qZWN0XCIsIC4uLn1cbiAgIH1cbik7XG5cbi8vIHVwZGF0ZSBhIHByb2plY3RcbnZhciBwcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgcHJvamVjdC5uYW1lID0gJ05ldyBQcm9qZWN0JztcbiAgIHByb2plY3QuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblByb2plY3Quc2F2ZSh7aWQ6IDEsIG5hbWU6ICdOZXcgUHJvamVjdCd9KTtcblxuLy8gZGVsZXRlIGEgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBwcm9qZWN0LiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblByb2plY3QuZGVsZXRlKHtpZDogMX0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUHJvamVjdCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzppZCcsIHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0Ly8gYSB1c2VyIGNhbiBvbmx5IHF1ZXJ5IHRoZWlyIG93biBwcm9qZWN0c1xuXHRcdFx0cXVlcnk6IHsgbWV0aG9kOiAnR0VUJywgcGFyYW1zOiB7IGlkOiAnbXknIH0sIGlzQXJyYXk6IHRydWUgfSxcblx0XHRcdGFkZDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0c2F2ZTogeyBtZXRob2Q6ICdQVVQnIH1cblx0XHR9XG5cdCk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBQcm9qZWN0TGFiZWxcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgbGFiZWxzIGJlbG9uZ2luZyB0byBhIHByb2plY3QuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgbGFiZWxzIG9mIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIGxhYmVscyA9IFByb2plY3RMYWJlbC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWxzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJDb3JhbFwiLCAuLi59LCAuLi5dXG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1Byb2plY3RMYWJlbCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzpwcm9qZWN0X2lkL2xhYmVscycsIHtwcm9qZWN0X2lkOiAnQHByb2plY3RfaWQnfSk7XG59KTtcbiIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFByb2plY3RUcmFuc2VjdFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0cmFuc2VjdHMgYmVsb25naW5nIHRvIGEgcHJvamVjdC5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCB0cmFuc2VjdHMgb2YgdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdHJhbnNlY3RzID0gUHJvamVjdFRyYW5zZWN0LnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh0cmFuc2VjdHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcInRyYW5zZWN0IDFcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGFkZCBhIG5ldyB0cmFuc2VjdCB0byB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciB0cmFuc2VjdCA9IFByb2plY3RUcmFuc2VjdC5hZGQoe3Byb2plY3RfaWQ6IDF9LFxuICAge1xuICAgICAgbmFtZTogXCJ0cmFuc2VjdCAxXCIsXG4gICAgICB1cmw6IFwiL3ZvbC90cmFuc2VjdHMvMVwiLFxuICAgICAgbWVkaWFfdHlwZV9pZDogMSxcbiAgICAgIGltYWdlczogW1wiMS5qcGdcIiwgXCIyLmpwZ1wiXVxuICAgfSxcbiAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHRyYW5zZWN0KTsgLy8ge2lkOiAxLCBuYW1lOiBcInRyYW5zZWN0IDFcIiwgLi4ufVxuICAgfVxuKTtcblxuLy8gYXR0YWNoIGFuIGV4aXN0aW5nIHRyYW5zZWN0IHRvIGFub3RoZXIgcHJvamVjdFxudmFyIHRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIHRyYW5zZWN0ID0gdHJhbnNlY3RzWzBdO1xuICAgLy8gdHJhbnNlY3QgaXMgbm93IGF0dGFjaGVkIHRvIHByb2plY3QgMSAqYW5kKiAyXG4gICB0cmFuc2VjdC4kYXR0YWNoKHtwcm9qZWN0X2lkOiAyfSk7XG59KTtcbi8vIG9yIGRpcmVjdGx5ICh0cmFuc2VjdCAxIHdpbGwgYmUgYXR0YWNoZWQgdG8gcHJvamVjdCAyKVxuUHJvamVjdFRyYW5zZWN0LmF0dGFjaCh7cHJvamVjdF9pZDogMn0sIHtpZDogMX0pO1xuXG4vLyBkZXRhY2ggYSB0cmFuc2VjdCBmcm9tIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIHRyYW5zZWN0ID0gdHJhbnNlY3RzWzBdO1xuICAgdHJhbnNlY3QuJGRldGFjaCh7cHJvamVjdF9pZDogMX0pO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdFRyYW5zZWN0LmRldGFjaCh7cHJvamVjdF9pZDogMX0sIHtpZDogMX0pO1xuXG4vLyBhdHRhY2hpbmcgYW5kIGRldGFjaGluZyBjYW4gYmUgZG9uZSB1c2luZyBhIFRyYW5zZWN0IG9iamVjdCBhcyB3ZWxsOlxudmFyIHRyYW5zZWN0ID0gVHJhbnNlY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIFByb2plY3RUcmFuc2VjdC5hdHRhY2goe3Byb2plY3RfaWQ6IDJ9LCB0cmFuc2VjdCk7XG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1Byb2plY3RUcmFuc2VjdCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzpwcm9qZWN0X2lkL3RyYW5zZWN0cy86aWQnLFxuXHRcdHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0YWRkOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRhdHRhY2g6IHsgbWV0aG9kOiAnUE9TVCcgfSxcblx0XHRcdGRldGFjaDogeyBtZXRob2Q6ICdERUxFVEUnIH1cblx0XHR9XG5cdCk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBQcm9qZWN0VXNlclxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB1c2VycyBiZWxvbmdpbmcgdG8gYSBwcm9qZWN0LlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHVzZXJzIG9mIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHVzZXJzID0gUHJvamVjdFVzZXIucXVlcnkoeyBwcm9qZWN0X2lkOiAxIH0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXJzKTsgLy8gW3tpZDogMSwgZmlyc3RuYW1lOiBcIkphbmVcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIHVwZGF0ZSB0aGUgcHJvamVjdCByb2xlIG9mIGEgdXNlclxuUHJvamVjdFVzZXIuc2F2ZSh7cHJvamVjdF9pZDogMX0sIHtpZDogMSwgcHJvamVjdF9yb2xlX2lkOiAxfSk7XG5cbi8vIGF0dGFjaCBhIHVzZXIgdG8gYW5vdGhlciBwcm9qZWN0XG5Qcm9qZWN0VXNlci5hdHRhY2goe3Byb2plY3RfaWQ6IDJ9LCB7aWQ6IDEsIHByb2plY3Rfcm9sZV9pZDogMn0pO1xuXG4vLyBkZXRhY2ggYSB1c2VyIGZyb20gdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdXNlcnMgPSBQcm9qZWN0VXNlci5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIHVzZXIgPSB1c2Vyc1swXTtcbiAgIHVzZXIuJGRldGFjaCh7cHJvamVjdF9pZDogMX0pO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdFVzZXIuZGV0YWNoKHtwcm9qZWN0X2lkOiAxfSwge2lkOiAxfSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdQcm9qZWN0VXNlcicsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzpwcm9qZWN0X2lkL3VzZXJzLzppZCcsXG5cdFx0eyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfSxcblx0XHRcdGF0dGFjaDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0ZGV0YWNoOiB7IG1ldGhvZDogJ0RFTEVURScgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFJvbGVcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3Igcm9sZXMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgcm9sZXNcbnZhciByb2xlcyA9IFJvbGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cocm9sZXMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcImFkbWluXCJ9LCAuLi5dXG59KTtcblxuLy8gZ2V0IG9uZSByb2xlXG52YXIgcm9sZSA9IFJvbGUuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHJvbGUpOyAvLyB7aWQ6IDEsIG5hbWU6IFwiYWRtaW5cIn1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUm9sZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3JvbGVzLzppZCcsIHsgaWQ6ICdAaWQnIH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgU2hhcGVcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3Igc2hhcGVzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHNoYXBlc1xudmFyIHNoYXBlcyA9IFNoYXBlLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHNoYXBlcyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwicG9pbnRcIn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIHNoYXBlXG52YXIgc2hhcGUgPSBTaGFwZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coc2hhcGUpOyAvLyB7aWQ6IDEsIG5hbWU6IFwicG9pbnRcIn1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnU2hhcGUnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9zaGFwZXMvOmlkJywgeyBpZDogJ0BpZCcgfSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBUcmFuc2VjdFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0cmFuc2VjdHMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBvbmUgdHJhbnNlY3RcbnZhciB0cmFuc2VjdCA9IFRyYW5zZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh0cmFuc2VjdCk7IC8vIHtpZDogMSwgbmFtZTogXCJ0cmFuc2VjdCAxXCJ9XG59KTtcblxuLy8gdXBkYXRlIGEgdHJhbnNlY3RcbnZhciB0cmFuc2VjdCA9IFRyYW5zZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICB0cmFuc2VjdC5uYW1lID0gXCJteSB0cmFuc2VjdFwiO1xuICAgdHJhbnNlY3QuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblRyYW5zZWN0LnNhdmUoe2lkOiAxLCBuYW1lOiBcIm15IHRyYW5zZWN0XCJ9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1RyYW5zZWN0JywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvdHJhbnNlY3RzLzppZCcsXG5cdFx0eyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfVxuXHRcdH1cblx0XHQpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgVHJhbnNlY3RJbWFnZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBpbWFnZXMgb2YgdHJhbnNlY3RzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgdGhlIElEcyBvZiBhbGwgaW1hZ2VzIG9mIHRoZSB0cmFuc2VjdCB3aXRoIElEIDFcbnZhciBpbWFnZXMgPSBUcmFuc2VjdEltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGltYWdlcyk7IC8vIFsxLCAxMiwgMTQsIC4uLl1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnVHJhbnNlY3RJbWFnZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3RyYW5zZWN0cy86dHJhbnNlY3RfaWQvaW1hZ2VzJyk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBVc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHVzZXJzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYSBsaXN0IG9mIGFsbCB1c2Vyc1xudmFyIHVzZXJzID0gVXNlci5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2Vycyk7IC8vIFt7aWQ6IDEsIGZpcnN0bmFtZTogXCJKYW5lXCIsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyByZXRyaWV2aW5nIHRoZSB1c2VybmFtZVxudmFyIHVzZXIgPSBVc2VyLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2VyLmZpcnN0bmFtZSk7XG59KTtcblxuLy8gY3JlYXRpbmcgYSBuZXcgdXNlclxudmFyIHVzZXIgPSBVc2VyLmFkZChcbiAgIHtcbiAgICAgIGVtYWlsOiAnbXlAbWFpbC5jb20nLFxuICAgICAgcGFzc3dvcmQ6ICcxMjM0NTZwdycsXG4gICAgICBwYXNzd29yZF9jb25maXJtYXRpb246ICcxMjM0NTZwdycsXG4gICAgICBmaXJzdG5hbWU6ICdqYW5lJyxcbiAgICAgIGxhc3RuYW1lOiAndXNlcidcbiAgIH0sXG4gICBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyh1c2VyKTsgLy8ge2lkOiAxLCBmaXJzdG5hbWU6ICdqYW5lJywgLi4ufVxuICAgfVxuKTtcblxuLy8gY2hhbmdpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IFVzZXIuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuZmlyc3RuYW1lID09ICdKb2VsJztcbiAgIHVzZXIuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblVzZXIuc2F2ZSh7aWQ6IDEsIGZpcnN0bmFtZTogJ0pvZWwnfSk7XG5cbi8vIGRlbGV0aW5nIHRoZSB1c2VyXG52YXIgdXNlciA9IFVzZXIuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuVXNlci5kZWxldGUoe2lkOiAxfSk7XG5cbi8vIHF1ZXJ5IGZvciBhIHVzZXJuYW1lXG52YXIgdXNlcnMgPSBVc2VyLmZpbmQoe3F1ZXJ5OiAnamEnIH0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXJzKTsgLy8gW3tpZDogMSwgZmlyc3RuYW1lOiBcImphbmVcIiwgLi4ufSwgLi4uXVxufSk7XG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnVXNlcicsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3VzZXJzLzppZC86cXVlcnknLCB7IGlkOiAnQGlkJyB9LCB7XG5cdFx0c2F2ZTogeyBtZXRob2Q6ICdQVVQnIH0sXG5cdFx0YWRkOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG4gICAgICBmaW5kOiB7IG1ldGhvZDogJ0dFVCcsIHBhcmFtczogeyBpZDogJ2ZpbmQnIH0sIGlzQXJyYXk6IHRydWUgfVxuXHR9KTtcbn0pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFwaVxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHJvbGVzXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIHRoZSBhdmFpbGFibGUgcm9sZXNcbiAqIEBleGFtcGxlXG52YXIgYWRtaW5Sb2xlSWQgPSByb2xlLmdldElkKCdhZG1pbicpOyAvLyAxXG52YXIgYWRtaW5Sb2xlTmFtZSA9IHJvbGUuZ2V0TmFtZSgxKTsgLy8gJ2FkbWluJ1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5zZXJ2aWNlKCdyb2xlcycsIGZ1bmN0aW9uIChSb2xlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgcm9sZXMgPSB7fTtcblx0XHR2YXIgcm9sZXNJbnZlcnNlID0ge307XG5cblx0XHRSb2xlLnF1ZXJ5KGZ1bmN0aW9uIChyKSB7XG5cdFx0XHRyLmZvckVhY2goZnVuY3Rpb24gKHJvbGUpIHtcblx0XHRcdFx0cm9sZXNbcm9sZS5pZF0gPSByb2xlLm5hbWU7XG5cdFx0XHRcdHJvbGVzSW52ZXJzZVtyb2xlLm5hbWVdID0gcm9sZS5pZDtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5nZXROYW1lID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRyZXR1cm4gcm9sZXNbaWRdO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldElkID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdHJldHVybiByb2xlc0ludmVyc2VbbmFtZV07XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hcGlcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzaGFwZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIGF2YWlsYWJsZSBzaGFwZXNcbiAqIEBleGFtcGxlXG52YXIgc2hhcGVzQXJyYXkgPSBzcGFoZXMuZ2V0QWxsKCk7IC8vIFt7aWQ6IDEsIG5hbWU6ICdQb2ludCd9LCAuLi5dXG5zaGFwZXMuZ2V0SWQoJ1BvaW50Jyk7IC8vIDFcbnNoYXBlcy5nZXROYW1lKDEpOyAvLyAnUG9pbnQnXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLnNlcnZpY2UoJ3NoYXBlcycsIGZ1bmN0aW9uIChTaGFwZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHNoYXBlcyA9IHt9O1xuXHRcdHZhciBzaGFwZXNJbnZlcnNlID0ge307XG5cblx0XHR2YXIgcmVzb3VyY2VzID0gU2hhcGUucXVlcnkoZnVuY3Rpb24gKHMpIHtcblx0XHRcdHMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcblx0XHRcdFx0c2hhcGVzW3NoYXBlLmlkXSA9IHNoYXBlLm5hbWU7XG5cdFx0XHRcdHNoYXBlc0ludmVyc2Vbc2hhcGUubmFtZV0gPSBzaGFwZS5pZDtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5nZXROYW1lID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRyZXR1cm4gc2hhcGVzW2lkXTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRJZCA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRyZXR1cm4gc2hhcGVzSW52ZXJzZVtuYW1lXTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gcmVzb3VyY2VzO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmdkb2MgY29uc3RhbnRcbiAqIEBuYW1lIE1BWF9NU0dcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAZGVzY3JpcHRpb24gVGhlIG1heGltdW0gbnVtYmVyIG9mIGluZm8gbWVzc2FnZXMgdG8gZGlzcGxheS5cbiAqIEByZXR1cm5zIHtJbnRlZ2VyfVxuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5jb25zdGFudCgnTUFYX01TRycsIDEpOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTWVzc2FnZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy51aS5tZXNzYWdlc1xuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgdGhlIGxpdmUgZGlzcGxheSBvZiB1c2VyIGZlZWRiYWNrIG1lc3NhZ2VzIHZpYSBKU1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS5tZXNzYWdlcycpLmNvbnRyb2xsZXIoJ01lc3NhZ2VzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIE1BWF9NU0cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5hbGVydHMgPSBbXTtcblxuXHRcdC8vIG1ha2UgbWV0aG9kIGFjY2Vzc2libGUgYnkgb3RoZXIgbW9kdWxlc1xuXHRcdHdpbmRvdy4kZGlhc1Bvc3RNZXNzYWdlID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCRzY29wZS5hbGVydHMudW5zaGlmdCh7XG5cdFx0XHRcdFx0bWVzc2FnZTogbWVzc2FnZSxcblx0XHRcdFx0XHR0eXBlOiB0eXBlIHx8ICdpbmZvJ1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpZiAoJHNjb3BlLmFsZXJ0cy5sZW5ndGggPiBNQVhfTVNHKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmFsZXJ0cy5wb3AoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jbG9zZSA9IGZ1bmN0aW9uIChpbmRleCkge1xuXHRcdFx0JHNjb3BlLmFsZXJ0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS51c2Vyc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgdXNlckNob29zZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLnVzZXJzXG4gKiBAZGVzY3JpcHRpb24gQW4gaW5wdXQgZmllbGQgdG8gZmluZCBhIHVzZXIuXG4gKiBAZXhhbXBsZVxuLy8gSFRNTFxuPGlucHV0IHBsYWNlaG9sZGVyPVwiU2VhcmNoIGJ5IHVzZXJuYW1lXCIgZGF0YS11c2VyLWNob29zZXI9XCJhZGRVc2VyXCIgLz5cblxuLy8gQ29udHJvbGxlciAoZXhhbXBsZSBmb3IgYWRkaW5nIGEgdXNlciB0byBhIHByb2plY3QpXG4kc2NvcGUuYWRkVXNlciA9IGZ1bmN0aW9uICh1c2VyKSB7XG5cdC8vIG5ldyB1c2VycyBhcmUgZ3Vlc3RzIGJ5IGRlZmF1bHRcblx0dmFyIHJvbGVJZCA9ICRzY29wZS5yb2xlcy5ndWVzdDtcblxuXHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHR1c2VyLnByb2plY3Rfcm9sZV9pZCA9IHJvbGVJZDtcblx0XHQkc2NvcGUudXNlcnMucHVzaCh1c2VyKTtcblx0fTtcblxuXHQvLyB1c2VyIHNob3VsZG4ndCBhbHJlYWR5IGV4aXN0XG5cdGlmICghZ2V0VXNlcih1c2VyLmlkKSkge1xuXHRcdFByb2plY3RVc2VyLmF0dGFjaChcblx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfSxcblx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0c3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3Jcblx0XHQpO1xuXHR9XG59O1xuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLnVzZXJzJykuZGlyZWN0aXZlKCd1c2VyQ2hvb3NlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXG5cdFx0XHRzY29wZToge1xuXHRcdFx0XHRzZWxlY3Q6ICc9dXNlckNob29zZXInXG5cdFx0XHR9LFxuXG5cdFx0XHRyZXBsYWNlOiB0cnVlLFxuXG5cdFx0XHR0ZW1wbGF0ZTogJzxpbnB1dCB0eXBlPVwidGV4dFwiIGRhdGEtbmctbW9kZWw9XCJzZWxlY3RlZFwiIGRhdGEtdHlwZWFoZWFkPVwidXNlci5uYW1lIGZvciB1c2VyIGluIGZpbmQoJHZpZXdWYWx1ZSlcIiBkYXRhLXR5cGVhaGVhZC13YWl0LW1zPVwiMjUwXCIgZGF0YS10eXBlYWhlYWQtb24tc2VsZWN0PVwic2VsZWN0KCRpdGVtKVwiLz4nLFxuXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBVc2VyKSB7XG5cdFx0XHRcdCRzY29wZS5maW5kID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG5cdFx0XHRcdFx0cmV0dXJuIFVzZXIuZmluZCh7cXVlcnk6IHF1ZXJ5fSkuJHByb21pc2U7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbXNnXG4gKiBAbWVtYmVyT2YgZGlhcy51aS5tZXNzYWdlc1xuICogQGRlc2NyaXB0aW9uIEVuYWJsZXMgYXJiaXRyYXJ5IEFuZ3VsYXJKUyBtb2R1bGVzIHRvIHBvc3QgdXNlciBmZWVkYmFjayBtZXNzYWdlcyB1c2luZyB0aGUgRElBUyBVSSBtZXNzYWdpbmcgc3lzdGVtLiBTZWUgdGhlIFtCb290c3RyYXAgYWxlcnRzXShodHRwOi8vZ2V0Ym9vdHN0cmFwLmNvbS9jb21wb25lbnRzLyNhbGVydHMpIGZvciBhdmFpbGFibGUgbWVzc2FnZSB0eXBlcyBhbmQgdGhlaXIgc3R5bGUuIEluIGFkZGl0aW9uIHRvIGFjdGl2ZWx5IHBvc3RpbmcgbWVzc2FnZXMsIGl0IHByb3ZpZGVzIHRoZSBgcmVzcG9uc2VFcnJvcmAgbWV0aG9kIHRvIGNvbnZlbmllbnRseSBkaXNwbGF5IGVycm9yIG1lc3NhZ2VzIGluIGNhc2UgYW4gQUpBWCByZXF1ZXN0IHdlbnQgd3JvbmcuXG4gKiBAZXhhbXBsZVxubXNnLnBvc3QoJ2RhbmdlcicsICdEbyB5b3UgcmVhbGx5IHdhbnQgdG8gZGVsZXRlIHRoaXM/IEV2ZXJ5dGhpbmcgd2lsbCBiZSBsb3N0LicpO1xuXG5tc2cuZGFuZ2VyKCdEbyB5b3UgcmVhbGx5IHdhbnQgdG8gZGVsZXRlIHRoaXM/IEV2ZXJ5dGhpbmcgd2lsbCBiZSBsb3N0LicpO1xubXNnLndhcm5pbmcoJ0xlYXZpbmcgdGhlIHByb2plY3QgaXMgbm90IHJldmVyc2libGUuJyk7XG5tc2cuc3VjY2VzcygnVGhlIHByb2plY3Qgd2FzIGNyZWF0ZWQuJyk7XG5tc2cuaW5mbygnWW91IHdpbGwgcmVjZWl2ZSBhbiBlbWFpbCBhYm91dCB0aGlzLicpO1xuXG52YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHsgLi4uIH0pO1xuLy8gaGFuZGxlcyBhbGwgZXJyb3IgcmVzcG9uc2VzIGF1dG9tYXRpY2FsbHlcbmxhYmVsLiRwcm9taXNlLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5zZXJ2aWNlKCdtc2cnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdHRoaXMucG9zdCA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZSB8fCB0eXBlO1xuXHRcdFx0d2luZG93LiRkaWFzUG9zdE1lc3NhZ2UodHlwZSwgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZGFuZ2VyID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblx0XHRcdF90aGlzLnBvc3QoJ2RhbmdlcicsIG1lc3NhZ2UpO1xuXHRcdH07XG5cblx0XHR0aGlzLndhcm5pbmcgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0X3RoaXMucG9zdCgnd2FybmluZycsIG1lc3NhZ2UpO1xuXHRcdH07XG5cblx0XHR0aGlzLnN1Y2Nlc3MgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0X3RoaXMucG9zdCgnc3VjY2VzcycsIG1lc3NhZ2UpO1xuXHRcdH07XG5cblx0XHR0aGlzLmluZm8gPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0X3RoaXMucG9zdCgnaW5mbycsIG1lc3NhZ2UpO1xuXHRcdH07XG5cblx0XHR0aGlzLnJlc3BvbnNlRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcblxuXHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxKSB7XG5cdFx0XHRcdF90aGlzLmRhbmdlcihcIlBsZWFzZSBsb2cgaW4gKGFnYWluKS5cIik7XG5cdFx0XHR9IGVsc2UgaWYgKCFkYXRhKSB7XG5cdFx0XHRcdF90aGlzLmRhbmdlcihcIlRoZSBzZXJ2ZXIgZGlkbid0IHJlc3BvbmQsIHNvcnJ5LlwiKTtcblx0XHRcdH0gZWxzZSBpZiAoZGF0YS5tZXNzYWdlKSB7XG5cdFx0XHRcdC8vIGVycm9yIHJlc3BvbnNlXG5cdFx0XHRcdF90aGlzLmRhbmdlcihkYXRhLm1lc3NhZ2UpO1xuXHRcdFx0fSBlbHNlIGlmIChkYXRhKSB7XG5cdFx0XHRcdC8vIHZhbGlkYXRpb24gcmVzcG9uc2Vcblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGRhdGEpIHtcblx0XHRcdFx0XHRfdGhpcy5kYW5nZXIoZGF0YVtrZXldWzBdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdW5rbm93biBlcnJvciByZXNwb25zZVxuXHRcdFx0XHRfdGhpcy5kYW5nZXIoXCJUaGVyZSB3YXMgYW4gZXJyb3IsIHNvcnJ5LlwiKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9