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
        $restrictions = [];

        if ($this->isRestrictedToExportArea()) {
            $restrictions[] = 'export area';
        }

        if ($this->isRestrictedToNewestLabel()) {
            $restrictions[] = 'newest label for each annotation';
        }

        if (!empty($restrictions)) {
            $suffix = implode(' and ', $restrictions);

            return "{$this->name} (restricted to {$suffix})";
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
        $restrictions = [];

        if ($this->isRestrictedToExportArea()) {
            $restrictions[] = 'export_area';
        }

        if ($this->isRestrictedToNewestLabel()) {
            $restrictions[] = 'newest_label';
        }

        if (!empty($restrictions)) {
            $suffix = implode('_', $restrictions);

            return "{$this->filename}_restricted_to_{$suffix}";
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

    /**
     * Determines if this report should take only the newest label for each annotation.
     *
     * @return bool
     */
    protected function isRestrictedToNewestLabel()
    {
        return $this->options->get('newestLabel', false);
    }
}
