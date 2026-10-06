<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\LabelTree;
use Biigle\Shape;
use Biigle\User;
use Exception;
use Illuminate\Support\Str;
use ZipArchive;

class YoloReportGenerator extends AnnotationReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'YOLO image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'yolo_image_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension = 'zip';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $zip = App::make(ZipArchive::class);
        $open = $zip->open($path, ZipArchive::OVERWRITE);

        if ($open !== true) {
            throw new Exception("Could not open ZIP file '{$path}'.");
        }

        try {
            $this->addDatasets($zip);
        } finally {
            $zip->close();
        }
    }

    /**
     * Add one dataset (or one per label tree/user) to the ZIP archive.
     *
     * @param ZipArchive $zip
     */
    protected function addDatasets($zip)
    {
        $exists = $this->initQuery()->exists();

        if ($this->shouldSeparateLabelTrees() && $exists) {
            $treeIds = $this->initQuery()
                ->select('labels.label_tree_id')
                ->distinct()
                ->pluck('label_tree_id');

            $trees = LabelTree::whereIn('id', $treeIds)->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $query = $this->query()->where('labels.label_tree_id', $id);
                $this->addDataset($zip, $query, Str::slug("{$id}-{$name}").'/');
            }
        } elseif ($this->shouldSeparateUsers() && $exists) {
            $userIds = $this->initQuery()
                ->select('user_id')
                ->distinct()
                ->pluck('user_id');

            $users = User::whereIn('id', $userIds)
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
                $query = $this->query()->where('user_id', $id);
                $this->addDataset($zip, $query, Str::slug("{$id}-{$name}").'/');
            }

            // Annotations of deleted users have a null user_id.
            if ($userIds->contains(null)) {
                $query = $this->query()->whereNull('user_id');
                $this->addDataset($zip, $query, 'deleted-users/');
            }
        } else {
            $this->addDataset($zip, $this->query(), '');
        }
    }

    /**
     * Add a YOLO dataset to the ZIP archive.
     *
     * @param ZipArchive $zip
     * @param \Illuminate\Database\Query\Builder $query Query for the annotation labels of the dataset
     * @param string $prefix Directory of the dataset in the ZIP archive
     */
    protected function addDataset($zip, $query, $prefix)
    {
        $labels = [];
        $lines = [];

        $query->eachById(function ($row) use (&$labels, &$lines) {
            $line = $this->getBoundingBox($row);
            if (is_null($line)) {
                return;
            }

            $labels[$row->label_id] = $row->label_name;
            $lines[$row->filename][] = [$row->label_id, $line];
        }, column: 'image_annotation_labels.id', alias: 'annotation_label_id');

        ksort($labels);
        $classes = array_flip(array_keys($labels));
        $splits = $this->splitFilenames(array_keys($lines));
        $imagePath = $this->getImagePath();

        foreach ($splits as $split => $filenames) {
            foreach ($filenames as $filename) {
                $content = '';
                foreach ($lines[$filename] as [$labelId, $box]) {
                    $content .= $classes[$labelId].' '.implode(' ', $box)."\n";
                }

                // Remote image filenames may have a query string, local files don't.
                $localFilename = Str::before($filename, '?');
                // Replace the file extension but keep any subdirectories.
                $name = preg_replace('/\.[^.\/]*$/', '', $localFilename);
                $zip->addFromString("{$prefix}labels/{$split}/{$name}.txt", $content);

                if ($imagePath) {
                    // A symlink is stored in a ZIP as a file that contains the link
                    // target and that has the symlink file type in its Unix mode bits.
                    $link = "{$prefix}images/{$split}/{$localFilename}";
                    $zip->addFromString($link, "{$imagePath}/{$localFilename}");
                    $zip->setExternalAttributesName($link, ZipArchive::OPSYS_UNIX, (0120777 << 16));
                }
            }
        }

        $zip->addFromString("{$prefix}data.yaml", $this->getDataYaml($labels, $splits));
        $zip->addFromString("{$prefix}classes.txt", implode('', array_map(fn ($name) => "{$name}\n", $labels)));
        $zip->addFromString("{$prefix}README.txt", $this->getReadme());
    }

    /**
     * Get the normalized YOLO bounding box of an annotation.
     *
     * @param object $row
     *
     * @return array|null Center x, center y, width and height or null if the annotation can't be converted.
     */
    protected function getBoundingBox($row)
    {
        $shapeId = intval($row->shape_id);
        $supported = [
            Shape::lineId(),
            Shape::polygonId(),
            Shape::rectangleId(),
            Shape::circleId(),
            Shape::ellipseId(),
        ];

        if (!in_array($shapeId, $supported)) {
            return null;
        }

        $attrs = json_decode($row->attrs ?? '', true);
        $width = $attrs['width'] ?? 0;
        $height = $attrs['height'] ?? 0;

        if ($width <= 0 || $height <= 0) {
            return null;
        }

        $points = json_decode($row->points, true);

        if ($shapeId === Shape::circleId()) {
            [$x, $y, $r] = $points;
            $r = max($r, 1);
            $box = [$x - $r, $y - $r, $x + $r, $y + $r];
        } elseif ($shapeId === Shape::ellipseId()) {
            // The points are the ends of the major and minor axes. Each axis is
            // a conjugate semi-diameter vector (u, v) of the ellipse, which gives
            // the extent of its bounding box.
            [$ax, $ay, $bx, $by, $cx, $cy, $dx, $dy] = $points;
            $mx = ($ax + $bx + $cx + $dx) / 4;
            $my = ($ay + $by + $cy + $dy) / 4;
            $halfWidth = sqrt(($ax - $mx) ** 2 + ($bx - $mx) ** 2);
            $halfHeight = sqrt(($ay - $my) ** 2 + ($by - $my) ** 2);
            $box = [$mx - $halfWidth, $my - $halfHeight, $mx + $halfWidth, $my + $halfHeight];
        } else {
            $xs = array_filter($points, fn ($key) => $key % 2 === 0, ARRAY_FILTER_USE_KEY);
            $ys = array_filter($points, fn ($key) => $key % 2 === 1, ARRAY_FILTER_USE_KEY);
            $box = [min($xs), min($ys), max($xs), max($ys)];
        }

        // Clip the box to the image.
        $xmin = max(0, min($width, $box[0]));
        $ymin = max(0, min($height, $box[1]));
        $xmax = max(0, min($width, $box[2]));
        $ymax = max(0, min($height, $box[3]));

        if ($xmax <= $xmin || $ymax <= $ymin) {
            return null;
        }

        return array_map(fn ($value) => sprintf('%.6f', $value), [
            ($xmin + $xmax) / 2 / $width,
            ($ymin + $ymax) / 2 / $height,
            ($xmax - $xmin) / $width,
            ($ymax - $ymin) / $height,
        ]);
    }

    /**
     * Assign the image filenames to the train, validation and test splits.
     *
     * The assignment is pseudo-random but deterministic for the same filenames.
     *
     * @param array $filenames
     *
     * @return array
     */
    protected function splitFilenames($filenames)
    {
        usort($filenames, fn ($a, $b) => strcmp(md5($a), md5($b)) ?: strcmp($a, $b));

        [$train, $val] = $this->getSplit();
        $count = count($filenames);
        $trainEnd = intval(round($count * $train));
        $valEnd = max($trainEnd, intval(round($count * ($train + $val))));

        return [
            'train' => array_slice($filenames, 0, $trainEnd),
            'val' => array_slice($filenames, $trainEnd, $valEnd - $trainEnd),
            'test' => array_slice($filenames, $valEnd),
        ];
    }

    /**
     * Get the content of the data.yaml file.
     *
     * @param array $labels Label names, ordered by class index
     * @param array $splits Image filenames of each split
     *
     * @return string
     */
    protected function getDataYaml($labels, $splits)
    {
        $yaml = "train: images/train\nval: images/val\n";

        if (!empty($splits['test'])) {
            $yaml .= "test: images/test\n";
        }

        $yaml .= "\nnc: ".count($labels)."\nnames:\n";

        foreach (array_values($labels) as $index => $name) {
            // A JSON string is a valid double-quoted YAML string.
            $name = json_encode($name, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $yaml .= "  {$index}: {$name}\n";
        }

        return $yaml;
    }

    /**
     * Get the content of the README.txt file.
     *
     * @return string
     */
    protected function getReadme()
    {
        $imagePath = $this->getImagePath();
        $readme = "YOLO dataset of the BIIGLE volume \"{$this->source->name}\".\n\n";

        if ($imagePath) {
            $readme .= "The files in images/train, images/val and images/test are symbolic links to the images in:\n\n  {$imagePath}\n\n";
            $readme .= "The links are only resolved if the images are available at this path and if the archive is extracted with a tool that supports symbolic links (e.g. unzip on Linux or macOS).\n\n";
        } else {
            $readme .= "Copy (or link) each image to images/train, images/val or images/test, matching the directory of its label file in labels/train, labels/val or labels/test.\n\n";
        }

        $readme .= "Start the training with the absolute path to data.yaml, e.g.:\n\n  yolo train data=\$(pwd)/data.yaml model=yolo11n.pt\n";

        return $readme;
    }

    /**
     * Get the local image path for the image symlinks.
     *
     * @return string|null
     */
    protected function getImagePath()
    {
        $path = trim($this->options->get('yoloImagePath') ?? '');

        return $path === '' ? null : rtrim($path, '/\\');
    }

    /**
     * Get the train, validation and test split ratios.
     *
     * @return array
     */
    protected function getSplit()
    {
        $split = $this->options->get('yoloSplit', [0.7, 0.2, 0.1]);
        $sum = array_sum($split);

        if ($sum <= 0) {
            return [0.7, 0.2, 0.1];
        }

        return array_map(fn ($value) => $value / $sum, $split);
    }

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        return $this
            ->initQuery([
                'image_annotation_labels.id as annotation_label_id',
                'image_annotation_labels.label_id',
                'labels.name as label_name',
                'images.filename',
                'images.attrs',
                'image_annotations.shape_id',
                'image_annotations.points',
            ]);
    }
}
