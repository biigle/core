@extends('manual.base')
@section('manual-title', 'Image Labels')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Image labels are labels that are attached to whole images.
        </p>
        <p>
            The main purpose of BIIGLE is to allow users to annotate images. They create annotations as points or regions on the image and then attach labels to these annotations. But BIIGLE allows you to "annotate" whole images as well. To do this you don't have to draw an annotation that encompasses the whole image, you can simply attach a label to the image, too. This can be useful to identify "bad" images where the camera flash did not work properly or to label images by main sediment type, just to name a few examples.
        </p>


        <h3>Attach image labels</h3>

        <p>
            Image labels are attached and modified in the volume overview. To activate the image labelling mode, click the <button class="btn btn-default btn-xs"><i class="glyphicon glyphicon-tags"></i></button> button in the sidebar on the left. This expands the label trees tab that you may already know from the annotation tool. You might also notice, that you can no longer click on the images to get to the annotation tool. This is not possible in the image labelling mode.
        </p>

        <p>
            To attach an image label, first select the appropriate label from the label trees tab. Next, click on the image to which the label should be attached. The image will show a blue border if the selected label can be attached. If no border is shown, the label is already attached to the image. While the newly attached image label is being saved, a yellow border is shown. Successful saving is indicated by a green border.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/volumes/images/manual/image_labels_1.png')}}"><img src="{{asset('vendor/volumes/images/manual/image_labels_1.png')}}" width="30%"></a>
            <a href="{{asset('vendor/volumes/images/manual/image_labels_2.png')}}"><img src="{{asset('vendor/volumes/images/manual/image_labels_2.png')}}" width="30%"></a>
            <a href="{{asset('vendor/volumes/images/manual/image_labels_3.png')}}"><img src="{{asset('vendor/volumes/images/manual/image_labels_3.png')}}" width="30%"></a>
        </p>

        <h3>View image labels</h3>

        <p>
            To view the labels attached to an image, click the <button class="btn btn-default btn-xs"><i class="glyphicon glyphicon-tag"></i></button> button that appears when you hover your cursor over the image. This will show the list of all attached labels. Click the <button class="close" style="float: none;">×</button> button next to an image label to detach it.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/volumes/images/manual/image_labels_4.png')}}"><img src="{{asset('vendor/volumes/images/manual/image_labels_4.png')}}" width="30%"></a>
        </p>

        <h3>Filter by image label</h3>

        <p>
            Images can be filtered by image label in the volume overview. This can help you to quickly find, explore and annotate those images of a large volume that are relevant to you. To filter images by label, open the filter tab in the volume overview with a click on the <button class="btn btn-default btn-xs"><i class="glyphicon glyphicon-filter"></i></button> button in the sidebar. Now select the "image label" filter from the dropdown menu and enter the name of the image label in the field below. Finally, click <button class="btn btn-default btn-xs">Add rule</button> to activate the new filter rule. Of course you can combine this with other filter rules, too.
        </p>

        @mixin('volumesManualImageLabels')
    </div>
@endsection
