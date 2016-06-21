<?php

namespace Dias\Modules\Ate\Http\Controllers\Api;

use Dias\Http\Controllers\Api\Controller;
use Dias\Modules\Ate\Jobs\Preprocess;
use Dias\Transect;
use Dias\Annotation;
use Symfony\Component\HttpFoundation\File\Exception\FileNotFoundException;

class AteController extends Controller
{
    /**
     * Preprocess a transect for use with ate
     *
     * @api {post} transect/:id/ate/preprocess Preprocess transect for use with ate
     * @apiGroup Transects
     * @apiName PreprocessForAte
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     *
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function preprocess($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);
        $this->dispatch(new Preprocess($transect));
    }

    /**
     * Show the patch image of an annotation
     *
     * @api {get} annotations/:id/patch Get an annotation patch
     * @apiGroup Annotations
     * @apiName ShowAnnotationPatch
     * @apiParam {Number} id The annotation ID.
     * @apiPermission projectMember
     * @apiDescription Responds with an image file
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function showPatch($id)
    {
        $annotation = Annotation::with('image')->findOrFail($id);
        $this->authorize('access', $annotation);

        $file = config('ate.patch_storage').'/'.
            $annotation->image->transect_id.'/'.
            $annotation->id.'.png';

        try {
            return response()->download($file);
        } catch (FileNotFoundException $e) {
            abort(404, $e->getMessage());
        }
    }

}
