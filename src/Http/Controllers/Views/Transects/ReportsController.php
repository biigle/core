<?php

namespace Dias\Modules\Export\Http\Controllers\Views\Transects;

use Dias\Transect;
use Dias\Http\Controllers\Views\Controller;

class ReportsController extends Controller
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

        return view('export::transectReports', [
            'projects' => $transect->projects,
            'transect' => $transect,
            'annotationSessions' => $transect->annotationSessions,
        ]);
    }
}
