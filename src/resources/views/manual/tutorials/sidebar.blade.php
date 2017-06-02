@extends('manual.base')

@section('manual-title') Sidebar @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            All sidebar tabs of the annotation tool explained.
        </p>

        <h3><a name="annotations-tab"></a> <i class="fa fa-map-marker"></i> Annotations</h3>

        <p>
            The annotations tab shows a list of all annotations on the current image, grouped by their label. A click on a label expands the list item to show all annotations that have this label attached. Each annotation is represented by the icon of the shape of the annotation and the user who attached the label to the annotation. A click on an annotation list item selects the annotation. A selected annotation is highlighted both on the image an in the annotations list. A double click on an annotation in the list will make the viewport pan and zoom to show the annotation on the image.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/sidebar_annotations_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/sidebar_annotations_1.jpg')}}" width="50%"></a>
        </p>
        <p>
            An annotation can have multiple labels by multiple users attached to it. This means that there may be multiple highlighted items in the annotation list for a single selected annotation.
        </p>
        <p>
            At the very top of the annotations tab there is the annotation filter. Annotations can be filtered by label, user, shape or annotation session. You can use the filter e.g. to display only your own annotations on the images. Whenever the annotation filter is active, the button of the annotations tab will be highlighted so you don't forget the active filter.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/sidebar_annotations_2.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/sidebar_annotations_2.jpg')}}" width="50%"></a>
        </p>

        <h3><a name="label-trees-tab"></a> <i class="fa fa-tags"></i> Label Trees</h3>

        <p>
            The label trees tab shows all label trees that are available for the image. Here you can find and choose the labels you want to attach to new or existing annotations. Use the search field at the top to quickly find labels of deeply nested label trees. Mark up to ten labels as favorites to quickly select them with the <code>0</code>-<code>9</code> keys of your keyboard. To select a label as favorite, click the <i class="fa fa-star-o"></i> icon next to the label in the label tree. Now it will appear in the "Favorites" label tree at the top and can be selected with a shortcut key. Click the <i class="fa fa-star"></i> icon of a favorite label to remove it from the favorites.
        </p>

        {{--<h3><a name="color-adjustment-tab"></a> <i class="fa fa-adjust"></i> Color Adjustment</h3>

        <p>
            TODO: Explain each method with example images and use cases.
        </p>

        <h3><a name="settings-tab"></a> <i class="fa fa-cog"></i> Settings</h3>

        <p>
            TODO: Explain each section. Link to "Navigating Images" for LMM and Volare. Add view mixin for sections on example annotations (Label Trees Tab, too!) and export area.
        </p>--}}
    </div>
@endsection
