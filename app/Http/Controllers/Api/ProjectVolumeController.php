<?php

namespace Biigle\Http\Controllers\Api;

use DB;
use Queue;
use Biigle\Volume;
use Biigle\Project;
use Illuminate\Http\Request;
use Biigle\Jobs\CreateNewImages;
use Biigle\Http\Requests\StoreVolume;

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
     * @api {post} projects/:id/volumes Create a new volume
     * @apiGroup Volumes
     * @apiName StoreProjectVolumes
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required attributes) {String} name The name of the new volume.
     * @apiParam (Required attributes) {String} url The base URL of the image files. Can be a path to a storage disk like `local://volumes/1` or a remote path like `https://example.com/volumes/1`.
     * @apiParam (Required attributes) {Number} media_type_id The ID of the media type of the new volume.
     * @apiParam (Required attributes) {String} images List of image file names of the images that can be found at the base URL, formatted as comma separated values or as array. With the base URL `local://volumes/1` and the image `1.jpg`, the file `volumes/1/1.jpg` of the `local` storage disk will be used.
     *
     * @apiParam (Optional attributes) {String} video_link Link to a video that belongs to or was the source of this volume.
     * @apiParam (Optional attributes) {String} gis_link Link to a GIS that belongs to this volume.
     * @apiParam (Optional attributes) {String} doi The DOI of the dataset that is represented by the new volume.
     *
     * @apiParamExample {String} Request example:
     * name: 'New volume'
     * url: 'local://volumes/test-volume'
     * media_type_id: 1
     * images: '1.jpg,2.jpg,3.jpg'
     * video_link: 'http://example.com'
     * gis_link: 'http://gis.example.com'
     * doi: '10.3389/fmars.2017.00083'
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
     *    "video_link": "http://example.com",
     *    "gis_link": "http://gis.example.com",
     *    "doi": "10.3389/fmars.2017.00083"
     * }
     *
     * @param StoreVolume $request
     * @return Volume
     */
    public function store(StoreVolume $request)
    {
        $volume = new Volume;
        $volume->name = $request->input('name');
        $volume->url = $request->input('url');
        $volume->setMediaTypeId($request->input('media_type_id'));
        $volume->video_link = $request->input('video_link');
        $volume->gis_link = $request->input('gis_link');
        $volume->doi = $request->input('doi');
        $volume->creator()->associate($request->user());
        $volume->save();
        $request->project->volumes()->attach($volume);

        $images = $request->input('images');

        // If too many images should be created, do this asynchronously in the
        // background. Else the script will run in the 30 s execution timeout.
        $job = new CreateNewImages($volume, $images);
        if (count($images) > 10000) {
            Queue::pushOn('high', $job);
        } else {
            Queue::connection('sync')->push($job);
        }

        // media type shouldn't be returned
        unset($volume->media_type);

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
