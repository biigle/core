<?php

namespace Biigle\Services\Reports;

class CsvFile extends File
{
    /**
     * Field delimiter.
     *
     * @var string
     */
    protected $delimiter;

    /**
     * String enclosure character.
     *
     * @var string
     */
    protected $enclosure;

    /**
     * Escape character.
     *
     * @var string
     */
    protected $escape_char;

    /**
     * Create a new CSV file.
     *
     * @param string $path File path. If not set, a temporary file will be created.
     * @param string $delimiter Optional field delimiter
     * @param string $enclosure Optional string enclosure character
     * @param string $escape_char Oprional escape character
     */
    public function __construct($path = null, $delimiter = ',', $enclosure = '"', $escape_char = '\\')
    {
        parent::__construct($path);
        $this->delimiter = $delimiter;
        $this->enclosure = $enclosure;
        $this->escape_char = $escape_char;
    }

    /**
     * Append a new row to the CSV file.
     */
    public function putCsv(array $items)
    {
        fputcsv($this->handle, $items, $this->delimiter, $this->enclosure, $this->escape_char);
    }
}
