<?php

namespace Biigle\Modules\Largo\Http\Controllers\Views\LabelTrees;

use Storage;
use Biigle\LabelTree;
use Biigle\Http\Controllers\Views\Controller;

class AnnotationCatalogController extends Controller
{
    /**
     * Show the annotation catalog of a label tree.
     *
     * @param int $id Label tree ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $tree = LabelTree::with('labels')->findOrFail($id);
        $this->authorize('access', $tree);

        $patchUrlTemplate = Storage::disk(config('largo.patch_storage_disk'))
            ->url(':prefix/:id.'.config('largo.patch_format'));

        return view('largo::annotationCatalog.show', compact('tree', 'patchUrlTemplate'));
    }
}
