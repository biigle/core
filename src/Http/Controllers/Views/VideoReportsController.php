<?php

namespace Biigle\Modules\Reports\Http\Controllers\Views;

use Biigle\Modules\Videos\Video;
use Biigle\Modules\Reports\ReportType;
use Biigle\Http\Controllers\Views\Controller;

class VideoReportsController extends Controller
{
    /**
     * Show the video reports view.
     *
     * @param int $id Video ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $video = Video::findOrFail($id);
        $this->authorize('access', $video);
        $types = ReportType::where('name', 'like', 'VideoAnnotations%')->get();

        return view('reports::videoReports', [
            'video' => $video,
            'reportTypes' => $types,
        ]);
    }
}
