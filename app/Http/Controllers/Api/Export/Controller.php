<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\ExportFile;
use Biigle\Http\Controllers\Api\Controller as BaseController;
use Biigle\Http\Requests\StoreExport;
use Biigle\Jobs\GenerateExportJob;
use Illuminate\Http\Response;
use Storage;

abstract class Controller extends BaseController
{
    public function __construct()
    {
        $this->middleware('can:sudo');
    }

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

    public function download($id)
    {
        $export = $this->findExport($id);
        $this->authorize('access', $export);

        if (!$export->ready_at) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $disk = Storage::disk(config('sync.export_storage_disk'));
        $path = $export->getStorageFilename();

        if (!$disk->exists($path)) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return $disk->download($path, $this->getExportFilename(), [
            'Content-Type' => 'application/zip',
        ])
            // Use fread() because the default fpassthru() can exhaust memory for large exports.
            ->setCallback(function () use ($disk, $path) {
                $stream = $disk->readStream($path);
                while (!feof($stream)) {
                    echo fread($stream, 8192);
                }
                fclose($stream);
            });
    }

    public function destroy($id)
    {
        $export = $this->findExport($id);
        $this->authorize('destroy', $export);
        $export->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('message', 'Export deleted.')
                ->with('messageType', 'success');
        }
    }

    protected function findExport($id): ExportFile
    {
        return ExportFile::where('type', $this->getType())->findOrFail($id);
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

    abstract protected function getExportFilename();

    protected function isAllowed()
    {
        return in_array($this->getType(), config('sync.allowed_exports'));
    }
}
