<?php

namespace Biigle\Services\Import;

use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\ImageLabel;
use Biigle\Jobs\PostprocessVolumeImport;
use Biigle\Label;
use Biigle\LabelTree;
use Biigle\MediaType;
use Biigle\Project;
use Biigle\Rules\VolumeUrl;
use Biigle\User;
use Biigle\Video;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Biigle\VideoLabel;
use Biigle\Volume;
use DB;
use Exception;
use Illuminate\Support\Collection;
use Ramsey\Uuid\Uuid;
use SplFileObject;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class VolumeImport extends Import
{
    /**
     * Caches the decoded volume import file.
     *
     * @var Collection
     */
    protected $importVolumes;

    /**
     * The user import instance that belongs to this import.
     *
     * @var UserImport
     */
    protected $userImport;

    /**
     * The label tree import instance that belongs to this import.
     *
     * @var LabelTreeImport
     */
    protected $labelTreeImport;

    /**
     * Perform the import.
     *
     * @param Project $project Project to attach the imported volumes to
     * @param User $creator Creator of the new volumes.
     * @param array|null $only IDs of the volume import candidates to limit the import to.
     * @param array $newUrls New URLs of imported volumes.
     * @param array $nameConflictResolution Array mapping label IDs to 'import' or 'existing' for how to resolve name conflicts.
     * @param array $parentConflictResolution Array mapping label IDs to 'import' or 'existing' for how to resolve parent conflicts.
     * @return array Array containing 'volumes', 'labelTrees', 'labels' and 'users', mapping external IDs (from the import file) to IDs of the database.
     */
    public function perform(Project $project, User $creator, array $only = null, array $newUrls = [], array $nameConflictResolution = [], array $parentConflictResolution = [])
    {
        return DB::transaction(function () use ($project, $creator, $only, $newUrls, $nameConflictResolution, $parentConflictResolution) {
            $volumeCandidates = $this->getVolumeImportCandidates()
                ->when(is_array($only), function ($collection) use ($only) {
                    return $collection->whereIn('id', $only);
                })
                ->keyBy('id');

            $volumes = $this->insertVolumes($volumeCandidates, $creator, $newUrls);

            $userIdMap = $this->insertUsers($volumeCandidates);

            $labelTreeIdMap = $this->insertLabelTreesAndLabels($volumeCandidates, $nameConflictResolution, $parentConflictResolution);
            foreach ($labelTreeIdMap['users'] as $key => $value) {
                $userIdMap[$key] = $value;
            }
            $labelIdMap = $labelTreeIdMap['labels'];
            $labelTreeIdMap = $labelTreeIdMap['labelTrees'];

            $volumeIdMap = [];
            foreach ($volumes as $volume) {
                $project->volumes()->attach($volume);
                $volumeIdMap[$volume->old_id] = $volume->id;
            }

            $imageIdMap = $this->insertImages($volumeIdMap);
            $this->insertImageLabels($imageIdMap, $labelIdMap, $userIdMap);
            $this->insertImageAnnotations($volumeIdMap, $imageIdMap, $labelIdMap, $userIdMap);

            $videoIdMap = $this->insertVideos($volumeIdMap);
            $this->insertVideoLabels($videoIdMap, $labelIdMap, $userIdMap);
            $this->insertVideoAnnotations($volumeIdMap, $videoIdMap, $labelIdMap, $userIdMap);

            PostprocessVolumeImport::dispatch($volumes)
                ->onQueue(config('sync.postprocess_volume_import_queue'));

            return [
                'volumes' => $volumeIdMap,
                'labelTrees' => $labelTreeIdMap,
                'labels' => $labelIdMap,
                'users' => $userIdMap,
            ];
        });
    }

    /**
     * Get the contents of the volume import file.
     *
     * @return Collection
     */
    public function getImportVolumes()
    {
        if (!$this->importVolumes) {
            $this->importVolumes = $this->collectJson('volumes.json');
        }

        return $this->importVolumes;
    }

    /**
     * Get the contents of the label tree import file.
     *
     * @return Collection
     */
    public function getImportLabelTrees()
    {
        return $this->getLabelTreeImport()->getImportLabelTrees();
    }

    /**
     * Get all volumes of this import augmented by the IDs of the users, label trees and
     * labels that they require.
     *
     * @return Collection
     */
    public function getVolumeImportCandidates()
    {
        $labelToTreeMap = $this->getLabelTreeImport()
            ->getImportLabelTrees()
            ->map(function ($tree) {
                $tree['labels'] = array_map(function ($label) use ($tree) {
                    $label['label_tree_id'] = $tree['id'];

                    return $label;
                }, $tree['labels']);

                return $tree;
            })
            ->pluck('labels')
            ->collapse()
            ->pluck('label_tree_id', 'id');

        $volumes = $this->getImportVolumes();
        $entities = $this->getRequiredEntities();

        return $volumes->map(function ($volume) use ($entities, $labelToTreeMap) {
            if (array_key_exists($volume['id'], $entities['users'])) {
                $volume['users'] = $entities['users'][$volume['id']];
            } else {
                $volume['users'] = [];
            }

            if (array_key_exists($volume['id'], $entities['labels'])) {
                $volume['labels'] = $entities['labels'][$volume['id']];
            } else {
                $volume['labels'] = [];
            }

            $volume['label_trees'] = array_values(array_unique(array_map(function ($id) use ($labelToTreeMap) {
                return $labelToTreeMap[$id];
            }, $volume['labels'])));

            return $volume;
        });
    }

    /**
     * Get all label trees that might have to be imported for the volumes.
     *
     * @return Collection
     */
    public function getLabelTreeImportCandidates()
    {
        return $this->getLabelTreeImport()->getLabelTreeImportCandidates();
    }

    /**
     * Get all labels that might have to be imported for the volumes.
     *
     * @return Collection
     */
    public function getLabelImportCandidates()
    {
        return $this->getLabelTreeImport()->getLabelImportCandidates();
    }

    /**
     * Get the users who might have to be imported for the volumes.
     * These may be creators of annotation/image labels or admins of required label trees.
     *
     * @return Collection
     */
    public function getUserImportCandidates()
    {
        return $this->getUserImport()->getUserImportCandidates();
    }

    /**
     * {@inheritdoc}
     */
    protected function expectedFiles()
    {
        return [
            'users.json',
            'label_trees.json',
            'volumes.json',
            'images.csv',
            'image_annotations.csv',
            'image_annotation_labels.csv',
            'image_labels.csv',
            'videos.csv',
            'video_annotations.csv',
            'video_annotation_labels.csv',
            'video_labels.csv',
        ];
    }

    /**
     * {@inheritdoc}
     */
    protected function validateFile($basename)
    {
        switch ($basename) {
            case 'users.json':
            case 'label_trees.json':
                return $this->getLabelTreeImport()->validateFile($basename);
            case 'volumes.json':
                return $this->expectKeysInJson('volumes.json', [
                    'id',
                    'name',
                    'media_type_name',
                    'url',
                    'attrs',
                ]);
            case 'images.csv':
                return $this->expectColumnsInCsv('images.csv', [
                    'id',
                    'filename',
                    'volume_id',
                ]);
            case 'image_annotation_labels.csv':
                return $this->expectColumnsInCsv('image_annotation_labels.csv', [
                    'annotation_id',
                    'label_id',
                    'user_id',
                    'confidence',
                    'created_at',
                    'updated_at',
                ]);
            case 'image_annotations.csv':
                return $this->expectColumnsInCsv('image_annotations.csv', [
                    'id',
                    'image_id',
                    'shape_id',
                    'created_at',
                    'updated_at',
                    'points',
                ]);
            case 'image_labels.csv':
                return $this->expectColumnsInCsv('image_labels.csv', [
                    'image_id',
                    'label_id',
                    'user_id',
                    'created_at',
                    'updated_at',
                ]);
            case 'videos.csv':
                return $this->expectColumnsInCsv('videos.csv', [
                    'id',
                    'filename',
                    'volume_id',
                ]);
            case 'video_annotation_labels.csv':
                return $this->expectColumnsInCsv('video_annotation_labels.csv', [
                    'annotation_id',
                    'label_id',
                    'user_id',
                    'created_at',
                    'updated_at',
                ]);
            case 'video_annotations.csv':
                return $this->expectColumnsInCsv('video_annotations.csv', [
                    'id',
                    'video_id',
                    'shape_id',
                    'created_at',
                    'updated_at',
                    'points',
                    'frames',
                ]);
            case 'video_labels.csv':
                return $this->expectColumnsInCsv('video_labels.csv', [
                    'video_id',
                    'label_id',
                    'user_id',
                    'created_at',
                    'updated_at',
                ]);
        }

        return parent::validateFile($basename);
    }

    /**
     * Get the user import instance that belongs to this import.
     *
     * @return UserImport
     */
    protected function getUserImport()
    {
        if (!$this->userImport) {
            $this->userImport = new UserImport($this->path);
        }

        return $this->userImport;
    }

    /**
     * Get the label tree import instance that belongs to this import.
     *
     * @return LabelTreeImport
     */
    protected function getLabelTreeImport()
    {
        if (!$this->labelTreeImport) {
            $this->labelTreeImport = new LabelTreeImport($this->path);
        }

        return $this->labelTreeImport;
    }

    /**
     * Get a map of one CSV ID column to another.
     * E.g. a map of the image 'id' in column 0 to the 'volume_id' in column 2.
     *
     * @param string $basename Name of the CSV file
     * @param string $value Name of the value column
     * @param string $key Name of the key column
     *
     * @return Collection
     */
    protected function getCsvIdMap($basename, $value, $key = 'id')
    {
        $csv = new SplFileObject("{$this->path}/{$basename}");
        $header = $csv->fgetcsv();
        $valueCol = array_search($value, $header);
        $keyCol = array_search($key, $header);

        $map = collect();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0])) {
                $map[$line[$keyCol]] = (int) $line[$valueCol];
            }
        }

        return $map;
    }

    /**
     * Get the list of labels and users that whould need to be imported for each volume.
     * This is based on image annotation labels, image labels, video annotation labels
     * and video labels of each volume.
     *
     * @return array Maps volume IDs to a list of label IDs and a list of user IDs.
     */
    protected function getRequiredEntities()
    {
        $imageVolumeMap = $this->getCsvIdMap('images.csv', 'volume_id');
        $annotationImageMap = $this->getCsvIdMap('image_annotations.csv', 'image_id');

        $videoVolumeMap = $this->getCsvIdMap('videos.csv', 'volume_id');
        $annotationVideoMap = $this->getCsvIdMap('video_annotations.csv', 'video_id');

        $labels = [];
        $users = [];
        $csv = new SplFileObject("{$this->path}/image_annotation_labels.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0])) {
                $volumeId = $imageVolumeMap->get($annotationImageMap->get($line[0]));
                $labels[$volumeId][] = (int) $line[1];
                $users[$volumeId][] = (int) $line[2];
            }
        }

        $csv = new SplFileObject("{$this->path}/image_labels.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0])) {
                $volumeId = $imageVolumeMap->get($line[0]);
                $labels[$volumeId][] = (int) $line[1];
                $users[$volumeId][] = (int) $line[2];
            }
        }

        $csv = new SplFileObject("{$this->path}/video_annotation_labels.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0])) {
                $volumeId = $videoVolumeMap->get($annotationVideoMap->get($line[0]));
                $labels[$volumeId][] = (int) $line[1];
                $users[$volumeId][] = (int) $line[2];
            }
        }

        $csv = new SplFileObject("{$this->path}/video_labels.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0])) {
                $volumeId = $videoVolumeMap->get($line[0]);
                $labels[$volumeId][] = (int) $line[1];
                $users[$volumeId][] = (int) $line[2];
            }
        }

        $labels = array_map(function ($ids) {
            return array_values(array_unique($ids));
        }, $labels);

        $users = array_map(function ($ids) {
            return array_values(array_unique($ids));
        }, $users);

        return compact('labels', 'users');
    }

    /**
     * Insert import volumes into the database.
     *
     * @param Collection $candidates The import volumes to insert.
     * @param User $creator The creator of the new volumes.
     * @param array $newUrls Array mapping a volume ID to a new volume URL (optional).
     * @throws  UnprocessableEntityHttpException If a volume URL is invalid.
     * @return Collection
     */
    protected function insertVolumes(Collection $candidates, User $creator, array $newUrls)
    {
        $mediaTypes = MediaType::pluck('id', 'name');

        return $candidates->map(function ($candidate) use ($creator, $newUrls, $mediaTypes) {
                $volume = new Volume;
                $volume->old_id = $candidate['id'];
                $volume->name = $candidate['name'];
                if (array_key_exists($volume->old_id, $newUrls)) {
                    $volume->url = $newUrls[$volume->old_id];
                } else {
                    $volume->url = $candidate['url'];
                }

                $validator = new VolumeUrl;
                if (!$validator->passes(null, $volume->url)) {
                    $message = "Volume '{$volume->name}' has an invalid URL: ".$validator->message();
                    throw new UnprocessableEntityHttpException($message);
                }

                $volume->media_type_id = $mediaTypes[$candidate['media_type_name']];
                $volume->attrs = $candidate['attrs'];
                $volume->creator_id = $creator->id;

                return $volume;
            })
            ->map(function ($volume) {
                // Save volumes only after all of them have validated their URLs.
                $oldId = $volume->old_id;
                unset($volume->old_id);
                $volume->save();
                $volume->old_id = $oldId;

                return $volume;
            });
    }

    /**
     * Insert import users into the database.
     *
     * @param Collection $volumeCandidates The import volumes to insert.
     *
     * @return array Map of import user IDs to existing user IDs.
     */
    protected function insertUsers(Collection $volumeCandidates)
    {
        $requiredUserIds = $volumeCandidates->pluck('users')
            ->collapse()
            ->unique()
            ->toArray();

        return $this->getUserImport()->perform($requiredUserIds);
    }

    /**
     * Insert import label trees and labels into the database.
     *
     * @param Collection $volumeCandidates The import volumes to insert.
     * @param array $nameConflictResolution Array mapping label IDs to 'import' or 'existing' for how to resolve name conflicts.
     * @param array $parentConflictResolution Array mapping label IDs to 'import' or 'existing' for how to resolve parent conflicts.
     *
     * @return array Map of import IDs to existing IDs of 'users' (who belong to imported label trees), 'labelTrees', and 'labels'.
     */
    protected function insertLabelTreesAndLabels(Collection $volumeCandidates, $nameConflictResolution, $parentConflictResolution)
    {
        $requiredLabelTreeIds = $volumeCandidates->pluck('label_trees')
            ->collapse()
            ->unique()
            ->toArray();
        $requiredLabelIds = $volumeCandidates->pluck('labels')
            ->collapse()
            ->unique()
            ->toArray();

        return $this->getLabelTreeImport()->perform(
            $requiredLabelTreeIds,
            $requiredLabelIds,
            $nameConflictResolution,
            $parentConflictResolution
        );
    }

    /**
     * Insert import files into the database.
     *
     * @param array $volumeIdMap Map of import volume IDs to existing volume IDs.
     * @param string $csv Filename of the import CSV.
     * @param string $modelClass File model class.
     *
     * @return array Map of import file IDs to existing file IDs.
     */
    protected function insertFiles($volumeIdMap, $csv, $modelClass)
    {
        $files = [];
        $csv = new SplFileObject("{$this->path}/{$csv}");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0]) && array_key_exists($line[2], $volumeIdMap)) {
                $files[] = [
                    'id' => (int) $line[0],
                    'filename' => $line[1],
                    'volume_id' => $volumeIdMap[$line[2]],
                ];
            }
        }

        $files = array_map(function ($file) {
            $file['uuid'] = (string) Uuid::uuid4();

            return $file;
        }, $files);

        $toInsert = array_map(function ($file) {
            return [
                'filename' => $file['filename'],
                'volume_id' => $file['volume_id'],
                'uuid' => $file['uuid'],
            ];
        }, $files);

        $volumeIds = [];
        foreach ($files as $file) {
            $volumeIds[] = $file['volume_id'];
        }

        $modelClass::insert($toInsert);
        $newFiles = $modelClass::whereIn('volume_id', array_unique($volumeIds))
            ->pluck('id', 'uuid');

        $idMap = [];
        foreach ($files as $file) {
            $idMap[$file['id']] = $newFiles[$file['uuid']];
        }

        return $idMap;
    }

    /**
     * Insert import images into the database.
     *
     * @param array $volumeIdMap Map of import volume IDs to existing volume IDs.
     *
     * @return array Map of import image IDs to existing image IDs.
     */
    protected function insertImages($volumeIdMap)
    {
        return $this->insertFiles($volumeIdMap, 'images.csv', Image::class);
    }

    /**
     * Insert import videos into the database.
     *
     * @param array $volumeIdMap Map of import volume IDs to existing volume IDs.
     *
     * @return array Map of import video IDs to existing video IDs.
     */
    protected function insertVideos($volumeIdMap)
    {
        return $this->insertFiles($volumeIdMap, 'videos.csv', Video::class);
    }

    /**
     * Insert import image labels into the database.
     *
     * @param array $imageIdMap Map of import image IDs to existing image IDs.
     * @param array $labelIdMap Map of import label IDs to existing label IDs.
     * @param array $userIdMap Map of import user IDs to existing user IDs.
     */
    protected function insertImageLabels($imageIdMap, $labelIdMap, $userIdMap)
    {
        $imageLabels = [];
        $csv = new SplFileObject("{$this->path}/image_labels.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0]) && array_key_exists($line[0], $imageIdMap)) {
                $imageLabels[] = [
                    'image_id' => $imageIdMap[$line[0]],
                    'label_id' => $labelIdMap[$line[1]],
                    'user_id' => $userIdMap[$line[2]] ?? null,
                    'created_at' => $line[3],
                    'updated_at' => $line[4],
                ];
            }
        }

        ImageLabel::insert($imageLabels);
    }

    /**
     * Insert import video labels into the database.
     *
     * @param array $videoIdMap Map of import video IDs to existing video IDs.
     * @param array $labelIdMap Map of import label IDs to existing label IDs.
     * @param array $userIdMap Map of import user IDs to existing user IDs.
     */
    protected function insertVideoLabels($videoIdMap, $labelIdMap, $userIdMap)
    {
        $videoLabels = [];
        $csv = new SplFileObject("{$this->path}/video_labels.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0]) && array_key_exists($line[0], $videoIdMap)) {
                $videoLabels[] = [
                    'video_id' => $videoIdMap[$line[0]],
                    'label_id' => $labelIdMap[$line[1]],
                    'user_id' => $userIdMap[$line[2]] ?? null,
                    'created_at' => $line[3],
                    'updated_at' => $line[4],
                ];
            }
        }

        VideoLabel::insert($videoLabels);
    }

    /**
     * Insert import image annotations into the database.
     *
     * @param array $volumeIdMap Map of import volume IDs to existing volume IDs.
     * @param array $imageIdMap Map of import image IDs to existing image IDs.
     * @param array $labelIdMap Map of import label IDs to existing label IDs.
     * @param array $userIdMap Map of import user IDs to existing user IDs.
     */
    protected function insertImageAnnotations($volumeIdMap, $imageIdMap, $labelIdMap, $userIdMap)
    {
        $chunkSize = 1000;
        $currentIndex = 0;

        $annotations = [];
        $oldIds = [];
        $csv = new SplFileObject("{$this->path}/image_annotations.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0]) && array_key_exists($line[1], $imageIdMap)) {
                $oldIds[] = (int) $line[0];
                $annotations[] = [
                    'image_id' => $imageIdMap[$line[1]],
                    'shape_id' => (int) $line[2],
                    'created_at' => $line[3],
                    'updated_at' => $line[4],
                    'points' => $line[5],
                ];

                $currentIndex += 1;

                if ($currentIndex >= $chunkSize) {
                    ImageAnnotation::insert($annotations);
                    $annotations = [];
                    $currentIndex = 0;
                }
            }
        }

        ImageAnnotation::insert($annotations);
        // Try to save memory where we can here. The annotation(labels) arrays can get
        // huge.
        unset($annotations);

        // As we cannot use any attribute of the annotations to establish a connection
        // between import IDs and existing IDs, we just assume that the IDs of the newly
        // created annotations match the ordering of the $oldIds array (i.e. the
        // ordering in which the annotations have been inserted).
        // $annotationIdMap = array_combine($oldIds, $newIds);
        $annotationIdMap = [];
        reset($oldIds);
        $handleAnnotation = function ($annotation) use (&$oldIds, &$annotationIdMap) {
            $annotationIdMap[current($oldIds)] = $annotation->id;
            next($oldIds);
        };

        ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
            ->whereIn('images.volume_id', array_values($volumeIdMap))
            ->orderBy('image_annotations.id', 'asc')
            ->select('image_annotations.id')
            ->eachById($handleAnnotation, 10000, 'image_annotations.id', 'id');

        unset($oldIds);

        $currentIndex = 0;
        $annotationLabels = [];
        $csv = new SplFileObject("{$this->path}/image_annotation_labels.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0]) && array_key_exists($line[0], $annotationIdMap)) {
                $annotationLabels[] = [
                    'annotation_id' => $annotationIdMap[$line[0]],
                    'label_id' => $labelIdMap[$line[1]],
                    'user_id' => $userIdMap[$line[2]] ?? null,
                    'confidence' => (float) $line[3],
                    'created_at' => $line[4],
                    'updated_at' => $line[5],
                ];

                $currentIndex += 1;

                if ($currentIndex >= $chunkSize) {
                    ImageAnnotationLabel::insert($annotationLabels);
                    $annotationLabels = [];
                    $currentIndex = 0;
                }
            }
        }

        ImageAnnotationLabel::insert($annotationLabels);
    }

    /**
     * Insert import video annotations into the database.
     *
     * @param array $volumeIdMap Map of import volume IDs to existing volume IDs.
     * @param array $videoIdMap Map of import video IDs to existing video IDs.
     * @param array $labelIdMap Map of import label IDs to existing label IDs.
     * @param array $userIdMap Map of import user IDs to existing user IDs.
     */
    protected function insertVideoAnnotations($volumeIdMap, $videoIdMap, $labelIdMap, $userIdMap)
    {
        $chunkSize = 1000;
        $currentIndex = 0;

        $annotations = [];
        $oldIds = [];
        $csv = new SplFileObject("{$this->path}/video_annotations.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0]) && array_key_exists($line[1], $videoIdMap)) {
                $oldIds[] = (int) $line[0];
                $annotations[] = [
                    'video_id' => $videoIdMap[$line[1]],
                    'shape_id' => (int) $line[2],
                    'created_at' => $line[3],
                    'updated_at' => $line[4],
                    'points' => $line[5],
                    'frames' => $line[6],
                ];

                $currentIndex += 1;

                if ($currentIndex >= $chunkSize) {
                    VideoAnnotation::insert($annotations);
                    $annotations = [];
                    $currentIndex = 0;
                }
            }
        }

        VideoAnnotation::insert($annotations);
        // Try to save memory where we can here. The annotation(labels) arrays can get
        // huge.
        unset($annotations);

        // As we cannot use any attribute of the annotations to establish a connection
        // between import IDs and existing IDs, we just assume that the IDs of the newly
        // created annotations match the ordering of the $oldIds array (i.e. the
        // ordering in which the annotations have been inserted).
        // $annotationIdMap = array_combine($oldIds, $newIds);
        $annotationIdMap = [];
        reset($oldIds);
        $handleAnnotation = function ($annotation) use (&$oldIds, &$annotationIdMap) {
            $annotationIdMap[current($oldIds)] = $annotation->id;
            next($oldIds);
        };

        VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
            ->whereIn('videos.volume_id', array_values($volumeIdMap))
            ->orderBy('video_annotations.id', 'asc')
            ->select('video_annotations.id')
            ->eachById($handleAnnotation, 10000, 'video_annotations.id', 'id');

        unset($oldIds);

        $currentIndex = 0;
        $annotationLabels = [];
        $csv = new SplFileObject("{$this->path}/video_annotation_labels.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0]) && array_key_exists($line[0], $annotationIdMap)) {
                $annotationLabels[] = [
                    'annotation_id' => $annotationIdMap[$line[0]],
                    'label_id' => $labelIdMap[$line[1]],
                    'user_id' => $userIdMap[$line[2]] ?? null,
                    'created_at' => $line[3],
                    'updated_at' => $line[4],
                ];

                $currentIndex += 1;

                if ($currentIndex >= $chunkSize) {
                    VideoAnnotationLabel::insert($annotationLabels);
                    $annotationLabels = [];
                    $currentIndex = 0;
                }
            }
        }

        VideoAnnotationLabel::insert($annotationLabels);
    }
}
