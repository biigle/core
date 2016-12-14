/**
 * Resource for projects.
 *
 * var resource = biigle.$require('api.projects');
 *
 * Get all projects of the current user:
 *
 * resource.query().then(...);
 *
 * Get a specific project:
 *
 * resource.get({id: projectId}).then(...);
 *
 * Create a project:
 *
 * resource.save({}, {
 *     name: 'My project',
 *     description: 'My description'
 * }).then(...);
 *
 * Update a project:
 *
 * resource.update({id: projectId}, {
 *     name: 'My new project name',
 * }).then(...);
 *
 * Delete a project:
 *
 * resource.delete({id: projectId}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.projects', Vue.resource('/api/v1/projects{/id}', {}, {
    query: {method: 'GET', params: {id: 'my'}}
}));
