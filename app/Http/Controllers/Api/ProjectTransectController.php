<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use Biigle\Project;
use Biigle\Transect;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;

class ProjectTransectController extends Controller
{
    /**
     * Shows a list of all transects belonging to the specified project..
     *
     * @api {get} projects/:id/transects Get all transects
     * @apiGroup Projects
     * @apiName IndexProjectTransects
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "transect 1",
     *       "media_type_id": 3,
     *       "creator_id": 7,
     *       "created_at": "2015-02-19 14:45:58",
     *       "updated_at":"2015-02-19 14:45:58",
     *       "url": "/vol/transects/1"
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

        return $project->transects;
    }

    /**
     * Creates a new transect associated to the specified project.
     *
     * @api {post} projects/:id/transects Create a new transect
     * @apiGroup Transects
     * @apiName StoreProjectTransects
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required attributes) {String} name The name of the new transect.
     * @apiParam (Required attributes) {String} url The base URL ot the image files. Can be a local path like `/vol/transects/1` or a remote path like `https://example.com/transects/1`.
     * @apiParam (Required attributes) {Number} media_type_id The ID of the media type of the new transect.
     * @apiParam (Required attributes) {String} images List of image file names of the images that can be found at the base URL, formatted as comma separated values. With the base URL `/vol/transects/1` and the image `1.jpg`, the local file `/vol/transects/1/1.jpg` will be used.
     *
     * @apiParamExample {String} Request example:
     * name: 'New transect'
     * url: '/vol/transects/test-transect'
     * media_type_id: 1
     * images: '1.jpg,2.jpg,3.jpg'
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "name": "New transect",
     *    "media_type_id": 1,
     *    "creator_id": 2,
     *    "created_at": "2015-02-19 16:10:17",
     *    "updated_at": "2015-02-19 16:10:17",
     *    "url": "/vol/transects/test-transect"
     * }
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id Project ID
     * @return Transect
     */
    public function store(Request $request, Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);
        $this->validate($request, Transect::$createRules);

        $transect = new Transect;
        $transect->name = $request->input('name');
        $transect->url = $request->input('url');
        $transect->setMediaTypeId($request->input('media_type_id'));
        $transect->creator()->associate($auth->user());

        try {
            $transect->validateUrl();
        } catch (Exception $e) {
            return $this->buildFailedValidationResponse($request, [
                'url' => $e->getMessage(),
            ]);
        }

        $images = Transect::parseImagesQueryString($request->input('images'));

        try {
            $transect->validateImages($images);
        } catch (Exception $e) {
            return $this->buildFailedValidationResponse($request, [
                'images' => $e->getMessage(),
            ]);
        }

        // save first, so the transect gets an ID for associating with images
        $transect->save();

        try {
            $transect->createImages($images);
        } catch (\Exception $e) {
            $transect->delete();
            return response($e->getMessage(), 400);
        }

        // it's important that this is done *after* all images were added
        $transect->handleNewImages();

        $project->transects()->attach($transect);

        if (static::isAutomatedRequest($request)) {
            // media type shouldn't be returned
            unset($transect->media_type);

            return $transect;
        } else {
            return redirect()->route('home')
                ->with('message', 'Transect '.$transect->name.' created')
                ->with('messageType', 'success');
        }
    }

    /**
     * Attaches the existing specified transect to the existing specified
     * project.
     *
     * @api {post} projects/:pid/transects/:tid Attach a transect
     * @apiGroup Projects
     * @apiName AttachProjectTransects
     * @apiPermission projectAdmin
     * @apiDescription This endpoint attaches an existing transect to another existing project. The transect then will belong to multiple projects. The user performing this operation needs to be project admin in both the project, the transect initially belongs to, and the project, the transect should be attached to.
     *
     * @apiParam {Number} pid ID of the project that should get the annotation.
     * @apiParam {Number} tid ID of the existing transect to attach to the project.
     *
     * @param Request $request
     * @param int $projectId
     * @param int $transectId
     * @return \Illuminate\Http\Response
     */
    public function attach(Request $request, $projectId, $transectId)
    {
        // user must be able to admin the transect *and* the project it should
        // be attached to
        $transect = Transect::findOrFail($transectId);
        $this->authorize('update', $transect);
        $project = Project::findOrFail($projectId);
        $this->authorize('update', $project);

        if ($project->transects()->where('id', $transectId)->exists()) {
            return $this->buildFailedValidationResponse($request, [
                'tid' => 'The transect is already attached to the project.',
            ]);
        }

        $project->transects()->attach($transect);
    }

    /**
     * Removes the specified transect from the specified project.
     * If it is the last project the transect belongs to, the transect is
     * deleted (if the `force` argument is present in the request).
     *
     * @api {delete} projects/:pid/transects/:tid Detach/delete a transect
     * @apiGroup Projects
     * @apiName DestroyProjectTransects
     * @apiPermission projectAdmin
     * @apiDescription Detaches a transect from a project. The transect will no longer belong to the project it was detached from. If the transect belongs only to a single project, it cannot be detached but should be deleted. Use the `force` parameter to delete a transect belonging only to one project.
     *
     * @apiParam {Number} pid The project ID, the transect should be detached from.
     * @apiParam {Number} tid The transect ID.
     *
     * @apiParam (Optional parameters) {Boolean} force If the transect only belongs to a single project, set this parameter to delete it instead of detaching it. Otherwise the transect cannot be removed.
     *
     * @param Request $request
     * @param  int  $projectId
     * @param  int  $transectId
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $projectId, $transectId)
    {
        $project = Project::findOrFail($projectId);
        $transect = $project->transects()->findOrFail($transectId);
        $this->authorize('destroy', $transect);

        $project->removeTransect($transect, $request->has('force'));

        return response('Removed.', 200);
    }
}
