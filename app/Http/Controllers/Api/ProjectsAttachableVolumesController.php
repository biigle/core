<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Project;
use Biigle\Role;
use Biigle\Volume;
use Illuminate\Http\Request;

class ProjectsAttachableVolumesController extends Controller
{
    /**
     * Shows volumes that match the given volume name and can be attached to the project by the requesting user.
     *
     * @api {get} projects/:id/attachable-volumes Get attachable volumes
     * @apiGroup Projects
     * @apiName IndexAttachableVolumes
     * @apiPermission projectAdmin
     * @apiParam {Number} id ID of the project for which the volumes should be fetched.
     * @apiDescription A list of all matching volumes where the requesting user has admin rights for (excluding those already belonging to the specified project).
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My other volume",
     *       "thumbnail": {
     *           "id": 12,
     *           "filename": "image.jpg",
     *           "uuid": "7ae57f55-6fd6-4857-a3ff-a3c9a099349b"
     *       }
     *    }
     * ]
     *
     * @param Request $request
     * @param int $id Project ID
     * @param string $name Volume name
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index(Request $request, $id, $name)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);

        $volumes = Volume::select('id', 'name', 'updated_at', 'media_type_id')
            ->with('mediaType')
            // All volumes of other projects where the user has admin rights on.
            ->whereIn('id', function ($query) use ($request, $id) {
                return $query->select('volume_id')
                    ->from('project_volume')
                    ->whereIn('project_id', function ($query) use ($request, $id) {
                        return $query->select('project_id')
                            ->from('project_user')
                            ->where('user_id', $request->user()->id)
                            ->where('project_role_id', Role::adminId())
                            ->where('project_id', '!=', $id);
                    });
            })
            ->whereRaw("UPPER(name) LIKE UPPER(?)", ["%{$name}%"])
            // Do not return volumes that are already attached to this project.
            // This is needed although we are already excluding the project in the
            // previous statement because other projects may already share volumes with
            // this one.
            ->whereNotIn('id', function ($query) use ($id) {
                return $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $id);
            })
            ->distinct()
            ->get();

        $hidden = ['doi'];
        $volumes->each(function ($item) use ($hidden) {
            $item->append('thumbnailUrl')
                ->append('thumbnailsUrl')
                ->makeHidden($hidden);
        });

        return $volumes;
    }
}
