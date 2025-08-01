@extends('manual.base')

@section('manual-title', 'Sidebar')

@section('manual-content')
    <div class="row">
        <p class="lead">
            All sidebar tabs of the image annotation tool explained.
        </p>

        <h3><a name="annotations-tab"></a> <i class="fa fa-map-marker-alt"></i> Annotations</h3>

        <p>
            The annotations tab shows a list of all annotations on the current image, grouped by their label. A click on a label expands the list item to show all annotations that have this label attached. Each annotation is represented by the icon of the shape of the annotation and the user who attached the label to the annotation. A click on an annotation list item selects the annotation. A selected annotation is highlighted both on the image an in the annotations list. A double click on an annotation in the list will make the viewport pan and zoom to show the annotation on the image.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/sidebar_annotations_1.jpg')}}"><img src="{{asset('assets/images/manual/sidebar_annotations_1.jpg')}}" width="50%"></a>
        </p>
        <p>
            An annotation can have multiple labels by multiple users attached to it. This means that there may be multiple highlighted items in the annotation list for a single selected annotation.
        </p>
        <p>
            At the very top of the annotations tab there is the annotation filter. Annotations can be filtered by label, user, shape or annotation session. You can use the filter e.g. to display only your own annotations on the images. Whenever the annotation filter is active, the button of the annotations tab will be highlighted so you don't forget the active filter.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/sidebar_annotations_2.jpg')}}"><img src="{{asset('assets/images/manual/sidebar_annotations_2.jpg')}}" width="50%"></a>
        </p>

        <h3><a name="label-trees-tab"></a> <i class="fa fa-tags"></i> Label Trees</h3>

        <p>
            The label trees tab shows all label trees that are available for the image. Here you can find and choose the labels you want to attach to new or existing annotations. Use the search field at the top to quickly find labels of deeply nested label trees. Mark up to ten labels as favorites to quickly select them with the <kbd>0</kbd>-<kbd>9</kbd> keys of your keyboard. To select a label as favorite, click the <i class="fa fa-star"></i> icon next to the label in the label tree. Now it will appear in the "Favorites" label tree at the top and can be selected with a shortcut key. Click the <i class="fa fa-star"></i> icon of a favorite label again to remove it from the favorites.
        </p>

        <p>
            If there already are some annotations with the selected label in the same volume, example annotation patches will be displayed at the bottom of this tab. Use these patches as a reference to decide if the label is actually the one you are looking for. You can disable the example annotations in the <a href="#settings-tab">settings tab</a>.
        </p>

        @mixin('annotationsManualSidebarLabelTrees')

        <h3><a name="annotation-modes-tab"></a> <i class="fa fa-th"></i> Annotation Modes</h3>

        <p>
            See the <a href="{{route('manual-tutorials', ['annotations', 'navigating-images'])}}#annotation-modes">Navigating Images</a> section for more information on the available annotation modes.
        </p>

        <h3><a name="image-labels-tab"></a> <i class="fa fa-image"></i> Image Labels</h3>

        <p>
            Image labels are labels that are attached to a whole image instead of annotations. Only project editors, experts or admins can modify image labels. To attach a new image label, select a label in the <a href="#label-trees-tab">label trees tab</a> (or use a <a href="{{route('manual-tutorials', ['annotations', 'shortcuts'])}}">shortcut</a>), then open the image label tab and click the <button class="btn btn-default btn-xs"><i class="fa fa-plus"></i></button> button in the top right corner. To detach an image label, click the <button class="close" style="float: none;"><span aria-hidden="true">×</span></button> button next to it.
        </p>
        <p>
            Attaching image labels with the image label tab is useful if you need to explore the whole image in order to determine the correct image label. If an image thumbnail is enough (e.g. to sort out bad images where the camera flash didn't fire properly) you can attach and detach image labels more quickly <a href="{{route('manual-tutorials', ['volumes', 'image-labels'])}}">in the volume overview</a>.
        </p>

        <h3><a name="color-adjustment-tab"></a> <i class="fa fa-adjust"></i> Color Adjustment</h3>

        <p>
            The color adjustment tab allows you to manipulate some of the visual properties of the image. This can make finding interesting objects or regions on the image easier and quicker, e.g. if the images are very dark or have a low contrast.
        </p>

        <h4>Brightness/Contrast</h4>

        <p>
            These are arguably the most important properties that can be adjusted on an image. Choose a brightness value larger than 0 to increase the brightness of the image. A value lower than 0 decreases the brightness. Adjusting the contrast works just the same. You can also adjust the brightness individually for each color channel of the image. Click on the <i class="fa fa-sliders-h"></i> button and the slider for the brightness will expand into three sliders for the red, green and blue color channels. Press the button again to get back to adjusting the brightness for all color channels at once.
        </p>

        <h4>Gamma</h4>

        <p>
            Gamma adjustment allows you to make dark regions brighter or bright regions darker in the image. Use a value between 0 and 1 to make dark regions brighter or a value greater than 1 to make bright regions darker.
        </p>

        <h4>Hue</h4>

        <p>
            Adjusting the hue will "rotate" the colors of the whole image. Blue pixels my become green or red pixels may become blue, depending on the position of the hue slider. This can be useful not only for people with dyschromatopsia but for others as well since the human visual system can differentiate between more shades of green than any other color.
        </p>

        <h4>Saturation/Vibrance</h4>

        <p>
            Increasing the saturation will make the colors more "loud". Decreasing it will eventually result in a black and white image. In contrast to that increasing the vibrance will only affect colors that are not highly saturated already. Decreasing it will <em>only</em> affect the highly saturated colors.
        </p>

        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                Color adjustment is unavailable for remote images without <a href="/manual/tutorials/volumes/remote-volumes#cors">cross-origin resource sharing</a> and images that are too large to be handled by the graphics processing unit of your machine (<span id="texture-size-remark">your machine can handle images up to <span id="texture-size"></span> px</span>).
            </div>
        </div>
        <script type="module">
            try {
                var gl = document.createElement('canvas').getContext('webgl');
                var size = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                document.getElementById('texture-size').innerHTML = size + ' &times; ' + size;
            } catch (e) {
                document.getElementById('texture-size-remark').innerHTML = 'your machine can handle no color adjustment at all as it doesn\'t support WebGL';
            }
        </script>

        <h3><a name="settings-tab"></a> <i class="fa fa-cog"></i> Settings</h3>

        <p>
            The settings tab allows you to customize the image annotation tool and provides some advanced features.
        </p>
        <p>
            Click the <i class="fa fa-camera"></i> capture screenshot button to get a screenshot of the currently visible area as a downloadable image. Note that the screenshot does not include the whole image but only the visible area of your current viewport.
        </p>

        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                Capturing screenshots is not available for remote images without <a href="/manual/tutorials/volumes/remote-volumes#cors">cross-origin resource sharing</a>. You can use the usual way of capturing a screenshot of your whole screen in this case.
            </div>
        </div>

        <p>
            The annotation opacity slider allows you to make annotations more transparent or hide them completely. Note that this setting will be remembered permanently so don't be confused if no annotations show up the next time you open an image in the image annotation tool.
        </p>

        <p>
            The cached images slider allows to preload the selected amount of images. The default amount is one. This allows you to move between images more quickly.
        </p>

        <p>
            The progress indicator switch constrols the display of the indicator element next to the image filename in the navbar. The indicator shows your progress through the current (filtered) volume and whether you have seen all images.
        </p>

        <p>
            The minimap switch enables you to show or hide the minimap. A hidden minimap can be particularly useful in Lawnmower Mode where you need to see all of the displayed viewport.
        </p>

        <p>
            The mouse position switch controls the display of an additional map overlay that shows the current position of the cursor on the image in pixels.
        </p>

        <p>
            The zoom level switch controls the display of a map overlay that shows the current zoom level of the viewport.
        </p>

        <p>
            The scale line switch controls the display of a map overlay that shows the a scale line. By default, the scale is shown in pixels. If image area information is available (via <a href="{{route('manual-tutorials', ['volumes', 'image-metadata'])}}">image metadata</a> or <a href="{{route('manual-tutorials', ['laserpoints', 'laserpoint-detection'])}}">laser point detection</a>), the scale is shown in meters.
        </p>

        <p>
            The label tooltip switch controls the display of a tooltip that appears when you hover your cursor over annotations. The tooltip shows the names of the labels that are attached to these annotations.
        </p>

        <p>
            The measure tooltip switch controls the display of a tooltip that appears when you hover your cursor over annotations. The tooltip shows the length of line string or the area of rectangle, circle or polygon annotations. If image area information is available (via <a href="{{route('manual-tutorials', ['volumes', 'image-metadata'])}}">image metadata</a> or <a href="{{route('manual-tutorials', ['laserpoints', 'laserpoint-detection'])}}">laser point detection</a>), the length/area is shown in meters.
        </p>

        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                Only one of the label or measure tooltips can be activated at the same time.
            </div>
        </div>

        <h4><a name="export-area"></a>Export Area</h4>

        <p>
            The export area can be used to restrict generated reports to a specific area of the images of a volume. Click <i class="fa fa-pencil-alt"></i> edit to draw or edit the export area. The area can be drawn similar to a <a href="{{route('manual-tutorials', ['annotations', 'creating-annotations'])}}#rectangle">rectangle annotation</a> and will be permanently displayed on all images of the volume. If a report is set to be restricted to the export area, only image annotations inside this area will be considered. Delete the export area with the <i class="fa fa-trash"></i> delete button. Set the export area opacity to 0 to hide it.
        </p>

        <p>
            The example annotations switch allows you to enable or disable the example annotation patches that are displayed in the <i class="fa fa-tags"></i> label trees tab.
        </p>

        <p>
            The "Restrict to Boundaries" setting controls whether new annotation points can be placed outside the image boundaries. When enabled, the floating vertex beneath the mouse cursor will be constrained to stay within the image area while drawing new annotations. This can be useful to prevent accidental annotation placement outside the visible image content.
        </p>


        @mixin('annotationsManualSidebarSettings')
    </div>
@endsection
