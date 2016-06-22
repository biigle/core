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

        $annotationMap = DB::table('annotation_labels')
            ->join('annotations', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->whereIn('annotations.image_id', function ($query) use ($transect) {
                $query->select('id')
                    ->from('images')
                    ->where('transect_id', $transect->id);
            })
            ->select('annotation_labels.label_id', 'annotations.id')
            ->get();

        // map a label ID to the IDs of all annotations of this transects who have the
        // label atached to them
        $labelMap = [];

        foreach ($annotationMap as $key => $value) {
            $labelMap[$value->label_id][] = $value->id;
            // clear the one array while filling the other to save memory
            // (there can be a massive amount of annotations per transect)
            unset($annotationMap[$key]);
        }

        unset($annotationMap);


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
            'labelMap' => $labelMap,
        ]);
    }
}
