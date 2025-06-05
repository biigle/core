<?php

namespace Biigle\Http\Controllers\Views\Annotations;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Image;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Role;
use Biigle\Shape;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnnotationToolController extends Controller
{
    /**
     * Shows the annotation tool.
     *
     * @param Request $request
     * @param int $id the image ID
     */
    public function show(Request $request, $id)
    {
        $image = Image::with('volume')->findOrFail($id);
        $this->authorize('access', $image);
        $user = $request->user();
        $volume = $image->volume;

        if ($user->can('sudo')) {
            // Global admins have no restrictions.
            $projectIds = DB::table('project_volume')
                ->where('volume_id', $image->volume_id)
                ->pluck('project_id');
        } else {
            // Array of all project IDs that the user and the image have in common
            // and where the user is editor, expert or admin.
            $projectIds = Project::inCommon($user, $image->volume_id, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->pluck('id');
        }

        $images = $volume->images()
            ->orderBy('filename', 'asc')
            ->pluck('filename', 'id');

        // All label trees that are used by all projects which are visible to the user.
        $trees = LabelTree::select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->whereIn('id', function ($query) use ($projectIds) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projectIds);
            })
            ->get();

        $shapes = Shape::pluck('name', 'id');

        $annotationSessions = $image->volume->annotationSessions()
            ->select('id', 'name', 'starts_at', 'ends_at')
            ->with('users')
            ->get();

        $tilesUriTemplate = Storage::disk(config('image.tiles.disk'))->url(':uuid/');

        // Get the number of annotations from all volumes
        // linked to projects the user has access to. This is needed for LabelBOT.
        $volumeIds = DB::table('project_volume')
            ->whereIn('project_id', $projectIds)
            ->pluck('volume_id');

        $annotationCount = ImageAnnotationLabelFeatureVector::select('annotation_id', 'volume_id')
            ->whereIn('volume_id', $volumeIds)
            ->distinct('annotation_id')
            ->count('annotation_id');

        return view('annotations.show', [
            'user' => $user,
            'image' => $image,
            'volume' => $image->volume,
            'images' => $images,
            'labelTrees' => $trees,
            'shapes' => $shapes,
            'annotationSessions' => $annotationSessions,
            'tilesUriTemplate' => $tilesUriTemplate,
            'annotationCount' => $annotationCount,
        ]);
    }
}
