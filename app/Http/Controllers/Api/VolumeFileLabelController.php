<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreVolumeFileLabel;
use Biigle\Image;
use Biigle\ImageLabel;
use Biigle\Label;

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
     * @return \Illuminate\Http\Response
     */
    public function baseStore(StoreVolumeFileLabel $request)
    {
        $model = $this->getFileLabelModel();
        $fileLabel = new $model;
        $fileLabel->user()->associate($request->user());
        $fileLabel->label()->associate($request->label);
        $fileLabel->file()->associate($request->file);

        $exists = $request->file->labels()
            ->where('label_id', $fileLabel->label_id)
            ->exists();

        if ($exists) {
            abort(400, 'This label is already attached.');
        } else {
            $fileLabel->save();
        }

        // should not be returned
        unset($fileLabel->file);

        return $fileLabel;
    }

    /**
     * Deletes the specified file label.
     *
     * @param int  $id
     * @return \Illuminate\Http\Response
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
