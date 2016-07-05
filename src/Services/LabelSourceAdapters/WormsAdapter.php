<?php

namespace Dias\Modules\LabelTrees\Services\LabelSourceAdapters;

use Dias\Contracts\LabelSourceAdapterContract;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use SoapClient;
use Dias\Label;

/**
 * WoRMS label source adapter
 */
class WormsAdapter implements LabelSourceAdapterContract
{

    /**
     * SOAP client for the WoRMS webservice
     *
     * @var SoapClient
     */
    private $client;

    /**
     * Create a new WoRMS label adapter
     */
    public function __construct ()
    {
        $this->client = app()->make(SoapClient::class, [
            "http://www.marinespecies.org/aphia.php?p=soap&wsdl=1",
            // explicitly define the optional second argument because the IoC can't
            // resolve it automatically
            []
        ]);
    }

    /**
     * Find labels by scientific name
     *
     * Uses the `getAphiaRecords` function of the WoRMS web service.
     * see: http://www.marinespecies.org/aphia.php?p=soap
     *
     * @param string $query
     *
     * @return array
     */
    public function find($query)
    {
        // add '%' for SQL LIKE matching
        $results = $this->client->getAphiaRecords("%{$query}%");
        $results = array_filter($results, [$this, 'filterUnaccepted']);
        return array_map([$this, 'parseItem'], $results);
    }

    /**
     * Create the label (or labels) from the label source based on an API request.
     *
     * Required request parameters:
     *
     * string  name  Name of the new label
     * string  color  Color of the new label (like `bada55`)
     * int  source_id  AphiaID of the new label in WoRMS
     * int  label_source_id  ID of the WoRMS LabelSource
     *
     *
     * Optional request parameters:
     *
     * bool  recursive  Specifies if all parent labels should be fetched and inserted, too.
     * int  parent_id  ID of the parent label. Must not be present if recursive is present.
     *
     * @param int $id Label tree ID
     * @param Request $request
     *
     * @return array Array of Label objects that were created
     */
    public function create($id, Request $request)
    {
        $attributes = $request->only([
            'name',
            'color',
            'parent_id',
            'source_id',
            'label_source_id',
        ]);

        $attributes['label_tree_id'] = $id;

        if ($this->client->getAphiaNameByID($attributes['source_id']) === null) {
            throw new ValidationException(null, [
                'source_id' => ['The AphiaID does not exist.'],
            ]);
        }

        $recursive = $request->input('recursive', 'false');

        if ($recursive === 'true') {
            if ($request->has('parent_id')) {
                throw new ValidationException(null, [
                    'parent_id' => ['The label must not have a parent if it should be created recursively.'],
                ]);
            }

            return $this->createRecursiveLabels($attributes);
        }


        return [$this->createSingleLabel($attributes)];
    }

    /**
     * Returns `true` for accepted WoRMS items and `false` otherwise
     *
     * @param array $item
     * @return bool
     */
    private function filterUnaccepted($item)
    {
        return $item['status'] === 'accepted';
    }

    /**
     * Parse a WoRMS item to the internal representation
     *
     * @param array $item
     * @return array
     */
    private function parseItem($item)
    {
        return [
            'aphia_id' => $item['AphiaID'],
            'name' => $item['scientificname'],
            'url' => $item['url'],
            'rank' => $item['rank'],
            // use array_filter to remove empty elements
            'parents' => array_filter(array_values(array_only($item, [
                'kingdom',
                'phylum',
                'class',
                'order',
                'family',
                'genus',
            ]))),
        ];
    }

    /**
     * Create (and save) a single label
     *
     * @param array $attributes All label attributes
     *
     * @return array Array containing the single label
     */
    private function createSingleLabel(array $attributes)
    {
        $label = new Label;
        $label->name = $attributes['name'];
        $label->color = $attributes['color'];
        $label->parent_id = $attributes['parent_id'];
        $label->source_id = (string) $attributes['source_id'];
        $label->label_source_id = $attributes['label_source_id'];
        $label->label_tree_id = $attributes['label_tree_id'];
        $label->save();

        return $label;
    }

    /**
     * Create (and save) a label and all WoRMS parents that don't already exist in the tree
     *
     * @param array $attributes All label attributes
     *
     * @return array Array containing all newly created labels
     */
    private function createRecursiveLabels(array $attributes)
    {
        $labels = [];

        // get all parent labels of the label to create
        $hierarchy = $this->client->getAphiaClassificationByID($attributes['source_id']);
        $parents = $this->extractParents($hierarchy);

        // set the custom name of the label of this request so it can be treated
        // like all parent labels that should be created as well
        $parents[sizeof($parents) - 1]['name'] = $attributes['name'];

        // get parents that already exist in the label tree
        $existing = Label::whereIn('source_id', array_pluck($parents, 'aphia_id'))
            ->where('label_tree_id', $attributes['label_tree_id'])
            ->where('label_source_id', $attributes['label_source_id'])
            ->pluck('id', 'source_id')
            ->toArray();

        // find index of the first item in $parents that should be created.
        // all lower indices are assumend to exist
        $index = 0;
        for ($i = sizeof($parents) - 1; $i >= 0 ; $i--) {
            if (array_key_exists($parents[$i]['aphia_id'], $existing)) {
                $index = $i + 1;
                break;
            }
        }

        if ($index > 0) {
            // the label ID of the parent of the first label that should be created
            $parentId = $existing[$parents[$index - 1]['aphia_id']];
        } else {
            // no label exists and we start from the root
            $parentId = null;
        }

        while ($index < sizeof($parents)) {
            $attributes['source_id'] = $parents[$index]['aphia_id'];
            $attributes['name'] = $parents[$index]['name'];
            $attributes['parent_id'] = $parentId;
            $label = $this->createSingleLabel($attributes);
            $labels[] = $label;
            $parentId = $label->id;
            $index++;
        }

        return $labels;
    }

    /**
     * Extract the aphia IDs in correct ordering from a WoRMS classification hierarchy
     *
     * @param object $hierarchy
     *
     * @return array Arrays with aphia_id and name of each label
     */
    private function extractParents($hierarchy)
    {
        $ids = [];

        while (property_exists($hierarchy, 'child')) {
            $ids[] = [
                'name' => $hierarchy->scientificname,
                'aphia_id' => $hierarchy->AphiaID,
            ];
            $hierarchy = $hierarchy->child;
        }

        return $ids;
    }
}
