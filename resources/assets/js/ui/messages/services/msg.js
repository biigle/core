/**
 * @namespace dias.ui.messages
 * @ngdoc service
 * @name msg
 * @memberOf dias.ui.messages
 * @description Enables arbitrary AngularJS modules to post user feedback messages using the DIAS UI messaging system.
 * @example
msg.post('danger', 'Do you really want to delete this?', 'Everything will be lost.');

msg.danger('Do you really want to delete this?', 'Everything will be lost.');
 */
angular.module('dias.ui.messages').service('msg', function () {
		"use strict";

		this.post = function (type, message) {
			message = message || type;
			window.$diasPostMessage(type, message);
		};

		this.danger = function (message) {
			this.post('danger', message);
		};

		this.warning = function (message) {
			this.post('warning', message);
		};

		this.success = function (message) {
			this.post('success', message);
		};

		this.info = function (message) {
			this.post('info', message);
		};

		this.responseError = function (response) {
			var message = response.data.message || "There was an error, sorry.";
			this.danger(message);
		};
	}
);
