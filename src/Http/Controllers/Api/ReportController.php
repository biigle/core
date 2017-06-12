<?php

namespace Biigle\Modules\Export\Http\Controllers\Api;

use Illuminate\Http\Request;
use Biigle\Modules\Export\Report;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Modules\Export\ReportType;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Export\Jobs\GenerateReportJob;

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
     * @param Guard $auth
     * @param int $sourceId Source ID
     * @param int $typeID ReportType ID
     *
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Guard $auth, $sourceId, $reportTypeId)
    {
        $this->source = $this->getSource($sourceId);
        $this->authorize('access', $this->source);

        $report = new Report;
        $report->user()->associate($auth->user());
        $report->type()->associate(ReportType::findOrFail($reportTypeId));
        $report->source()->associate($this->source);
        $report->options = $this->getOptions($request);
        $report->save();

        $this->dispatch(new GenerateReportJob($report));
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
            'separateLabelTrees' => 'nullable|boolean',
            'exportArea' => 'nullable|boolean',
        ]);

        return [
            'separateLabelTrees' => (bool) $request->input('separateLabelTrees', false),
            'exportArea' => (bool) $request->input('exportArea', false),
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
