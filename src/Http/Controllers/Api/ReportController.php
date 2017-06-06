<?php

namespace Biigle\Modules\Export\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Export\Jobs\GenerateReportJob;

abstract class ReportController extends Controller
{
    /**
     * The report classname.
     *
     * @var string
     */
    protected $report;

    /**
     * The model for which the report will be generated.
     *
     * @var mixed
     */
    protected $model;

    /**
     * Generate a report.
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id model id
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Guard $auth, $id)
    {
        $this->model = $this->getModel($id);
        $this->authorize('access', $this->model);
        $report = new $this->report($this->model, $this->getOptions($request));
        $job = new GenerateReportJob($report, $auth->user());
        $this->dispatch($job->onQueue('high'));
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
     * Get the model to generate the report for.
     *
     * @param int $id
     * @return mixed
     */
    abstract protected function getModel($id);
}
