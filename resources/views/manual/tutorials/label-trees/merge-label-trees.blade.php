@extends('manual.base')
@section('manual-title', 'Merge Label Trees')

@section('manual-content')
    <div class="row">
        <p class="lead">
            View and resolve differences between label trees.
        </p>
        <p>
            BIIGLE allows you to compare two label trees and resolve the differences between them. This is called a "merge". If the changes of a label tree <em>B</em> should be applied to a "base" label tree <em>A</em>, the label tree <em>B</em> is "merged into" label tree <em>A</em>.
        </p>
        <p>
            To perform a merge, you must be a member of the base label tree, i.e. you must be able to modify the labels of the tree. Click <button class="btn btn-default btn-xs">Merge</button> in the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu at the top of the label tree overview to start a new merge. The next view asks you to select a label tree that should be merged into the base label tree. Type the name of the label tree and select it from the list, then click <button class="btn btn-success btn-xs">Continue</button>.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/merge_labels_1.png')}}"><img src="{{asset('assets/images/manual/merge_labels_1.png')}}" width="100%"></a>
        </p>

        <p>
            The merge view visualizes the differences between the two label trees. The left column shows the relevant labels of the base label tree (<em>A</em>). The right column shows the relevant labels of the label tree to merge (<em>B</em>). Only those labels are shown that are relevant for the merge. Most labels that both label trees have in common are hidden from the merge view.
        </p>
        <p>
            There are two types of differences:
        </p>
        <ul>
            <li>A label exists in label tree <em>A</em> but not in label tree <em>B</em>. This is called a "<span class="text-danger">deletion</span>".</li>
            <li>A label exists in label tree <em>B</em> but not in label tree <em>A</em>. This is called an "<span class="text-success">addition</span>".</li>
        </ul>
        <p>
            A deletion is displayed as a red row in the merge view. To accept a deletion for the merge, click the <button class="btn btn-default btn-xs"><i class="fa fa-minus"></i></button> button to the left of the row. When a deletion is accepted and the merge is performed, the label will be deleted from the base label tree.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/merge_labels_2.png')}}"><img src="{{asset('assets/images/manual/merge_labels_2.png')}}" width="100%"></a>
        </p>

        <p>
            An addition is displayed as a green row in the merge view. To accept an addition for the merge, click the <button class="btn btn-default btn-xs"><i class="fa fa-plus"></i></button> button to the left of the row. When an addition is accepted and the merge is performed, the label will be added at the appropriate position to the base label tree.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/merge_labels_3.png')}}"><img src="{{asset('assets/images/manual/merge_labels_3.png')}}" width="100%"></a>
        </p>

        <p>
            You can also use the <button class="btn btn-default btn-xs">Accept all</button> and <button class="btn btn-default btn-xs">Accept none</button> buttons to toggle all merge items at once.
        </p>
        <p>
            Once you are satisfied with the changes that should be applied to the base label tree on the left, click <button class="btn btn-success btn-xs">Merge into <em>A</em></button>. The changes will be applied and you can go <button class="btn btn-default btn-xs">Back</button> to the base label tree.
        </p>

        <h3>Caveats</h3>

        <p>
            There are a few special cases that the merge view handles for you:
        </p>
        <ul>
            <li>
                Labels are compared solely based on their names. If you have multiple labels with the same name on the same level in both label trees, the merge view might not be displayed correctly.
            </li>
            <li>
                If you want to delete a label that has child labels, the child labels must be deleted, too. The merge view will accept the deletion of the child labels automatically in this case. Equally, if you unselect an accepted deletion, all parent labels that are accepted deletions will be unselected, too.
            </li>
            <li>
                If you want to add a label that has a parent label which is also an addition, the parent label must be added, too. The merge view will accept the addition of the parent label(s) automatically in this case. Equally, if you unselect an accepted addition, all child labels that are accepted additions will be unselected, too.
            </li>
            <li>
                Labels which are used or which have child labels that are used cannot be deleted.
            </li>
        </ul>

    </div>
@endsection
