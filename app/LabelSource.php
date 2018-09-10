<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Model;

/**
 * The source (database) of a label.
 */
class LabelSource extends Model
{
    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Returns the label source adapter of this label source.
     *
     * If the name is `worms`, the adapter will be
     * `Biigle\Services\LabelSourceAdapters\WormsAdapter`.
     * If the name is `ab_cd`, the adapter will be
     * `Biigle\Services\LabelSourceAdapters\AbCdAdapter`.
     *
     * @return \Biigle\Contracts\LabelSourceAdapterContract
     */
    public function getAdapter()
    {
        $name = studly_case($this->name);

        return app()->make("Biigle\Services\LabelSourceAdapters\\{$name}Adapter");
    }
}
