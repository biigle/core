/**
 * Resource for projects.
 *
 * var resource = biigle.$require('api.projects');
 *
 * Get all projects the current user belongs to:
 * resource.query().then(...);
 *
 * Get one project:
 * resource.get({id: 1}).then(...);
 *
 * Create a new project:
 * resource.save({}, {name: 'Test', description: 'Test project'}).then(...);
 *
 * Update a project:
 * resource.update({id: 1}, {name: 'My new name'}).then(...);
 *
 * Delete a project:
 * resource.delete({id: 1}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.projects', Vue.resource('/api/v1/projects{/id}', {}, {
    query: {
        // a user can only query their own projects
        url: '/api/v1/projects/my',
    }
}));
