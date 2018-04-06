<?php

namespace Biigle\Modules\Sync\Support\Import;

use File;
use Exception;
use SplFileObject;

class Import
{
    /**
     * Path to the directory with the import files.
     *
     * @var string
     */
    protected $path;

    /**
     * Create a new instance.
     *
     * @param string $path Path to the directory with the import files.
     */
    function __construct($path)
    {
        $this->path = $path;
    }

    /**
     * Check if this import matches to the given import files.
     *
     * @return boolean
     */
    public function filesMatch()
    {
        $files = $this->files();
        sort($files);
        $expected = $this->expectedFiles();
        sort($expected);

        return $files == $expected;
    }

    /**
     * Check if the files of this import are valid.
     *
     * @throws Exception If any of the import files is invalid.
     */
    public function validateFiles()
    {
        foreach ($this->files() as $file) {
            $this->validateFile($file);
        }
    }

    /**
     * The files expected by this import.
     *
     * @return array
     */
    protected function expectedFiles()
    {
        return [];
    }

    /**
     * Get the basename of each file of this import.
     *
     * @return array
     */
    protected function files()
    {
        return array_map(function ($file) {
            return File::basename($file);
        }, File::files($this->path));
    }

    /**
     * Validate a file of this import.
     *
     * @param string $basename Basename of the file.
     *
     * @throws Exception If the file is invalid.
     */
    protected function validateFile($basename)
    {
        throw new Exception("The {$basename} file does not belong to this import.");
    }

    /**
     * Validates a JSON file to contain an array of objects, each of which has all the expected keys.
     *
     * @param string $path Path to the JSON file.
     * @param array $expectation Expected keys.
     *
     * @throws Exception If keys are missing.
     */
    protected function expectKeysInJson($path, $expectation)
    {
        $content = json_decode(File::get($path), true);

        foreach ($content as $item) {
            $diff = array_diff($expectation, array_keys($item));
            if (!empty($diff)) {
                $basename = File::basename($path);
                throw new Exception("Items in the {$basename} file are missing keys: ".implode(', ', $diff).'.');
            }
        }
    }

    /**
     * Validates a CSV file to contain the expected columns.
     *
     * @param string $path Path to the CSV file.
     * @param array $expectation Expected columns.
     *
     * @throws Exception If columns are missing.
     */
    protected function expectColumnsInCsv($path, $expectation)
    {
        $csv = new SplFileObject($path, 'r');
        $columns = $csv->fgetcsv();
        $diff = array_diff($expectation, $columns);
        if (!empty($diff)) {
            throw new Exception("The {$basename} file is missing columns: ".implode(', ', $diff).'.');
        }

        $diff = array_diff($columns, $expectation);
        if (!empty($diff)) {
            throw new Exception("The {$basename} file has unexpected columns: ".implode(', ', $diff).'.');
        }
    }
}
