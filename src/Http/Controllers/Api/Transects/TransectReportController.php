<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects;

use Dias\Transect;
use Illuminate\Http\Request;
use Dias\Modules\Export\Http\Controllers\Api\ReportController;

abstract class TransectReportController extends ReportController
{
    /**
     * Get the options of the requested report
     *
     * @param Request $request
     * @return array
     */
    public function getOptions(Request $request)
    {
        $options = parent::getOptions($request);

        $this->validate($request, [
            'annotationSession' => "exists:annotation_sessions,id,transect_id,{$this->model->id}"
        ]);

        return array_merge($options, [
            'annotationSession' => $request->input('annotationSession'),
        ]);
    }

    /**
     * Get the model to generate the report for
     *
     * @param int $id
     * @return mixed
     */
    protected function getModel($id)
    {
        return Transect::findOrFail($id);
    }
}
