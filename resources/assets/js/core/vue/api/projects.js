/**
 * Resource for projects.
 *
 * Get all projects of the current user
 *
 * biigle.api.projects.query().then(...);
 *
 * Get a specific project:
 *
 * biigle.api.projects.get({id: projectId}).then(...);
 *
 * Create a project:
 *
 * biigle.api.projects.save({}, {
 *     name: 'My project',
 *     description: 'My description'
 * }).then(...);
 *
 * Update a project:
 *
 * biigle.api.projects.update({id: projectId}, {
 *     name: 'My new project name',
 * }).then(...);
 *
 * Delete a project:
 *
 * biigle.api.projects.delete({id: projectId}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.api.projects = Vue.resource('/api/v1/projects{/id}', {}, {
    query: {method: 'GET', params: {id: 'my'}}
});
