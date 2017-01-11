<?php

namespace Biigle\Modules\Export\Support;

use App;
use File;
use Biigle\Modules\Export\Contracts\DeletableContract;

class CsvFile implements DeletableContract
{
    /**
     * File path
     *
     * @var string
     */
    protected $path;

    /**
     * File handle for the CSV file
     *
     * @var resource
     */
    protected $handle;

    /**
     * Field delimiter
     *
     * @var string
     */
    protected $delimiter;

    /**
     * String enclosure character
     *
     * @var string
     */
    protected $enclosure;

    /**
     * Escape character
     *
     * @var string
     */
    protected $escape_char;

    /**
     * Create a new CSV file
     *
     * @param string $path File path. If not set, a temporary file will be created.
     * @param string $delimiter Optional field delimiter
     * @param string $enclosure Optional string enclosure character
     * @param string $escape_char Oprional escape character
     */
    public function __construct($path = null, $delimiter = ',', $enclosure = '"', $escape_char = '\\')
    {
        if (is_null($path)) {
            $this->path = tempnam(config('export.tmp_storage').'/', 'biigle-export-csv-');
        } else {
            $this->path = $path;
        }

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
     * Creates a new temporary CsvFile
     *
     * @return CsvFile
     */
    public static function makeTmp()
    {
        return App::make(static::class);
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
     * Close the CSV file
     */
    public function close()
    {
        try {
            fclose($this->handle);
        } catch (\Exception $e) {
            //
        }
    }

    /**
     * Returns the path of the CSV file
     *
     * @return string
     */
    public function getPath()
    {
        return $this->path;
    }
}
