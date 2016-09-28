<?php

namespace Dias\Modules\Export\Support\Reports\Projects\Annotations;

use DB;
use Dias\Modules\Export\Transect;
use Dias\Modules\Export\Support\Reports\Projects\Report as BaseReport;

class Report extends BaseReport
{
    /**
     * Get the report name
     *
     * @return string
     */
    public function getName()
    {
        if ($this->isRestricted()) {
            return "{$this->name} (restricted to export area)";
        }

        return $this->name;
    }

    /**
     * Get the filename
     *
     * @return string
     */
    public function getFilename()
    {
        if ($this->isRestricted()) {
            return "{$this->filename}_restricted";
        }

        return $this->filename;
    }

    /**
     * Should this report be restricted to the export area?
     *
     * @return boolean
     */
    protected function isRestricted()
    {
        return $this->options->get('exportArea', false);
    }
}
