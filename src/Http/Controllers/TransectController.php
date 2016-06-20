<?php

namespace Dias\Modules\Transects\Http\Controllers;

use Dias\Transect;
use Dias\Project;
use Dias\LabelTree;
use Dias\MediaType;
use Dias\Http\Controllers\Views\Controller;

class TransectController extends Controller
{
    /**
     * Shows the create transect page.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $project = Project::findOrFail($this->request->input('project'));
        $this->authorize('update', $project);

        return view('transects::create')
            ->with('project', $project)
            ->with('mediaTypes', MediaType::all());
    }

    /**
     * Shows the transect index page.
     *
     * @param int $id transect ID
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);

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

        $imageIds = $transect->images()
            ->orderBy('filename', 'asc')
            ->pluck('id');

        return view('transects::index')
            ->with('user', $this->user)
            ->with('transect', $transect)
            ->with('labelTrees', $labelTrees)
            ->with('projects', $projects)
            ->with('imageIds', $imageIds);
    }

    /**
     * Shows the transect edit page.
     *
     * @param int $id transect ID
     *
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        $transect = Transect::with('projects')->findOrFail($id);
        $this->authorize('update', $transect);

        return view('transects::edit')
            ->withTransect($transect)
            ->with('images', $transect->images()->pluck('filename', 'id'))
            ->with('mediaTypes', MediaType::all());
    }
}
