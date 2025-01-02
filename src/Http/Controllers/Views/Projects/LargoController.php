<?php

namespace Biigle\Modules\Largo\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\ImageAnnotationLabel;
use Biigle\Project;
use Biigle\Shape;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Storage;

class LargoController extends Controller
{
    /**
     * Show the Largo view for a project.
     *
     * @param Request $request
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        if (!$request->user()->can('sudo')) {
            $this->authorize('edit-in', $project);
        }

        if (!$project->volumes()->exists()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $labelTrees = $project->labelTrees()
            ->select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->get();

        $patchUrlTemplate = Storage::disk(config('largo.patch_storage_disk'))
            ->url(':prefix/:id.'.config('largo.patch_format'));

        $shapes = Shape::pluck('name', 'id');

        $usersWithAnnotations = ImageAnnotationLabel::query()
            ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->where('images.volume_id', $id)
            ->join('users', 'image_annotation_labels.user_id', '=', 'users.id')
            ->distinct('image_annotation_labels.user_id')
            ->select('image_annotation_labels.user_id', 'users.lastname', 'users.firstname')
            ->get();

        return view('largo::project', [
            'project' => $project,
            'labelTrees' => $labelTrees,
            'target' => $project,
            'patchUrlTemplate' => $patchUrlTemplate,
            'shapes' => $shapes,
            'usersWithAnnotations' => $usersWithAnnotations,
        ]);
    }
}
