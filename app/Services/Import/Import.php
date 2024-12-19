<?php

namespace Biigle\Services\Import;

use Exception;
use File;
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
    public function __construct($path)
    {
        $this->path = $path;
    }

    /**
     * Check if this import matches to the given import files.
     *
     * @return bool
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
        return array_map(fn ($file) => File::basename($file), File::files($this->path));
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
     * @param string $file File name under $this->path
     * @param array $expectation Expected keys.
     * @param bool $array Specifies if the file to validate contains an array or not.
     *
     * @throws Exception If keys are missing.
     */
    protected function expectKeysInJson($file, $expectation, $array = true)
    {
        $content = $this->collectJson($file);
        $validate = function ($item) use ($file, $expectation) {
            $diff = array_diff($expectation, array_keys($item));
            if (!empty($diff)) {
                $keys = implode(', ', $diff);
                throw new Exception("Items in the {$file} file are missing keys: {$keys}.");
            }
        };

        if ($array) {
            $content->each($validate);
        } else {
            $validate($content->toArray());
        }
    }

    /**
     * Validates a CSV file to contain the expected columns.
     *
     * @param string $file File name under $this->path
     * @param array $expectation Expected columns.
     *
     * @throws Exception If columns are missing.
     */
    protected function expectColumnsInCsv($file, $expectation)
    {
        $csv = new SplFileObject("{$this->path}/{$file}", 'r');
        $columns = $csv->fgetcsv();
        $diff = array_diff($expectation, $columns);
        if (!empty($diff)) {
            $columns = implode(', ', $diff);
            throw new Exception("The {$file} file is missing columns: {$columns}.");
        }

        $diff = array_diff($columns, $expectation);
        if (!empty($diff)) {
            $columns = implode(', ', $diff);
            throw new Exception("The {$file} file has unexpected columns: {$columns}.");
        }
    }

    /**
     * Read a JSON file containing an array and wrap it in a Laravel collection.
     *
     * @param string $file File name under $this->path
     *
     * @return \Illuminate\Support\Collection
     */
    protected function collectJson($file)
    {
        return collect(json_decode(File::get("{$this->path}/{$file}"), true));
    }
}
