<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Volumes;

use Biigle\Volume;
use Illuminate\Http\Request;
use Biigle\Modules\Export\Http\Controllers\Api\ReportController;

abstract class VolumeReportController extends ReportController
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
            'annotationSession' => "nullable|exists:annotation_sessions,id,volume_id,{$this->model->id}"
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
        return Volume::findOrFail($id);
    }
}
