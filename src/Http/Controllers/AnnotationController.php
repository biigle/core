<?php

namespace Dias\Modules\Annotations\Http\Controllers;

use Dias\Image;
use Dias\LabelTree;
use Dias\Http\Controllers\Views\Controller;

class AnnotationController extends Controller
{
    /**
     * Shows the annotation index page.
     * @param int $id the image ID
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id) {
        $image = Image::with('transect.projects')->findOrFail($id);
        $this->requireCanSee($image);

        if ($this->user->isAdmin) {
            // admins have no restrictions
            $projectIds = $image->projectIds();
        } else {
            // array of all project IDs that the user and the image have in common
            $projectIds = array_intersect(
                $this->user->projects()->pluck('id')->toArray(),
                $image->projectIds()
            );
        }

        $images = Image::where('transect_id', $image->transect_id)
            ->orderBy('filename', 'asc')
            ->pluck('filename', 'id');

        // all label trees that are used by all projects which are visible to the user
        $trees = LabelTree::with('labels')
            ->select('id', 'name')
            ->whereIn('id', function ($query) use ($projectIds) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projectIds);
            })
            ->get();

        return view('annotations::index')
            ->with('user', $this->user)
            ->with('image', $image)
            ->with('transect', $image->transect)
            ->with('editMode', $this->user->canEditInOneOfProjects($image->projectIds()))
            ->with('projectIds', implode(',', $projectIds))
            ->with('images', $images)
            ->with('labelTrees', $trees);
    }
}
