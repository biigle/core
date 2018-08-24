<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api;

use Illuminate\Http\Request;
use Biigle\Modules\Reports\Report;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;

abstract class ReportController extends Controller
{
    /**
     * The source for which the report will be generated.
     *
     * @var mixed
     */
    protected $source;

    /**
     * Generate a report.
     *
     * @param Request $request
     * @param int $id Source ID
     *
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $id)
    {
        $this->source = $this->getSource($id);
        $this->authorize('access', $this->source);
        $this->validate($request, ['type_id' => 'required|exists:report_types,id']);

        $report = new Report;
        $report->source()->associate($this->source);
        $report->type_id = $request->input('type_id');
        $report->user()->associate($request->user());
        $report->options = $this->getOptions($request);
        $report->save();

        $this->dispatch((new GenerateReportJob($report))->onQueue('high'));
    }

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
        ]);

        return [
            'separateLabelTrees' => (bool) $request->input('separate_label_trees', false),
            'exportArea' => (bool) $request->input('export_area', false),
            'newestLabel' => (bool) $request->input('newest_label', false),
        ];
    }

    /**
     * Get the source to generate the report for.
     *
     * @param int $id
     * @return mixed
     */
    abstract protected function getSource($id);
}
