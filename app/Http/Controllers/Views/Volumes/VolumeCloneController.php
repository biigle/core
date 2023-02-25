<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Biigle\Volume;
use Illuminate\Http\Request;

class VolumeCloneController extends Controller
{

    function clone(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);

        $user = $request->user();
        $destProjects = $user->projects()->where('project_role_id', \Biigle\Role::adminId())->get();

        return view('volumes.clone', [
            'volume' => $volume,
            'name' => $volume->name,
            'destinationProjects' => collect($destProjects)->values(),
            'files' => collect($volume->files()->get())->values(),
        ]);
    }

}
