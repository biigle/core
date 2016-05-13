<?php

namespace Dias\Modules\Transects\Http\Controllers;

use Dias\Transect;
use Dias\Project;
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
        $this->requireCanAdmin($project);

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
        $transect = Transect::with('projects')->findOrFail($id);
        $this->requireCanSee($transect);

        return view('transects::index')
            ->with('imageIds', $transect->images()->orderBy('id')->pluck('id'))
            ->withTransect($transect)
            ->with('isAdmin', $this->user->canAdminOneOfProjects($transect->projectIds()));
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
        $this->requireCanAdmin($transect);

        return view('transects::edit')
            ->withTransect($transect)
            ->with('images', $transect->images()->pluck('filename', 'id'))
            ->with('mediaTypes', MediaType::all());
    }
}
