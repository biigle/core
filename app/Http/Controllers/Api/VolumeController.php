<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\UpdateVolume;
use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\ImageLabel;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\Project;
use Biigle\Video;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Biigle\VideoLabel;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Ramsey\Uuid\Uuid;

class VolumeController extends Controller
{

    /**
     * Shows all volumes the user has access to.
     *
     * @param Request $request
     * @return Response
     * @api {get} volumes Get accessible volumes
     * @apiGroup Volumes
     * @apiName IndexVolumes
     * @apiPermission user
     * @apiDescription Only projects in which the user is a member are listed for each
     * volume.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My Volume",
     *       "media_type_id": 1,
     *       "created_at": "2015-02-10 09:45:30",
     *       "updated_at": "2015-02-10 09:45:30",
     *       "projects": [
     *           {
     *               "id": 11,
     *               "name": "Example project",
     *               "description": "This is an example project"
     *           }
     *       ]
     *    }
     * ]
     *
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return Volume::accessibleBy($user)
            ->with(['projects' => function ($query) use ($user) {
                $query->when(!$user->can('sudo'), function ($query) use ($user) {
                    return $query->join('project_user', 'project_user.project_id', '=', 'projects.id')
                        ->where('project_user.user_id', $user->id);
                })
                    ->select('projects.id', 'projects.name', 'projects.description');
            }])
            ->orderByDesc('id')
            ->select('id', 'name', 'created_at', 'updated_at', 'media_type_id')
            ->get();
    }

    /**
     * Displays the specified volume.
     *
     * @param Request $request
     * @param int $id
     * @return Volume
     * @api {get} volumes/:id Get a volume
     * @apiGroup Volumes
     * @apiName ShowVolumes
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "volume 1",
     *    "media_type_id": 3,
     *    "creator_id": 7,
     *    "created_at": "2015-02-20 17:51:03",
     *    "updated_at": "2015-02-20 17:51:03",
     *    "url": "local://images/",
     *    "projects": [
     *        {
     *            "id": 11,
     *            "name": "Example project",
     *            "description": "This is an example project"
     *        }
     *    ]
     * }
     *
     */
    public function show(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $volume->load(['projects' => function ($query) use ($request) {
            $query->join('project_user', 'project_user.project_id', '=', 'projects.id')
                ->where('project_user.user_id', $request->user()->id)
                ->select('projects.id', 'projects.name', 'projects.description');
        }]);

        return $volume;
    }

    /**
     * Updates the attributes of the specified volume.
     *
     * @param UpdateVolume $request
     * @return Response
     * @api {put} volumes/:id Update a volume
     * @apiGroup Volumes
     * @apiName UpdateVolumes
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the volume.
     * @apiParam (Attributes that can be updated) {String} url The base URL of the files. Can be a path to a storage disk like `local://volumes/1` or a remote path like `https://example.com/volumes/1`. Updating the URL will trigger a re-generation of all volume thumbnails.
     * @apiParam (Attributes that can be updated) {String} handle Handle or DOI of the dataset that is represented by the new volume.
     *
     */
    public function update(UpdateVolume $request)
    {
        $volume = $request->volume;
        $volume->name = $request->input('name', $volume->name);
        $volume->url = $request->input('url', $volume->url);
        $volume->handle = $request->input('handle', $volume->handle);

        $isDirty = $volume->isDirty();
        $shouldReread = !$isDirty && $request->user()->can('sudo');
        $newUrl = $volume->isDirty('url');
        $volume->save();

        // Do this *after* saving.
        if ($newUrl || $shouldReread) {
            ProcessNewVolumeFiles::dispatch($volume);
        }

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('saved', $isDirty)
                ->with('reread', $shouldReread);
        }
    }

    /**
     * Clones volume to destination project.
     *
     * @param int $volumeId
     * @param int $destProjectId
     * @param Request $request
     * @return Response
     * @api {post} volumes/:id/clone-to/:project_id Clones a volume
     * @apiGroup Volumes
     * @apiName CloneVolume
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The volume ID.
     * @apiParam {Number} project_id The target project ID.
     * @apiParam (image IDs that can be used for cloning) {Array} imageIds selected subset of image IDs from original volume. Only images from this subset will be cloned.
     * @apiParam (video IDs that can be used for cloning) {Array} videoIds selected subset of video IDs from original volume. Only videos from this subset will be cloned.
     *
     * @apiSuccessExample {json} Success response:
     * {
     * "name": "Kulas Group",
     * "media_type_id": 3,
     * "creator_id": 5,
     * "url": "test://files",
     * "handle": null,
     * "created_at": "2022-11-25T13:10:12.000000Z",
     * "updated_at": "2022-11-25T13:10:12.000000Z",
     * "id": 4
     * }
     **/
    public function clone($volumeId, $destProjectId, Request $request)
    {
        return DB::transaction(function () use ($volumeId, $destProjectId, $request) {
            $project = Project::findOrFail($destProjectId);
            $this->authorize('update', $project);
            $volume = Volume::findOrFail($volumeId);
            $this->authorize('update', $volume);
            $copy = $volume->replicate();
            $copy->name = $request->input('name', $volume->name);
            $copy->save();

            if ($volume->isImageVolume()) {
                $this->copyImages($volume, $copy, $request->input('file_ids', []));
                // check if annotation label ids exist
                if ($request->has('labelIds')) {
                    $this->copyImageAnnotation($volume, $copy, $request->input('file_ids', []));
                }
                if ($request->has("imageLabelIds")) {
                    $this->copyImageLabels($volume, $copy, $request->input('file_ids', []));
                }
            } else {
                $this->copyVideos($volume, $copy, $request->input('file_ids', []));
                // check if annotation label ids exist
                if ($request->has('labelIds')) {
                   $this->copyVideoAnnotation($volume, $copy, $request->input('file_ids', []));
                }
                if ($request->has('videoLabelIds')) {
                    $this->copyVideoLabels($volume, $copy, $request->input('file_ids', []));
                }
            }

            //save ifdo-file if exist
            if ($volume->hasIfdo()) {
                $this->copyIfdoFile($volumeId, $copy->id);
            }

            $project->addVolumeId($copy->id);

            if ($this->isAutomatedRequest()) {
                return $volume;
            }

            return $this->fuzzyRedirect('project', $destProjectId)
                ->with('message', 'The volume was cloned');
        });

    }

    /**
     * Copies (selected) images from given volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedImageIds
     **/
    private function copyImages($volume, $copy, $selectedImageIds)
    {
        // copy image references
        $images = $volume->images()->orderBy('id')
            ->when(!empty($selectedImageIds), function ($query) use ($selectedImageIds) {
                $query->whereIn('id', $selectedImageIds);
            })->get();

        $images->map(function ($image) use ($copy) {
            $original = $image->getRawOriginal();
            $original['volume_id'] = $copy->id;
            $original['uuid'] = (string)Uuid::uuid4();
            unset($original['id']);
            return $original;
        })->chunk(10000)->each(function ($chunk) {
            Image::insert($chunk->toArray());
        });

    }

    /**
     * Copies (selected) image annotation and annotation labels from volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedLabelIds
     **/
    private function copyImageAnnotation($volume, $copy, $selectedLabelIds)
    {
        $chunkSize = 100;
        $newImageIds = $copy->images()->orderBy('id')->pluck('id');
        $volume->images()
            ->orderBy('id')
            ->with('annotations.labels')
            // This is an optimized implementation to clone the annotations with only few database
            // queries. There are simpler ways to implement this, but they can be ridiculously inefficient.
            ->chunkById($chunkSize, function ($chunk, $page) use ($newImageIds, $chunkSize) {
                $insertData = [];
                $chunkNewImageIds = [];
                // Consider all previous image chunks when calculating the start of the index.
                $baseImageIndex = ($page - 1) * $chunkSize;
                foreach ($chunk as $index => $image) {
                    $newImageId = $newImageIds[$baseImageIndex + $index];
                    // Collect relevant image IDs for the annotation query below.
                    $chunkNewImageIds[] = $newImageId;
                    foreach ($image->annotations as $annotation) {
                        $original = $annotation->getRawOriginal();
                        $original['image_id'] = $newImageId;
                        unset($original['id']);
                        $insertData[] = $original;
                    }
                }

                ImageAnnotation::insert($insertData);
                // Get the IDs of all newly inserted annotations. Ordering is essential.
                $newAnnotationIds = ImageAnnotation::whereIn('image_id', $chunkNewImageIds)
                    ->orderBy('id')
                    ->pluck('id');
                $insertData = [];
                foreach ($chunk as $index => $image) {
                    foreach ($image->annotations as $annotation) {
                        $newAnnotationId = $newAnnotationIds->shift();
                        foreach ($annotation->labels as $annotationLabel) {
                            $original = $annotationLabel->getRawOriginal();
                            $original['annotation_id'] = $newAnnotationId;
                            unset($original['id']);
                            $insertData[] = $original;
                        }
                    }
                }
                ImageAnnotationLabel::insert($insertData);
            });
    }

    /**
     * Copies (selected) image labels from given volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedLabelIds
     **/
    private function copyImageLabels($volume, $copy, $selectedLabelIds)
    {
        $oldImages = $volume->images()
            ->when(!empty($selectedLabelIds), function ($query) use ($selectedLabelIds) {
                $query->whereIn('id', $selectedLabelIds);
            })
            ->orderBy('id')
            ->with('labels')
            ->get();
        $newImageIds = $copy->images()->orderBy('id')->pluck('id');

        foreach ($oldImages as $imageIdx => $oldImage) {
            $newImageId = $newImageIds[$imageIdx];
            $oldImage->labels->map(function ($oldLabel) use ($newImageId) {
                $origin = $oldLabel->getRawOriginal();
                $origin['image_id'] = $newImageId;
                unset($origin['id']);
                return $origin;
            })->chunk(10000)->each(function ($chunk) {
                ImageLabel::insert($chunk->toArray());
            });
        }
    }

    /**
     * Copies (selected) videos from given volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedVideoIds
     **/
    private function copyVideos($volume, $copy, $selectedVideoIds)
    {
        // copy video references
        $videos = $volume->videos()->orderBy('id')
            ->when(!empty($selectedVideoIds), function ($query) use ($selectedVideoIds) {
                $query->whereIn('id', $selectedVideoIds);
            })->get();

        $videos->map(function ($video) use ($copy) {
            $original = $video->getRawOriginal();
            $original['volume_id'] = $copy->id;
            $original['uuid'] = (string)Uuid::uuid4();
            unset($original['id']);
            return $original;
        })->chunk(10000)->each(function ($chunk) {
            Video::insert($chunk->toArray());
        });

    }

    /**
     * Copies (selected) video annotations and annotation labels from given volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedLabelIds
     **/
    private function copyVideoAnnotation($volume, $copy, $selectedLabelIds)
    {
        //TODO: use selected videoIds
        $chunkSize = 100;
        $newVideoIds = $copy->videos()->orderBy('id')->pluck('id');
        $volume->videos()
            ->orderBy('id')
            ->with('annotations.labels')
            // This is an optimized implementation to clone the annotations with only few database
            // queries. There are simpler ways to implement this, but they can be ridiculously inefficient.
            ->chunkById($chunkSize, function ($chunk, $page) use ($newVideoIds, $chunkSize) {
                $insertData = [];
                $chunkNewVideoIds = [];
                // Consider all previous video chunks when calculating the start of the index.
                $baseVideoIndex = ($page - 1) * $chunkSize;
                foreach ($chunk as $index => $video) {
                    $newVideoId = $newVideoIds[$baseVideoIndex + $index];
                    // Collect relevant video IDs for the annotation query below.
                    $chunkNewVideoIds[] = $newVideoId;
                    foreach ($video->annotations as $annotation) {
                        $original = $annotation->getRawOriginal();
                        $original['video_id'] = $newVideoId;
                        unset($original['id']);
                        $insertData[] = $original;
                    }
                }

                VideoAnnotation::insert($insertData);
                // Get the IDs of all newly inserted annotations. Ordering is essential.
                $newAnnotationIds = VideoAnnotation::whereIn('video_id', $chunkNewVideoIds)
                    ->orderBy('id')
                    ->pluck('id');
                $insertData = [];
                foreach ($chunk as $index => $video) {
                    foreach ($video->annotations as $annotation) {
                        $newAnnotationId = $newAnnotationIds->shift();
                        foreach ($annotation->labels as $annotationLabel) {
                            $original = $annotationLabel->getRawOriginal();
                            $original['annotation_id'] = $newAnnotationId;
                            unset($original['id']);
                            $insertData[] = $original;
                        }
                    }
                }
                VideoAnnotationLabel::insert($insertData);
            });
    }

    /**
     * Copies (selected) video labels from volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedLabelIds
     **/
    private function copyVideoLabels($volume, $copy, $selectedLabelIds)
    {
        $oldVideos = $volume->videos()
            ->when(!empty($selectedLabelIds), function ($query) use ($selectedLabelIds) {
                $query->whereIn('id', $selectedLabelIds);
            })
            ->orderBy('id')
            ->with('labels')
            ->get();
        $newVideoIds = $copy->videos()->orderBy('id')->pluck('id');

        foreach ($oldVideos as $videoIdx => $oldVideo) {
            $newVideoId = $newVideoIds[$videoIdx];
            $oldVideo->labels->map(function ($oldLabel) use ($newVideoId) {
                $origin = $oldLabel->getRawOriginal();
                $origin['video_id'] = $newVideoId;
                unset($origin['id']);
                return $origin;
            })->chunk(10000)->each(function ($chunk) {
                VideoLabel::insert($chunk->toArray());
            });
        }
    }

    /**
     * Copies ifDo-Files from given volume to volume copy.
     *
     * @param int $volumeId
     * @param int $copyId
     **/
    private function copyIfdoFile($volumeId, $copyId)
    {
        $disk = Storage::disk(config('volumes.ifdo_storage_disk'));
        $iFdoFilename = $volumeId.".yaml";
        $copyIFdoFilename = $copyId.".yaml";
        $disk->copy($iFdoFilename, $copyIFdoFilename);
    }
}
