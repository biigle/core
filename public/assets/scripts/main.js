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
angular.module('dias.ui', ['ui.bootstrap', 'dias.ui.messages', 'dias.ui.users', 'ngAnimate']);


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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJhcGkvY29uc3RhbnRzL1VSTC5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbi5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbkxhYmVsLmpzIiwiYXBpL2ZhY3Rvcmllcy9BdHRyaWJ1dGUuanMiLCJhcGkvZmFjdG9yaWVzL0ltYWdlLmpzIiwiYXBpL2ZhY3Rvcmllcy9MYWJlbC5qcyIsImFwaS9mYWN0b3JpZXMvTWVkaWFUeXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9Pd25Vc2VyLmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0LmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0TGFiZWwuanMiLCJhcGkvZmFjdG9yaWVzL1Byb2plY3RUcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvUHJvamVjdFVzZXIuanMiLCJhcGkvZmFjdG9yaWVzL1JvbGUuanMiLCJhcGkvZmFjdG9yaWVzL1NoYXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9UcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvVHJhbnNlY3RJbWFnZS5qcyIsImFwaS9mYWN0b3JpZXMvVXNlci5qcyIsImFwaS9zZXJ2aWNlcy9yb2xlcy5qcyIsImFwaS9zZXJ2aWNlcy9zaGFwZXMuanMiLCJ1aS9tZXNzYWdlcy9jb25zdGFudHMvTUFYX01TRy5qcyIsInVpL21lc3NhZ2VzL2NvbnRyb2xsZXIvTWVzc2FnZXNDb250cm9sbGVyLmpzIiwidWkvbWVzc2FnZXMvc2VydmljZXMvbXNnLmpzIiwidWkvdXNlcnMvZGlyZWN0aXZlcy91c2VyQ2hvb3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxZQUFBLENBQUE7O0FBRUEsUUFBQSxPQUFBLFlBQUEseUJBQUEsVUFBQSxlQUFBO0NBQ0E7O0NBRUEsY0FBQSxTQUFBLFFBQUEsT0FBQTtFQUNBOzs7Ozs7O0FBT0EsUUFBQSxPQUFBLG9CQUFBLENBQUE7OztBQUdBLFFBQUEsUUFBQSxVQUFBLE1BQUEsWUFBQTtDQUNBOztDQUVBLFFBQUE7RUFDQSxTQUFBLGNBQUE7RUFDQSxDQUFBOzs7Ozs7OztBQVFBLFFBQUEsT0FBQSxpQkFBQSxDQUFBLGdCQUFBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsV0FBQSxDQUFBLGdCQUFBLG9CQUFBLGlCQUFBOzs7Ozs7Ozs7OztBQy9CQSxRQUFBLE9BQUEsWUFBQSxTQUFBLE9BQUEsT0FBQSxnQkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzJDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLG1DQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7RUFDQSxFQUFBLElBQUE7RUFDQTtHQUNBLEtBQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFVBQUE7O0dBRUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsVUFBQTs7R0FFQSxRQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxVQUFBOztHQUVBLE9BQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFVBQUEsVUFBQSxNQUFBO0lBQ0EsU0FBQTs7R0FFQSxLQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxVQUFBLFVBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzNDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsOENBQUE7R0FDQSxJQUFBO0dBQ0EsZUFBQTtLQUNBO0dBQ0EsT0FBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsUUFBQSxlQUFBLFFBQUE7SUFDQSxTQUFBOztHQUVBLFFBQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFFBQUEsZUFBQSxRQUFBOztHQUVBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFFBQUEscUJBQUEsZUFBQSxNQUFBLFFBQUE7O0dBRUEsUUFBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsUUFBQSxxQkFBQSxlQUFBLE1BQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNyQkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxrQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLDBCQUFBLEVBQUEsSUFBQSxTQUFBO0VBQ0EsS0FBQSxDQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN0QkEsUUFBQSxPQUFBLFlBQUEsUUFBQSw4QkFBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ29CQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDhCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsc0JBQUEsRUFBQSxJQUFBO0VBQ0E7R0FDQSxLQUFBLENBQUEsUUFBQTtHQUNBLE1BQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzFCQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGtDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsMkJBQUEsRUFBQSxJQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDT0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxnQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLG9CQUFBLElBQUE7RUFDQSxNQUFBLENBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNRQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsd0JBQUEsRUFBQSxJQUFBO0VBQ0E7O0dBRUEsT0FBQSxFQUFBLFFBQUEsT0FBQSxRQUFBLEVBQUEsSUFBQSxRQUFBLFNBQUE7R0FDQSxLQUFBLEVBQUEsUUFBQTtHQUNBLE1BQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxxQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLHVDQUFBLENBQUEsWUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2dDQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7RUFDQSxFQUFBLElBQUE7RUFDQTtHQUNBLEtBQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7R0FDQSxRQUFBLEVBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM3QkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxvQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBO0VBQ0EsRUFBQSxJQUFBO0VBQ0E7R0FDQSxNQUFBLEVBQUEsUUFBQTtHQUNBLFFBQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDakJBLFFBQUEsT0FBQSxZQUFBLFFBQUEsNkJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxxQkFBQSxFQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0hBLFFBQUEsT0FBQSxZQUFBLFFBQUEsOEJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxzQkFBQSxFQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0FBLFFBQUEsT0FBQSxZQUFBLFFBQUEsaUNBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTtFQUNBLEVBQUEsSUFBQTtFQUNBO0dBQ0EsTUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2RBLFFBQUEsT0FBQSxZQUFBLFFBQUEsc0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ29DQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDZCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsNEJBQUEsRUFBQSxJQUFBLFNBQUE7RUFDQSxNQUFBLEVBQUEsUUFBQTtFQUNBLEtBQUEsRUFBQSxRQUFBO01BQ0EsTUFBQSxFQUFBLFFBQUEsT0FBQSxRQUFBLEVBQUEsSUFBQSxVQUFBLFNBQUE7Ozs7Ozs7Ozs7Ozs7QUNqREEsUUFBQSxPQUFBLFlBQUEsUUFBQSxrQkFBQSxVQUFBLE1BQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7RUFDQSxJQUFBLGVBQUE7O0VBRUEsS0FBQSxNQUFBLFVBQUEsR0FBQTtHQUNBLEVBQUEsUUFBQSxVQUFBLE1BQUE7SUFDQSxNQUFBLEtBQUEsTUFBQSxLQUFBO0lBQ0EsYUFBQSxLQUFBLFFBQUEsS0FBQTs7OztFQUlBLEtBQUEsVUFBQSxVQUFBLElBQUE7R0FDQSxPQUFBLE1BQUE7OztFQUdBLEtBQUEsUUFBQSxVQUFBLE1BQUE7R0FDQSxPQUFBLGFBQUE7Ozs7Ozs7Ozs7Ozs7OztBQ2pCQSxRQUFBLE9BQUEsWUFBQSxRQUFBLG9CQUFBLFVBQUEsT0FBQTtFQUNBOztFQUVBLElBQUEsU0FBQTtFQUNBLElBQUEsZ0JBQUE7O0VBRUEsSUFBQSxZQUFBLE1BQUEsTUFBQSxVQUFBLEdBQUE7R0FDQSxFQUFBLFFBQUEsVUFBQSxPQUFBO0lBQ0EsT0FBQSxNQUFBLE1BQUEsTUFBQTtJQUNBLGNBQUEsTUFBQSxRQUFBLE1BQUE7Ozs7RUFJQSxLQUFBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsT0FBQSxPQUFBOzs7RUFHQSxLQUFBLFFBQUEsVUFBQSxNQUFBO0dBQ0EsT0FBQSxjQUFBOzs7RUFHQSxLQUFBLFNBQUEsWUFBQTtHQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQ3pCQSxRQUFBLE9BQUEsb0JBQUEsU0FBQSxXQUFBOzs7Ozs7OztBQ0RBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDRDQUFBLFVBQUEsUUFBQSxTQUFBO0VBQ0E7O0VBRUEsT0FBQSxTQUFBOztRQUVBLElBQUEsa0JBQUEsWUFBQTtZQUNBLElBQUEsU0FBQSxnQkFBQTtnQkFDQSxTQUFBO21CQUNBLElBQUEsU0FBQSxrQkFBQTtnQkFDQSxTQUFBO21CQUNBLElBQUEsU0FBQSxxQkFBQTtnQkFDQSxTQUFBO21CQUNBLElBQUEsU0FBQSxzQkFBQTtnQkFDQSxTQUFBOzs7OztFQUtBLE9BQUEsbUJBQUEsVUFBQSxNQUFBLFNBQUE7WUFDQTtHQUNBLE9BQUEsT0FBQSxXQUFBO0lBQ0EsT0FBQSxPQUFBLFFBQUE7S0FDQSxTQUFBO0tBQ0EsTUFBQSxRQUFBOzs7SUFHQSxJQUFBLE9BQUEsT0FBQSxTQUFBLFNBQUE7S0FDQSxPQUFBLE9BQUE7Ozs7O0VBS0EsT0FBQSxRQUFBLFVBQUEsT0FBQTtHQUNBLE9BQUEsT0FBQSxPQUFBLE9BQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDdEJBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLE9BQUEsWUFBQTtFQUNBO0VBQ0EsSUFBQSxRQUFBOztFQUVBLEtBQUEsT0FBQSxVQUFBLE1BQUEsU0FBQTtHQUNBLFVBQUEsV0FBQTtHQUNBLE9BQUEsaUJBQUEsTUFBQTs7O0VBR0EsS0FBQSxTQUFBLFVBQUEsU0FBQTtHQUNBLE1BQUEsS0FBQSxVQUFBOzs7RUFHQSxLQUFBLFVBQUEsVUFBQSxTQUFBO0dBQ0EsTUFBQSxLQUFBLFdBQUE7OztFQUdBLEtBQUEsVUFBQSxVQUFBLFNBQUE7R0FDQSxNQUFBLEtBQUEsV0FBQTs7O0VBR0EsS0FBQSxPQUFBLFVBQUEsU0FBQTtHQUNBLE1BQUEsS0FBQSxRQUFBOzs7RUFHQSxLQUFBLGdCQUFBLFVBQUEsVUFBQTtHQUNBLElBQUEsT0FBQSxTQUFBOztHQUVBLElBQUEsU0FBQSxXQUFBLEtBQUE7SUFDQSxNQUFBLE9BQUE7VUFDQSxJQUFBLENBQUEsTUFBQTtJQUNBLE1BQUEsT0FBQTtVQUNBLElBQUEsS0FBQSxTQUFBOztJQUVBLE1BQUEsT0FBQSxLQUFBO1VBQ0EsSUFBQSxNQUFBOztJQUVBLEtBQUEsSUFBQSxPQUFBLE1BQUE7S0FDQSxNQUFBLE9BQUEsS0FBQSxLQUFBOztVQUVBOztJQUVBLE1BQUEsT0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzdCQSxRQUFBLE9BQUEsaUJBQUEsVUFBQSxlQUFBLFlBQUE7RUFDQTs7RUFFQSxPQUFBO0dBQ0EsVUFBQTs7R0FFQSxPQUFBO0lBQ0EsUUFBQTs7O0dBR0EsU0FBQTs7R0FFQSxVQUFBOztHQUVBLCtCQUFBLFVBQUEsUUFBQSxNQUFBO0lBQ0EsT0FBQSxPQUFBLFVBQUEsT0FBQTtLQUNBLE9BQUEsS0FBQSxLQUFBLENBQUEsT0FBQSxRQUFBOzs7Ozs7QUFNQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgYXBpIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScsIFsnbmdSZXNvdXJjZSddKTtcblxuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdCRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bXCJYLVJlcXVlc3RlZC1XaXRoXCJdID1cblx0XHRcIlhNTEh0dHBSZXF1ZXN0XCI7XG59KTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkubWVzc2FnZXNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB1c2VyIGZlZWRiYWNrIG1lc3NhZ2VzIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLm1lc3NhZ2VzJywgWyd1aS5ib290c3RyYXAnXSk7XG5cbi8vIGJvb3RzdHJhcCB0aGUgbWVzc2FnZXMgbW9kdWxlXG5hbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0YW5ndWxhci5ib290c3RyYXAoXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtbmctY29udHJvbGxlcj1cIk1lc3NhZ2VzQ29udHJvbGxlclwiXScpLFxuXHRcdFsnZGlhcy51aS5tZXNzYWdlcyddXG5cdCk7XG59KTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkudXNlcnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB1c2VycyBVSSBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS51c2VycycsIFsndWkuYm9vdHN0cmFwJywgJ2RpYXMuYXBpJ10pO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aVxuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIFVJIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpJywgWyd1aS5ib290c3RyYXAnLCAnZGlhcy51aS5tZXNzYWdlcycsICdkaWFzLnVpLnVzZXJzJywgJ25nQW5pbWF0ZSddKTtcblxuIiwiLyoqXG4gKiBAbmdkb2MgY29uc3RhbnRcbiAqIEBuYW1lIFVSTFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gVGhlIGJhc2UgdXJsIG9mIHRoZSBhcHBsaWNhdGlvbi5cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5jb25zdGFudCgnVVJMJywgd2luZG93LiRkaWFzQmFzZVVybCB8fCAnJyk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgQW5ub3RhdGlvblxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBhbm5vdGF0aW9ucy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gcmV0cmlldmluZyB0aGUgc2hhcGUgSUQgb2YgYW4gYW5ub3RhdGlvblxudmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmdldCh7aWQ6IDEyM30sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGFubm90YXRpb24uc2hhcGVfaWQpO1xufSk7XG5cbi8vIHNhdmluZyBhbiBhbm5vdGF0aW9uICh1cGRhdGluZyB0aGUgYW5ub3RhdGlvbiBwb2ludHMpXG52YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGFubm90YXRpb24ucG9pbnRzID0gW3t4OiAxMCwgeTogMTB9XTtcbiAgIGFubm90YXRpb24uJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbkFubm90YXRpb24uc2F2ZSh7XG4gICBpZDogMSwgcG9pbnRzOiBbe3g6IDEwLCB5OiAxMH1dXG59KTtcblxuLy8gZGVsZXRpbmcgYW4gYW5ub3RhdGlvblxudmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmdldCh7aWQ6IDEyM30sIGZ1bmN0aW9uICgpIHtcbiAgIGFubm90YXRpb24uJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuQW5ub3RhdGlvbi5kZWxldGUoe2lkOiAxMjN9KTtcblxuLy8gZ2V0IGFsbCBhbm5vdGF0aW9ucyBvZiBhbiBpbWFnZVxuLy8gbm90ZSwgdGhhdCB0aGUgYGlkYCBpcyBub3cgdGhlIGltYWdlIElEIGFuZCBub3QgdGhlIGFubm90YXRpb24gSUQgZm9yIHRoZVxuLy8gcXVlcnkhXG52YXIgYW5ub3RhdGlvbnMgPSBBbm5vdGF0aW9uLnF1ZXJ5KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGFubm90YXRpb25zKTsgLy8gW3tpZDogMSwgc2hhcGVfaWQ6IDEsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyBhZGQgYSBuZXcgYW5ub3RhdGlvbiB0byBhbiBpbWFnZVxuLy8gbm90ZSwgdGhhdCB0aGUgYGlkYCBpcyBub3cgdGhlIGltYWdlIElEIGFuZCBub3QgdGhlIGFubm90YXRpb24gSUQgZm9yIHRoZVxuLy8gcXVlcnkhXG52YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uYWRkKHtcbiAgIGlkOiAxLFxuICAgc2hhcGVfaWQ6IDEsXG4gICBsYWJlbF9pZDogMSxcbiAgIGNvbmZpZGVuY2U6IDAuNVxuICAgcG9pbnRzOiBbXG4gICAgICB7IHg6IDEwLCB5OiAyMCB9XG4gICBdXG59KTtcbiAqIFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdBbm5vdGF0aW9uJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvOmVuZHBvaW50LzppZC86c2x1ZycsXG5cdFx0eyBpZDogJ0BpZCdcdH0sXG5cdFx0e1xuXHRcdFx0Z2V0OiB7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHBhcmFtczogeyBlbmRwb2ludDogJ2Fubm90YXRpb25zJyB9XG5cdFx0XHR9LFxuXHRcdFx0c2F2ZToge1xuXHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxuXHRcdFx0XHRwYXJhbXM6IHsgZW5kcG9pbnQ6ICdhbm5vdGF0aW9ucycgfVxuXHRcdFx0fSxcblx0XHRcdGRlbGV0ZToge1xuXHRcdFx0XHRtZXRob2Q6ICdERUxFVEUnLFxuXHRcdFx0XHRwYXJhbXM6IHsgZW5kcG9pbnQ6ICdhbm5vdGF0aW9ucycgfVxuXHRcdFx0fSxcblx0XHRcdHF1ZXJ5OiB7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHBhcmFtczogeyBlbmRwb2ludDogJ2ltYWdlcycsIHNsdWc6ICdhbm5vdGF0aW9ucycgfSxcblx0XHRcdFx0aXNBcnJheTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGFkZDoge1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0cGFyYW1zOiB7IGVuZHBvaW50OiAnaW1hZ2VzJywgc2x1ZzogJ2Fubm90YXRpb25zJyB9XG5cdFx0XHR9XG5cdFx0fSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBBbm5vdGF0aW9uTGFiZWxcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgYW5ub3RhdGlvbiBsYWJlbHMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgbGFiZWxzIG9mIGFuIGFubm90YXRpb24gYW5kIHVwZGF0ZSBvbmUgb2YgdGhlbVxudmFyIGxhYmVscyA9IEFubm90YXRpb25MYWJlbC5xdWVyeSh7YW5ub3RhdGlvbl9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHZhciBsYWJlbCA9IGxhYmVsc1swXTtcbiAgIGxhYmVsLmNvbmZpZGVuY2UgPSAwLjk7XG4gICBsYWJlbC4kc2F2ZSgpO1xufSk7XG5cbi8vIGRpcmVjdGx5IHVwZGF0ZSBhIGxhYmVsXG5Bbm5vdGF0aW9uTGFiZWwuc2F2ZSh7Y29uZmlkZW5jZTogMC4xLCBhbm5vdGF0aW9uX2lkOiAxLCBpZDogMX0pO1xuXG4vLyBhdHRhY2ggYSBuZXcgbGFiZWwgdG8gYW4gYW5ub3RhdGlvblxudmFyIGxhYmVsID0gQW5ub3RhdGlvbkxhYmVsLmF0dGFjaCh7bGFiZWxfaWQ6IDEsIGNvbmZpZGVuY2U6IDAuNSwgYW5ub3RhdGlvbl9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGxhYmVsKTsgLy8ge2lkOiAxLCBuYW1lOiAnbXkgbGFiZWwnLCB1c2VyX2lkOiAxLCAuLi59XG59KTtcblxuXG4vLyBkZXRhY2ggYSBsYWJlbFxudmFyIGxhYmVscyA9IEFubm90YXRpb25MYWJlbC5xdWVyeSh7YW5ub3RhdGlvbl9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHZhciBsYWJlbCA9IGxhYmVsc1swXTtcbiAgIGxhYmVsLiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbkFubm90YXRpb25MYWJlbC5kZWxldGUoe2lkOiAxfSk7XG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnQW5ub3RhdGlvbkxhYmVsJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvOnByZWZpeC86YW5ub3RhdGlvbl9pZC86c3VmZml4LzppZCcsIHtcblx0XHRcdGlkOiAnQGlkJyxcblx0XHRcdGFubm90YXRpb25faWQ6ICdAYW5ub3RhdGlvbl9pZCdcblx0XHR9LCB7XG5cdFx0XHRxdWVyeToge1xuXHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHRwYXJhbXM6IHsgcHJlZml4OiAnYW5ub3RhdGlvbnMnLCBzdWZmaXg6ICdsYWJlbHMnIH0sXG5cdFx0XHRcdGlzQXJyYXk6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRhdHRhY2g6IHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHBhcmFtczogeyBwcmVmaXg6ICdhbm5vdGF0aW9ucycsIHN1ZmZpeDogJ2xhYmVscycgfVxuXHRcdFx0fSxcblx0XHRcdHNhdmU6IHtcblx0XHRcdFx0bWV0aG9kOiAnUFVUJyxcblx0XHRcdFx0cGFyYW1zOiB7IHByZWZpeDogJ2Fubm90YXRpb24tbGFiZWxzJywgYW5ub3RhdGlvbl9pZDogbnVsbCwgc3VmZml4OiBudWxsIH1cblx0XHRcdH0sXG5cdFx0XHRkZWxldGU6IHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0cGFyYW1zOiB7IHByZWZpeDogJ2Fubm90YXRpb24tbGFiZWxzJywgYW5ub3RhdGlvbl9pZDogbnVsbCwgc3VmZml4OiBudWxsIH1cblx0XHRcdH1cblx0fSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBBdHRyaWJ1dGVcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgYXR0cmlidXRlcy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gbGlzdCBhbGwgYXR0cmlidXRlc1xudmFyIGF0dHJpYnV0ZXMgPSBBdHRyaWJ1dGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coYXR0cmlidXRlcyk7IC8vIFt7aWQ6IDEsIHR5cGU6ICdib29sZWFuJywgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGdldCBhIHNwZWNpZmljIGF0dHJpYnV0ZVxudmFyIGF0dHJpYnV0ZSA9IEF0dHJpYnV0ZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coYXR0cmlidXRlKTsgLy8ge2lkOiAxLCB0eXBlOiAnYm9vbGVhbicsIC4uLn1cbn0pO1xuXG4vLyBjcmVhdGUgYSBuZXcgYXR0cmlidXRlXG52YXIgYXR0cmlidXRlID0gQXR0cmlidXRlLmFkZCh7XG4gICAgICBuYW1lOiAnYmFkX3F1YWxpdHknLCB0eXBlOiAnYm9vbGVhbidcbiAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKGF0dHJpYnV0ZSk7IC8vIHtpZDogMSwgbmFtZTogJ2JhZF9xdWFsaXR5JywgLi4ufVxufSk7XG5cbi8vIGRlbGV0ZSBhbiBhdHRyaWJ1dGVcbnZhciBhdHRyaWJ1dGVzID0gQXR0cmlidXRlLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIHZhciBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzWzBdO1xuICAgYXR0cmlidXRlLiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbkF0dHJpYnV0ZS5kZWxldGUoe2lkOiAxfSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdBdHRyaWJ1dGUnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9hdHRyaWJ1dGVzLzppZCcsIHsgaWQ6ICdAaWQnIH0sIHtcblx0XHRhZGQ6IHttZXRob2Q6ICdQT1NUJ31cblx0fSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBJbWFnZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBpbWFnZXMuIFRoaXMgcmVzb3VyY2UgaXMgb25seSBmb3IgXG4gKiBmaW5kaW5nIG91dCB3aGljaCB0cmFuc2VjdCBhbiBpbWFnZSBiZWxvbmdzIHRvLiBUaGUgaW1hZ2UgZmlsZXMgYXJlXG4gKiBkaXJlY3RseSBjYWxsZWQgZnJvbSB0aGUgQVBJLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYW4gaW1hZ2VcbnZhciBpbWFnZSA9IEltYWdlLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhpbWFnZSk7IC8vIHtpZDogMSwgd2lkdGg6IDEwMDAsIGhlaWdodDogNzUwLCB0cmFuc2VjdDogey4uLn0sIC4uLn1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnSW1hZ2UnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9pbWFnZXMvOmlkJyk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBMYWJlbFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBsYWJlbHMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgbGFiZWxzXG52YXIgbGFiZWxzID0gTGFiZWwucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWxzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJCZW50aGljIE9iamVjdFwiLCAuLi59LCAuLi5dXG59KTtcblxuLy8gZ2V0IG9uZSBsYWJlbFxudmFyIGxhYmVsID0gTGFiZWwuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGxhYmVsKTsgLy8ge2lkOiAxLCBuYW1lOiBcIkJlbnRoaWMgT2JqZWN0XCIsIC4uLn1cbn0pO1xuXG4vLyBjcmVhdGUgYSBuZXcgbGFiZWxcbnZhciBsYWJlbCA9IExhYmVsLmFkZCh7bmFtZTogXCJUcmFzaFwiLCBwYXJlbnRfaWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbCk7IC8vIHtpZDogMiwgbmFtZTogXCJUcmFzaFwiLCBwYXJlbnRfaWQ6IDEsIC4uLn1cbn0pO1xuXG4vLyB1cGRhdGUgYSBsYWJlbFxudmFyIGxhYmVsID0gTGFiZWwuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGxhYmVsLm5hbWUgPSAnVHJhc2gnO1xuICAgbGFiZWwuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbkxhYmVsLnNhdmUoe2lkOiAxLCBuYW1lOiAnVHJhc2gnfSk7XG5cbi8vIGRlbGV0ZSBhIGxhYmVsXG52YXIgbGFiZWwgPSBMYWJlbC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgbGFiZWwuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuTGFiZWwuZGVsZXRlKHtpZDogMX0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnTGFiZWwnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9sYWJlbHMvOmlkJywgeyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHRhZGQ6IHttZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0c2F2ZTogeyBtZXRob2Q6ICdQVVQnIH1cblx0XHR9XG5cdCk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBNZWRpYVR5cGVcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgbWVkaWEgdHlwZXMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgbWVkaWEgdHlwZXNcbnZhciBtZWRpYVR5cGVzID0gTWVkaWFUeXBlLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKG1lZGlhVHlwZXMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcInRpbWUtc2VyaWVzXCJ9LCAuLi5dXG59KTtcblxuLy8gZ2V0IG9uZSBtZWRpYSB0eXBlXG52YXIgbWVkaWFUeXBlID0gTWVkaWFUeXBlLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhtZWRpYVR5cGUpOyAvLyB7aWQ6IDEsIG5hbWU6IFwidGltZS1zZXJpZXNcIn1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnTWVkaWFUeXBlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvbWVkaWEtdHlwZXMvOmlkJywgeyBpZDogJ0BpZCcgfSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBPd25Vc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHRoZSBsb2dnZWQgaW4gdXNlci5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gcmV0cmlldmluZyB0aGUgdXNlcm5hbWVcbnZhciB1c2VyID0gT3duVXNlci5nZXQoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2codXNlci5maXJzdG5hbWUpO1xufSk7XG5cbi8vIGNoYW5naW5nIHRoZSB1c2VybmFtZVxudmFyIHVzZXIgPSBPd25Vc2VyLmdldChmdW5jdGlvbiAoKSB7XG4gICB1c2VyLmZpcnN0bmFtZSA9PSAnSm9lbCc7XG4gICB1c2VyLiRzYXZlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Pd25Vc2VyLnNhdmUoe2ZpcnN0bmFtZTogJ0pvZWwnfSk7XG5cbi8vIGRlbGV0aW5nIHRoZSB1c2VyXG52YXIgdXNlciA9IE93blVzZXIuZ2V0KGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuT3duVXNlci5kZWxldGUoKTtcbiAqIFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdPd25Vc2VyJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvdXNlcnMvbXknLCB7fSwge1xuXHRcdHNhdmU6IHttZXRob2Q6ICdQVVQnfVxuXHR9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFByb2plY3RcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgcHJvamVjdHMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgcHJvamVjdHMsIHRoZSBjdXJyZW50IHVzZXIgYmVsb25ncyB0b1xudmFyIHByb2plY3RzID0gUHJvamVjdC5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhwcm9qZWN0cyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwiVGVzdCBQcm9qZWN0XCIsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIHByb2plY3RcbnZhciBwcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cocHJvamVjdCk7IC8vIHtpZDogMSwgbmFtZTogXCJUZXN0IFByb2plY3RcIiwgLi4ufVxufSk7XG5cbi8vIGNyZWF0ZSBhIG5ldyBwcm9qZWN0XG52YXIgcHJvamVjdCA9IFByb2plY3QuYWRkKHtuYW1lOiBcIk15IFByb2plY3RcIiwgZGVzY3JpcHRpb246IFwibXkgcHJvamVjdFwifSxcbiAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHByb2plY3QpOyAvLyB7aWQ6IDIsIG5hbWU6IFwiTXkgUHJvamVjdFwiLCAuLi59XG4gICB9XG4pO1xuXG4vLyB1cGRhdGUgYSBwcm9qZWN0XG52YXIgcHJvamVjdCA9IFByb2plY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHByb2plY3QubmFtZSA9ICdOZXcgUHJvamVjdCc7XG4gICBwcm9qZWN0LiRzYXZlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Qcm9qZWN0LnNhdmUoe2lkOiAxLCBuYW1lOiAnTmV3IFByb2plY3QnfSk7XG5cbi8vIGRlbGV0ZSBhIHByb2plY3RcbnZhciBwcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgcHJvamVjdC4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Qcm9qZWN0LmRlbGV0ZSh7aWQ6IDF9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1Byb2plY3QnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9wcm9qZWN0cy86aWQnLCB7IGlkOiAnQGlkJyB9LFxuXHRcdHtcblx0XHRcdC8vIGEgdXNlciBjYW4gb25seSBxdWVyeSB0aGVpciBvd24gcHJvamVjdHNcblx0XHRcdHF1ZXJ5OiB7IG1ldGhvZDogJ0dFVCcsIHBhcmFtczogeyBpZDogJ215JyB9LCBpc0FycmF5OiB0cnVlIH0sXG5cdFx0XHRhZGQ6IHsgbWV0aG9kOiAnUE9TVCcgfSxcblx0XHRcdHNhdmU6IHsgbWV0aG9kOiAnUFVUJyB9XG5cdFx0fVxuXHQpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgUHJvamVjdExhYmVsXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGxhYmVscyBiZWxvbmdpbmcgdG8gYSBwcm9qZWN0LlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIGxhYmVscyBvZiB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciBsYWJlbHMgPSBQcm9qZWN0TGFiZWwucXVlcnkoeyBwcm9qZWN0X2lkOiAxIH0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGxhYmVscyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwiQ29yYWxcIiwgLi4ufSwgLi4uXVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdQcm9qZWN0TGFiZWwnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9wcm9qZWN0cy86cHJvamVjdF9pZC9sYWJlbHMnLCB7cHJvamVjdF9pZDogJ0Bwcm9qZWN0X2lkJ30pO1xufSk7XG4iLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBQcm9qZWN0VHJhbnNlY3RcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgdHJhbnNlY3RzIGJlbG9uZ2luZyB0byBhIHByb2plY3QuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgdHJhbnNlY3RzIG9mIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2codHJhbnNlY3RzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJ0cmFuc2VjdCAxXCIsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyBhZGQgYSBuZXcgdHJhbnNlY3QgdG8gdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdHJhbnNlY3QgPSBQcm9qZWN0VHJhbnNlY3QuYWRkKHtwcm9qZWN0X2lkOiAxfSxcbiAgIHtcbiAgICAgIG5hbWU6IFwidHJhbnNlY3QgMVwiLFxuICAgICAgdXJsOiBcIi92b2wvdHJhbnNlY3RzLzFcIixcbiAgICAgIG1lZGlhX3R5cGVfaWQ6IDEsXG4gICAgICBpbWFnZXM6IFtcIjEuanBnXCIsIFwiMi5qcGdcIl1cbiAgIH0sXG4gICBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyh0cmFuc2VjdCk7IC8vIHtpZDogMSwgbmFtZTogXCJ0cmFuc2VjdCAxXCIsIC4uLn1cbiAgIH1cbik7XG5cbi8vIGF0dGFjaCBhbiBleGlzdGluZyB0cmFuc2VjdCB0byBhbm90aGVyIHByb2plY3RcbnZhciB0cmFuc2VjdHMgPSBQcm9qZWN0VHJhbnNlY3QucXVlcnkoeyBwcm9qZWN0X2lkOiAxIH0sIGZ1bmN0aW9uICgpIHtcbiAgIHZhciB0cmFuc2VjdCA9IHRyYW5zZWN0c1swXTtcbiAgIC8vIHRyYW5zZWN0IGlzIG5vdyBhdHRhY2hlZCB0byBwcm9qZWN0IDEgKmFuZCogMlxuICAgdHJhbnNlY3QuJGF0dGFjaCh7cHJvamVjdF9pZDogMn0pO1xufSk7XG4vLyBvciBkaXJlY3RseSAodHJhbnNlY3QgMSB3aWxsIGJlIGF0dGFjaGVkIHRvIHByb2plY3QgMilcblByb2plY3RUcmFuc2VjdC5hdHRhY2goe3Byb2plY3RfaWQ6IDJ9LCB7aWQ6IDF9KTtcblxuLy8gZGV0YWNoIGEgdHJhbnNlY3QgZnJvbSB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciB0cmFuc2VjdHMgPSBQcm9qZWN0VHJhbnNlY3QucXVlcnkoeyBwcm9qZWN0X2lkOiAxIH0sIGZ1bmN0aW9uICgpIHtcbiAgIHZhciB0cmFuc2VjdCA9IHRyYW5zZWN0c1swXTtcbiAgIHRyYW5zZWN0LiRkZXRhY2goe3Byb2plY3RfaWQ6IDF9KTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblByb2plY3RUcmFuc2VjdC5kZXRhY2goe3Byb2plY3RfaWQ6IDF9LCB7aWQ6IDF9KTtcblxuLy8gYXR0YWNoaW5nIGFuZCBkZXRhY2hpbmcgY2FuIGJlIGRvbmUgdXNpbmcgYSBUcmFuc2VjdCBvYmplY3QgYXMgd2VsbDpcbnZhciB0cmFuc2VjdCA9IFRyYW5zZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBQcm9qZWN0VHJhbnNlY3QuYXR0YWNoKHtwcm9qZWN0X2lkOiAyfSwgdHJhbnNlY3QpO1xufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdQcm9qZWN0VHJhbnNlY3QnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9wcm9qZWN0cy86cHJvamVjdF9pZC90cmFuc2VjdHMvOmlkJyxcblx0XHR7IGlkOiAnQGlkJyB9LFxuXHRcdHtcblx0XHRcdGFkZDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0YXR0YWNoOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRkZXRhY2g6IHsgbWV0aG9kOiAnREVMRVRFJyB9XG5cdFx0fVxuXHQpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgUHJvamVjdFVzZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgdXNlcnMgYmVsb25naW5nIHRvIGEgcHJvamVjdC5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCB1c2VycyBvZiB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciB1c2VycyA9IFByb2plY3RVc2VyLnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2Vycyk7IC8vIFt7aWQ6IDEsIGZpcnN0bmFtZTogXCJKYW5lXCIsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyB1cGRhdGUgdGhlIHByb2plY3Qgcm9sZSBvZiBhIHVzZXJcblByb2plY3RVc2VyLnNhdmUoe3Byb2plY3RfaWQ6IDF9LCB7aWQ6IDEsIHByb2plY3Rfcm9sZV9pZDogMX0pO1xuXG4vLyBhdHRhY2ggYSB1c2VyIHRvIGFub3RoZXIgcHJvamVjdFxuUHJvamVjdFVzZXIuYXR0YWNoKHtwcm9qZWN0X2lkOiAyfSwge2lkOiAxLCBwcm9qZWN0X3JvbGVfaWQ6IDJ9KTtcblxuLy8gZGV0YWNoIGEgdXNlciBmcm9tIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHVzZXJzID0gUHJvamVjdFVzZXIucXVlcnkoeyBwcm9qZWN0X2lkOiAxIH0sIGZ1bmN0aW9uICgpIHtcbiAgIHZhciB1c2VyID0gdXNlcnNbMF07XG4gICB1c2VyLiRkZXRhY2goe3Byb2plY3RfaWQ6IDF9KTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblByb2plY3RVc2VyLmRldGFjaCh7cHJvamVjdF9pZDogMX0sIHtpZDogMX0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUHJvamVjdFVzZXInLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9wcm9qZWN0cy86cHJvamVjdF9pZC91c2Vycy86aWQnLFxuXHRcdHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0c2F2ZTogeyBtZXRob2Q6ICdQVVQnIH0sXG5cdFx0XHRhdHRhY2g6IHsgbWV0aG9kOiAnUE9TVCcgfSxcblx0XHRcdGRldGFjaDogeyBtZXRob2Q6ICdERUxFVEUnIH1cblx0XHR9XG5cdCk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBSb2xlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHJvbGVzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHJvbGVzXG52YXIgcm9sZXMgPSBSb2xlLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHJvbGVzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJhZG1pblwifSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgcm9sZVxudmFyIHJvbGUgPSBSb2xlLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhyb2xlKTsgLy8ge2lkOiAxLCBuYW1lOiBcImFkbWluXCJ9XG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1JvbGUnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9yb2xlcy86aWQnLCB7IGlkOiAnQGlkJyB9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFNoYXBlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHNoYXBlcy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBzaGFwZXNcbnZhciBzaGFwZXMgPSBTaGFwZS5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhzaGFwZXMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcInBvaW50XCJ9LCAuLi5dXG59KTtcblxuLy8gZ2V0IG9uZSBzaGFwZVxudmFyIHNoYXBlID0gU2hhcGUuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHNoYXBlKTsgLy8ge2lkOiAxLCBuYW1lOiBcInBvaW50XCJ9XG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1NoYXBlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvc2hhcGVzLzppZCcsIHsgaWQ6ICdAaWQnIH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgVHJhbnNlY3RcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgdHJhbnNlY3RzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgb25lIHRyYW5zZWN0XG52YXIgdHJhbnNlY3QgPSBUcmFuc2VjdC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2codHJhbnNlY3QpOyAvLyB7aWQ6IDEsIG5hbWU6IFwidHJhbnNlY3QgMVwifVxufSk7XG5cbi8vIHVwZGF0ZSBhIHRyYW5zZWN0XG52YXIgdHJhbnNlY3QgPSBUcmFuc2VjdC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdHJhbnNlY3QubmFtZSA9IFwibXkgdHJhbnNlY3RcIjtcbiAgIHRyYW5zZWN0LiRzYXZlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5UcmFuc2VjdC5zYXZlKHtpZDogMSwgbmFtZTogXCJteSB0cmFuc2VjdFwifSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdUcmFuc2VjdCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3RyYW5zZWN0cy86aWQnLFxuXHRcdHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0c2F2ZTogeyBtZXRob2Q6ICdQVVQnIH1cblx0XHR9XG5cdFx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFRyYW5zZWN0SW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgaW1hZ2VzIG9mIHRyYW5zZWN0cy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IHRoZSBJRHMgb2YgYWxsIGltYWdlcyBvZiB0aGUgdHJhbnNlY3Qgd2l0aCBJRCAxXG52YXIgaW1hZ2VzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhpbWFnZXMpOyAvLyBbMSwgMTIsIDE0LCAuLi5dXG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1RyYW5zZWN0SW1hZ2UnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS90cmFuc2VjdHMvOnRyYW5zZWN0X2lkL2ltYWdlcycpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgVXNlclxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB1c2Vycy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGEgbGlzdCBvZiBhbGwgdXNlcnNcbnZhciB1c2VycyA9IFVzZXIucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2codXNlcnMpOyAvLyBbe2lkOiAxLCBmaXJzdG5hbWU6IFwiSmFuZVwiLCAuLi59LCAuLi5dXG59KTtcblxuLy8gcmV0cmlldmluZyB0aGUgdXNlcm5hbWVcbnZhciB1c2VyID0gVXNlci5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2codXNlci5maXJzdG5hbWUpO1xufSk7XG5cbi8vIGNyZWF0aW5nIGEgbmV3IHVzZXJcbnZhciB1c2VyID0gVXNlci5hZGQoXG4gICB7XG4gICAgICBlbWFpbDogJ215QG1haWwuY29tJyxcbiAgICAgIHBhc3N3b3JkOiAnMTIzNDU2cHcnLFxuICAgICAgcGFzc3dvcmRfY29uZmlybWF0aW9uOiAnMTIzNDU2cHcnLFxuICAgICAgZmlyc3RuYW1lOiAnamFuZScsXG4gICAgICBsYXN0bmFtZTogJ3VzZXInXG4gICB9LFxuICAgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2codXNlcik7IC8vIHtpZDogMSwgZmlyc3RuYW1lOiAnamFuZScsIC4uLn1cbiAgIH1cbik7XG5cbi8vIGNoYW5naW5nIHRoZSB1c2VybmFtZVxudmFyIHVzZXIgPSBVc2VyLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICB1c2VyLmZpcnN0bmFtZSA9PSAnSm9lbCc7XG4gICB1c2VyLiRzYXZlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Vc2VyLnNhdmUoe2lkOiAxLCBmaXJzdG5hbWU6ICdKb2VsJ30pO1xuXG4vLyBkZWxldGluZyB0aGUgdXNlclxudmFyIHVzZXIgPSBVc2VyLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICB1c2VyLiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblVzZXIuZGVsZXRlKHtpZDogMX0pO1xuXG4vLyBxdWVyeSBmb3IgYSB1c2VybmFtZVxudmFyIHVzZXJzID0gVXNlci5maW5kKHtxdWVyeTogJ2phJyB9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2Vycyk7IC8vIFt7aWQ6IDEsIGZpcnN0bmFtZTogXCJqYW5lXCIsIC4uLn0sIC4uLl1cbn0pO1xuICogXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1VzZXInLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS91c2Vycy86aWQvOnF1ZXJ5JywgeyBpZDogJ0BpZCcgfSwge1xuXHRcdHNhdmU6IHsgbWV0aG9kOiAnUFVUJyB9LFxuXHRcdGFkZDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuICAgICAgZmluZDogeyBtZXRob2Q6ICdHRVQnLCBwYXJhbXM6IHsgaWQ6ICdmaW5kJyB9LCBpc0FycmF5OiB0cnVlIH1cblx0fSk7XG59KTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hcGlcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSByb2xlc1xuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciB0aGUgYXZhaWxhYmxlIHJvbGVzXG4gKiBAZXhhbXBsZVxudmFyIGFkbWluUm9sZUlkID0gcm9sZS5nZXRJZCgnYWRtaW4nKTsgLy8gMVxudmFyIGFkbWluUm9sZU5hbWUgPSByb2xlLmdldE5hbWUoMSk7IC8vICdhZG1pbidcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuc2VydmljZSgncm9sZXMnLCBmdW5jdGlvbiAoUm9sZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHJvbGVzID0ge307XG5cdFx0dmFyIHJvbGVzSW52ZXJzZSA9IHt9O1xuXG5cdFx0Um9sZS5xdWVyeShmdW5jdGlvbiAocikge1xuXHRcdFx0ci5mb3JFYWNoKGZ1bmN0aW9uIChyb2xlKSB7XG5cdFx0XHRcdHJvbGVzW3JvbGUuaWRdID0gcm9sZS5uYW1lO1xuXHRcdFx0XHRyb2xlc0ludmVyc2Vbcm9sZS5uYW1lXSA9IHJvbGUuaWQ7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHRoaXMuZ2V0TmFtZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0cmV0dXJuIHJvbGVzW2lkXTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRJZCA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRyZXR1cm4gcm9sZXNJbnZlcnNlW25hbWVdO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYXBpXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc2hhcGVzXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIHRoZSBhdmFpbGFibGUgc2hhcGVzXG4gKiBAZXhhbXBsZVxudmFyIHNoYXBlc0FycmF5ID0gc3BhaGVzLmdldEFsbCgpOyAvLyBbe2lkOiAxLCBuYW1lOiAnUG9pbnQnfSwgLi4uXVxuc2hhcGVzLmdldElkKCdQb2ludCcpOyAvLyAxXG5zaGFwZXMuZ2V0TmFtZSgxKTsgLy8gJ1BvaW50J1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5zZXJ2aWNlKCdzaGFwZXMnLCBmdW5jdGlvbiAoU2hhcGUpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzaGFwZXMgPSB7fTtcblx0XHR2YXIgc2hhcGVzSW52ZXJzZSA9IHt9O1xuXG5cdFx0dmFyIHJlc291cmNlcyA9IFNoYXBlLnF1ZXJ5KGZ1bmN0aW9uIChzKSB7XG5cdFx0XHRzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XG5cdFx0XHRcdHNoYXBlc1tzaGFwZS5pZF0gPSBzaGFwZS5uYW1lO1xuXHRcdFx0XHRzaGFwZXNJbnZlcnNlW3NoYXBlLm5hbWVdID0gc2hhcGUuaWQ7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHRoaXMuZ2V0TmFtZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0cmV0dXJuIHNoYXBlc1tpZF07XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0SWQgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0cmV0dXJuIHNoYXBlc0ludmVyc2VbbmFtZV07XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHJlc291cmNlcztcblx0XHR9O1xuXHR9XG4pOyIsIi8qKlxuICogQG5nZG9jIGNvbnN0YW50XG4gKiBAbmFtZSBNQVhfTVNHXG4gKiBAbWVtYmVyT2YgZGlhcy51aS5tZXNzYWdlc1xuICogQGRlc2NyaXB0aW9uIFRoZSBtYXhpbXVtIG51bWJlciBvZiBpbmZvIG1lc3NhZ2VzIHRvIGRpc3BsYXkuXG4gKiBAcmV0dXJucyB7SW50ZWdlcn1cbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLm1lc3NhZ2VzJykuY29uc3RhbnQoJ01BWF9NU0cnLCAxKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS5tZXNzYWdlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIE1lc3NhZ2VzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudWkubWVzc2FnZXNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSBsaXZlIGRpc3BsYXkgb2YgdXNlciBmZWVkYmFjayBtZXNzYWdlcyB2aWEgSlNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5jb250cm9sbGVyKCdNZXNzYWdlc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBNQVhfTVNHKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuYWxlcnRzID0gW107XG5cbiAgICAgICAgdmFyIGNsb3NlRnVsbHNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4pIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuXHRcdC8vIG1ha2UgbWV0aG9kIGFjY2Vzc2libGUgYnkgb3RoZXIgbW9kdWxlc1xuXHRcdHdpbmRvdy4kZGlhc1Bvc3RNZXNzYWdlID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNsb3NlRnVsbHNjcmVlbigpO1xuXHRcdFx0JHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdFx0JHNjb3BlLmFsZXJ0cy51bnNoaWZ0KHtcblx0XHRcdFx0XHRtZXNzYWdlOiBtZXNzYWdlLFxuXHRcdFx0XHRcdHR5cGU6IHR5cGUgfHwgJ2luZm8nXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmICgkc2NvcGUuYWxlcnRzLmxlbmd0aCA+IE1BWF9NU0cpIHtcblx0XHRcdFx0XHQkc2NvcGUuYWxlcnRzLnBvcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlID0gZnVuY3Rpb24gKGluZGV4KSB7XG5cdFx0XHQkc2NvcGUuYWxlcnRzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbXNnXG4gKiBAbWVtYmVyT2YgZGlhcy51aS5tZXNzYWdlc1xuICogQGRlc2NyaXB0aW9uIEVuYWJsZXMgYXJiaXRyYXJ5IEFuZ3VsYXJKUyBtb2R1bGVzIHRvIHBvc3QgdXNlciBmZWVkYmFjayBtZXNzYWdlcyB1c2luZyB0aGUgRElBUyBVSSBtZXNzYWdpbmcgc3lzdGVtLiBTZWUgdGhlIFtCb290c3RyYXAgYWxlcnRzXShodHRwOi8vZ2V0Ym9vdHN0cmFwLmNvbS9jb21wb25lbnRzLyNhbGVydHMpIGZvciBhdmFpbGFibGUgbWVzc2FnZSB0eXBlcyBhbmQgdGhlaXIgc3R5bGUuIEluIGFkZGl0aW9uIHRvIGFjdGl2ZWx5IHBvc3RpbmcgbWVzc2FnZXMsIGl0IHByb3ZpZGVzIHRoZSBgcmVzcG9uc2VFcnJvcmAgbWV0aG9kIHRvIGNvbnZlbmllbnRseSBkaXNwbGF5IGVycm9yIG1lc3NhZ2VzIGluIGNhc2UgYW4gQUpBWCByZXF1ZXN0IHdlbnQgd3JvbmcuXG4gKiBAZXhhbXBsZVxubXNnLnBvc3QoJ2RhbmdlcicsICdEbyB5b3UgcmVhbGx5IHdhbnQgdG8gZGVsZXRlIHRoaXM/IEV2ZXJ5dGhpbmcgd2lsbCBiZSBsb3N0LicpO1xuXG5tc2cuZGFuZ2VyKCdEbyB5b3UgcmVhbGx5IHdhbnQgdG8gZGVsZXRlIHRoaXM/IEV2ZXJ5dGhpbmcgd2lsbCBiZSBsb3N0LicpO1xubXNnLndhcm5pbmcoJ0xlYXZpbmcgdGhlIHByb2plY3QgaXMgbm90IHJldmVyc2libGUuJyk7XG5tc2cuc3VjY2VzcygnVGhlIHByb2plY3Qgd2FzIGNyZWF0ZWQuJyk7XG5tc2cuaW5mbygnWW91IHdpbGwgcmVjZWl2ZSBhbiBlbWFpbCBhYm91dCB0aGlzLicpO1xuXG52YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHsgLi4uIH0pO1xuLy8gaGFuZGxlcyBhbGwgZXJyb3IgcmVzcG9uc2VzIGF1dG9tYXRpY2FsbHlcbmxhYmVsLiRwcm9taXNlLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5zZXJ2aWNlKCdtc2cnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdHRoaXMucG9zdCA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZSB8fCB0eXBlO1xuXHRcdFx0d2luZG93LiRkaWFzUG9zdE1lc3NhZ2UodHlwZSwgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZGFuZ2VyID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblx0XHRcdF90aGlzLnBvc3QoJ2RhbmdlcicsIG1lc3NhZ2UpO1xuXHRcdH07XG5cblx0XHR0aGlzLndhcm5pbmcgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0X3RoaXMucG9zdCgnd2FybmluZycsIG1lc3NhZ2UpO1xuXHRcdH07XG5cblx0XHR0aGlzLnN1Y2Nlc3MgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0X3RoaXMucG9zdCgnc3VjY2VzcycsIG1lc3NhZ2UpO1xuXHRcdH07XG5cblx0XHR0aGlzLmluZm8gPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0X3RoaXMucG9zdCgnaW5mbycsIG1lc3NhZ2UpO1xuXHRcdH07XG5cblx0XHR0aGlzLnJlc3BvbnNlRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcblxuXHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxKSB7XG5cdFx0XHRcdF90aGlzLmRhbmdlcihcIlBsZWFzZSBsb2cgaW4gKGFnYWluKS5cIik7XG5cdFx0XHR9IGVsc2UgaWYgKCFkYXRhKSB7XG5cdFx0XHRcdF90aGlzLmRhbmdlcihcIlRoZSBzZXJ2ZXIgZGlkbid0IHJlc3BvbmQsIHNvcnJ5LlwiKTtcblx0XHRcdH0gZWxzZSBpZiAoZGF0YS5tZXNzYWdlKSB7XG5cdFx0XHRcdC8vIGVycm9yIHJlc3BvbnNlXG5cdFx0XHRcdF90aGlzLmRhbmdlcihkYXRhLm1lc3NhZ2UpO1xuXHRcdFx0fSBlbHNlIGlmIChkYXRhKSB7XG5cdFx0XHRcdC8vIHZhbGlkYXRpb24gcmVzcG9uc2Vcblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGRhdGEpIHtcblx0XHRcdFx0XHRfdGhpcy5kYW5nZXIoZGF0YVtrZXldWzBdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdW5rbm93biBlcnJvciByZXNwb25zZVxuXHRcdFx0XHRfdGhpcy5kYW5nZXIoXCJUaGVyZSB3YXMgYW4gZXJyb3IsIHNvcnJ5LlwiKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkudXNlcnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIHVzZXJDaG9vc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy51aS51c2Vyc1xuICogQGRlc2NyaXB0aW9uIEFuIGlucHV0IGZpZWxkIHRvIGZpbmQgYSB1c2VyLlxuICogQGV4YW1wbGVcbi8vIEhUTUxcbjxpbnB1dCBwbGFjZWhvbGRlcj1cIlNlYXJjaCBieSB1c2VybmFtZVwiIGRhdGEtdXNlci1jaG9vc2VyPVwiYWRkVXNlclwiIC8+XG5cbi8vIENvbnRyb2xsZXIgKGV4YW1wbGUgZm9yIGFkZGluZyBhIHVzZXIgdG8gYSBwcm9qZWN0KVxuJHNjb3BlLmFkZFVzZXIgPSBmdW5jdGlvbiAodXNlcikge1xuXHQvLyBuZXcgdXNlcnMgYXJlIGd1ZXN0cyBieSBkZWZhdWx0XG5cdHZhciByb2xlSWQgPSAkc2NvcGUucm9sZXMuZ3Vlc3Q7XG5cblx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dXNlci5wcm9qZWN0X3JvbGVfaWQgPSByb2xlSWQ7XG5cdFx0JHNjb3BlLnVzZXJzLnB1c2godXNlcik7XG5cdH07XG5cblx0Ly8gdXNlciBzaG91bGRuJ3QgYWxyZWFkeSBleGlzdFxuXHRpZiAoIWdldFVzZXIodXNlci5pZCkpIHtcblx0XHRQcm9qZWN0VXNlci5hdHRhY2goXG5cdFx0XHR7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZH0sXG5cdFx0XHR7aWQ6IHVzZXIuaWQsIHByb2plY3Rfcm9sZV9pZDogcm9sZUlkfSxcblx0XHRcdHN1Y2Nlc3MsIG1zZy5yZXNwb25zZUVycm9yXG5cdFx0KTtcblx0fVxufTtcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS51c2VycycpLmRpcmVjdGl2ZSgndXNlckNob29zZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdBJyxcblxuXHRcdFx0c2NvcGU6IHtcblx0XHRcdFx0c2VsZWN0OiAnPXVzZXJDaG9vc2VyJ1xuXHRcdFx0fSxcblxuXHRcdFx0cmVwbGFjZTogdHJ1ZSxcblxuXHRcdFx0dGVtcGxhdGU6ICc8aW5wdXQgdHlwZT1cInRleHRcIiBkYXRhLW5nLW1vZGVsPVwic2VsZWN0ZWRcIiBkYXRhLXVpYi10eXBlYWhlYWQ9XCJ1c2VyLm5hbWUgZm9yIHVzZXIgaW4gZmluZCgkdmlld1ZhbHVlKVwiIGRhdGEtdHlwZWFoZWFkLXdhaXQtbXM9XCIyNTBcIiBkYXRhLXR5cGVhaGVhZC1vbi1zZWxlY3Q9XCJzZWxlY3QoJGl0ZW0pXCIvPicsXG5cblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFVzZXIpIHtcblx0XHRcdFx0JHNjb3BlLmZpbmQgPSBmdW5jdGlvbiAocXVlcnkpIHtcblx0XHRcdFx0XHRyZXR1cm4gVXNlci5maW5kKHtxdWVyeTogcXVlcnl9KS4kcHJvbWlzZTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9