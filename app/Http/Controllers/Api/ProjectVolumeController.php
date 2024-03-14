<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreVolume;
use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\Project;
use Biigle\Volume;
use DB;
use Illuminate\Http\Request;
use Queue;

class ProjectVolumeController extends Controller
{
    /**
     * Shows a list of all volumes belonging to the specified project..
     *
     * @api {get} projects/:id/volumes Get all volumes
     * @apiGroup Projects
     * @apiName IndexProjectVolumes
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "volume 1",
     *       "media_type_id": 3,
     *       "creator_id": 7,
     *       "created_at": "2015-02-19 14:45:58",
     *       "updated_at":"2015-02-19 14:45:58",
     *       "url": "local://volumes/1"
     *    }
     * ]
     *
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        return $project->volumes;
    }

    /**
     * Creates a new volume associated to the specified project.
     *
     * @api {post} projects/:id/volumes Create a new volume (v1)
     * @apiGroup Volumes
     * @apiName StoreProjectVolumes
     * @apiPermission projectAdmin
     * @apiDeprecated use now (#Volumes:StoreProjectPendingVolumes) and (#Volumes:UpdatePendingVolume).
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required attributes) {String} name The name of the new volume.
     * @apiParam (Required attributes) {String} url The base URL of the image/video files. Can be a path to a storage disk like `local://volumes/1` or a remote path like `https://example.com/volumes/1`.
     * @apiParam (Required attributes) {String} media_type The media type of the new volume (`image` or `video`). If this attribute is missing, `image` is assumed for backwards compatibility.
     * @apiParam (Required attributes) {String} files List of file names of the images/videos that can be found at the base URL, formatted as comma separated values or as array. With the base URL `local://volumes/1` and the image `1.jpg`, the file `volumes/1/1.jpg` of the `local` storage disk will be used.
     *
     * @apiParam (Optional attributes) {String} handle Handle or DOI of the dataset that is represented by the new volume.
     * @apiParam (Optional attributes) {String} metadata_text CSV-like string with file metadata. See "metadata columns" for the possible columns. Each column may occur only once. There must be at least one column other than `filename`. For video metadata, multiple rows can contain metadata from different times of the same video. In this case, the `filename` of the rows must match and each row needs a (different) `taken_at` timestamp.
     * @apiParam (Optional attributes) {File} metadata_csv Alternative to `metadata_text`. This field allows the upload of an actual CSV file. See `metadata_text` for the further description.
     *
     * @apiParam (metadata columns) {String} filename The filename of the file the metadata belongs to. This column is required.
     * @apiParam (metadata columns) {String} taken_at The date and time where the file was taken. Example: `2016-12-19 12:49:00`
     * @apiParam (metadata columns) {Number} lng Longitude where the file was taken in decimal form. If this column is present, `lat` must be present, too. Example: `52.3211`
     * @apiParam (metadata columns) {Number} lat Latitude where the file was taken in decimal form. If this column is present, `lng` must be present, too. Example: `28.775`
     * @apiParam (metadata columns) {Number} gps_altitude GPS Altitude where the file was taken in meters. Negative for below sea level. Example: `-1500.5`
     * @apiParam (metadata columns) {Number} distance_to_ground Distance to the sea floor in meters. Example: `30.25`
     * @apiParam (metadata columns) {Number} area Area shown by the file in m². Example `2.6`.
     *
     * @apiParam (Deprecated attributes) {String} images This attribute has been replaced by the `files` attribute which should be used instead.
     *
     * @apiParamExample {String} Request example:
     * name: 'New volume'
     * url: 'local://volumes/test-volume'
     * media_type_id: 1
     * files: '1.jpg,2.jpg,3.jpg'
     * handle: '10.3389/fmars.2017.00083'
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "name": "New volume",
     *    "media_type_id": 1,
     *    "creator_id": 2,
     *    "created_at": "2015-02-19 16:10:17",
     *    "updated_at": "2015-02-19 16:10:17",
     *    "url": "local://volumes/test-volume",
     *    "handle": "10.3389/fmars.2017.00083"
     * }
     *
     * @param StoreVolume $request
     * @return Volume
     */
    public function store(StoreVolume $request)
    {
        $volume = DB::transaction(function () use ($request) {
            $volume = new Volume;
            $volume->name = $request->input('name');
            $volume->url = $request->input('url');
            $volume->media_type_id = $request->input('media_type_id');
            $volume->handle = $request->input('handle');
            $volume->creator()->associate($request->user());
            $volume->save();
            $request->project->volumes()->attach($volume);

            $files = $request->input('files');

            if ($request->file('metadata_csv')) {
                $volume->saveMetadata($request->file('metadata_csv'));
            }

            // If too many files should be created, do this asynchronously in the
            // background. Else the script will run in the 30 s execution timeout.
            $job = new CreateNewImagesOrVideos($volume, $files);
            if (count($files) > PendingVolumeController::CREATE_SYNC_LIMIT) {
                Queue::pushOn('high', $job);
                $volume->creating_async = true;
                $volume->save();
            } else {
                Queue::connection('sync')->push($job);
            }

            // media type shouldn't be returned
            unset($volume->media_type);

            return $volume;
        });

        if ($this->isAutomatedRequest()) {
            return $volume;
        }

        return $this->fuzzyRedirect()
            ->with('message', "Volume {$volume->name} created")
            ->with('messageType', 'success');
    }

    /**
     * Attaches the existing specified volume to the existing specified
     * project.
     *
     * @api {post} projects/:pid/volumes/:tid Attach a volume
     * @apiGroup Projects
     * @apiName AttachProjectVolumes
     * @apiPermission projectAdmin
     * @apiDescription This endpoint attaches an existing volume to another existing project. The volume then will belong to multiple projects. The user performing this operation needs to be project admin in both the project, the volume initially belongs to, and the project, the volume should be attached to.
     *
     * @apiParam {Number} pid ID of the project that should get the annotation.
     * @apiParam {Number} tid ID of the existing volume to attach to the project.
     *
     * @param Request $request
     * @param int $projectId
     * @param int $volumeId
     * @return \Illuminate\Http\Response
     */
    public function attach(Request $request, $projectId, $volumeId)
    {
        // user must be able to admin the volume *and* the project it should
        // be attached to
        $project = Project::findOrFail($projectId);
        $this->authorize('update', $project);
        $volume = Volume::findOrFail($volumeId);
        $this->authorize('update', $volume);
        $project->volumes()->syncWithoutDetaching([$volume->id]);
    }

    /**
     * Removes the specified volume from the specified project.
     * If it is the last project the volume belongs to, the volume is
     * deleted (if the `force` argument is present in the request).
     *
     * @api {delete} projects/:pid/volumes/:tid Detach/delete a volume
     * @apiGroup Projects
     * @apiName DestroyProjectVolumes
     * @apiPermission projectAdmin
     * @apiDescription Detaches a volume from a project. The volume will no longer belong to the project it was detached from. If the volume belongs only to a single project, it cannot be detached but should be deleted. Use the `force` parameter to delete a volume belonging only to one project.
     *
     * @apiParam {Number} pid The project ID, the volume should be detached from.
     * @apiParam {Number} tid The volume ID.
     *
     * @apiParam (Optional parameters) {Boolean} force If the volume only belongs to a single project, set this parameter to delete it instead of detaching it. Otherwise the volume cannot be removed.
     *
     * @param Request $request
     * @param  int  $projectId
     * @param  int  $volumeId
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $projectId, $volumeId)
    {
        $project = Project::findOrFail($projectId);
        $this->authorize('update', $project);
        $volume = $project->volumes()->findOrFail($volumeId);
        $this->authorize('destroy', $volume);
        $project->removeVolume($volume, $request->filled('force'));
    }
}
