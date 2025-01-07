<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects;

class ProjectVideoReportGenerator extends ProjectReportGenerator
{
    /**
     * {@inheritdoc}
     */
    public function getProjectSources()
    {
        return $this->source->videoVolumes;
    }
}
