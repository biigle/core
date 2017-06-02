@extends('manual.base')

@section('manual-title') Navigating Images @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn about advanced ways to navigate the images in the annotation tool.
        </p>

        <p>
            You've already learned the basic mechanisms of how to navigate around an image in the <a href="{{route('manual-tutorials', ['annotations', 'getting-started'])}}">getting started section</a>. You can zoom and move the image similar to interactive maps and you can switch to the previous or next image using the <i class="fa fa-step-backward"></i> backward or <i class="fa fa-step-forward"></i> forward buttons in the toolbar at the bottom. Now let's focus on the more advanced ways to navigate images.
        </p>

        <h3><a name="image-filtering-sorting"></a>Image Filtering/Sorting</h3>

        <p>
            If you are familiar with the volume overview you will have noticed the image filter and sorting functions. The image filter can be used to display only certain images of a volume, e.g. only images containing annotations. The image sorting can be used to shuffle the image randomly or sort them in any other way.
        </p>
        <p>
            The sequence of filtered and sorted images in the volume overview is always directly transferred to the annotation tool. If you have an active filtering in the volume overview and open the annotation tool, you will now cycle through only the images that were displayed in the volume overview and not just all images of the volume.
        </p>

        <h3><a name="minimap"></a> Minimap</h3>

        <p>
            At the top right of the annotation tool there is the minimap. It doesn't only highlight your current viewport on the image but you can also use it to move the viewport or quickly jump around. Drag the highlighted viewport in the minimap around to move it or click on a location in the minimap to immediately center your viewport on this point.
        </p>

        <h3><a name="zoom-to-extent"></a> Zoom To Extent And Original Resolution</h3>

        <p>
            At the top left of the annotation tool there are the <i class="fa fa-compress"></i> zoom to extent and <i class="fa fa-expand"></i> zoom to original resolution buttons. Zoom to extent modifies your viewport so that the whole image is shown in the center. This is the same view as when you initially open the annotation tool. Zoom to original resolution zooms the image in or out until it has its original size, i.e. one pixel of the image maps to one pixel of your monitor.
        </p>

        <h3><a name="lawnmower-mode"></a> Lawnmower Mode</h3>

        <p>
            Lawnmower Mode can be used to quickly and methodically screen all areas of an image at a larger resolution that fits on your monitor. To activate Lawnmower Mode, first choose a zoom level on which you want to screen the image. Then open the <i class="fa fa-cog"></i> settings tab and set Lawnmower Mode to "on". You viewport will now jump to the first "tile", the bottom left section of the image that fits in your viewport at the current zoom level. Now you can advance through image tiles with the <i class="fa fa-step-forward"></i> forward and <i class="fa fa-step-backward"></i> backward buttons or the <a href="{{route('manual-tutorials', ['annotations', 'shortcuts'])}}">shortcut keys</a>. If the last tile is displayed and you hit the forward button, the annotation tool will switch to the first tile of the next image. This way you can quickly screen all images of a volume.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/navigating_images_lmm_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/navigating_images_lmm_1.jpg')}}" width="50%"></a><br>
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/navigating_images_lmm_2.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/navigating_images_lmm_2.jpg')}}" width="32%"></a>
            <a href="{{asset('vendor/annotations/images/manual/navigating_images_lmm_3.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/navigating_images_lmm_3.jpg')}}" width="32%"></a>
            <a href="{{asset('vendor/annotations/images/manual/navigating_images_lmm_4.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/navigating_images_lmm_4.jpg')}}" width="32%"></a>
        </p>

        <h3><a name="volare"></a> Volare</h3>

        <p>
            Volume label review (Volare) allows you to quickly cycle through all annotations of a volume. To activate Volare open the <i class="fa fa-cog"></i> settings tab and set Volare to "on". Your viewport will now jump to the first annotation of the current image and select it. If there is no annotation it will zoom out to show the whole image. You can now advance through annotations with the <i class="fa fa-step-forward"></i> forward and <i class="fa fa-step-backward"></i> backward buttons or the <a href="{{route('manual-tutorials', ['annotations', 'shortcuts'])}}">shortcut keys</a>. If the last annotation is displayed and you hit the forward button, the annotation tool will switch to the first annotation of the next image.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/navigating_images_volare_1.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/navigating_images_volare_1.jpg')}}" width="50%"></a><br>
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/annotations/images/manual/navigating_images_volare_2.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/navigating_images_volare_2.jpg')}}" width="32%"></a>
            <a href="{{asset('vendor/annotations/images/manual/navigating_images_volare_3.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/navigating_images_volare_3.jpg')}}" width="32%"></a>
            <a href="{{asset('vendor/annotations/images/manual/navigating_images_volare_4.jpg')}}"><img src="{{asset('vendor/annotations/images/manual/navigating_images_volare_4.jpg')}}" width="32%"></a>
        </p>
        <p>
            You can use Volare to quickly attach labels to an annotation, too. Just press the <i class="fa fa-plus"></i> button in the settings tab or hit enter to attach your currently selected label to the currently highlighted annotation.
        </p>
        <p>
            Volare works great with the <a href="{{route('manual-tutorials', ['annotations', 'sidebar'])}}#annotations-tab">annotation filter</a> if you want to review only specific annotations.

        </p>

    </div>
@endsection
