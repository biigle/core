@extends('manual.base')

@push('styles')
<link href="{{ cachebust_asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
<style type="text/css">
    .icon {
        width: 22px;
        height: 22px;
    }
    img {
        margin-bottom: .25em;
    }
</style>
@endpush

@section('manual-title') Creating Annotations @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn about all the tools that are available to create new annotations.
        </p>

        <p>
            An annotation is a point or a region on an image that can have one or more labels attached to it. The annotation tool offers different shapes that can be used to create new annotations. Each shape is suited best for specific annotation tasks so choose the shapes you want to use wisely before you begin annotating.
        </p>
        <p>
            You can activate a tool by clicking the button in the toolbar at the bottom:
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_1.jpg')}}" width="50%"></a>
        </p>
        <p>
            As you will notice you are required to select a label from the <i class="glyphicon glyphicon-tags"></i> label trees tab in the sidebar first before you can activate one of these tools. A new annotation can only be created if there is a label attached to it. The currently selected label will be attached to all new annotations that you create.
        </p>
        <p>
            Once you have selected a label and activated an annotation tool you can start creating annotations. You can choose from the following shapes:
        </p>

        <h3><i class="icon icon-point"></i> Point</h3>

        <p>
            A point annotation consists of a single coordinate. Be careful when you want to choose this shape because often you want to annotate a specific area on the image and not just a single point. Don't let the area of the point <em>icon</em> on the image fool you into believing the point annotation covers all of this area.
        </p>
        <p>
            To draw a point, activate the point annotation tool and then click on the point on the image that you want to annotate.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_point.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_point.jpg')}}" width="25%"></a>
        </p>

        <h3><i class="icon icon-rectangle"></i> Rectangle</h3>

        <p>
            A rectangle consists of four coordinates and covers a specific area on the image. A rectangle is drawn with three mouse clicks. The first click specifies the starting point of the rectangle. This point will be the center of one of the edges of the final rectangle. The second click specifies the center of the edge parallel to the edge of the first point. With these two points the length and rotation of the rectangle is set. The third click finishes the rectangle by specifying one of its corner points, thus determining the width of the rectangle.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_rectangle_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_rectangle_1.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_rectangle_2.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_rectangle_2.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_rectangle_3.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_rectangle_3.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_rectangle_4.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_rectangle_4.jpg')}}" width="24%"></a>
        </p>

        <h3><i class="icon icon-circle"></i> Circle</h3>
        <p>
            A circle consists of a center point and a radius and covers a specific area on the image. Two mouse clicks are required to draw a new circle. The first click determines the center point of the circle similar to a point annotation. The second click sets the radius of the circle which is the distance between the two points of the first and the second click.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_circle_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_circle_1.jpg')}}" width="25%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_circle_2.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_circle_2.jpg')}}" width="25%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_circle_3.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_circle_3.jpg')}}" width="25%"></a>
        </p>

        <h3><i class="icon icon-linestring"></i> Line String</h3>

        <p>
            A line string consists of two or more coordinates forming a line. Just like the point, this shape does <em>not</em> cover an area on the image so be careful when you want to use it. This shape is useful if you want to measure lengths. Each click adds a new coordinate to the line string. To finish a line string, click twice on the last coordinate (once to add it to the line string and once to finish the line string).
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_1.jpg')}}" width="32%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_2.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_2.jpg')}}" width="32%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_3.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_3.jpg')}}" width="32%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_4.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_4.jpg')}}" width="32%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_5.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_5.jpg')}}" width="32%"></a>
        </p>

        <p>
            You can also draw a line string in freehand mode. To do this, press the Shift key on your keyboard before you make the first mouse click and start drawing a line string. Keep Shift and the mouse button pressed and move the mouse to draw a line string along the path that your cursor takes. Release the mouse button to finish the line string. Press and release shift while you draw to switch between freehand and normal drawing mode.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_f_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_f_1.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_f_2.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_f_2.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_f_3.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_f_3.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_f_4.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_linestring_f_4.jpg')}}" width="24%"></a>
        </p>

        <h3><i class="icon icon-polygon"></i> Polygon</h3>

        <p>
            A polygon consists of three or more coordinates enclosing a specific area on the image. You can draw a polygon similar to drawing a line string coordinate by coordinate. Click twice on the last coordinate to close and finish the polygon.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_1.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_2.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_2.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_3.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_3.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_4.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_4.jpg')}}" width="24%"></a>
        </p>

        <p>
            Just like line strings, polygons can be drawn in freehand mode by pressing the Shift key.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_f_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_f_1.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_f_2.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_f_2.jpg')}}" width="24%"></a>
            <a href="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_f_3.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/creating_annotations_polygon_f_3.jpg')}}" width="24%"></a>
        </p>

        TODO magic wand

        TODO press return to undo last drawn annotation
    </div>
@endsection
