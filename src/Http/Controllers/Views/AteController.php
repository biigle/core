<?php

namespace Dias\Modules\Ate\Http\Controllers\Views;

use DB;
use Dias\Http\Controllers\Views\Controller;
use Dias\Transect;
use Dias\Annotation;
use Dias\LabelTree;

class AteController extends Controller
{
    /**
     * Show the application dashboard to the user.
     *
     * @param int $id Transect ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('edit-in', $transect);

        if ($this->user->isAdmin) {
            // admins have no restrictions
            $projects = $transect->projects;
        } else {
            // all projects that the user and the transect have in common
            $projects = $this->user->projects()
                ->whereIn('id', function ($query) use ($transect) {
                    $query->select('project_id')
                        ->from('project_transect')
                        ->where('transect_id', $transect->id);
                })
                ->get();
        }

        // all label trees that are used by all projects which are visible to the user
        $labelTrees = LabelTree::with('labels')
            ->select('id', 'name')
            ->whereIn('id', function ($query) use ($projects) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projects->pluck('id'));
            })
            ->get();

        return view('ate::index', [
            'user' => $this->user,
            'transect' => $transect,
            'projects' => $projects,
            'labelTrees' => $labelTrees,
        ]);
    }
}
