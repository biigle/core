<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreVolumeFileLabel;
use Biigle\Label;
use DB;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;

abstract class VolumeFileLabelController extends Controller
{
    /**
     * Shows all labels of the specified file.
     *
     * @param int $id File ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $model = $this->getFileModel();
        $file = $model::findOrFail($id);
        $this->authorize('access', $file);

        return $file->labels()
            ->select('id', 'label_id', 'user_id')
            ->get();
    }

    /**
     * Creates a new label for the specified file.
     *
     * @param StoreVolumeFileLabel $request
     * @return \Biigle\VolumeFileLabel
     */
    public function baseStore(StoreVolumeFileLabel $request)
    {
        $model = $this->getFileLabelModel();
        /** @var \Biigle\VolumeFileLabel */
        $fileLabel = new $model;
        $fileLabel->user()->associate($request->user());
        $fileLabel->label()->associate($request->label);
        $fileLabel->file()->associate($request->file);

        $exists = $request->file->labels()
            ->where('label_id', $fileLabel->label_id)
            ->exists();

        if ($exists) {
            abort(400, 'This label is already attached.');
        }

        try {
            // The transaction becomes a savepoint if there is an outer transaction, so
            // a failed insert does not abort the outer transaction.
            DB::transaction(fn () => $fileLabel->save());
        } catch (UniqueConstraintViolationException) {
            // The label was attached by a concurrent request after the check above.
            abort(400, 'This label is already attached.');
        } catch (QueryException $e) {
            // SQLSTATE 23503 is a foreign key violation. The file or label was deleted
            // by a concurrent request.
            if ($e->getCode() === '23503') {
                abort(404);
            }

            throw $e;
        }

        // should not be returned
        unset($fileLabel->file);

        return $fileLabel;
    }

    /**
     * Deletes the specified file label.
     *
     * @param int  $id
     */
    public function destroy($id)
    {
        $model = $this->getFileLabelModel();
        $fileLabel = $model::findOrFail($id);
        $this->authorize('destroy', $fileLabel);
        $fileLabel->delete();
    }

    /**
     * Get the file model class name.
     *
     * @return string
     */
    abstract protected function getFileModel();

    /**
     * Get the file label model class name.
     *
     * @return string
     */
    abstract protected function getFileLabelModel();
}
