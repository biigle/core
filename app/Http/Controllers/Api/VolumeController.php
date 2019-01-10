<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use Biigle\Volume;
use Illuminate\Http\Request;
use Biigle\Http\Requests\UpdateVolume;
use Illuminate\Validation\ValidationException;

class VolumeController extends Controller
{
    /**
     * Shows all volumes the user has access to.
     *
     * @api {get} volumes Get accessible volumes
     * @apiGroup Volumes
     * @apiName IndexVolumes
     * @apiPermission user
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My Volume",
     *       "created_at": "2015-02-10 09:45:30",
     *       "updated_at": "2015-02-10 09:45:30",
     *       "projects": [
     *           {
     *               "id": 11,
     *               "name": "Example project",
     *               "description": "This is an example project"
     *           }
     *       ]
     *    }
     * ]
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        return Volume::accessibleBy($request->user())
            ->with(['projects' => function ($query) {
                $query->select('id', 'name', 'description');
            }])
            ->orderByDesc('id')
            ->select('id', 'name', 'created_at', 'updated_at')
            ->get();
    }

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
     *    "url": "local://images/"
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
     * @apiParam (Attributes that can be updated) {Number} media_type_id The ID of the media type of the volume.
     * @apiParam (Attributes that can be updated) {String} url The base URL of the image files. Can be a path to a storage disk like `local://volumes/1` or a remote path like `https://example.com/volumes/1`. Updating the URL will trigger a re-generation of all volume image thumbnails.
     * @apiParam (Attributes that can be updated) {String} video_link Link to a video that belongs to or was the source of this volume.
     * @apiParam (Attributes that can be updated) {String} gis_link Link to a GIS that belongs to this volume.
     * @apiParam (Attributes that can be updated) {String} doi The DOI of the dataset that is represented by the new volume.
     *
     * @param UpdateVolume $request
     * @return \Illuminate\Http\Response
     */
    public function update(UpdateVolume $request)
    {
        $volume = $request->volume;
        $volume->name = $request->input('name', $volume->name);
        $volume->url = $request->input('url', $volume->url);
        $volume->media_type_id = $request->input('media_type_id', $volume->media_type_id);
        $volume->video_link = $request->input('video_link', $volume->video_link);
        $volume->gis_link = $request->input('gis_link', $volume->gis_link);
        $volume->doi = $request->input('doi', $volume->doi);

        $isDirty = $volume->isDirty();
        $newUrl = $volume->isDirty('url');
        $volume->save();

        // Do this *after* saving.
        if ($newUrl) {
            $volume->handleNewImages();
        }

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('saved', $isDirty);
        }
    }
}
