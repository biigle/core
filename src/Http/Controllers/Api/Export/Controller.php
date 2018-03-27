<?php

namespace Biigle\Modules\Sync\Http\Controllers\Api\Export;

use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller as BaseController;

class Controller extends BaseController
{
    /**
     * Handle a generic export request.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request)
    {
        $this->validate($request, ['except' => 'filled', 'only' => 'filled']);
        $query = $this->getQuery();

        if ($request->has('except')) {
            $query = $query->whereNotIn('id', explode(',', $request->input('except')));
        } elseif ($request->has('only')) {
            $query = $query->whereIn('id', explode(',', $request->input('only')));
        }

        $export = $this->getExport($query->pluck('id')->toArray());

        return response()
            ->download($export->getArchive(), $this->getExportFilename())
            ->deleteFileAfterSend(true);
    }

    /**
     * Get the query for the model to export.
     *
     * @return Illuminate\Database\Eloquent\Model
     */
    protected function getQuery()
    {
        return null;
    }

    /**
     * Get the new export instance
     *
     * @param array $ids
     * @return Biigle\Modules\Sync\Support\Export
     */
    protected function getExport(array $ids)
    {
        return null;
    }

    /**
     * Get the filename of the export archive
     *
     * @return string
     */
    protected function getExportFilename()
    {
        return 'export.zip';
    }
}
