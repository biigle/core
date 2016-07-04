<?php

namespace Dias\Contracts;

use Illuminate\Http\Request;

/**
 * A label source adapter
 */
interface LabelSourceAdapterContract
{
    /**
     * Find a label in the label source
     *
     * @param string $query The query string (e.g. label name)
     *
     * @return array All labels of the label source that match the query
     */
    public function find($query);

    /**
     * Create the label (or labels) from the label source based on an API request
     *
     * The request may contain arbitrary input data. This function may create multiple
     * labels (e.g. all parent labels of the label to create) as well.
     *
     * @param Request $request
     *
     * @return array Array of Label objects that were created
     */
    public function create(Request $request);
}
