@extends('manual.base')

@section('manual-title', 'Editing Image Annotations')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn about all the tools to modify or delete existing image annotations.
        </p>

        <p>
            The image annotation tool offers several ways to edit or delete existing annotations. Most of these functions you can find in the toolbar at the bottom:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/editing_annotations_1.jpg')}}"><img src="{{asset('assets/images/manual/editing_annotations_1.jpg')}}" width="33%"></a>
        </p>

        <h3><a name="modify-annotations"></a> Modify Annotations</h3>

        <p>
            To modify an image annotation, select it with a click. Now every time you hover your cursor over a coordinate of the annotation that can be modified a dot is displayed. Grab this dot with the mouse and drag it to modify the annotation.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/editing_annotations_modify_1.jpg')}}"><img src="{{asset('assets/images/manual/editing_annotations_modify_1.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/editing_annotations_modify_2.jpg')}}"><img src="{{asset('assets/images/manual/editing_annotations_modify_2.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/editing_annotations_modify_3.jpg')}}"><img src="{{asset('assets/images/manual/editing_annotations_modify_3.jpg')}}" width="32%"></a>
        </p>

        <p>
            Complex polygon annotations that were drawn in freehand mode or with the polygon brush tool are hard to modify with the method described above. Use the polygon eraser and fill tools in this case.
        </p>

        <h4><a name="polygon-eraser"></a><i class="fa fa-eraser"></i> Eraser</h4>

        <p>
            The polygon eraser tool allows you to remove parts of polygons with a circular brush. The button to activate the polygon eraser tool appears when you hover your cursor over the button of the polygon tool:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_eraser_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_eraser_1.jpg')}}" width="33%"></a>
        </p>

        <p>
            The eraser works similar to the <a href="{{route('manual-tutorials', ['annotations', 'creating-annotations'])}}#polygon-brush">polygon brush tool</a>, only that sections of the polygon that are beneath the circular brush are erased. The eraser affects only selected polygon annotations. You can select annotations with <kbd>Shift</kbd>+<kbd>Mouse left</kbd> while the eraser tool is active. If you cut an annotation in two using the eraser, the smaller part of the annotation is deleted. You cannot erase an annotation completely. Instead, annotations that are smaller than the current brush size of the eraser are no longer affected. See <a href="#delete-annotations">below</a> on how to delete annotations completely.
        </p>

        <h4><a name="polygon-fill"></a><i class="fa fa-fill-drip"></i> Fill</h4>

        <p>
            The polygon fill tool allows you to extend existing polygons with a circular brush. The button to activate the polygon fill tool appears when you hover your cursor over the button of the polygon tool:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_fill_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_fill_1.jpg')}}" width="33%"></a>
        </p>

        <p>
            The fill tool works similar to the <a href="{{route('manual-tutorials', ['annotations', 'creating-annotations'])}}#polygon-brush">polygon brush tool</a>. The fill tool affects only selected polygon annotations. You can select annotations with <kbd>Shift</kbd>+<kbd>Mouse left</kbd> while the fill tool is active.
        </p>


        <h3><a name="move-annotations"></a><i class="fa fa-arrows-alt"></i> Move Annotations</h3>

        <p>
            To move an annotation as a whole, activate the move annotations tool in the toolbar. Next, select the annotation to move with a click. Now you are able to drag this annotation as a whole to a new position.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/editing_annotations_move_1.jpg')}}"><img src="{{asset('assets/images/manual/editing_annotations_move_1.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/editing_annotations_move_2.jpg')}}"><img src="{{asset('assets/images/manual/editing_annotations_move_2.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/editing_annotations_move_3.jpg')}}"><img src="{{asset('assets/images/manual/editing_annotations_move_3.jpg')}}" width="32%"></a>
        </p>

        <h3><a name="attach-labels"></a><i class="fa fa-tag"></i> Attach Labels</h3>

        <p>
            This tool allows you to attach new labels to existing annotations. This can be useful if another user already annotated an object and you want to confirm (or question) the label that the other user attached to the annotation. To attach a label, select the label from the <i class="fa fa-tags"></i> label trees tab in the sidebar, activate the attach labels tool and then click on the annotation you want to attach the label to.
        </p>

        <h3><a name="swap-labels"></a><i class="fa fa-sync-alt"></i> Swap Labels</h3>

        <p>
            This tool allows you to swap your most recently attached label of an annotation with a new one. The button to activate the swap label tool appears when you hover your cursor over the button of the attach label tool. To swap a label, select the label from the <i class="fa fa-tags"></i> label trees tab in the sidebar, activate the swap labels tool and then click on the annotation you want to swap your most recent label of.
        </p>

        <p>
            If none of the original labels of the selected annotation were attached by you, this tool will just attach the new label to the annotation.
        </p>

        <h3><a name="detach-labels"></a>Detach Labels</h3>

        <p>
            You can see all labels attached to an annotation if you select the annotation (click on it) and open the <i class="fa fa-map-marker-alt"></i> annotations tab in the sidebar. To detach a label from an annotation, click on the "&times;" symbol next to your name. Note that the whole annotation will be deleted if you detach its last label.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/editing_annotations_2.jpg')}}"><img src="{{asset('assets/images/manual/editing_annotations_detach_1.jpg')}}" width="75%"></a>
        </p>

        <h3><a name="delete-annotations"></a><i class="fa fa-trash"></i> Delete Annotations</h3>

        <p>
            To delete an annotation, select it and press the delete annotations button in the toolbar. You can also delete multiple annotations in one go. You might have noticed that the delete annotations button changes to the <i class="fa fa-undo"></i> undo button if you have drawn a new annotation. Press this button to delete the annotation you've just created even if you didn't select it first.
        </p>
    </div>
@endsection
