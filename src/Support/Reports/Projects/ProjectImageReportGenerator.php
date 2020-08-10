<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects;

class ProjectImageReportGenerator extends ProjectReportGenerator
{
    /**
     * {@inheritdoc}
     */
    protected function getProjectSources()
    {
        return $this->source->imageVolumes;
    }
}
