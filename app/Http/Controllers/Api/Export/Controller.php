<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\ExportFile;
use Biigle\Http\Controllers\Api\Controller as BaseController;
use Biigle\Http\Requests\StoreExport;
use Biigle\Jobs\GenerateExportJob;

abstract class Controller extends BaseController
{
    public function __construct()
    {
        $this->middleware('can:sudo');
    }

    /**
     * Request a new export file.
     *
     * @param StoreExport $request
     * @return ExportFile
     */
    public function store(StoreExport $request)
    {
        if (!$this->isAllowed()) {
            abort(404);
        }

        $export = new ExportFile;
        $export->user()->associate($request->user());
        $export->type = $this->getType();
        $export->description = $request->input('description');
        $export->entity_ids = $this->getIds($request);
        $export->ready_at = null;
        $export->save();

        GenerateExportJob::dispatch($export)
            ->onQueue(config('sync.generate_export_queue'));

        $export->unsetRelation('user');

        return $export;
    }

    protected function getIds(StoreExport $request): array
    {
        $query = $this->getQuery();

        if ($request->filled('except')) {
            $query = $query->whereNotIn('id', $request->input('except'));
        } elseif ($request->filled('only')) {
            $query = $query->whereIn('id', $request->input('only'));
        }

        return $query->pluck('id')->toArray();
    }

    abstract protected function getQuery();

    abstract protected function getType(): string;

    protected function isAllowed()
    {
        return in_array($this->getType(), config('sync.allowed_exports'));
    }
}
