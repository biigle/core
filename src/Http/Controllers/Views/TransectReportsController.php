<?php

namespace Biigle\Modules\Export\Http\Controllers\Views;

use Biigle\Transect;
use Biigle\Http\Controllers\Views\Controller;

class TransectReportsController extends Controller
{
    /**
     * Show the transects reports view.
     *
     * @param int $id Transect ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);
        $sessions = $transect->annotationSessions()->orderBy('starts_at', 'desc')->get();

        return view('export::transectReports', [
            'projects' => $transect->projects,
            'transect' => $transect,
            'annotationSessions' => $sessions,
        ]);
    }
}
