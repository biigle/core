<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\ImageLabel;

class ImageLabelController extends Controller
{
    /**
     * Deletes the specified image label.
     *
     * @api {delete} image-labels/:id Detach a label
     * @apiGroup Images
     * @apiName DeleteImageLabels
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The image **label** ID (not the image ID).
     *
     * @param int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $imageLabel = ImageLabel::findOrFail($id);
        $this->authorize('destroy', $imageLabel);

        $imageLabel->delete();
    }
}
