<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api;

use Illuminate\Http\Request;
use Biigle\Modules\Reports\Report;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;

class ReportController extends Controller
{
    /**
     * Get the options of the requested report.
     *
     * @param Request $request
     * @return array
     */
    protected function getOptions(Request $request)
    {
        $this->validate($request, [
            'separate_label_trees' => 'nullable|boolean',
            'export_area' => 'nullable|boolean',
            'newest_label' => 'nullable|boolean',
            'only_labels' => 'nullable|array',
            'only_labels.*' => 'exists:labels,id',
            'aggregate_child_labels' => "nullable|boolean",
        ]);

        return [
            'separateLabelTrees' => (bool) $request->input('separate_label_trees', false),
            'exportArea' => (bool) $request->input('export_area', false),
            'newestLabel' => (bool) $request->input('newest_label', false),
            'onlyLabels' => $request->input('only_labels', []),
            'aggregateChildLabels' => (bool) $request->input('aggregate_child_labels', false),
        ];
    }
}
