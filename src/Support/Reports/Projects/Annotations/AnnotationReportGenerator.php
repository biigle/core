<?php

namespace Biigle\Modules\Export\Support\Reports\Projects\Annotations;

use Biigle\Modules\Export\Support\Reports\Projects\ProjectReportGenerator;

class AnnotationReportGenerator extends ProjectReportGenerator
{
    /**
     * Get the report name.
     *
     * @return string
     */
    public function getName()
    {
        if ($this->isRestrictedToExportArea()) {
            return "{$this->name} (restricted to export area)";
        }

        return $this->name;
    }

    /**
     * Get the filename.
     *
     * @return string
     */
    public function getFilename()
    {
        if ($this->isRestrictedToExportArea()) {
            return "{$this->filename}_restricted_to_export_area";
        }

        return $this->filename;
    }

    /**
     * Should this report be restricted to the export area?
     *
     * @return bool
     */
    protected function isRestrictedToExportArea()
    {
        return $this->options->get('exportArea', false);
    }
}
