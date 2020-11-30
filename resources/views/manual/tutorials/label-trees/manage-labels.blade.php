@extends('manual.base')
@section('manual-title', 'Manage Labels')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn how to create, modify or delete labels of a label tree.
        </p>
        <p>
            Each label consists of a name and a color. The label colors help you to identify the labels both in the label tree(s) and in the annotation tool, as annotations are colored according to the labels that are attached to them. In addition to that, a label can have a <em>parent</em> label, too. This allows you to arrange labels in a tree-like structure, the label tree.
        </p>

        <p>
            The labels of a label tree can only be modified by label tree <a href="{{route('manual-tutorials', ['label-trees', 'about'])}}#members">members</a>. New labels can be created at the right of the <button class="btn btn-default btn-xs"><i class="fa fa-tags"></i> Labels</button> tab of the label tree overview. There, you find the two tabs <button class="btn btn-default btn-xs">New label</button> and <button class="btn btn-default btn-xs">WoRMS label import</button> which are the two ways to create new labels: manually and by WoRMS import.
        </p>

        <h3><a name="manually"></a>Create labels manually</h3>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/manage_labels_1.png')}}"><img src="{{asset('assets/images/manual/manage_labels_1.png')}}" width="90%"></a>
        </p>

        <p>
            The <button class="btn btn-default btn-xs">New label</button> tab shows three controls: the color chooser, the label parent chooser and the field to enter the new label name. To create your first label, choose a color with the color picker (click on the colored rectangle) or get a random color with a click on the <button class="btn btn-default btn-xs"><i class="fa fa-sync-alt"></i></button> button. Next, enter the new label name and hit enter.
        </p>
        <p>
            Once there is a label in the tree, you can (but don't have to) create child labels for it. To do this, select the label in the tree. Its name will appear in the label parent chooser. Alternatively you can enter the name of the parent label in the parent label chooser, too. This is particularly useful for large label trees. When you select a parent label, the selected color will automatically change to the one of the selected label. You can either re-use the same color for child labels or select a new color at this point. Finally, enter the name of the child label and hit enter.
        </p>


        <h3><a name="worms"></a>Import labels from WoRMS</h3>

        @if (config('biigle.offline_mode'))
            <div class="panel panel-danger">
                <div class="panel-body text-danger">
                    <strong>This BIIGLE instance is in offline mode.</strong> WoRMS label import is not available as it requires a working internet connection.
                </div>
            </div>
        @endif

        <p class="text-center">
            <a href="{{asset('assets/images/manual/manage_labels_2.png')}}"><img src="{{asset('assets/images/manual/manage_labels_2.png')}}" width="90%"></a>
        </p>

        <p>
            As an alternative to create labels manually, you can import them from the <a href="http://www.marinespecies.org/">World Register of Marine Species</a>. To search for a species, enter (part of) the label name and hit enter. The list of search results will be shown below. Items that already have been imported will be highlighted in green.
        </p>

        <p>
            By default, only accepted items from WoRMS will be included in the search results. If you also want to include unaccepted results (e.g. synonyms), activate the <button class="btn btn-default btn-xs">unaccepted</button> button before you search.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/manage_labels_3.png')}}"><img src="{{asset('assets/images/manual/manage_labels_3.png')}}" width="90%"></a>
        </p>

        <p>
            Now you have three options to import the found species as new labels. The simplest is to click on the <button class="btn btn-default btn-xs"><i class="fa fa-plus"></i></button> button of the species you want to import. This will add the species as a new root label to the label tree.
        </p>
        <p>
            The next option is to add a found species as a child label. Similar to creating labels manually, you first select an existing label from the label tree as parent and then click the <button class="btn btn-default btn-xs"><i class="fa fa-plus"></i></button> button of the species you want to import.
        </p>
        <p>
            The last and most powerful option is the recursive import. This will import the found species and the <em>whole hierarchy</em> of parent labels from WoRMS. If you take the genus "Kolga" from the image above, for example, this would include the labels Biota, Animalia, Echinodermata, Holothuroidea, Elasipodida, Elpidiidae and Kolga! To perform a recursive import, click the <button class="btn btn-default btn-xs">recursive</button> button first and then the <button class="btn btn-default btn-xs"><i class="fa fa-plus"></i></button> button of the species you want to import.
        </p>
        <p>
            The recursive import respects previously imported labels, too. Just keep the <button class="btn btn-default btn-xs">recursive</button> button activated, import labels and they will be placed at their appropriate position in the tree.
        </p>
        <div class="panel panel-info">
            <div class="panel-body text-info">
                If you want to import only part of the hierarchy of parent labels recursively from WoRMS, you can first import the topmost item as root label (e.g. "Holothuroidea" in the example above). Then activate the <button class="btn btn-default btn-xs">recursive</button> button and import other search results. The recursive import will now include only items up to the already existing root label.
            </div>
        </div>

        <h3><a name="modify"></a>Modify labels</h3>

        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                Be very careful when you modify the name of a label since it changes the meaning of all existing annotations with this label (e.g. do not change "coral" to "stone")!
            </div>
        </div>

        <p>
            To modify an existing label, hover the mouse over the label name, then click on the <button class="btn btn-default btn-xs"><i class="fa fa-pencil-alt"></i></button> to switch a label into edit mode.
        </p>

        <p>
            In edit mode, the color and name of the label are editable. Choose a new color or name and click the <button class="btn btn-success btn-xs"><i class="fa fa-check"></i></button> button to save the changes. To revert unsaved changes and exit edit mode, click <button class="btn btn-default btn-xs"><i class="fa fa-times"></i></button>. To delete a label from the label tree, click the <button class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></button> button. Only labels that have no child labels and that are not attached to an annotation, image or video can be deleted.
        </p>

        <p>
            The parent of existing labels cannot be modified in the user interface at this time. However, you can use the <a href="/doc/api/index.html#api-Labels-UpdateLabels">endpoint</a> of the REST API.
        </p>

        <p>
            Continue to learn more about versioned label trees in the <a href="{{route('manual-tutorials', ['label-trees', 'label-tree-versions'])}}">next section</a>.
        </p>

    </div>
@endsection
