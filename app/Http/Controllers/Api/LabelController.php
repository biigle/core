<?php

namespace Dias\Http\Controllers\Api;

use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Dias\Label;

class LabelController extends Controller
{
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
     * @apiDescription This does not include project specific label categories.
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
        return Label::whereNull('project_id')->get();
    }

    /**
     * Displays the specified label.
     *
     * @api {get} labels/:id Get a label category
     * @apiDescription This does not include project specific label categories.
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
        return $this->requireNotNull(Label::whereNull('project_id')->find($id));
    }

    /**
     * Creates a new label.
     *
     * @api {post} labels Create a new (project specific) label category
     * @apiDescription Project specific label categories can only be created by project admins. Global categories can only be created by global admins.
     * @apiGroup Labels
     * @apiName StoreLabels
     * @apiPermission adminOrProjectAdmin
     *
     * @apiParam (Required arguments) {String} name Name of the new label category.
     *
     * @apiParam (Optional arguments) {Number} parent_id ID of the parent label category for ordering in a tree-like stricture.
     * @apiParam (Optional arguments) {Number} aphia_id The [WoRMS](http://www.marinespecies.org/) AphiaID.
     * @apiParam (Optional arguments) {Number} project_id ID of the project, this category should belong to. If this attribute is present, the category becomes a project specific category.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 4,
     *    "name": "Sea Cucumber",
     *    "parent_id": 1,
     *    "aphia_id": 1234,
     *    "project_id": null
     * }
     *
     * @return Label
     */
    public function store()
    {
        $this->validate($this->request, Label::$createRules);

        if ($this->request->has('project_id')) {
            // if the project exists is checked by the validation before
            $this->requireCanAdmin(\Dias\Project::find($this->request->input('project_id')));
        } else {
            $this->requireAdmin();
        }

        $label = new Label;
        $label->name = $this->request->input('name');
        $label->aphia_id = $this->request->input('aphia_id');
        $label->project_id = $this->request->input('project_id');
        $label->parent_id = $this->request->input('parent_id');

        $label->save();
        // the parent object shouldn't be returned
        unset($label->parent);
        return $label;
    }

    /**
     * Updates the attributes of the specified label.
     *
     * @api {put} labels/:id Update a label category
     * @apiDescription Project specific label categories can only be updated by project admins. Global categories can only be updated by global admins.
     * @apiGroup Labels
     * @apiName UpdateLabels
     * @apiPermission adminOrProjectAdmin
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
        $this->validate($this->request, Label::$updateRules);
        $label = $this->requireNotNull(Label::find($id));

        if ($label->project_id === null) {
            $this->requireAdmin();
        } else {
            $this->requireCanAdmin($label->project);
        }

        $label->name = $this->request->input('name', $label->name);
        $label->aphia_id = $this->request->input('aphia_id', $label->aphia_id);
        $label->parent_id = $this->request->input('parent_id', $label->parent_id);

        $label->save();
    }

    /**
     * Removes the specified label.
     *
     * @api {delete} labels/:id Delete a label category
     * @apiGroup Labels
     * @apiName DestroyLabels
     * @apiPermission adminOrProjectAdmin
     * @apiDescription If a label category is still attached to an annotation, it cannot be removed. Also, if a label category has child labels, the `force` argument is required.
     * Project specific label categories can only be deleted by project admins. Global categories can only be deleted by global admins.
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

        if ($label->project_id === null) {
            $this->requireAdmin();
        } else {
            $this->requireCanAdmin($label->project);
        }

        if ($label->hasChildren && !$this->request->has('force')) {
            abort(400, 'The label has child labels. Add the "force" parameter to delete the label and all its child labels.');
        }

        $label->delete();

        return response('Deleted.', 200);
    }
}
