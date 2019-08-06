<?php

namespace Biigle\Modules\LabelTrees\Http\Controllers;

use DB;
use Biigle\Project;
use Biigle\LabelTree;
use Biigle\Visibility;
use Biigle\LabelTreeVersion;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Views\Controller;
use Biigle\Modules\Videos\VideoAnnotationLabel;

class LabelTreeMergeController extends Controller
{
    /**
     * Show the label tree merge page.
     *
     * @param int $id1 ID of the base label tree
     * @param int $id2 ID of the label tree to merge into the base
     *
     * @return mixed
     */
    public function show($id1, $id2)
    {
        $baseTree = LabelTree::findOrFail($id1);
        $this->authorize('createLabel', $baseTree);
        $mergeTree = LabelTree::findOrFail($id2);
        $this->authorize('access', $mergeTree);

        $usedLabels = $baseTree->labels()
            ->whereExists(function ($query) {
                return $query->select(DB::raw(1))
                    ->from('annotation_labels')
                    ->whereRaw('labels.id = annotation_labels.label_id');
            })
            ->orWhereExists(function ($query) {
                return $query->select(DB::raw(1))
                    ->from('image_labels')
                    ->whereRaw('labels.id = image_labels.label_id');
            })
            ->when(class_exists(VideoAnnotationLabel::class), function ($query) {
                return $query->orWhereExists(function ($query) {
                    return $query->select(DB::raw(1))
                        ->from('video_annotation_labels')
                        ->whereRaw('labels.id = video_annotation_labels.label_id');
                });
            })
            ->pluck('labels.id');

        return view('label-trees::merge.show', [
            'baseTree' => $baseTree->load('labels'),
            'mergeTree' => $mergeTree->load('labels'),
            'usedLabels' => $usedLabels,
        ]);
    }
}
