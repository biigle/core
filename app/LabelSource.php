<?php

namespace Biigle;

use App;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Str;

/**
 * The source (database) of a label.
 */
class LabelSource extends Model
{
    use HasFactory;

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
        $name = Str::studly($this->name);

        return App::make("Biigle\Services\LabelSourceAdapters\\{$name}Adapter");
    }
}
