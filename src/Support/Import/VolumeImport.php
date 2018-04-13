<?php

namespace Biigle\Modules\Sync\Support\Import;

use Biigle\Role;
use SplFileObject;
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
     * Get the contents of the label tree import file.
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
     * Get the users who have to be imported for each volume.
     * These may be creators of annotation/image labels or admins of required label trees.
     *
     * @return Collection Map of volume ID to an array of users who need to be imported for this volume.
     */
    public function getUserImportCandidates()
    {
        $candidates = (new UserImport($this->path))
            ->getUserImportCandidates()
            ->keyBy('id');

        $entities = $this->getRequiredEntities();
        // Map of volume IDs to a list of user IDs who would need to be imported based on
        // annotation and image labels.
        $requiredLabelUsers = collect($entities['users'])->map(function ($userIds) use ($candidates) {
                return array_filter($userIds, function ($id) use ($candidates) {
                    return $candidates->has($id);
                });
            });

        // Now determine the users who have to be imported because they are admins of
        // required label trees.
        $trees = (new LabelTreeImport($this->path))->getImportLabelTrees();

        // Maps label IDs to the ID of their label tree.
        $labelToLabelTreeMap = $trees->map(function ($tree) {
                $tree['labels'] = array_map(function ($label) use ($tree) {
                    $label['label_tree_id'] = $tree['id'];
                    return $label;
                }, $tree['labels']);
                return $tree;
            })
            ->pluck('labels')
            ->collapse()
            ->pluck('label_tree_id', 'id');

        $labels = collect($entities['labels']);
        // Maps volume IDs to a list of label trees that are required for the volume.
        $requiredLabelTrees = $labels->map(function ($ids) use ($labelToLabelTreeMap) {
            $ids = array_map(function ($id) use ($labelToLabelTreeMap) {
                return $labelToLabelTreeMap->get($id);
            }, $ids);

            return array_unique($ids);
        });

        // Maps label tree IDs to the list of their admin IDs who don't already exist.
        $labelTreeAdmins = $trees->map(function ($tree) use ($candidates) {
                $tree['members'] = array_filter($tree['members'], function ($member) use ($candidates) {
                    return $candidates->has($member['id']) &&
                        $member['role_id'] === Role::$admin->id;
                });

                $tree['members'] = array_values(array_map(function ($member) {
                    return $member['id'];
                }, $tree['members']));

                return $tree;
            })
            ->pluck('members', 'id');

        // Map of volume IDs to a list of user IDs who would need to be imported because
        // they are admins of required label trees.
        $requiredLabelTreeUsers = $requiredLabelTrees->map(function ($labelTreeIds) use ($labelTreeAdmins) {
            $userIds = [];
            foreach ($labelTreeIds as $id) {
                $userIds = array_merge($userIds, $labelTreeAdmins->get($id));
            }

            return $userIds;
        });

        $requiredUsers = $requiredLabelUsers;

        foreach ($requiredLabelTreeUsers as $id => $users) {
            if ($requiredUsers->has($id)) {
                $requiredUsers[$id] = array_merge($requiredUsers[$id], $users);
            } else {
                $requiredUsers[$id] = $users;
            }
        }

        $requiredUsers = $requiredUsers->map(function ($ids) use ($candidates) {
                return $candidates->whereIn('id', $ids)->values();
            })
            ->reject(function ($users) {
                return $users->isEmpty();
            });

        return $requiredUsers;
    }

    // Get the label trees which have to be imported for each volume.
    // These are the ones that don't exist yet but contain labels that are used for
    // annotation/image labels.

    // Get the single labels which habe to be imported/merged for each volume.
    // These are the ones of label trees which already exist but the labels themselves
    // don't (or have conflicts).

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
                return (new LabelTreeImport($this->path))->validateFile($basename);
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
            return array_unique($ids);
        }, $labels);

        $users = array_map(function ($ids) {
            return array_unique($ids);
        }, $users);


        return compact('labels', 'users');
    }
}
