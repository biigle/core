<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use Biigle\LabelTree;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\MakesZipArchives;
use Biigle\User;
use DB;

class YoloReportGenerator extends AnnotationReportGenerator
{
    use MakesZipArchives;
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'yolo image annotation report';

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
        $rows = $this->query()->get();
        
        // Always create a single unified dataset for YOLO
        $csv = $this->createCsv($rows);
        $this->tmpFiles[] = $csv;
        
        $this->executeScript('to_yolo', $path);
        
        // Python script creates output directory based on the first CSV file path
        // Collect all files from that directory for zipping  
        $firstCsvPath = $this->tmpFiles[0]->getPath();
        $outputDir = pathinfo($firstCsvPath, PATHINFO_DIRNAME) . '/' . pathinfo($firstCsvPath, PATHINFO_FILENAME) . '_yolo_output';
        
        
        // Clear the toZip array and rebuild it with files from output directory
        $toZip = [];
        if (is_dir($outputDir)) {
            $this->addDirectoryToZip($outputDir, $toZip);
        } else {
            \Log::warning("YOLO: Output directory not found", ['outputDir' => $outputDir]);
        }
        
        $this->makeZip($toZip, $path);
    }
    
    /**
     * Override makeZip to handle symlinks properly
     */
    protected function makeZip($files, $path)
    {
        $zip = \App::make(\ZipArchive::class);
        $open = $zip->open($path, \ZipArchive::OVERWRITE);

        if ($open !== true) {
            throw new \Exception("Could not open ZIP file '{$path}'.");
        }

        try {
            foreach ($files as $source => $target) {
                // Check if file is a symlink
                if (is_link($source)) {
                    // Add symlink to zip
                    $linkTarget = readlink($source);
                    $zip->addFromString($target, $linkTarget);
                    // Set external attributes to mark as symlink
                    $zip->setExternalAttributesName($target, \ZipArchive::OPSYS_UNIX, 0120777 << 16);
                } else {
                    // Regular file
                    $zip->addFile($source, $target);
                }
            }
        } finally {
            $zip->close();
        }
    }
    
    /**
     * Override executeScript to pass YOLO-specific arguments before CSV files
     */
    protected function executeScript($scriptName, $path)
    {
        $imagePath = $this->options->get('yoloImagePath', '');
        $splitRatio = $this->options->get('yoloSplitRatio', '0.7 0.2 0.1');
        
        // Call parent's pythonScriptRunner directly with custom arguments
        // Command format: python script.py volumeName path imagePath splitRatio csv1 csv2 ...
        $python = config('reports.python');
        $script = config("reports.scripts.{$scriptName}");
        $csvs = implode(' ', array_map(fn ($csv) => $csv->getPath(), $this->tmpFiles));
        
        $command = sprintf(
            "%s %s \"%s\" %s %s %s %s 2>&1",
            $python,
            $script,
            $this->source->name,
            $path,
            escapeshellarg($imagePath),
            escapeshellarg($splitRatio),
            $csvs
        );
        
        exec($command, $lines, $code);
        
        if ($code !== 0) {
            throw new \Exception("The report script '{$scriptName}' failed with exit code {$code}:\n".implode("\n", $lines));
        }
    }
    
    /**
     * Recursively add all files from a directory to the zip array
     */
    protected function addDirectoryToZip($dir, &$toZip, $basePath = '')
    {
        $items = new \DirectoryIterator($dir);
        foreach ($items as $item) {
            if ($item->isDot()) continue;
            
            $relativePath = $basePath ? $basePath . '/' . $item->getFilename() : $item->getFilename();
            
            if ($item->isDir()) {
                $this->addDirectoryToZip($item->getPathname(), $toZip, $relativePath);
            } else {
                $toZip[$item->getPathname()] = $relativePath;
            }
        }
    }
    
    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this
            ->initQuery([
                'image_annotation_labels.id as annotation_label_id',
                'image_annotation_labels.label_id',
                'labels.name as label_name',
                'users.id as user_id',
                'images.id as image_id',
                'images.filename',
                'images.lng as longitude',
                'images.lat as latitude',
                'shapes.name as shape_name',
                'image_annotations.points',
                'images.attrs',
            ])
            ->join('shapes', 'image_annotations.shape_id', '=', 'shapes.id')
            ->leftJoin('users', 'image_annotation_labels.user_id', '=', 'users.id')
            ->orderBy('image_annotation_labels.id');

        return $query;
    }

    /**
     * Create a CSV file for this report.
     *
     * @param \Illuminate\Support\Collection $rows The rows for the CSV
     * @return CsvFile
     */
    protected function createCsv($rows)
    {
        $csv = CsvFile::makeTmp();
        // column headers
        $csv->putCsv([
            'annotation_label_id',
            'label_id',
            'label_name',
            'image_id',
            'filename',
            'image_longitude',
            'image_latitude',
            'shape_name',
            'points',
            'attributes',
        ]);

        foreach ($rows as $row) {
            $csv->putCsv([
                $row->annotation_label_id,
                $row->label_id,
                $row->label_name,
                $row->image_id,
                $row->filename,
                $row->longitude,
                $row->latitude,
                $row->shape_name,
                $row->points,
                $row->attrs,
            ]);
        }

        $csv->close();

        return $csv;
    }
}
