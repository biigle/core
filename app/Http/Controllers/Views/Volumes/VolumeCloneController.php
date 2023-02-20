<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Biigle\Volume;
use Illuminate\Http\Request;
use function Amp\Iterator\map;

class VolumeCloneController extends Controller
{

    function clone(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);

        $user = $request->user();
        $destinationProjects = $user->projects()->get()->map(function ($project) use ($user) {
            if ($user->can('sudo') || $user->can('update', $project)) {
                return $project->name;
            }
        });

        $filesWithAllLabels = $volume->files()->with(['Labels','Annotations.labels'])->get();


        return view('volumes.clone', [
            'name' => $volume->name,
            'destProjects' => $destinationProjects,
            'files' => $filesWithAllLabels
        ]);
    }

}
