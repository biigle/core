<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects;

class ProjectVideoReportGenerator extends ProjectReportGenerator
{
    /**
     * {@inheritdoc}
     */
    protected function getProjectSources()
    {
        return $this->source->videoVolumes;
    }
}
