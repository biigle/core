/**
 * Resource for videos.
 *
 * let resource = biigle.$require('videos.api.videos');
 *
 * Get video information:
 * resource.get({id: videoId}).then(...);
 *
 * Create a video:
 * resource.save({id: projectId}, {url: 'local://videos', ...}).then(...)
 *
 * Delete a video:
 * resource.delete({id: videoId}, {force: false}).then(...);
 *
 * @type {Vue.resource}
 */
export default Vue.resource('api/v1/videos{/id}', {}, {
    save: {
        method: 'POST',
        url: 'api/v1/projects{/id}/videos',
    },
});
