/**
 * Resource for querying users with annotations on volumes and projects.
 *
 * var resource = biigle.$require('largo.api.users');
 *
 * Get all users with annotations on a certain volume:
 * resource.getUsersAnnotationVolume({vid: 1}).then(...)
 *
 * Get all users with annotations on a certain project:
 * resource.getUsersAnnotationProject({pid: 1}).then(...)
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/shapes', {}, {
    getUsersAnnotationVolume: {
        method: 'GET',
        url: 'api/v1/volumes/{vid}/users-with-annotations',
    },
    getUsersAnnotationProject: {
      method: 'GET',
      url: 'api/v1/projects/{pid}/users-with-annotations',
    }
});
