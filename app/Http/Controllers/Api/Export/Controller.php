<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\Http\Controllers\Api\Controller as BaseController;
use Biigle\Http\Requests\ShowExport;

abstract class Controller extends BaseController
{
    /**
     * Creates a new instance.
     */
    public function __construct()
    {
        $this->middleware('can:sudo');
    }

    /**
     * Handle a generic export request.
     *
     * @param ShowExport $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function show(ShowExport $request)
    {
        if (!$this->isAllowed()) {
            abort(404);
        }

        $query = $this->getQuery();

        if ($request->filled('except')) {
            $query = $query->whereNotIn('id', $request->input('except'));
        } elseif ($request->filled('only')) {
            $query = $query->whereIn('id', $request->input('only'));
        }

        $export = $this->getExport($query->pluck('id')->toArray());

        return response()
            ->download($export->getArchive(), $this->getExportFilename(), [
                'Content-Type' => 'application/zip',
            ])
            ->deleteFileAfterSend(true);
    }

    /**
     * Get the query for the model to export.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    abstract protected function getQuery();

    /**
     * Get the new export instance.
     *
     * @param array $ids
     * @return \Biigle\Services\Export\Export
     */
    abstract protected function getExport(array $ids);

    /**
     * Get the filename of the export archive.
     *
     * @return string
     */
    abstract protected function getExportFilename();

    /**
     * Determine if this kind of export is allowed by the config.
     *
     * @return bool
     */
    protected function isAllowed()
    {
        return false;
    }
}
