<?php

namespace Dias\Http\Controllers\Api;

use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Dias\Label;

class LabelController extends Controller
{
    /**
     * Creates a new LabelController instance.
     * 
     * @param Guard $auth
     * @param Request $request
     */
    public function __construct(Guard $auth, Request $request)
    {
        parent::__construct($auth, $request);
        $this->middleware('admin', ['except' => ['index', 'show']]);
    }

    /**
     * Checks if the request contains a parent ID and tries to associate the
     * parent with the given label. Aborts with 400 if the parent does not
     * exist.
     * 
     * @param Label $label
     * @return void
     */
    private function maybeSetParent($label)
    {
        if ($this->request->has('parent_id')) {
            $parent = Label::find($this->request->input('parent_id'));

            if (!$parent) {
                abort(400, 'Parent label with ID "'.$this->request->input('parent_id').'" does not exist!');
            }

            $label->parent()->associate($parent);
        }
    }

    /**
     * Shows a list of all labels.
     * 
     * @api {get} labels Get all label categories
     * @apiGroup Labels
     * @apiName IndexLabels
     * @apiPermission user
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "aphia_id": null,
     *       "id": 1,
     *       "name": "Benthic Object",
     *       "parent_id": null
     *    },
     *    {
     *       "aphia_id": null,
     *       "id": 2,
     *       "name": "Coral",
     *       "parent_id": 1
     *    }
     * ]
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return Label::all();
    }

    /**
     * Displays the specified label.
     * 
     * @api {get} labels/:id Get a label category
     * @apiGroup Labels
     * @apiName ShowLabels
     * @apiPermission user
     * 
     * @apiParam {Number} id The label ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "aphia_id": null,
     *    "id": 1,
     *    "name": "Benthic Object",
     *    "parent_id": null
     * }
     *
     * @param  int  $id
     * @return Label
     */
    public function show($id)
    {
        return $this->requireNotNull(Label::find($id));
    }

    /**
     * Creates a new label.
     * 
     * @api {post} labels Create a new label category
     * @apiGroup Labels
     * @apiName StoreLabels
     * @apiPermission admin
     * 
     * @apiParam (Required arguments) {String} name Name of the new label category.
     * 
     * @apiParam (Optional arguments) {Number} parent_id ID of the parent label category for ordering in a tree-like stricture.
     * @apiParam (Optional arguments) {Number} aphia_id The [WoRMS](http://www.marinespecies.org/) AphiaID.
     * 
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 4,
     *    "name": "Sea Cucumber",
     *    "parent_id": 1,
     *    "aphia_id": 1234
     * }
     *
     * @return Label
     */
    public function store()
    {
        $this->validate($this->request, Label::$createRules);

        $label = new Label;
        $label->name = $this->request->input('name');
        $label->aphia_id = $this->request->input('aphia_id');
        $this->maybeSetParent($label);

        $label->save();
        // call fresh, so the parent object is not included
        return $label->fresh();
    }

    /**
     * Updates the attributes of the specified label.
     * 
     * @api {put} labels/:id Update a label category
     * @apiGroup Labels
     * @apiName UpdateLabels
     * @apiPermission admin
     * 
     * @apiParam {Number} id The label ID.
     * 
     * @apiParam (Attributes that can be updated) {String} name Name of the label category.
     * @apiParam (Attributes that can be updated) {Number} parent_id ID of the parent label category for ordering in a tree-like stricture.
     * @apiParam (Attributes that can be updated) {Number} aphia_id The [WoRMS](http://www.marinespecies.org/) AphiaID.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update($id)
    {
        $label = $this->requireNotNull(Label::find($id));
        $label->name = $this->request->input('name', $label->name);
        $label->aphia_id = $this->request->input('aphia_id', $label->aphia_id);
        $this->maybeSetParent($label);

        $label->save();
    }

    /**
     * Removes the specified label.
     * 
     * @api {delete} labels/:id Delete a label category
     * @apiGroup Labels
     * @apiName DestroyLabels
     * @apiPermission admin
     * @apiDescription If a label category is still attached to an annotation, it cannot be removed. Also, if a label category has child labels, the `force` argument is required.
     * 
     * @apiParam {Number} id The label ID.
     * 
     * @apiParam (Optional parameters) {Boolean} force Set this parameter to delete label categories with child labels.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $label = $this->requireNotNull(Label::find($id));

        if ($label->hasChildren && !$this->request->has('force')) {
            abort(400, 'The label has child labels. Add the "force" parameter to delete the label and all its child labels.');
        }

        $label->delete();

        return response('Deleted.', 200);
    }
}
