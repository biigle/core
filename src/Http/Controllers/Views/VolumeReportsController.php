<?php

namespace Biigle\Modules\Export\Http\Controllers\Views;

use Biigle\Volume;
use Biigle\Http\Controllers\Views\Controller;

class VolumeReportsController extends Controller
{
    /**
     * Show the volumes reports view.
     *
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $sessions = $volume->annotationSessions()->orderBy('starts_at', 'desc')->get();

        return view('export::volumeReports', [
            'projects' => $volume->projects,
            'volume' => $volume,
            'annotationSessions' => $sessions,
        ]);
    }
}
