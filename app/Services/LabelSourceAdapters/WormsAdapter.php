<?php

namespace Biigle\Services\LabelSourceAdapters;

use \Illuminate\Http\Response;
use Arr;
use Biigle\Contracts\LabelSourceAdapterContract;
use Biigle\Label;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Ramsey\Uuid\Uuid;
use SoapClient;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

/**
 * WoRMS label source adapter.
 */
class WormsAdapter implements LabelSourceAdapterContract
{
    /**
     * WoRMS limits their results to a maximum of 50. We use a loop to get more results
     * for each "find" request. This is the number of maximum results that the loop will
     * return to prevent too many requests.
     *
     * @var int
     */
    const MAX_RESULTS = 500;

    /**
     * SOAP client for the WoRMS webservice.
     *
     * @var SoapClient
     */
    protected $client;

    /**
     * Set the SOAP client instance to use for requests.
     *
     * @param SoapClient $client
     */
    public function setSoapClient(SoapClient $client)
    {
        $this->client = $client;
    }

    /**
     * Get the SOAP client instance to use for requests.
     *
     * @return SoapClient
     */
    public function getSoapClient()
    {
        if (!isset($this->client)) {
            $this->client = new SoapClient('http://www.marinespecies.org/aphia.php?p=soap&wsdl=1', config('label-trees.soap_options'));
        }

        return $this->client;
    }

    /**
     * Find labels by scientific name.
     *
     * Uses the `getAphiaRecords` function of the WoRMS web service.
     * see: http://www.marinespecies.org/aphia.php?p=soap
     *
     * @param Request $request
     *
     * @return array
     */
    public function find(Request $request)
    {
        $results = [];
        $currentResults = [];
        $offset = 1;

        $query = $request->input('query');

        if (!$query) {
            return [];
        }

        try {
            $client = $this->getSoapClient();

            // WoRMS returns a maximum of 50 results per request. We use a loop to get more
            // results but take care to stop it if it runs too often.
            do {
                // Method signature is:
                // string $like Add a '%'-sign added after the ScientificName (SQL LIKE function). Default=true
                // bool $like (deprecated)
                // bool $fuzzy (deprecated)
                // bool $marine_only Limit to marine taxa. Default=true
                // int $offset Starting recordnumber, when retrieving next chunk of (50) records. Default=1
            
                $currentResults = $client->getAphiaRecords("%{$query}%", null, null, true, $offset);
            
                if (!is_array($currentResults)) {
                    break;
                }
                $results = array_merge($results, $currentResults);
                $offset += 50;
            } while (count($currentResults) === 50 && $offset < self::MAX_RESULTS);

        } catch(\SoapFault $sf) {
            throw new ServiceUnavailableHttpException(message: 'The WoRMS server is currently unavailable.');
        }

            if (!$request->input('unaccepted', false)) {
                // use array_values because array_filter retains the keys and this might
                // produce a JSON object output and no array output in the HTTP response
                $results = array_values(array_filter($results, [$this, 'filterUnaccepted']));
            }

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
            'source_id',
            'label_source_id',
        ]);

        $attributes['parent_id'] = $request->input('parent_id');
        $attributes['label_tree_id'] = $id;

        try {
            $client = $this->getSoapClient();
        
            if ($client->getAphiaNameByID($attributes['source_id']) === null) {
                throw ValidationException::withMessages([
                    'source_id' => ['The AphiaID does not exist.'],
                ]);
            }

            $recursive = $request->input('recursive', 'false');

            if ($recursive === 'true') {
                if ($request->has('parent_id')) {
                    throw ValidationException::withMessages([
                        'parent_id' => ['The label must not have a parent if it should be created recursively.'],
                    ]);
                }

                return $this->createRecursiveLabels($attributes);
            }

        } catch(\SoapFault $sf) {
            throw new ServiceUnavailableHttpException(message: 'The WoRMS server is currently unavailable.');
        }

            return [$this->createSingleLabel($attributes)];
    
    }

    /**
     * Returns `true` for accepted WoRMS items and `false` otherwise.
     *
     * @param object $item
     * @return bool
     */
    private function filterUnaccepted($item)
    {
        return $item->status === 'accepted';
    }

    /**
     * Parse a WoRMS item to the internal representation.
     *
     * @param object $item
     * @return array
     */
    private function parseItem($item)
    {
        $item = (array) $item;

        return [
            'aphia_id' => $item['AphiaID'],
            'name' => $item['scientificname'],
            'url' => $item['url'],
            'rank' => $item['rank'],
            'accepted' => $item['status'] === 'accepted',
            // use array_filter to remove empty elements
            // and the outer array_values to reset array keys so it is not parsed as
            // object in the JSON output
            'parents' => array_values(array_filter(array_values(Arr::only($item, [
                'kingdom',
                'phylum',
                'class',
                'order',
                'family',
                'genus',
            ])))),
        ];
    }

    /**
     * Create (and save) a single label.
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
        $label->uuid = Uuid::uuid4();
        $label->save();

        return $label;
    }

    /**
     * Create (and save) a label and all WoRMS parents that don't already exist in the tree.
     *
     * @param array $attributes All label attributes
     *
     * @return array Array containing all newly created labels
     */
    private function createRecursiveLabels(array $attributes)
    {
        $labels = [];

        // get all parent labels of the label to create
        $client = $this->getSoapClient();
        $hierarchy = $client->getAphiaClassificationByID($attributes['source_id']);
        $parents = $this->extractParents($hierarchy);

        // set the custom name of the label of this request so it can be treated
        // like all parent labels that should be created as well
        $parents[sizeof($parents) - 1]['name'] = $attributes['name'];

        // get parents that already exist in the label tree
        $existing = Label::whereIn('source_id', Arr::pluck($parents, 'aphia_id'))
            ->where('label_tree_id', $attributes['label_tree_id'])
            ->where('label_source_id', $attributes['label_source_id'])
            ->pluck('id', 'source_id')
            ->toArray();

        // find index of the first item in $parents that should be created.
        // all lower indices are assumend to exist
        $index = 0;
        for ($i = sizeof($parents) - 1; $i >= 0; $i--) {
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
     * Extract the aphia IDs in correct ordering from a WoRMS classification hierarchy.
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
