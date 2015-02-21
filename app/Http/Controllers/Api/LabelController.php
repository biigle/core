<?php namespace Dias\Http\Controllers\Api;

use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

use Dias\Label;

class LabelController extends Controller {

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
		if ($this->request->has('parent_id'))
		{
			$parent = Label::find($this->request->input('parent_id'));

			if (!$parent)
			{
				abort(400, 'Parent label with ID "'.$this->request->input('parent_id').'" does not exist!');
			}

			$label->parent()->associate($parent);
		}
	}

	/**
	 * Shows a list of all labels.
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
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function show($id)
	{
		return $this->requireNotNull(Label::find($id));
	}

	/**
	 * Creates a new label.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store()
	{
		$this->requireArguments('name');

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
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function destroy($id)
	{
		$label = $this->requireNotNull(Label::find($id));

		if ($label->hasChildren && !$this->request->has('force'))
		{
			abort(400, 'The label has child labels. Add the "force" parameter to delete the label and all its child labels.');
		}

		$label->delete();
		return response('Deleted.', 200);
	}
}
