<?php

namespace Biigle\Modules\Sync\Support\Import;

use Biigle\Role;
use SplFileObject;
use Biigle\Project;
use Illuminate\Support\Collection;

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
     * Perform the import
     *
     * @param Project $project Project to attach the imported volumes to
     * @param array|null $only IDs of the volume import candidates to limit the import to.
     * @param array $newUrls New URLs of imported volumes.
     * @param array $nameConflictResolution Array mapping label IDs to 'import' or 'existing' for how to resolve name conflicts.
     * @param array $parentConflictResolution Array mapping label IDs to 'import' or 'existing' for how to resolve parent conflicts.
     * @return array Array containing 'volumes', 'labelTrees', 'labels' and 'users', mapping external IDs (from the import file) to IDs of the database.
     */
    public function perform(Project $project, $only = null, $newUrls = [], $nameConflictResolution = [], $parentConflictResolution = [])
    {
        // Validate volume URLs before creating anything.
        // if ($request->has('new_urls')) {
        //     foreach ($request->input('new_urls') as $url) {
        //         $volume = new Volume;
        //         $volume->url = $url;
        //         try {
        //             $volume->validateUrl();
        //         } catch (Exception $e) {
        //             $message = "Invalid volume URL '{$url}': ".$e->getMessage();
        //             throw new UnprocessableEntityHttpException($message);
        //         }
        //     }
        // }
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
     * @{inheritdoc}
     */
    protected function expectedFiles()
    {
        return [
            'users.json',
            'label_trees.json',
            'volumes.json',
            'images.csv',
            'annotations.csv',
            'annotation_labels.csv',
            'image_labels.csv',
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
                    'media_type_id',
                    'url',
                    'attrs',
                ]);
            case 'images.csv':
                return $this->expectColumnsInCsv('images.csv', [
                    'id',
                    'filename',
                    'volume_id',
                ]);
            case 'annotation_labels.csv':
                return $this->expectColumnsInCsv('annotation_labels.csv', [
                    'annotation_id',
                    'label_id',
                    'user_id',
                    'confidence',
                    'created_at',
                    'updated_at',
                ]);
            case 'annotations.csv':
                return $this->expectColumnsInCsv('annotations.csv', [
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
     * This is based on annotation and image labels of each volume.
     *
     * @return array Maps volume IDs to a list of label IDs and a list of user IDs.
     */
    protected function getRequiredEntities()
    {
        $imageVolumeMap = $this->getCsvIdMap('images.csv', 'volume_id');
        $annotationImageMap = $this->getCsvIdMap('annotations.csv', 'image_id');

        $labels = [];
        $users = [];
        $csv = new SplFileObject("{$this->path}/annotation_labels.csv");
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

        $labels = array_map(function ($ids) {
            return array_values(array_unique($ids));
        }, $labels);

        $users = array_map(function ($ids) {
            return array_values(array_unique($ids));
        }, $users);

        return compact('labels', 'users');
    }
}
