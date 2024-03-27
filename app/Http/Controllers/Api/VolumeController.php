<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\CloneVolume;
use Biigle\Http\Requests\UpdateVolume;
use Biigle\Jobs\CloneImagesOrVideos;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\Project;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Queue;

class VolumeController extends Controller
{
    /**
     * Shows all volumes the user has access to.
     *
     * @param Request $request
     * @return Response
     * @api {get} volumes Get accessible volumes
     * @apiGroup Volumes
     * @apiName IndexVolumes
     * @apiPermission user
     * @apiDescription Only projects in which the user is a member are listed for each
     * volume.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My Volume",
     *       "media_type_id": 1,
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
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return Volume::accessibleBy($user)
            ->with(['projects' => function ($query) use ($user) {
                $query->when(!$user->can('sudo'), function ($query) use ($user) {
                    return $query->join('project_user', 'project_user.project_id', '=', 'projects.id')
                        ->where('project_user.user_id', $user->id);
                })
                    ->select('projects.id', 'projects.name', 'projects.description');
            }])
            ->orderByDesc('id')
            ->select('id', 'name', 'created_at', 'updated_at', 'media_type_id')
            ->get();
    }

    /**
     * Displays the specified volume.
     *
     * @param Request $request
     * @param int $id
     * @return Volume
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
     *    "url": "local://images/",
     *    "projects": [
     *        {
     *            "id": 11,
     *            "name": "Example project",
     *            "description": "This is an example project"
     *        }
     *    ]
     * }
     *
     */
    public function show(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $volume->load(['projects' => function ($query) use ($request) {
            $query->join('project_user', 'project_user.project_id', '=', 'projects.id')
                ->where('project_user.user_id', $request->user()->id)
                ->select('projects.id', 'projects.name', 'projects.description');
        }]);

        return $volume;
    }

    /**
     * Updates the attributes of the specified volume.
     *
     * @param UpdateVolume $request
     * @return Response
     * @api {put} volumes/:id Update a volume
     * @apiGroup Volumes
     * @apiName UpdateVolumes
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the volume.
     * @apiParam (Attributes that can be updated) {String} url The base URL of the files. Can be a path to a storage disk like `local://volumes/1` or a remote path like `https://example.com/volumes/1`. Updating the URL will trigger a re-generation of all volume thumbnails.
     * @apiParam (Attributes that can be updated) {String} handle Handle or DOI of the dataset that is represented by the new volume.
     *
     */
    public function update(UpdateVolume $request)
    {
        $volume = $request->volume;
        $volume->name = $request->input('name', $volume->name);
        $volume->url = $request->input('url', $volume->url);
        $volume->handle = $request->input('handle', $volume->handle);

        $isDirty = $volume->isDirty();
        $shouldReread = !$isDirty && $request->user()->can('sudo');
        $newUrl = $volume->isDirty('url');
        $volume->save();

        // Do this *after* saving.
        if ($newUrl || $shouldReread) {
            ProcessNewVolumeFiles::dispatch($volume);
        }

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('saved', $isDirty)
                ->with('reread', $shouldReread);
        }
    }

    /**
     * Clones volume to destination project.
     *
     * @param CloneVolume $request
     * @return Response
     * @api {post} volumes/:id/clone-to/:project_id Clones a volume
     * @apiGroup Volumes
     * @apiName CloneVolume
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The volume id.
     * @apiParam {Number} project_id The target project id.
     *
     * @apiParam (Optional attributes) {string} name Name of cloned volume. Default is the original name.
     * @apiParam (Optional attributes) {Array} only_files ids of files which should be cloned. If empty all files are cloned.
     * @apiParam (Optional attributes) {bool} clone_annotations Set to `true` to also clone annotations. Default is `false`.
     * @apiParam (Optional attributes) {Array} only_annotation_labels Label IDs to filter cloned annotations. If empty, all annotations are cloned. Only has an effect if `clone_annotations` is `true`.
     * @apiParam (Optional attributes) {bool} clone_file_labels Set to `true` to also clone image/video labels. Default is `false`.
     * @apiParam (Optional attributes) {Array} only_file_labels Label IDs to filter cloned file labels. If empty, all file labels are cloned. Only has an effect if `clone_file_labels` is `true`.
     *
     * @apiSuccessExample {json} Success response:
     * {
     * "name": "Kulas Group",
     * "media_type_id": 3,
     * "creator_id": 5,
     * "url": "test://files",
     * "handle": null,
     * "created_at": "2022-11-25T13:10:12.000000Z",
     * "updated_at": "2022-11-25T13:10:12.000000Z",
     * "id": 4
     * }
     **/
    public function clone(CloneVolume $request)
    {
        $copy = DB::transaction(function () use ($request) {

            $volume = $request->volume;
            $project = $request->project;

            $copy = $volume->replicate();
            $copy->name = $request->input('name', $volume->name);
            $copy->creating_async = true;
            $copy->save();
            if ($volume->hasMetadata()) {
                $copy->update(['metadata_file_path' => $copy->id.'.'.pathinfo($volume->metadata_file_path, PATHINFO_EXTENSION)]);
            }
            $project->addVolumeId($copy->id);

            $job = new CloneImagesOrVideos($request, $copy);
            Queue::pushOn('high', $job);

            return $copy;
        });

        if ($this->isAutomatedRequest()) {
            return $copy;
        }

        return redirect()->route('volume', $copy->id)
            ->with('message', "Volume cloned")
            ->with('messageType', 'success');

    }
}
