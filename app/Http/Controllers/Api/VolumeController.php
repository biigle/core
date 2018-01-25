<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use Biigle\Volume;
use Biigle\Project;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Auth\Access\AuthorizationException;

class VolumeController extends Controller
{
    /**
     * Displays the specified volume.
     *
     * @api {get} volumes/:id Get a volume
     * @apiGroup Volumes
     * @apiName ShowVolumes
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "volume 1",
     *    "media_type_id": 3,
     *    "creator_id": 7,
     *    "created_at": "2015-02-20 17:51:03",
     *    "updated_at": "2015-02-20 17:51:03",
     *    "url": "/vol/images/"
     * }
     *
     * @param  int  $id
     * @return Volume
     */
    public function show($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume;
    }

    /**
     * Creates a new volume.
     *
     * @api {post} volumes Create a new volume
     * @apiGroup Volumes
     * @apiName StoreVolumes
     * @apiPermission user
     *
     * @apiParam (Required attributes) {String} name The name of the new volume.
     * @apiParam (Required attributes) {String} url The base URL of the image files. Can be a local path like `/vol/volumes/1` or a remote path like `https://example.com/volumes/1`.
     * @apiParam (Required attributes) {Number} visibility_id ID of the visibility of the new label tree (public or private).
     * @apiParam (Required attributes) {Number} media_type_id The ID of the media type of the new volume.
     * @apiParam (Required attributes) {String} images List of image file names of the images that can be found at the base URL, formatted as comma separated values. With the base URL `/vol/volumes/1` and the image `1.jpg`, the local file `/vol/volumes/1/1.jpg` will be used.
     *
     * @apiParam (Optional attributes) {String} video_link Link to a video that belongs to or was the source of this volume.
     * @apiParam (Optional attributes) {String} gis_link Link to a GIS that belongs to this volume.
     * @apiParam (Optional attributes) {String} doi The DOI of the dataset that is represented by the new volume.
     * @apiParam (Optional attributes) {Number} project_id Target project for the new volume. If this attribute is set and the user is an admin of the project, the new volume will be immediately attached to this project.
     *
     * @apiParamExample {String} Request example:
     * name: 'New volume'
     * url: '/vol/volumes/test-volume'
     * media_type_id: 1
     * visibility_id: 1
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
     *    "visibility_id": 1,
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
    public function store(Request $request, Guard $auth)
    {
        $this->validate($request, Volume::$createRules);

        $user = $auth->user();

        if ($request->has('project_id')) {
            $project = Project::findOrFail($request->input('project_id'));
            if (!$user->can('update', $project)) {
                return $this->buildFailedValidationResponse($request, [
                    'project_id' => ['You have no permission to attach a volume to this project.'],
                ]);
            }
        }

        $volume = new Volume;
        $volume->name = $request->input('name');
        $volume->url = $request->input('url');
        $volume->media_type_id = $request->input('media_type_id');
        $volume->visibility_id = $request->input('visibility_id');
        $volume->video_link = $request->input('video_link');
        $volume->gis_link = $request->input('gis_link');
        $volume->doi = $request->input('doi');
        $volume->creator()->associate($user);

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

        if (isset($project)) {
            $volume->projects()->attach($project);
            // $volume->authorizedProjects()->attach($project);
        }

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
     * Updates the attributes of the specified volume.
     *
     * @api {put} volumes/:id Update a volume
     * @apiGroup Volumes
     * @apiName UpdateVolumes
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the volume.
     * @apiParam (Attributes that can be updated) {Number} visibility_id ID of the visibility of the new label tree (public or private).
     * @apiParam (Attributes that can be updated) {Number} media_type_id The ID of the media type of the volume.
     * @apiParam (Attributes that can be updated) {String} url The base URL ot the image files. Can be a local path like `/vol/volumes/1` or a remote path like `https://example.com/volumes/1`. Updating the URL will trigger a re-generation of all volume image thumbnails.
     * @apiParam (Attributes that can be updated) {String} video_link Link to a video that belongs to or was the source of this volume.
     * @apiParam (Attributes that can be updated) {String} gis_link Link to a GIS that belongs to this volume.
     * @apiParam (Attributes that can be updated) {String} doi The DOI of the dataset that is represented by the new volume.
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);

        $this->validate($request, Volume::$updateRules);

        if ($request->has('url')) {
            $volume->url = $request->input('url');
            try {
                $volume->validateUrl();
            } catch (Exception $e) {
                return $this->buildFailedValidationResponse($request, [
                    'url' => $e->getMessage(),
                ]);
            }
        }

        $volume->name = $request->input('name', $volume->name);
        $volume->media_type_id = $request->input('media_type_id', $volume->media_type_id);
        $volume->visibility_id = $request->input('visibility_id', $volume->visibility_id);
        $volume->video_link = $request->input('video_link', $volume->video_link);
        $volume->gis_link = $request->input('gis_link', $volume->gis_link);
        $volume->doi = $request->input('doi', $volume->doi);

        $isDirty = $volume->isDirty();
        $newUrl = $volume->isDirty('url');
        $volume->save();

        // do this *after* saving
        if ($newUrl) {
            $volume->handleNewImages();
        }

        if (!static::isAutomatedRequest($request)) {
            if ($request->has('_redirect')) {
                return redirect($request->input('_redirect'))
                    ->with('saved', $isDirty);
            }

            return redirect()->back()
                ->with('saved', $isDirty);
        }
    }

    /**
     * Removes the specified volume.
     *
     * @api {delete} volumes/:id Delete a volume
     * @apiGroup Volume
     * @apiName DestroyVolumes
     * @apiPermission volumeAdmin
     * @apiDescription A volume cannot be deleted if any of its images have annotations or image labels.
     *
     * @apiParam {Number} id The volume ID.
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('destroy', $volume);

        if (!$volume->canBeDeleted()) {
            throw new AuthorizationException('A volume cannot be deleted if any of its images have annotations or image labels.');
        }

        $volume->delete();
    }
}
