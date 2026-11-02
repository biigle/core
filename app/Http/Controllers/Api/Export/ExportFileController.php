<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\ExportFile;
use Biigle\Http\Controllers\Api\Controller;
use Illuminate\Http\Response;
use Storage;

class ExportFileController extends Controller
{
    public function __construct()
    {
        $this->middleware('can:sudo');
    }

    /**
     * Download an export file.
     *
     * @api {get} export-files/:id Get an export file
     * @apiGroup Sync
     * @apiName ShowExportFile
     * @apiPermission admin
     * @apiDescription Only the user who requested the export can download it. Responds with the ZIP archive that can be used for the import.
     *
     * @apiParam {Number} id The export file ID.
     *
     * @param int $id
     * @return mixed
     */
    public function show($id)
    {
        $export = ExportFile::findOrFail($id);
        $this->authorize('access', $export);

        $disk = Storage::disk(config('sync.export_storage_disk'));
        $path = $export->getStorageFilename();

        if (!$export->ready_at || !$disk->exists($path)) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return $disk->download($path, $export->getDownloadFilename(), [
            'Content-Type' => 'application/zip',
        ])
            // Use a custom fallback with fread() because the default fpassthru() could
            // lead to an out of memory error with large exports.
            ->setCallback(function () use ($disk, $path) {
                $stream = $disk->readStream($path);
                while (!feof($stream)) {
                    echo fread($stream, 8192);
                }
                fclose($stream);
            });
    }

    /**
     * Delete an export file.
     *
     * @api {delete} export-files/:id Delete an export file
     * @apiGroup Sync
     * @apiName DestroyExportFile
     * @apiPermission admin
     * @apiDescription Only the user who requested the export can delete it.
     *
     * @apiParam {Number} id The export file ID.
     *
     * @param int $id
     * @return mixed
     */
    public function destroy($id)
    {
        $export = ExportFile::findOrFail($id);
        $this->authorize('destroy', $export);
        $export->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('message', 'Export deleted.')
                ->with('messageType', 'success');
        }
    }
}
