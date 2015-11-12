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
            // ad possible missing items if sortedSubset is longer than superset
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJhcGkvY29uc3RhbnRzL1VSTC5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbi5qcyIsImFwaS9mYWN0b3JpZXMvQW5ub3RhdGlvbkxhYmVsLmpzIiwiYXBpL2ZhY3Rvcmllcy9BdHRyaWJ1dGUuanMiLCJhcGkvZmFjdG9yaWVzL0ltYWdlLmpzIiwiYXBpL2ZhY3Rvcmllcy9MYWJlbC5qcyIsImFwaS9mYWN0b3JpZXMvTWVkaWFUeXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9Pd25Vc2VyLmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0LmpzIiwiYXBpL2ZhY3Rvcmllcy9Qcm9qZWN0TGFiZWwuanMiLCJhcGkvZmFjdG9yaWVzL1Byb2plY3RUcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvUHJvamVjdFVzZXIuanMiLCJhcGkvZmFjdG9yaWVzL1JvbGUuanMiLCJhcGkvZmFjdG9yaWVzL1NoYXBlLmpzIiwiYXBpL2ZhY3Rvcmllcy9UcmFuc2VjdC5qcyIsImFwaS9mYWN0b3JpZXMvVHJhbnNlY3RJbWFnZS5qcyIsImFwaS9mYWN0b3JpZXMvVXNlci5qcyIsImFwaS9zZXJ2aWNlcy9yb2xlcy5qcyIsImFwaS9zZXJ2aWNlcy9zaGFwZXMuanMiLCJ1aS9tZXNzYWdlcy9jb25zdGFudHMvTUFYX01TRy5qcyIsInVpL21lc3NhZ2VzL2NvbnRyb2xsZXIvTWVzc2FnZXNDb250cm9sbGVyLmpzIiwidWkvbWVzc2FnZXMvc2VydmljZXMvbXNnLmpzIiwidWkvdXNlcnMvZGlyZWN0aXZlcy91c2VyQ2hvb3Nlci5qcyIsInVpL3V0aWxzL2ZhY3Rvcmllcy9maWx0ZXJTdWJzZXRPZlRyYW5zZWN0SWRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLFlBQUEsQ0FBQTs7QUFFQSxRQUFBLE9BQUEsWUFBQSx5QkFBQSxVQUFBLGVBQUE7Q0FDQTs7Q0FFQSxjQUFBLFNBQUEsUUFBQSxPQUFBO0VBQ0E7Ozs7Ozs7QUFPQSxRQUFBLE9BQUEsb0JBQUEsQ0FBQTs7O0FBR0EsUUFBQSxRQUFBLFVBQUEsTUFBQSxZQUFBO0NBQ0E7O0NBRUEsUUFBQTtFQUNBLFNBQUEsY0FBQTtFQUNBLENBQUE7Ozs7Ozs7O0FBUUEsUUFBQSxPQUFBLGlCQUFBLENBQUEsZ0JBQUE7Ozs7OztBQU1BLFFBQUEsT0FBQSxpQkFBQTs7Ozs7O0FBTUEsUUFBQSxPQUFBLFdBQUEsQ0FBQSxnQkFBQSxvQkFBQSxpQkFBQSxpQkFBQTs7Ozs7Ozs7Ozs7QUNyQ0EsUUFBQSxPQUFBLFlBQUEsU0FBQSxPQUFBLE9BQUEsZ0JBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUMyQ0EsUUFBQSxPQUFBLFlBQUEsUUFBQSxtQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBO0VBQ0EsRUFBQSxJQUFBO0VBQ0E7R0FDQSxLQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxVQUFBOztHQUVBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFVBQUE7O0dBRUEsUUFBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsVUFBQTs7R0FFQSxPQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxVQUFBLFVBQUEsTUFBQTtJQUNBLFNBQUE7O0dBRUEsS0FBQTtJQUNBLFFBQUE7SUFDQSxRQUFBLEVBQUEsVUFBQSxVQUFBLE1BQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUMzQ0EsUUFBQSxPQUFBLFlBQUEsUUFBQSx3Q0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLDhDQUFBO0dBQ0EsSUFBQTtHQUNBLGVBQUE7S0FDQTtHQUNBLE9BQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFFBQUEsZUFBQSxRQUFBO0lBQ0EsU0FBQTs7R0FFQSxRQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxRQUFBLGVBQUEsUUFBQTs7R0FFQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLFFBQUEsRUFBQSxRQUFBLHFCQUFBLGVBQUEsTUFBQSxRQUFBOztHQUVBLFFBQUE7SUFDQSxRQUFBO0lBQ0EsUUFBQSxFQUFBLFFBQUEscUJBQUEsZUFBQSxNQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDckJBLFFBQUEsT0FBQSxZQUFBLFFBQUEsa0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSwwQkFBQSxFQUFBLElBQUEsU0FBQTtFQUNBLEtBQUEsQ0FBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDdEJBLFFBQUEsT0FBQSxZQUFBLFFBQUEsOEJBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNvQkEsUUFBQSxPQUFBLFlBQUEsUUFBQSw4QkFBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLHNCQUFBLEVBQUEsSUFBQTtFQUNBO0dBQ0EsS0FBQSxDQUFBLFFBQUE7R0FDQSxNQUFBLEVBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUMxQkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxrQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLDJCQUFBLEVBQUEsSUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ09BLFFBQUEsT0FBQSxZQUFBLFFBQUEsZ0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSxvQkFBQSxJQUFBO0VBQ0EsTUFBQSxDQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDUUEsUUFBQSxPQUFBLFlBQUEsUUFBQSxnQ0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLHdCQUFBLEVBQUEsSUFBQTtFQUNBOztHQUVBLE9BQUEsRUFBQSxRQUFBLE9BQUEsUUFBQSxFQUFBLElBQUEsUUFBQSxTQUFBO0dBQ0EsS0FBQSxFQUFBLFFBQUE7R0FDQSxNQUFBLEVBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbkNBLFFBQUEsT0FBQSxZQUFBLFFBQUEscUNBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQSx1Q0FBQSxDQUFBLFlBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNnQ0EsUUFBQSxPQUFBLFlBQUEsUUFBQSx3Q0FBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBO0VBQ0EsRUFBQSxJQUFBO0VBQ0E7R0FDQSxLQUFBLEVBQUEsUUFBQTtHQUNBLFFBQUEsRUFBQSxRQUFBO0dBQ0EsUUFBQSxFQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDN0JBLFFBQUEsT0FBQSxZQUFBLFFBQUEsb0NBQUEsVUFBQSxXQUFBLEtBQUE7Q0FDQTs7Q0FFQSxPQUFBLFVBQUEsTUFBQTtFQUNBLEVBQUEsSUFBQTtFQUNBO0dBQ0EsTUFBQSxFQUFBLFFBQUE7R0FDQSxRQUFBLEVBQUEsUUFBQTtHQUNBLFFBQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2pCQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDZCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEscUJBQUEsRUFBQSxJQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNIQSxRQUFBLE9BQUEsWUFBQSxRQUFBLDhCQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUEsc0JBQUEsRUFBQSxJQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQSxRQUFBLE9BQUEsWUFBQSxRQUFBLGlDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7RUFDQSxFQUFBLElBQUE7RUFDQTtHQUNBLE1BQUEsRUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNkQSxRQUFBLE9BQUEsWUFBQSxRQUFBLHNDQUFBLFVBQUEsV0FBQSxLQUFBO0NBQ0E7O0NBRUEsT0FBQSxVQUFBLE1BQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNvQ0EsUUFBQSxPQUFBLFlBQUEsUUFBQSw2QkFBQSxVQUFBLFdBQUEsS0FBQTtDQUNBOztDQUVBLE9BQUEsVUFBQSxNQUFBLDRCQUFBLEVBQUEsSUFBQSxTQUFBO0VBQ0EsTUFBQSxFQUFBLFFBQUE7RUFDQSxLQUFBLEVBQUEsUUFBQTtNQUNBLE1BQUEsRUFBQSxRQUFBLE9BQUEsUUFBQSxFQUFBLElBQUEsVUFBQSxTQUFBOzs7Ozs7Ozs7Ozs7O0FDakRBLFFBQUEsT0FBQSxZQUFBLFFBQUEsa0JBQUEsVUFBQSxNQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBO0VBQ0EsSUFBQSxlQUFBOztFQUVBLEtBQUEsTUFBQSxVQUFBLEdBQUE7R0FDQSxFQUFBLFFBQUEsVUFBQSxNQUFBO0lBQ0EsTUFBQSxLQUFBLE1BQUEsS0FBQTtJQUNBLGFBQUEsS0FBQSxRQUFBLEtBQUE7Ozs7RUFJQSxLQUFBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsT0FBQSxNQUFBOzs7RUFHQSxLQUFBLFFBQUEsVUFBQSxNQUFBO0dBQ0EsT0FBQSxhQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUNqQkEsUUFBQSxPQUFBLFlBQUEsUUFBQSxvQkFBQSxVQUFBLE9BQUE7RUFDQTs7RUFFQSxJQUFBLFNBQUE7RUFDQSxJQUFBLGdCQUFBOztFQUVBLElBQUEsWUFBQSxNQUFBLE1BQUEsVUFBQSxHQUFBO0dBQ0EsRUFBQSxRQUFBLFVBQUEsT0FBQTtJQUNBLE9BQUEsTUFBQSxNQUFBLE1BQUE7SUFDQSxjQUFBLE1BQUEsUUFBQSxNQUFBOzs7O0VBSUEsS0FBQSxVQUFBLFVBQUEsSUFBQTtHQUNBLE9BQUEsT0FBQTs7O0VBR0EsS0FBQSxRQUFBLFVBQUEsTUFBQTtHQUNBLE9BQUEsY0FBQTs7O0VBR0EsS0FBQSxTQUFBLFlBQUE7R0FDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUN6QkEsUUFBQSxPQUFBLG9CQUFBLFNBQUEsV0FBQTs7Ozs7Ozs7QUNEQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw0Q0FBQSxVQUFBLFFBQUEsU0FBQTtFQUNBOztFQUVBLE9BQUEsU0FBQTs7UUFFQSxJQUFBLGtCQUFBLFlBQUE7WUFDQSxJQUFBLFNBQUEsZ0JBQUE7Z0JBQ0EsU0FBQTttQkFDQSxJQUFBLFNBQUEsa0JBQUE7Z0JBQ0EsU0FBQTttQkFDQSxJQUFBLFNBQUEscUJBQUE7Z0JBQ0EsU0FBQTttQkFDQSxJQUFBLFNBQUEsc0JBQUE7Z0JBQ0EsU0FBQTs7Ozs7RUFLQSxPQUFBLG1CQUFBLFVBQUEsTUFBQSxTQUFBO1lBQ0E7R0FDQSxPQUFBLE9BQUEsV0FBQTtJQUNBLE9BQUEsT0FBQSxRQUFBO0tBQ0EsU0FBQTtLQUNBLE1BQUEsUUFBQTs7O0lBR0EsSUFBQSxPQUFBLE9BQUEsU0FBQSxTQUFBO0tBQ0EsT0FBQSxPQUFBOzs7OztFQUtBLE9BQUEsUUFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLE9BQUEsT0FBQSxPQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3RCQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxPQUFBLFlBQUE7RUFDQTtFQUNBLElBQUEsUUFBQTs7RUFFQSxLQUFBLE9BQUEsVUFBQSxNQUFBLFNBQUE7R0FDQSxVQUFBLFdBQUE7R0FDQSxPQUFBLGlCQUFBLE1BQUE7OztFQUdBLEtBQUEsU0FBQSxVQUFBLFNBQUE7R0FDQSxNQUFBLEtBQUEsVUFBQTs7O0VBR0EsS0FBQSxVQUFBLFVBQUEsU0FBQTtHQUNBLE1BQUEsS0FBQSxXQUFBOzs7RUFHQSxLQUFBLFVBQUEsVUFBQSxTQUFBO0dBQ0EsTUFBQSxLQUFBLFdBQUE7OztFQUdBLEtBQUEsT0FBQSxVQUFBLFNBQUE7R0FDQSxNQUFBLEtBQUEsUUFBQTs7O0VBR0EsS0FBQSxnQkFBQSxVQUFBLFVBQUE7R0FDQSxJQUFBLE9BQUEsU0FBQTs7R0FFQSxJQUFBLFNBQUEsV0FBQSxLQUFBO0lBQ0EsTUFBQSxPQUFBO1VBQ0EsSUFBQSxDQUFBLE1BQUE7SUFDQSxNQUFBLE9BQUE7VUFDQSxJQUFBLEtBQUEsU0FBQTs7SUFFQSxNQUFBLE9BQUEsS0FBQTtVQUNBLElBQUEsTUFBQTs7SUFFQSxLQUFBLElBQUEsT0FBQSxNQUFBO0tBQ0EsTUFBQSxPQUFBLEtBQUEsS0FBQTs7VUFFQTs7SUFFQSxNQUFBLE9BQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM3QkEsUUFBQSxPQUFBLGlCQUFBLFVBQUEsZUFBQSxZQUFBO0VBQ0E7O0VBRUEsT0FBQTtHQUNBLFVBQUE7O0dBRUEsT0FBQTtJQUNBLFFBQUE7OztHQUdBLFNBQUE7O0dBRUEsVUFBQTs7R0FFQSwrQkFBQSxVQUFBLFFBQUEsTUFBQTtJQUNBLE9BQUEsT0FBQSxVQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsS0FBQSxDQUFBLE9BQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7QUN4Q0EsUUFBQSxPQUFBLGlCQUFBLFFBQUEsZ0JBQUEsWUFBQTtRQUNBOztRQUVBLElBQUEsaUJBQUEsVUFBQSxHQUFBLEdBQUE7WUFDQSxPQUFBLElBQUE7Ozs7OztRQU1BLElBQUEsZUFBQSxVQUFBLFFBQUEsVUFBQSxRQUFBO1lBQ0EsSUFBQSxDQUFBLFFBQUE7O2dCQUVBLFdBQUEsU0FBQSxNQUFBLEdBQUEsS0FBQTs7O1lBR0EsSUFBQSxlQUFBLE9BQUEsTUFBQSxHQUFBLEtBQUE7O1lBRUEsSUFBQSxXQUFBO1lBQ0EsSUFBQSxJQUFBLEdBQUEsSUFBQTtZQUNBLE9BQUEsSUFBQSxTQUFBLFVBQUEsSUFBQSxhQUFBLFFBQUE7Z0JBQ0EsSUFBQSxTQUFBLEtBQUEsYUFBQSxJQUFBO29CQUNBO3VCQUNBLElBQUEsU0FBQSxPQUFBLGFBQUEsSUFBQTtvQkFDQTtvQkFDQTt1QkFDQTtvQkFDQSxTQUFBLEtBQUEsYUFBQTs7OztZQUlBLE9BQUEsSUFBQSxhQUFBLFFBQUE7Z0JBQ0EsU0FBQSxLQUFBLGFBQUE7Ozs7O1lBS0EsS0FBQSxJQUFBLEdBQUEsSUFBQSxTQUFBLFFBQUEsS0FBQTs7Z0JBRUEsT0FBQSxPQUFBLE9BQUEsUUFBQSxTQUFBLEtBQUE7Ozs7UUFJQSxPQUFBOzs7QUFHQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgYXBpIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScsIFsnbmdSZXNvdXJjZSddKTtcblxuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdCRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bXCJYLVJlcXVlc3RlZC1XaXRoXCJdID1cblx0XHRcIlhNTEh0dHBSZXF1ZXN0XCI7XG59KTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkubWVzc2FnZXNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB1c2VyIGZlZWRiYWNrIG1lc3NhZ2VzIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLm1lc3NhZ2VzJywgWyd1aS5ib290c3RyYXAnXSk7XG5cbi8vIGJvb3RzdHJhcCB0aGUgbWVzc2FnZXMgbW9kdWxlXG5hbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0YW5ndWxhci5ib290c3RyYXAoXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtbmctY29udHJvbGxlcj1cIk1lc3NhZ2VzQ29udHJvbGxlclwiXScpLFxuXHRcdFsnZGlhcy51aS5tZXNzYWdlcyddXG5cdCk7XG59KTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkudXNlcnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB1c2VycyBVSSBBbmd1bGFySlMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS51c2VycycsIFsndWkuYm9vdHN0cmFwJywgJ2RpYXMuYXBpJ10pO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS51dGlsc1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIHV0aWxzIFVJIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLnV0aWxzJywgW10pO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aVxuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIFVJIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpJywgWyd1aS5ib290c3RyYXAnLCAnZGlhcy51aS5tZXNzYWdlcycsICdkaWFzLnVpLnVzZXJzJywgJ2RpYXMudWkudXRpbHMnLCAnbmdBbmltYXRlJ10pO1xuXG4iLCIvKipcbiAqIEBuZ2RvYyBjb25zdGFudFxuICogQG5hbWUgVVJMXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBUaGUgYmFzZSB1cmwgb2YgdGhlIGFwcGxpY2F0aW9uLlxuICogQHJldHVybnMge1N0cmluZ31cbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmNvbnN0YW50KCdVUkwnLCB3aW5kb3cuJGRpYXNCYXNlVXJsIHx8ICcnKTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBBbm5vdGF0aW9uXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGFubm90YXRpb25zLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyByZXRyaWV2aW5nIHRoZSBzaGFwZSBJRCBvZiBhbiBhbm5vdGF0aW9uXG52YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uZ2V0KHtpZDogMTIzfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coYW5ub3RhdGlvbi5zaGFwZV9pZCk7XG59KTtcblxuLy8gc2F2aW5nIGFuIGFubm90YXRpb24gKHVwZGF0aW5nIHRoZSBhbm5vdGF0aW9uIHBvaW50cylcbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgYW5ub3RhdGlvbi5wb2ludHMgPSBbe3g6IDEwLCB5OiAxMH1dO1xuICAgYW5ub3RhdGlvbi4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuQW5ub3RhdGlvbi5zYXZlKHtcbiAgIGlkOiAxLCBwb2ludHM6IFt7eDogMTAsIHk6IDEwfV1cbn0pO1xuXG4vLyBkZWxldGluZyBhbiBhbm5vdGF0aW9uXG52YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uZ2V0KHtpZDogMTIzfSwgZnVuY3Rpb24gKCkge1xuICAgYW5ub3RhdGlvbi4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Bbm5vdGF0aW9uLmRlbGV0ZSh7aWQ6IDEyM30pO1xuXG4vLyBnZXQgYWxsIGFubm90YXRpb25zIG9mIGFuIGltYWdlXG4vLyBub3RlLCB0aGF0IHRoZSBgaWRgIGlzIG5vdyB0aGUgaW1hZ2UgSUQgYW5kIG5vdCB0aGUgYW5ub3RhdGlvbiBJRCBmb3IgdGhlXG4vLyBxdWVyeSFcbnZhciBhbm5vdGF0aW9ucyA9IEFubm90YXRpb24ucXVlcnkoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coYW5ub3RhdGlvbnMpOyAvLyBbe2lkOiAxLCBzaGFwZV9pZDogMSwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGFkZCBhIG5ldyBhbm5vdGF0aW9uIHRvIGFuIGltYWdlXG4vLyBub3RlLCB0aGF0IHRoZSBgaWRgIGlzIG5vdyB0aGUgaW1hZ2UgSUQgYW5kIG5vdCB0aGUgYW5ub3RhdGlvbiBJRCBmb3IgdGhlXG4vLyBxdWVyeSFcbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5hZGQoe1xuICAgaWQ6IDEsXG4gICBzaGFwZV9pZDogMSxcbiAgIGxhYmVsX2lkOiAxLFxuICAgY29uZmlkZW5jZTogMC41XG4gICBwb2ludHM6IFtcbiAgICAgIHsgeDogMTAsIHk6IDIwIH1cbiAgIF1cbn0pO1xuICogXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0Fubm90YXRpb24nLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS86ZW5kcG9pbnQvOmlkLzpzbHVnJyxcblx0XHR7IGlkOiAnQGlkJ1x0fSxcblx0XHR7XG5cdFx0XHRnZXQ6IHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0cGFyYW1zOiB7IGVuZHBvaW50OiAnYW5ub3RhdGlvbnMnIH1cblx0XHRcdH0sXG5cdFx0XHRzYXZlOiB7XG5cdFx0XHRcdG1ldGhvZDogJ1BVVCcsXG5cdFx0XHRcdHBhcmFtczogeyBlbmRwb2ludDogJ2Fubm90YXRpb25zJyB9XG5cdFx0XHR9LFxuXHRcdFx0ZGVsZXRlOiB7XG5cdFx0XHRcdG1ldGhvZDogJ0RFTEVURScsXG5cdFx0XHRcdHBhcmFtczogeyBlbmRwb2ludDogJ2Fubm90YXRpb25zJyB9XG5cdFx0XHR9LFxuXHRcdFx0cXVlcnk6IHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0cGFyYW1zOiB7IGVuZHBvaW50OiAnaW1hZ2VzJywgc2x1ZzogJ2Fubm90YXRpb25zJyB9LFxuXHRcdFx0XHRpc0FycmF5OiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YWRkOiB7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHRwYXJhbXM6IHsgZW5kcG9pbnQ6ICdpbWFnZXMnLCBzbHVnOiAnYW5ub3RhdGlvbnMnIH1cblx0XHRcdH1cblx0XHR9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEFubm90YXRpb25MYWJlbFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBhbm5vdGF0aW9uIGxhYmVscy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBsYWJlbHMgb2YgYW4gYW5ub3RhdGlvbiBhbmQgdXBkYXRlIG9uZSBvZiB0aGVtXG52YXIgbGFiZWxzID0gQW5ub3RhdGlvbkxhYmVsLnF1ZXJ5KHthbm5vdGF0aW9uX2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIGxhYmVsID0gbGFiZWxzWzBdO1xuICAgbGFiZWwuY29uZmlkZW5jZSA9IDAuOTtcbiAgIGxhYmVsLiRzYXZlKCk7XG59KTtcblxuLy8gZGlyZWN0bHkgdXBkYXRlIGEgbGFiZWxcbkFubm90YXRpb25MYWJlbC5zYXZlKHtjb25maWRlbmNlOiAwLjEsIGFubm90YXRpb25faWQ6IDEsIGlkOiAxfSk7XG5cbi8vIGF0dGFjaCBhIG5ldyBsYWJlbCB0byBhbiBhbm5vdGF0aW9uXG52YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHtsYWJlbF9pZDogMSwgY29uZmlkZW5jZTogMC41LCBhbm5vdGF0aW9uX2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWwpOyAvLyB7aWQ6IDEsIG5hbWU6ICdteSBsYWJlbCcsIHVzZXJfaWQ6IDEsIC4uLn1cbn0pO1xuXG5cbi8vIGRldGFjaCBhIGxhYmVsXG52YXIgbGFiZWxzID0gQW5ub3RhdGlvbkxhYmVsLnF1ZXJ5KHthbm5vdGF0aW9uX2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIGxhYmVsID0gbGFiZWxzWzBdO1xuICAgbGFiZWwuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuQW5ub3RhdGlvbkxhYmVsLmRlbGV0ZSh7aWQ6IDF9KTtcbiAqIFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdBbm5vdGF0aW9uTGFiZWwnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS86cHJlZml4Lzphbm5vdGF0aW9uX2lkLzpzdWZmaXgvOmlkJywge1xuXHRcdFx0aWQ6ICdAaWQnLFxuXHRcdFx0YW5ub3RhdGlvbl9pZDogJ0Bhbm5vdGF0aW9uX2lkJ1xuXHRcdH0sIHtcblx0XHRcdHF1ZXJ5OiB7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHBhcmFtczogeyBwcmVmaXg6ICdhbm5vdGF0aW9ucycsIHN1ZmZpeDogJ2xhYmVscycgfSxcblx0XHRcdFx0aXNBcnJheTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGF0dGFjaDoge1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0cGFyYW1zOiB7IHByZWZpeDogJ2Fubm90YXRpb25zJywgc3VmZml4OiAnbGFiZWxzJyB9XG5cdFx0XHR9LFxuXHRcdFx0c2F2ZToge1xuXHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxuXHRcdFx0XHRwYXJhbXM6IHsgcHJlZml4OiAnYW5ub3RhdGlvbi1sYWJlbHMnLCBhbm5vdGF0aW9uX2lkOiBudWxsLCBzdWZmaXg6IG51bGwgfVxuXHRcdFx0fSxcblx0XHRcdGRlbGV0ZToge1xuXHRcdFx0XHRtZXRob2Q6ICdERUxFVEUnLFxuXHRcdFx0XHRwYXJhbXM6IHsgcHJlZml4OiAnYW5ub3RhdGlvbi1sYWJlbHMnLCBhbm5vdGF0aW9uX2lkOiBudWxsLCBzdWZmaXg6IG51bGwgfVxuXHRcdFx0fVxuXHR9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEF0dHJpYnV0ZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBhdHRyaWJ1dGVzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBsaXN0IGFsbCBhdHRyaWJ1dGVzXG52YXIgYXR0cmlidXRlcyA9IEF0dHJpYnV0ZS5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhdHRyaWJ1dGVzKTsgLy8gW3tpZDogMSwgdHlwZTogJ2Jvb2xlYW4nLCAuLi59LCAuLi5dXG59KTtcblxuLy8gZ2V0IGEgc3BlY2lmaWMgYXR0cmlidXRlXG52YXIgYXR0cmlidXRlID0gQXR0cmlidXRlLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhdHRyaWJ1dGUpOyAvLyB7aWQ6IDEsIHR5cGU6ICdib29sZWFuJywgLi4ufVxufSk7XG5cbi8vIGNyZWF0ZSBhIG5ldyBhdHRyaWJ1dGVcbnZhciBhdHRyaWJ1dGUgPSBBdHRyaWJ1dGUuYWRkKHtcbiAgICAgIG5hbWU6ICdiYWRfcXVhbGl0eScsIHR5cGU6ICdib29sZWFuJ1xuICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coYXR0cmlidXRlKTsgLy8ge2lkOiAxLCBuYW1lOiAnYmFkX3F1YWxpdHknLCAuLi59XG59KTtcblxuLy8gZGVsZXRlIGFuIGF0dHJpYnV0ZVxudmFyIGF0dHJpYnV0ZXMgPSBBdHRyaWJ1dGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgdmFyIGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbMF07XG4gICBhdHRyaWJ1dGUuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuQXR0cmlidXRlLmRlbGV0ZSh7aWQ6IDF9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ0F0dHJpYnV0ZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2F0dHJpYnV0ZXMvOmlkJywgeyBpZDogJ0BpZCcgfSwge1xuXHRcdGFkZDoge21ldGhvZDogJ1BPU1QnfVxuXHR9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGltYWdlcy4gVGhpcyByZXNvdXJjZSBpcyBvbmx5IGZvciBcbiAqIGZpbmRpbmcgb3V0IHdoaWNoIHRyYW5zZWN0IGFuIGltYWdlIGJlbG9uZ3MgdG8uIFRoZSBpbWFnZSBmaWxlcyBhcmVcbiAqIGRpcmVjdGx5IGNhbGxlZCBmcm9tIHRoZSBBUEkuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbiBpbWFnZVxudmFyIGltYWdlID0gSW1hZ2UuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGltYWdlKTsgLy8ge2lkOiAxLCB3aWR0aDogMTAwMCwgaGVpZ2h0OiA3NTAsIHRyYW5zZWN0OiB7Li4ufSwgLi4ufVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdJbWFnZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2ltYWdlcy86aWQnKTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIExhYmVsXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGxhYmVscy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBsYWJlbHNcbnZhciBsYWJlbHMgPSBMYWJlbC5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhsYWJlbHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcIkJlbnRoaWMgT2JqZWN0XCIsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIGxhYmVsXG52YXIgbGFiZWwgPSBMYWJlbC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWwpOyAvLyB7aWQ6IDEsIG5hbWU6IFwiQmVudGhpYyBPYmplY3RcIiwgLi4ufVxufSk7XG5cbi8vIGNyZWF0ZSBhIG5ldyBsYWJlbFxudmFyIGxhYmVsID0gTGFiZWwuYWRkKHtuYW1lOiBcIlRyYXNoXCIsIHBhcmVudF9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGxhYmVsKTsgLy8ge2lkOiAyLCBuYW1lOiBcIlRyYXNoXCIsIHBhcmVudF9pZDogMSwgLi4ufVxufSk7XG5cbi8vIHVwZGF0ZSBhIGxhYmVsXG52YXIgbGFiZWwgPSBMYWJlbC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgbGFiZWwubmFtZSA9ICdUcmFzaCc7XG4gICBsYWJlbC4kc2F2ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuTGFiZWwuc2F2ZSh7aWQ6IDEsIG5hbWU6ICdUcmFzaCd9KTtcblxuLy8gZGVsZXRlIGEgbGFiZWxcbnZhciBsYWJlbCA9IExhYmVsLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBsYWJlbC4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5MYWJlbC5kZWxldGUoe2lkOiAxfSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdMYWJlbCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL2xhYmVscy86aWQnLCB7IGlkOiAnQGlkJyB9LFxuXHRcdHtcblx0XHRcdGFkZDoge21ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIE1lZGlhVHlwZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBtZWRpYSB0eXBlcy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBtZWRpYSB0eXBlc1xudmFyIG1lZGlhVHlwZXMgPSBNZWRpYVR5cGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobWVkaWFUeXBlcyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwidGltZS1zZXJpZXNcIn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIG1lZGlhIHR5cGVcbnZhciBtZWRpYVR5cGUgPSBNZWRpYVR5cGUuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKG1lZGlhVHlwZSk7IC8vIHtpZDogMSwgbmFtZTogXCJ0aW1lLXNlcmllc1wifVxufSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdNZWRpYVR5cGUnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9tZWRpYS10eXBlcy86aWQnLCB7IGlkOiAnQGlkJyB9KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIE93blVzZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgdGhlIGxvZ2dlZCBpbiB1c2VyLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyByZXRyaWV2aW5nIHRoZSB1c2VybmFtZVxudmFyIHVzZXIgPSBPd25Vc2VyLmdldChmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2VyLmZpcnN0bmFtZSk7XG59KTtcblxuLy8gY2hhbmdpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IE93blVzZXIuZ2V0KGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuZmlyc3RuYW1lID09ICdKb2VsJztcbiAgIHVzZXIuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcbk93blVzZXIuc2F2ZSh7Zmlyc3RuYW1lOiAnSm9lbCd9KTtcblxuLy8gZGVsZXRpbmcgdGhlIHVzZXJcbnZhciB1c2VyID0gT3duVXNlci5nZXQoZnVuY3Rpb24gKCkge1xuICAgdXNlci4kZGVsZXRlKCk7XG59KTtcbi8vIG9yIGRpcmVjdGx5XG5Pd25Vc2VyLmRlbGV0ZSgpO1xuICogXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ093blVzZXInLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS91c2Vycy9teScsIHt9LCB7XG5cdFx0c2F2ZToge21ldGhvZDogJ1BVVCd9XG5cdH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgUHJvamVjdFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBwcm9qZWN0cy5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCBwcm9qZWN0cywgdGhlIGN1cnJlbnQgdXNlciBiZWxvbmdzIHRvXG52YXIgcHJvamVjdHMgPSBQcm9qZWN0LnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHByb2plY3RzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJUZXN0IFByb2plY3RcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGdldCBvbmUgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhwcm9qZWN0KTsgLy8ge2lkOiAxLCBuYW1lOiBcIlRlc3QgUHJvamVjdFwiLCAuLi59XG59KTtcblxuLy8gY3JlYXRlIGEgbmV3IHByb2plY3RcbnZhciBwcm9qZWN0ID0gUHJvamVjdC5hZGQoe25hbWU6IFwiTXkgUHJvamVjdFwiLCBkZXNjcmlwdGlvbjogXCJteSBwcm9qZWN0XCJ9LFxuICAgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2cocHJvamVjdCk7IC8vIHtpZDogMiwgbmFtZTogXCJNeSBQcm9qZWN0XCIsIC4uLn1cbiAgIH1cbik7XG5cbi8vIHVwZGF0ZSBhIHByb2plY3RcbnZhciBwcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgcHJvamVjdC5uYW1lID0gJ05ldyBQcm9qZWN0JztcbiAgIHByb2plY3QuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblByb2plY3Quc2F2ZSh7aWQ6IDEsIG5hbWU6ICdOZXcgUHJvamVjdCd9KTtcblxuLy8gZGVsZXRlIGEgcHJvamVjdFxudmFyIHByb2plY3QgPSBQcm9qZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBwcm9qZWN0LiRkZWxldGUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblByb2plY3QuZGVsZXRlKHtpZDogMX0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUHJvamVjdCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzppZCcsIHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0Ly8gYSB1c2VyIGNhbiBvbmx5IHF1ZXJ5IHRoZWlyIG93biBwcm9qZWN0c1xuXHRcdFx0cXVlcnk6IHsgbWV0aG9kOiAnR0VUJywgcGFyYW1zOiB7IGlkOiAnbXknIH0sIGlzQXJyYXk6IHRydWUgfSxcblx0XHRcdGFkZDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0c2F2ZTogeyBtZXRob2Q6ICdQVVQnIH1cblx0XHR9XG5cdCk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBQcm9qZWN0TGFiZWxcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgbGFiZWxzIGJlbG9uZ2luZyB0byBhIHByb2plY3QuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgbGFiZWxzIG9mIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIGxhYmVscyA9IFByb2plY3RMYWJlbC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cobGFiZWxzKTsgLy8gW3tpZDogMSwgbmFtZTogXCJDb3JhbFwiLCAuLi59LCAuLi5dXG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1Byb2plY3RMYWJlbCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzpwcm9qZWN0X2lkL2xhYmVscycsIHtwcm9qZWN0X2lkOiAnQHByb2plY3RfaWQnfSk7XG59KTtcbiIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFByb2plY3RUcmFuc2VjdFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0cmFuc2VjdHMgYmVsb25naW5nIHRvIGEgcHJvamVjdC5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gZ2V0IGFsbCB0cmFuc2VjdHMgb2YgdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdHJhbnNlY3RzID0gUHJvamVjdFRyYW5zZWN0LnF1ZXJ5KHsgcHJvamVjdF9pZDogMSB9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh0cmFuc2VjdHMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcInRyYW5zZWN0IDFcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIGFkZCBhIG5ldyB0cmFuc2VjdCB0byB0aGUgcHJvamVjdCB3aXRoIElEIDFcbnZhciB0cmFuc2VjdCA9IFByb2plY3RUcmFuc2VjdC5hZGQoe3Byb2plY3RfaWQ6IDF9LFxuICAge1xuICAgICAgbmFtZTogXCJ0cmFuc2VjdCAxXCIsXG4gICAgICB1cmw6IFwiL3ZvbC90cmFuc2VjdHMvMVwiLFxuICAgICAgbWVkaWFfdHlwZV9pZDogMSxcbiAgICAgIGltYWdlczogW1wiMS5qcGdcIiwgXCIyLmpwZ1wiXVxuICAgfSxcbiAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHRyYW5zZWN0KTsgLy8ge2lkOiAxLCBuYW1lOiBcInRyYW5zZWN0IDFcIiwgLi4ufVxuICAgfVxuKTtcblxuLy8gYXR0YWNoIGFuIGV4aXN0aW5nIHRyYW5zZWN0IHRvIGFub3RoZXIgcHJvamVjdFxudmFyIHRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIHRyYW5zZWN0ID0gdHJhbnNlY3RzWzBdO1xuICAgLy8gdHJhbnNlY3QgaXMgbm93IGF0dGFjaGVkIHRvIHByb2plY3QgMSAqYW5kKiAyXG4gICB0cmFuc2VjdC4kYXR0YWNoKHtwcm9qZWN0X2lkOiAyfSk7XG59KTtcbi8vIG9yIGRpcmVjdGx5ICh0cmFuc2VjdCAxIHdpbGwgYmUgYXR0YWNoZWQgdG8gcHJvamVjdCAyKVxuUHJvamVjdFRyYW5zZWN0LmF0dGFjaCh7cHJvamVjdF9pZDogMn0sIHtpZDogMX0pO1xuXG4vLyBkZXRhY2ggYSB0cmFuc2VjdCBmcm9tIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHRyYW5zZWN0cyA9IFByb2plY3RUcmFuc2VjdC5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIHRyYW5zZWN0ID0gdHJhbnNlY3RzWzBdO1xuICAgdHJhbnNlY3QuJGRldGFjaCh7cHJvamVjdF9pZDogMX0pO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdFRyYW5zZWN0LmRldGFjaCh7cHJvamVjdF9pZDogMX0sIHtpZDogMX0pO1xuXG4vLyBhdHRhY2hpbmcgYW5kIGRldGFjaGluZyBjYW4gYmUgZG9uZSB1c2luZyBhIFRyYW5zZWN0IG9iamVjdCBhcyB3ZWxsOlxudmFyIHRyYW5zZWN0ID0gVHJhbnNlY3QuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIFByb2plY3RUcmFuc2VjdC5hdHRhY2goe3Byb2plY3RfaWQ6IDJ9LCB0cmFuc2VjdCk7XG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1Byb2plY3RUcmFuc2VjdCcsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzpwcm9qZWN0X2lkL3RyYW5zZWN0cy86aWQnLFxuXHRcdHsgaWQ6ICdAaWQnIH0sXG5cdFx0e1xuXHRcdFx0YWRkOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG5cdFx0XHRhdHRhY2g6IHsgbWV0aG9kOiAnUE9TVCcgfSxcblx0XHRcdGRldGFjaDogeyBtZXRob2Q6ICdERUxFVEUnIH1cblx0XHR9XG5cdCk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBQcm9qZWN0VXNlclxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB1c2VycyBiZWxvbmdpbmcgdG8gYSBwcm9qZWN0LlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHVzZXJzIG9mIHRoZSBwcm9qZWN0IHdpdGggSUQgMVxudmFyIHVzZXJzID0gUHJvamVjdFVzZXIucXVlcnkoeyBwcm9qZWN0X2lkOiAxIH0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXJzKTsgLy8gW3tpZDogMSwgZmlyc3RuYW1lOiBcIkphbmVcIiwgLi4ufSwgLi4uXVxufSk7XG5cbi8vIHVwZGF0ZSB0aGUgcHJvamVjdCByb2xlIG9mIGEgdXNlclxuUHJvamVjdFVzZXIuc2F2ZSh7cHJvamVjdF9pZDogMX0sIHtpZDogMSwgcHJvamVjdF9yb2xlX2lkOiAxfSk7XG5cbi8vIGF0dGFjaCBhIHVzZXIgdG8gYW5vdGhlciBwcm9qZWN0XG5Qcm9qZWN0VXNlci5hdHRhY2goe3Byb2plY3RfaWQ6IDJ9LCB7aWQ6IDEsIHByb2plY3Rfcm9sZV9pZDogMn0pO1xuXG4vLyBkZXRhY2ggYSB1c2VyIGZyb20gdGhlIHByb2plY3Qgd2l0aCBJRCAxXG52YXIgdXNlcnMgPSBQcm9qZWN0VXNlci5xdWVyeSh7IHByb2plY3RfaWQ6IDEgfSwgZnVuY3Rpb24gKCkge1xuICAgdmFyIHVzZXIgPSB1c2Vyc1swXTtcbiAgIHVzZXIuJGRldGFjaCh7cHJvamVjdF9pZDogMX0pO1xufSk7XG4vLyBvciBkaXJlY3RseVxuUHJvamVjdFVzZXIuZGV0YWNoKHtwcm9qZWN0X2lkOiAxfSwge2lkOiAxfSk7XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5mYWN0b3J5KCdQcm9qZWN0VXNlcicsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3Byb2plY3RzLzpwcm9qZWN0X2lkL3VzZXJzLzppZCcsXG5cdFx0eyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfSxcblx0XHRcdGF0dGFjaDogeyBtZXRob2Q6ICdQT1NUJyB9LFxuXHRcdFx0ZGV0YWNoOiB7IG1ldGhvZDogJ0RFTEVURScgfVxuXHRcdH1cblx0KTtcbn0pOyIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIFJvbGVcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3Igcm9sZXMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgcm9sZXNcbnZhciByb2xlcyA9IFJvbGUucXVlcnkoZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2cocm9sZXMpOyAvLyBbe2lkOiAxLCBuYW1lOiBcImFkbWluXCJ9LCAuLi5dXG59KTtcblxuLy8gZ2V0IG9uZSByb2xlXG52YXIgcm9sZSA9IFJvbGUuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHJvbGUpOyAvLyB7aWQ6IDEsIG5hbWU6IFwiYWRtaW5cIn1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnUm9sZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3JvbGVzLzppZCcsIHsgaWQ6ICdAaWQnIH0pO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgU2hhcGVcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3Igc2hhcGVzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIHNoYXBlc1xudmFyIHNoYXBlcyA9IFNoYXBlLnF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHNoYXBlcyk7IC8vIFt7aWQ6IDEsIG5hbWU6IFwicG9pbnRcIn0sIC4uLl1cbn0pO1xuXG4vLyBnZXQgb25lIHNoYXBlXG52YXIgc2hhcGUgPSBTaGFwZS5nZXQoe2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coc2hhcGUpOyAvLyB7aWQ6IDEsIG5hbWU6IFwicG9pbnRcIn1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnU2hhcGUnLCBmdW5jdGlvbiAoJHJlc291cmNlLCBVUkwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS9zaGFwZXMvOmlkJywgeyBpZDogJ0BpZCcgfSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBUcmFuc2VjdFxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0cmFuc2VjdHMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBvbmUgdHJhbnNlY3RcbnZhciB0cmFuc2VjdCA9IFRyYW5zZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh0cmFuc2VjdCk7IC8vIHtpZDogMSwgbmFtZTogXCJ0cmFuc2VjdCAxXCJ9XG59KTtcblxuLy8gdXBkYXRlIGEgdHJhbnNlY3RcbnZhciB0cmFuc2VjdCA9IFRyYW5zZWN0LmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICB0cmFuc2VjdC5uYW1lID0gXCJteSB0cmFuc2VjdFwiO1xuICAgdHJhbnNlY3QuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblRyYW5zZWN0LnNhdmUoe2lkOiAxLCBuYW1lOiBcIm15IHRyYW5zZWN0XCJ9KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLmZhY3RvcnkoJ1RyYW5zZWN0JywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoVVJMICsgJy9hcGkvdjEvdHJhbnNlY3RzLzppZCcsXG5cdFx0eyBpZDogJ0BpZCcgfSxcblx0XHR7XG5cdFx0XHRzYXZlOiB7IG1ldGhvZDogJ1BVVCcgfVxuXHRcdH1cblx0XHQpO1xufSk7IiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgVHJhbnNlY3RJbWFnZVxuICogQG1lbWJlck9mIGRpYXMuYXBpXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBpbWFnZXMgb2YgdHJhbnNlY3RzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgdGhlIElEcyBvZiBhbGwgaW1hZ2VzIG9mIHRoZSB0cmFuc2VjdCB3aXRoIElEIDFcbnZhciBpbWFnZXMgPSBUcmFuc2VjdEltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGltYWdlcyk7IC8vIFsxLCAxMiwgMTQsIC4uLl1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnVHJhbnNlY3RJbWFnZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3RyYW5zZWN0cy86dHJhbnNlY3RfaWQvaW1hZ2VzJyk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBVc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIHVzZXJzLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYSBsaXN0IG9mIGFsbCB1c2Vyc1xudmFyIHVzZXJzID0gVXNlci5xdWVyeShmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2Vycyk7IC8vIFt7aWQ6IDEsIGZpcnN0bmFtZTogXCJKYW5lXCIsIC4uLn0sIC4uLl1cbn0pO1xuXG4vLyByZXRyaWV2aW5nIHRoZSB1c2VybmFtZVxudmFyIHVzZXIgPSBVc2VyLmdldCh7aWQ6IDF9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2VyLmZpcnN0bmFtZSk7XG59KTtcblxuLy8gY3JlYXRpbmcgYSBuZXcgdXNlclxudmFyIHVzZXIgPSBVc2VyLmFkZChcbiAgIHtcbiAgICAgIGVtYWlsOiAnbXlAbWFpbC5jb20nLFxuICAgICAgcGFzc3dvcmQ6ICcxMjM0NTZwdycsXG4gICAgICBwYXNzd29yZF9jb25maXJtYXRpb246ICcxMjM0NTZwdycsXG4gICAgICBmaXJzdG5hbWU6ICdqYW5lJyxcbiAgICAgIGxhc3RuYW1lOiAndXNlcidcbiAgIH0sXG4gICBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyh1c2VyKTsgLy8ge2lkOiAxLCBmaXJzdG5hbWU6ICdqYW5lJywgLi4ufVxuICAgfVxuKTtcblxuLy8gY2hhbmdpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IFVzZXIuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuZmlyc3RuYW1lID09ICdKb2VsJztcbiAgIHVzZXIuJHNhdmUoKTtcbn0pO1xuLy8gb3IgZGlyZWN0bHlcblVzZXIuc2F2ZSh7aWQ6IDEsIGZpcnN0bmFtZTogJ0pvZWwnfSk7XG5cbi8vIGRlbGV0aW5nIHRoZSB1c2VyXG52YXIgdXNlciA9IFVzZXIuZ2V0KHtpZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuJGRlbGV0ZSgpO1xufSk7XG4vLyBvciBkaXJlY3RseVxuVXNlci5kZWxldGUoe2lkOiAxfSk7XG5cbi8vIHF1ZXJ5IGZvciBhIHVzZXJuYW1lXG52YXIgdXNlcnMgPSBVc2VyLmZpbmQoe3F1ZXJ5OiAnamEnIH0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKHVzZXJzKTsgLy8gW3tpZDogMSwgZmlyc3RuYW1lOiBcImphbmVcIiwgLi4ufSwgLi4uXVxufSk7XG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYXBpJykuZmFjdG9yeSgnVXNlcicsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3VzZXJzLzppZC86cXVlcnknLCB7IGlkOiAnQGlkJyB9LCB7XG5cdFx0c2F2ZTogeyBtZXRob2Q6ICdQVVQnIH0sXG5cdFx0YWRkOiB7IG1ldGhvZDogJ1BPU1QnIH0sXG4gICAgICBmaW5kOiB7IG1ldGhvZDogJ0dFVCcsIHBhcmFtczogeyBpZDogJ2ZpbmQnIH0sIGlzQXJyYXk6IHRydWUgfVxuXHR9KTtcbn0pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFwaVxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHJvbGVzXG4gKiBAbWVtYmVyT2YgZGlhcy5hcGlcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIHRoZSBhdmFpbGFibGUgcm9sZXNcbiAqIEBleGFtcGxlXG52YXIgYWRtaW5Sb2xlSWQgPSByb2xlLmdldElkKCdhZG1pbicpOyAvLyAxXG52YXIgYWRtaW5Sb2xlTmFtZSA9IHJvbGUuZ2V0TmFtZSgxKTsgLy8gJ2FkbWluJ1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hcGknKS5zZXJ2aWNlKCdyb2xlcycsIGZ1bmN0aW9uIChSb2xlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgcm9sZXMgPSB7fTtcblx0XHR2YXIgcm9sZXNJbnZlcnNlID0ge307XG5cblx0XHRSb2xlLnF1ZXJ5KGZ1bmN0aW9uIChyKSB7XG5cdFx0XHRyLmZvckVhY2goZnVuY3Rpb24gKHJvbGUpIHtcblx0XHRcdFx0cm9sZXNbcm9sZS5pZF0gPSByb2xlLm5hbWU7XG5cdFx0XHRcdHJvbGVzSW52ZXJzZVtyb2xlLm5hbWVdID0gcm9sZS5pZDtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5nZXROYW1lID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRyZXR1cm4gcm9sZXNbaWRdO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldElkID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdHJldHVybiByb2xlc0ludmVyc2VbbmFtZV07XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hcGlcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzaGFwZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFwaVxuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIGF2YWlsYWJsZSBzaGFwZXNcbiAqIEBleGFtcGxlXG52YXIgc2hhcGVzQXJyYXkgPSBzcGFoZXMuZ2V0QWxsKCk7IC8vIFt7aWQ6IDEsIG5hbWU6ICdQb2ludCd9LCAuLi5dXG5zaGFwZXMuZ2V0SWQoJ1BvaW50Jyk7IC8vIDFcbnNoYXBlcy5nZXROYW1lKDEpOyAvLyAnUG9pbnQnXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFwaScpLnNlcnZpY2UoJ3NoYXBlcycsIGZ1bmN0aW9uIChTaGFwZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHNoYXBlcyA9IHt9O1xuXHRcdHZhciBzaGFwZXNJbnZlcnNlID0ge307XG5cblx0XHR2YXIgcmVzb3VyY2VzID0gU2hhcGUucXVlcnkoZnVuY3Rpb24gKHMpIHtcblx0XHRcdHMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcblx0XHRcdFx0c2hhcGVzW3NoYXBlLmlkXSA9IHNoYXBlLm5hbWU7XG5cdFx0XHRcdHNoYXBlc0ludmVyc2Vbc2hhcGUubmFtZV0gPSBzaGFwZS5pZDtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5nZXROYW1lID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRyZXR1cm4gc2hhcGVzW2lkXTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRJZCA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRyZXR1cm4gc2hhcGVzSW52ZXJzZVtuYW1lXTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gcmVzb3VyY2VzO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmdkb2MgY29uc3RhbnRcbiAqIEBuYW1lIE1BWF9NU0dcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAZGVzY3JpcHRpb24gVGhlIG1heGltdW0gbnVtYmVyIG9mIGluZm8gbWVzc2FnZXMgdG8gZGlzcGxheS5cbiAqIEByZXR1cm5zIHtJbnRlZ2VyfVxuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudWkubWVzc2FnZXMnKS5jb25zdGFudCgnTUFYX01TRycsIDEpOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTWVzc2FnZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy51aS5tZXNzYWdlc1xuICogQGRlc2NyaXB0aW9uIEhhbmRsZXMgdGhlIGxpdmUgZGlzcGxheSBvZiB1c2VyIGZlZWRiYWNrIG1lc3NhZ2VzIHZpYSBKU1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS5tZXNzYWdlcycpLmNvbnRyb2xsZXIoJ01lc3NhZ2VzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIE1BWF9NU0cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5hbGVydHMgPSBbXTtcblxuICAgICAgICB2YXIgY2xvc2VGdWxsc2NyZWVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbikge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbikge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4pIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG5cdFx0Ly8gbWFrZSBtZXRob2QgYWNjZXNzaWJsZSBieSBvdGhlciBtb2R1bGVzXG5cdFx0d2luZG93LiRkaWFzUG9zdE1lc3NhZ2UgPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuICAgICAgICAgICAgY2xvc2VGdWxsc2NyZWVuKCk7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkc2NvcGUuYWxlcnRzLnVuc2hpZnQoe1xuXHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXG5cdFx0XHRcdFx0dHlwZTogdHlwZSB8fCAnaW5mbydcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aWYgKCRzY29wZS5hbGVydHMubGVuZ3RoID4gTUFYX01TRykge1xuXHRcdFx0XHRcdCRzY29wZS5hbGVydHMucG9wKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbiAoaW5kZXgpIHtcblx0XHRcdCRzY29wZS5hbGVydHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudWkubWVzc2FnZXNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtc2dcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLm1lc3NhZ2VzXG4gKiBAZGVzY3JpcHRpb24gRW5hYmxlcyBhcmJpdHJhcnkgQW5ndWxhckpTIG1vZHVsZXMgdG8gcG9zdCB1c2VyIGZlZWRiYWNrIG1lc3NhZ2VzIHVzaW5nIHRoZSBESUFTIFVJIG1lc3NhZ2luZyBzeXN0ZW0uIFNlZSB0aGUgW0Jvb3RzdHJhcCBhbGVydHNdKGh0dHA6Ly9nZXRib290c3RyYXAuY29tL2NvbXBvbmVudHMvI2FsZXJ0cykgZm9yIGF2YWlsYWJsZSBtZXNzYWdlIHR5cGVzIGFuZCB0aGVpciBzdHlsZS4gSW4gYWRkaXRpb24gdG8gYWN0aXZlbHkgcG9zdGluZyBtZXNzYWdlcywgaXQgcHJvdmlkZXMgdGhlIGByZXNwb25zZUVycm9yYCBtZXRob2QgdG8gY29udmVuaWVudGx5IGRpc3BsYXkgZXJyb3IgbWVzc2FnZXMgaW4gY2FzZSBhbiBBSkFYIHJlcXVlc3Qgd2VudCB3cm9uZy5cbiAqIEBleGFtcGxlXG5tc2cucG9zdCgnZGFuZ2VyJywgJ0RvIHlvdSByZWFsbHkgd2FudCB0byBkZWxldGUgdGhpcz8gRXZlcnl0aGluZyB3aWxsIGJlIGxvc3QuJyk7XG5cbm1zZy5kYW5nZXIoJ0RvIHlvdSByZWFsbHkgd2FudCB0byBkZWxldGUgdGhpcz8gRXZlcnl0aGluZyB3aWxsIGJlIGxvc3QuJyk7XG5tc2cud2FybmluZygnTGVhdmluZyB0aGUgcHJvamVjdCBpcyBub3QgcmV2ZXJzaWJsZS4nKTtcbm1zZy5zdWNjZXNzKCdUaGUgcHJvamVjdCB3YXMgY3JlYXRlZC4nKTtcbm1zZy5pbmZvKCdZb3Ugd2lsbCByZWNlaXZlIGFuIGVtYWlsIGFib3V0IHRoaXMuJyk7XG5cbnZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goeyAuLi4gfSk7XG4vLyBoYW5kbGVzIGFsbCBlcnJvciByZXNwb25zZXMgYXV0b21hdGljYWxseVxubGFiZWwuJHByb21pc2UuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS5tZXNzYWdlcycpLnNlcnZpY2UoJ21zZycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0dGhpcy5wb3N0ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlIHx8IHR5cGU7XG5cdFx0XHR3aW5kb3cuJGRpYXNQb3N0TWVzc2FnZSh0eXBlLCBtZXNzYWdlKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5kYW5nZXIgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0X3RoaXMucG9zdCgnZGFuZ2VyJywgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMud2FybmluZyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cdFx0XHRfdGhpcy5wb3N0KCd3YXJuaW5nJywgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc3VjY2VzcyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cdFx0XHRfdGhpcy5wb3N0KCdzdWNjZXNzJywgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuaW5mbyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cdFx0XHRfdGhpcy5wb3N0KCdpbmZvJywgbWVzc2FnZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucmVzcG9uc2VFcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0dmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuXG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcblx0XHRcdFx0X3RoaXMuZGFuZ2VyKFwiUGxlYXNlIGxvZyBpbiAoYWdhaW4pLlwiKTtcblx0XHRcdH0gZWxzZSBpZiAoIWRhdGEpIHtcblx0XHRcdFx0X3RoaXMuZGFuZ2VyKFwiVGhlIHNlcnZlciBkaWRuJ3QgcmVzcG9uZCwgc29ycnkuXCIpO1xuXHRcdFx0fSBlbHNlIGlmIChkYXRhLm1lc3NhZ2UpIHtcblx0XHRcdFx0Ly8gZXJyb3IgcmVzcG9uc2Vcblx0XHRcdFx0X3RoaXMuZGFuZ2VyKGRhdGEubWVzc2FnZSk7XG5cdFx0XHR9IGVsc2UgaWYgKGRhdGEpIHtcblx0XHRcdFx0Ly8gdmFsaWRhdGlvbiByZXNwb25zZVxuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuXHRcdFx0XHRcdF90aGlzLmRhbmdlcihkYXRhW2tleV1bMF0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyB1bmtub3duIGVycm9yIHJlc3BvbnNlXG5cdFx0XHRcdF90aGlzLmRhbmdlcihcIlRoZXJlIHdhcyBhbiBlcnJvciwgc29ycnkuXCIpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS51c2Vyc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgdXNlckNob29zZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnVpLnVzZXJzXG4gKiBAZGVzY3JpcHRpb24gQW4gaW5wdXQgZmllbGQgdG8gZmluZCBhIHVzZXIuXG4gKiBAZXhhbXBsZVxuLy8gSFRNTFxuPGlucHV0IHBsYWNlaG9sZGVyPVwiU2VhcmNoIGJ5IHVzZXJuYW1lXCIgZGF0YS11c2VyLWNob29zZXI9XCJhZGRVc2VyXCIgLz5cblxuLy8gQ29udHJvbGxlciAoZXhhbXBsZSBmb3IgYWRkaW5nIGEgdXNlciB0byBhIHByb2plY3QpXG4kc2NvcGUuYWRkVXNlciA9IGZ1bmN0aW9uICh1c2VyKSB7XG5cdC8vIG5ldyB1c2VycyBhcmUgZ3Vlc3RzIGJ5IGRlZmF1bHRcblx0dmFyIHJvbGVJZCA9ICRzY29wZS5yb2xlcy5ndWVzdDtcblxuXHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHR1c2VyLnByb2plY3Rfcm9sZV9pZCA9IHJvbGVJZDtcblx0XHQkc2NvcGUudXNlcnMucHVzaCh1c2VyKTtcblx0fTtcblxuXHQvLyB1c2VyIHNob3VsZG4ndCBhbHJlYWR5IGV4aXN0XG5cdGlmICghZ2V0VXNlcih1c2VyLmlkKSkge1xuXHRcdFByb2plY3RVc2VyLmF0dGFjaChcblx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfSxcblx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0c3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3Jcblx0XHQpO1xuXHR9XG59O1xuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnVpLnVzZXJzJykuZGlyZWN0aXZlKCd1c2VyQ2hvb3NlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXG5cdFx0XHRzY29wZToge1xuXHRcdFx0XHRzZWxlY3Q6ICc9dXNlckNob29zZXInXG5cdFx0XHR9LFxuXG5cdFx0XHRyZXBsYWNlOiB0cnVlLFxuXG5cdFx0XHR0ZW1wbGF0ZTogJzxpbnB1dCB0eXBlPVwidGV4dFwiIGRhdGEtbmctbW9kZWw9XCJzZWxlY3RlZFwiIGRhdGEtdWliLXR5cGVhaGVhZD1cInVzZXIubmFtZSBmb3IgdXNlciBpbiBmaW5kKCR2aWV3VmFsdWUpXCIgZGF0YS10eXBlYWhlYWQtd2FpdC1tcz1cIjI1MFwiIGRhdGEtdHlwZWFoZWFkLW9uLXNlbGVjdD1cInNlbGVjdCgkaXRlbSlcIi8+JyxcblxuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgVXNlcikge1xuXHRcdFx0XHQkc2NvcGUuZmluZCA9IGZ1bmN0aW9uIChxdWVyeSkge1xuXHRcdFx0XHRcdHJldHVybiBVc2VyLmZpbmQoe3F1ZXJ5OiBxdWVyeX0pLiRwcm9taXNlO1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy51aS51dGlsc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIGZpbHRlclN1YnNldFxuICogQG1lbWJlck9mIGRpYXMudWkudXRpbHNcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyBhIGZ1bmN0aW9uIHRoYXQgcmVtb3ZlcyBhbGwgbnVtYmVycyBvZiB0aGUgZmlyc3QgYXJndW1lbnQgYXJyYXkgKGluIHBsYWNlISkgdGhhdCBhcmUgbm90IHByZXNlbnQgaW4gdGhlIHNlY29uZCBhcmd1bWVudCBhcnJheS4gQWNjZXB0cyBhIHRoaXJkIGFyZ3VtZW50IGJvb2xlYW4gYXMgdG8gd2hldGhlciB0aGUgc2Vjb25kIGFyZ3VtZW50IGFycmF5IGlzIGFscmVhZHkgc29ydGVkLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy51aS51dGlscycpLmZhY3RvcnkoJ2ZpbHRlclN1YnNldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgICAgIC8vIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGFycmF5LnNvcnQoKSB3aXRoIG51bWJlcnNcbiAgICAgICAgdmFyIGNvbXBhcmVOdW1iZXJzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhIC0gYjtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIHRoZSBzdWJzZXQgYXJyYXkgd2l0aG91dCB0aGUgZWxlbWVudHMgdGhhdCBhcmUgbm90IHByZXNlbnQgaW4gc3VwZXJzZXRcbiAgICAgICAgLy8gYXNzdW1lcyB0aGF0IHN1cGVyc2V0IGlzIHNvcnRlZCBpZiBzb3J0ZWQgZXZhbHVhdGVzIHRvIHRydWVcbiAgICAgICAgLy8gZG9lc24ndCBjaGFuZ2UgdGhlIG9yZGVyaW5nIG9mIGVsZW1lbnRzIGluIHRoZSBzdWJzZXQgYXJyYXlcbiAgICAgICAgdmFyIGZpbHRlclN1YnNldCA9IGZ1bmN0aW9uIChzdWJzZXQsIHN1cGVyc2V0LCBzb3J0ZWQpIHtcbiAgICAgICAgICAgIGlmICghc29ydGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gY2xvbmUgYXJyYXkgc28gc29ydGluZyBkb2Vzbid0IGFmZmVjdCBvcmlnaW5hbFxuICAgICAgICAgICAgICAgIHN1cGVyc2V0ID0gc3VwZXJzZXQuc2xpY2UoMCkuc29ydChjb21wYXJlTnVtYmVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjbG9uZSB0aGUgaW5wdXQgYXJyYXkgKHNvIGl0IGlzbid0IGNoYW5nZWQgYnkgc29ydGluZyksIHRoZW4gc29ydCBpdFxuICAgICAgICAgICAgdmFyIHNvcnRlZFN1YnNldCA9IHN1YnNldC5zbGljZSgwKS5zb3J0KGNvbXBhcmVOdW1iZXJzKTtcbiAgICAgICAgICAgIC8vIGhlcmUgd2Ugd2lsbCBwdXQgYWxsIGl0ZW1zIG9mIHN1YnNldCB0aGF0IGFyZSBub3QgcHJlc2VudCBpbiBzdXBlcnNldFxuICAgICAgICAgICAgdmFyIG5vdFRoZXJlID0gW107XG4gICAgICAgICAgICB2YXIgaSA9IDAsIGogPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGkgPCBzdXBlcnNldC5sZW5ndGggJiYgaiA8IHNvcnRlZFN1YnNldC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VwZXJzZXRbaV0gPCBzb3J0ZWRTdWJzZXRbal0pIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3VwZXJzZXRbaV0gPT09IHNvcnRlZFN1YnNldFtqXSkge1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub3RUaGVyZS5wdXNoKHNvcnRlZFN1YnNldFtqKytdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBhZCBwb3NzaWJsZSBtaXNzaW5nIGl0ZW1zIGlmIHNvcnRlZFN1YnNldCBpcyBsb25nZXIgdGhhbiBzdXBlcnNldFxuICAgICAgICAgICAgd2hpbGUgKGogPCBzb3J0ZWRTdWJzZXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgbm90VGhlcmUucHVzaChzb3J0ZWRTdWJzZXRbaisrXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG5vdyByZW1vdmUgYWxsIGVsZW1lbnRzIGZyb20gc3Vic2V0IHRoYXQgYXJlIG5vdCBpbiBzdXBlcnNldFxuICAgICAgICAgICAgLy8gd2UgZG8gaXQgdGhpcyB3YXkgYmVjYXVzZSB0aGUgbm90VGhlcmUgYXJyYXkgd2lsbCBwcm9iYWJseSBhbHdheXMgYmUgdmVyeSBzbWFsbFxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG5vdFRoZXJlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gd2UgY2FuIGFzc3VtZSB0aGF0IGluZGV4T2YgaXMgbmV2ZXIgPDBcbiAgICAgICAgICAgICAgICBzdWJzZXQuc3BsaWNlKHN1YnNldC5pbmRleE9mKG5vdFRoZXJlW2ldKSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGZpbHRlclN1YnNldDtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
