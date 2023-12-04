<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Project;
use Biigle\ImageAnnotation;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Biigle\Http\Controllers\Api\Controller;

class FilterImageAnnotationsByLabelController extends Controller
{
    /**
     * Show all image annotations of the project that have a specific label attached.
     *
     * @api {get} projects/:pid/image-annotations/filter/label/:lid Get image annotations with a label
     * @apiGroup Projects
     * @apiName ShowProjectsImageAnnotationsFilterLabels
     * @apiParam {Number} pid The project ID
     * @apiParam {Number} lit The Label ID
     * @apiParam (Optional arguments) {Number} take Number of image annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited.
     * @apiPermission projectMember
     * @apiDescription Returns a map of image annotation IDs to their image UUIDs.
     *
     * @param Request $request
     * @param  int  $pid Project ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $pid, $lid)
    {
        $project = Project::findOrFail($pid);
        $this->authorize('access', $project);
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');

        $res = ImageAnnotation::join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->whereIn('images.volume_id', function ($query) use ($pid) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $pid);
            })
            ->where('image_annotation_labels.label_id', $lid)
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->take($take);
            })
            ->select('images.uuid', 'image_annotations.id')
            ->distinct()
            ->orderBy('image_annotations.id', 'desc')
            ->pluck('images.uuid', 'image_annotations.id');



        //TODO: replace string svg by constant
        $uuids = $res->values()->unique()->all();
        $annotationIds = $res->keys();

        foreach($uuids as $uuid){
            $dir = fragment_uuid_path($uuid);
            $allFiles = Storage::disk(config('largo.patch_storage_disk'))->files($dir);
            $files = Arr::where($allFiles, fn($path, $id) => Str::endsWith($path, 'svg'));
    
            $files = collect(Arr::flatten($files));
            foreach ($files as $file) {
                $id = (Str::of($file))->match('/([0-9]*).svg/')->toInteger();
                if($annotationIds->contains($id)){
                    $xml = Storage::disk(config('largo.patch_storage_disk'))->get($file);
                    $res[$id] = [$uuid,$xml];
                }
            };
        }

        return $res;

    }
}