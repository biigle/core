@extends('manual.base')

@push('styles')
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

@section('manual-title', 'Creating Image Annotations')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn about all the tools that are available to create new image annotations.
        </p>

        <p>
            An image annotation is a point or a region on an image that can have one or more labels attached to it. The image annotation tool offers different shapes that can be used to create new annotations. Each shape is suited best for specific annotation tasks so choose the shapes you want to use wisely before you begin annotating.
        </p>
        <p>
            You can activate a tool by clicking the button in the toolbar at the bottom:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_1.jpg')}}" width="50%"></a>
        </p>
        <p>
            Before one of these tools cen be activated, you have to select a label from the <i class="fa fa-tags"></i> label trees tab in the sidebar. A new annotation can only be created if there is a label attached to it. The currently selected label will be attached to all new annotations that you create. As an alternative to a manually selected label, you can also enable <a href="{{route('manual-tutorials', ['labelbot', 'labelbot'])}}">LabelBOT</a>.
        </p>
        <p>
            Once you have activated an annotation tool you can start creating annotations. You can choose from the following shapes:
        </p>

        <h3><a name="point"></a><i class="icon icon-point"></i> Point</h3>

        <p>
            A point annotation consists of a single coordinate. Be careful when you want to choose this shape because often you want to annotate a specific area on the image and not just a single point. Don't let the area of the point <em>icon</em> on the image fool you into believing the point annotation covers all of this area.
        </p>
        <p>
            To draw a point, activate the point annotation tool and then click on the point on the image that you want to annotate.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_point.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_point.jpg')}}" width="25%"></a>
        </p>

        <h3><a name="rectangle"></a><i class="icon icon-rectangle"></i> Rectangle</h3>

        <p>
            A rectangle consists of four coordinates and covers a specific area on the image. A rectangle is drawn with three mouse clicks. The first click specifies the starting point of the rectangle. This point will be the center of one of the edges of the final rectangle. The second click specifies the center of the edge parallel to the edge of the first point. With these two points the length and rotation of the rectangle is set. The third click finishes the rectangle by specifying one of its corner points, thus determining the width of the rectangle.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_rectangle_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_rectangle_1.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_rectangle_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_rectangle_2.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_rectangle_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_rectangle_3.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_rectangle_4.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_rectangle_4.jpg')}}" width="24%"></a>
        </p>

        <h4><a name="box"></a><i class="fa fa-vector-square"></i> Axis-Aligned Box</h4>
        <p>
            In addition to the regular mode to draw rectangles, there is the axis-aligned box tool. The button to activate the box tool appears when you hover your cursor over the button of the rectangle tool. You can also press <kbd>Shift</kbd>+<kbd>S</kbd> to activate it.
        </p>
        <p>
            An axis-aligned box is a rectangle that is always aligned with the image axes (i.e. its edges are always horizontal and vertical). It is drawn with two mouse clicks. The first click specifies one corner of the box. The second click specifies the opposite corner, completing the box. This is a quick and convenient way to draw bounding boxes around objects in the image.
        </p>

        <h3><a name="circle"></a><i class="icon icon-circle"></i> Circle</h3>
        <p>
            A circle consists of a center point and a radius and covers a specific area on the image. Two mouse clicks are required to draw a new circle. The first click determines the center point of the circle similar to a point annotation. The second click sets the radius of the circle which is the distance between the two points of the first and the second click.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_circle_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_circle_1.jpg')}}" width="25%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_circle_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_circle_2.jpg')}}" width="25%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_circle_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_circle_3.jpg')}}" width="25%"></a>
        </p>

        <h4><a name="ellipse"></a><i class="icon icon-ellipse"></i> Ellipse</h4>
        <p>
            In addition to the regular mode to draw circles, there is the ellipse tool. The button to activate the ellipse tool appears when you hover your cursor over the button of the circle tool:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_ellipse_0.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_ellipse_0.jpg')}}" width="33%"></a>
        </p>
        <p>
            An ellipse consists of a center point and two radii and covers a specific area on the image. Ellipses are drawn similar to rectangles. The first two clicks define the first axis and diameter. The third click defines the second diameter.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_ellipse_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_ellipse_1.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_ellipse_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_ellipse_2.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_ellipse_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_ellipse_3.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_ellipse_4.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_ellipse_4.jpg')}}" width="24%"></a>
        </p>

        <h3><a name="line-string"></a><i class="icon icon-linestring"></i> Line String</h3>

        <p>
            A line string consists of two or more coordinates forming a line. Just like the point, this shape does <em>not</em> cover an area on the image so be careful when you want to use it. This shape is useful if you want to measure lengths. Each click adds a new coordinate to the line string. To finish a line string, click twice on the last coordinate (once to add it to the line string and once to finish the line string).
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_linestring_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_linestring_1.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_linestring_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_linestring_2.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_linestring_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_linestring_3.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_linestring_4.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_linestring_4.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_linestring_5.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_linestring_5.jpg')}}" width="32%"></a>
        </p>

        <h4><a name="line-string-freehand"></a>Freehand</h4>

        <p>
            You can also draw a line string in freehand mode. To do this, press the Shift key on your keyboard before you make the first mouse click and start drawing a line string. Keep Shift and the mouse button pressed and move the mouse to draw a line string along the path that your cursor takes. Release the mouse button to finish the line string. Press and release shift while you draw to switch between freehand and normal drawing mode.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_linestring_f_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_linestring_f_1.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_linestring_f_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_linestring_f_2.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_linestring_f_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_linestring_f_3.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_linestring_f_4.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_linestring_f_4.jpg')}}" width="24%"></a>
        </p>

        <h3><a name="polygon"></a><i class="icon icon-polygon"></i> Polygon</h3>

        <p>
            A polygon consists of three or more coordinates enclosing a specific area on the image. You can draw a polygon similar to drawing a line string coordinate by coordinate. Click twice on the last coordinate to close and finish the polygon.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_1.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_2.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_3.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_4.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_4.jpg')}}" width="24%"></a>
        </p>

        <h4><a name="polygon-freehand"></a>Freehand</h4>

        <p>
            Just like line strings, polygons can be drawn in freehand mode by pressing the Shift key.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_f_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_f_1.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_f_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_f_2.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_f_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_f_3.jpg')}}" width="24%"></a>
        </p>

        <h4><a name="polygon-magic-wand"></a><i class="fa fa-magic"></i> Magic Wand</h4>

        <p>
            In addition to the regular and freehand modes to draw polygons, there is the magic wand tool. This tool can detect a region where the pixels share similar colors and draw a polygon around it. The button to activate the magic wand tool appears when you hover your cursor over the button of the polygon tool:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_magic_wand_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_magic_wand_1.jpg')}}" width="33%"></a>
        </p>
        <p>
            When the magic wand tool is activated, press and hold the mouse button at roughly the center of the region or object you want to annotate. Now you can "grow" the detected region by pulling away the cursor from the point where you initially pressed the mouse button. Release the mouse button once you are satisfied with the detected region. This will create a new polygon annotation.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_magic_wand_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_magic_wand_2.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_magic_wand_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_magic_wand_3.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_magic_wand_4.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_magic_wand_4.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_magic_wand_5.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_magic_wand_5.jpg')}}" width="24%"></a>
        </p>
        <p>
            To abort the process, move the cursor back to the point where you initially pressed the mouse button and an "&times;" symbol will appear. If you release the mouse button here, the detected region will be discarded. If you hold the <kbd>Shift</kbd> key while you move the cursor, the "&times;" symbol will not appear and the region will not be discarded no matter how close the cursor is to the initial point.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_magic_wand_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_magic_wand_2.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_magic_wand_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_magic_wand_3.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_magic_wand_6.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_magic_wand_6.jpg')}}" width="24%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_magic_wand_7.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_magic_wand_7.jpg')}}" width="24%"></a>
        </p>
        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                The magic wand tool is not available for remote images without <a href="/manual/tutorials/volumes/remote-volumes#cors">cross-origin resource sharing</a>.
            </div>
        </div>
        <p>
            Internally, the magic wand tool uses a scanline flood fill algorithm with a variable threshold to detect a region. The flood fill algorithm starts with the pixel at the point where the mouse button was initially pressed and adds all neighboring pixels to the detected region that don't differ too much from the color of the initial pixel. The accepted difference is computed according to a specific threshold. The threshold is dynamically updated and depends on the distance of the cursor to the point where the mouse button was initially pressed. The larger the distance/threshold, the more pixels will be added to the detected region.
        </p>
        <p>
            The magic wand tool uses your current view of the image for reference and not the original image itself. This means that you can draw more detailed polygons when your view is zoomed in and less detailed polygons when your view is zoomed out. Also, the detected region can never get larger than your current viewport.
        </p>

        <h4><a name="polygon-brush"></a><i class="fa fa-paint-brush"></i> Brush</h4>

        <p>
            The polygon brush tool allows you to "paint" polygons with a circular brush. The button to activate the polygon brush tool appears when you hover your cursor over the button of the polygon tool:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_brush_1.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_brush_1.jpg')}}" width="33%"></a>
        </p>
        <p>
            When activated, the outline of the circular brush is displayed beneath the cursor. You can change the radius of the brush by pressing <kbd>Alt</kbd> and using the mouse wheel. To paint a polygon, simply press and hold the left mouse button, then move the mouse. Release the mouse button to finish the new polygon.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_brush_2.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_brush_2.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_brush_3.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_brush_3.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/creating_annotations_polygon_brush_4.jpg')}}"><img src="{{asset('assets/images/manual/creating_annotations_polygon_brush_4.jpg')}}" width="32%"></a>
        </p>

        <p>
            Polygons that were drawn with the brush tool are best edited with the polygon eraser and fill tools. Head over to the <a href="{{route('manual-tutorials', ['annotations', 'editing-annotations'])}}">next manual section</a> to learn more.
        </p>

        @mixin('manualCreatingPolygons')
    </div>
@endsection
