<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use Biigle\Project;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;

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
     *       "url": "/vol/volumes/1"
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
     * @apiParam (Required attributes) {String} url The base URL ot the image files. Can be a local path like `/vol/volumes/1` or a remote path like `https://example.com/volumes/1`.
     * @apiParam (Required attributes) {Number} media_type_id The ID of the media type of the new volume.
     * @apiParam (Required attributes) {String} images List of image file names of the images that can be found at the base URL, formatted as comma separated values. With the base URL `/vol/volumes/1` and the image `1.jpg`, the local file `/vol/volumes/1/1.jpg` will be used.
     *
     * @apiParam (Optional attributes) {String} video_link Link to a video that belongs to or was the source of this volume.
     * @apiParam (Optional attributes) {String} gis_link Link to a GIS that belongs to this volume.
     * @apiParam (Optional attributes) {String} doi The DOI of the dataset that is represented by the new volume.
     *
     * @apiParamExample {String} Request example:
     * name: 'New volume'
     * url: '/vol/volumes/test-volume'
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
     *    "url": "/vol/volumes/test-volume",
     *    "video_link": "http://example.com",
     *    "gis_link": "http://gis.example.com",
     *    "doi": "10.3389/fmars.2017.00083"
     * }
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id Project ID
     * @return Volume
     */
    public function store(Request $request, Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);
        $this->validate($request, Volume::$createRules);

        $volume = new Volume;
        $volume->name = $request->input('name');
        $volume->url = $request->input('url');
        $volume->setMediaTypeId($request->input('media_type_id'));
        $volume->video_link = $request->input('video_link');
        $volume->gis_link = $request->input('gis_link');
        $volume->doi = $request->input('doi');
        $volume->creator()->associate($auth->user());

        try {
            $volume->validateUrl();
        } catch (Exception $e) {
            return $this->buildFailedValidationResponse($request, [
                'url' => $e->getMessage(),
            ]);
        }

        $images = Volume::parseImagesQueryString($request->input('images'));

        try {
            $volume->validateImages($images);
        } catch (Exception $e) {
            return $this->buildFailedValidationResponse($request, [
                'images' => $e->getMessage(),
            ]);
        }

        // save first, so the volume gets an ID for associating with images
        $volume->save();

        try {
            $volume->createImages($images);
        } catch (\Exception $e) {
            $volume->delete();

            return response($e->getMessage(), 400);
        }

        // it's important that this is done *after* all images were added
        $volume->handleNewImages();

        $project->volumes()->attach($volume);

        if (static::isAutomatedRequest($request)) {
            // media type shouldn't be returned
            unset($volume->media_type);

            return $volume;
        } else {
            return redirect()->route('home')
                ->with('message', 'Volume '.$volume->name.' created')
                ->with('messageType', 'success');
        }
    }

    /**
     * Attaches the existing specified volume to the existing specified
     * project.
     *
     * @api {post} projects/:pid/volumes/:vid Attach a volume
     * @apiGroup Projects
     * @apiName AttachProjectVolumes
     * @apiPermission projectAdmin
     * @apiDescription This endpoint attaches an existing volume to another existing project. The volume then will belong to multiple projects. The user performing this operation needs to be project admin in both the project, the volume initially belongs to, and the project, the volume should be attached to.
     *
     * @apiParam {Number} pid ID of the project that should get the annotation.
     * @apiParam {Number} vid ID of the existing volume to attach to the project.
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
        $volume = Volume::findOrFail($volumeId);
        $this->authorize('update', $volume);
        $project = Project::findOrFail($projectId);
        $this->authorize('update', $project);

        if ($project->volumes()->where('volumes.id', $volumeId)->exists()) {
            return $this->buildFailedValidationResponse($request, [
                'vid' => 'The volume is already attached to the project.',
            ]);
        }

        $project->volumes()->attach($volume);
    }

    /**
     * Detaches the specified volume from the specified project. If this would delete
     * annotations, the `force` parameter is required.
     *
     * @api {delete} projects/:pid/volumes/:vid Detach a volume
     * @apiGroup Projects
     * @apiName DestroyProjectVolumes
     * @apiPermission projectAdmin
     * @apiDescription Detaches a volume from a project. This will delete any
     * annotations that were created in the project and volume. If there are annotations
     * to be deleted, the `force` parameter is required.
     *
     * @apiParam {Number} pid ID of the project, from which the volume should be
     * detached.
     * @apiParam {Number} vid The volume ID.
     *
     * @apiParam (Optional parameters) {Boolean} force Set this parameter if the request
     * should delete annotations. Else the request will be rejected.
     *
     * @param Request $request
     * @param  int  $projectId
     * @param  int  $volumeId
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $projectId, $volumeId)
    {
        $project = Project::findOrFail($projectId);
        $volume = $project->volumes()->findOrFail($volumeId);
        $this->authorize('destroy', $volume);

        $project->detachVolume($volume, $request->has('force'));

        return response('Removed.', 200);
    }
}
