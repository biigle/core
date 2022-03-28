/**
 * Resource for users.
 *
 * var resource = biigle.$require('api.users');
 *
 * Get all users:
 * resource.query().then(...);
 *
 * Get one user:
 * resource.get({id: 1}).then(...);
 *
 * Create a new user:
 * resource.save({}, {
 *    email: 'my@mail.com',
 *    password: '123456pw',
 *    password_confirmation: '123456pw',
 *    firstname: 'jane',
 *    lastname: 'user'
 * }).then(...);
 *
 * Update a user:
 * resource.update({id: 1}, {firstname: 'Jack'}).then(...);
 *
 * Delete a user:
 * resource.delete({id: 1}).then(...);
 *
 * Update own user settings:
 * resource.updateSettings({settings_key: settingsValue}).then(...);
 *
 * Query users by name:
 * resource.find({query: 'jo'}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/users{/id}', {}, {
    find: {
        method: 'GET',
        url: 'api/v1/users/find{/query}',
    },
    updateSettings: {
        method: 'PUT',
        url: 'api/v1/users/my/settings',
    },
});
