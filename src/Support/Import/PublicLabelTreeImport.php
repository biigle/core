<?php

namespace Biigle\Modules\Sync\Support\Import;

use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Visibility;
use DB;
use Illuminate\Support\Collection;
use Ramsey\Uuid\Uuid;
use SplFileObject;

class PublicLabelTreeImport extends Import
{
    /**
     * Caches the decoded label tree import file.
     *
     * @var Collection
     */
    protected $importLabelTree;

    /**
     * Perform the import.
     */
    public function perform()
    {
        return DB::transaction(function () {
            $importTree = $this->getImportLabelTree();
            $tree = new LabelTree;
            $tree->name = $importTree['name'];
            $tree->description = $importTree['description'];
            $tree->uuid = Uuid::uuid4();
            $tree->visibility_id = Visibility::privateId();
            $tree->save();
            $this->importLabels($tree);

            return $tree;
        });
    }

    /**
     * Checks if the label tree of the import already exists.
     *
     * @return bool
     */
    public function treeExists()
    {
        $tree = $this->getImportLabelTree();

        return LabelTree::where('uuid', $tree['uuid'])->exists();
    }

    /**
     * Get the contents of the label tree import file.
     *
     * @return Collection
     */
    protected function getImportLabelTree()
    {
        if (!$this->importLabelTree) {
            $this->importLabelTree = $this->collectJson('label_tree.json');
        }

        return $this->importLabelTree;
    }

    /**
     * {@inheritdoc}
     */
    protected function expectedFiles()
    {
        return [
            'labels.csv',
            'label_tree.json',
        ];
    }

    /**
     * {@inheritdoc}
     */
    protected function validateFile($basename)
    {
        switch ($basename) {
            case 'labels.csv':
                return $this->expectColumnsInCsv('labels.csv', [
                    'id',
                    'name',
                    'parent_id',
                    'color',
                    'label_tree_id',
                    'source_id',
                ]);
            case 'label_tree.json':
                return $this->expectKeysInJson('label_tree.json', [
                    'id',
                    'name',
                    'description',
                    'uuid',
                ], false);
        }

        return parent::validateFile($basename);
    }

    /**
     * Import the labels of this import.
     *
     * @param LabelTree $tree
     */
    protected function importLabels(LabelTree $tree)
    {
        $importTree = $this->getImportLabelTree();
        $idMap = [];
        $parentIdMap = [];
        $csv = new SplFileObject("{$this->path}/labels.csv");
        $csv->fgetcsv();
        while ($line = $csv->fgetcsv()) {
            if (!is_null($line[0]) && intval($line[4]) === $importTree['id']) {
                $label = new Label;
                $label->name = $line[1];
                $label->color = $line[3];
                $label->source_id = $line[5];
                $label->label_tree_id = $tree->id;
                $label->uuid = Uuid::uuid4();
                $label->save();

                $idMap[$line[0]] = $label->id;
                if ($line[2]) {
                    $parentIdMap[$label->id] = $line[2];
                }
            }
        }

        foreach ($parentIdMap as $labelId => $oldParentId) {
            Label::where('id', $labelId)->update(['parent_id' => $idMap[$oldParentId]]);
        }
    }
}
