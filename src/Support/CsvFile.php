<?php

namespace Dias\Modules\Export\Support;

use File;

class CsvFile
{
    /**
     * File path
     *
     * @var string
     */
    public $path;

    /**
     * File handle for the CSV file
     *
     * @var resource
     */
    private $handle;

    /**
     * Field delimiter
     *
     * @var string
     */
    private $delimiter;

    /**
     * String enclosure character
     *
     * @var string
     */
    private $enclosure;

    /**
     * Escape character
     *
     * @var string
     */
    private $escape_char;

    /**
     * Create a new CSV file
     *
     * @param string $path File path
     * @param string $delimiter Optional field delimiter
     * @param string $enclosure Optional string enclosure character
     * @param string $escape_char Oprional escape character
     */
    public function __construct($path, $delimiter = ',', $enclosure = '"', $escape_char = '\\')
    {
        $this->path = $path;
        $this->delimiter = $delimiter;
        $this->enclosure = $enclosure;
        $this->escape_char = $escape_char;
        $this->handle = fopen($this->path, 'w');
    }

    public function __destruct()
    {
        $this->close();
    }

    /**
     * Creates a new CsvFile in the temporary storage
     *
     * @return CsvFile
     */
    public static function makeTmp()
    {
        do {
            $path = uniqid(config('export.tmp_storage').'/');
        } while (File::exists($path));

        return app()->make(self::class, [$path]);
    }

    /**
     * Append a new row to the CSV file
     *
     * @param array $items Row items
     */
    public function put(array $items)
    {
        fputcsv($this->handle, $items, $this->delimiter, $this->enclosure, $this->escape_char);
    }

    /**
     * Delete the CSV file
     */
    public function delete()
    {
        $this->close();
        File::delete($this->path);
    }

    /**
     * Return the basename of this file
     *
     * @return string
     */
    public function basename()
    {
        return File::basename($this->path);
    }

    /**
     * Return the dirname of this file
     *
     * @return string
     */
    public function dirname()
    {
        return File::dirname($this->path);
    }

    /**
     * Close the CSV file
     */
    private function close()
    {
        try {
            fclose($this->handle);
        } catch (\Exception $e) {
            //
        }
    }
}
