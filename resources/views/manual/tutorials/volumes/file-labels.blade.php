@extends('manual.base')
@section('manual-title', 'File Labels')

@section('manual-content')
    <div class="row">
        <p class="lead">
            File labels are labels that are attached to whole images or videos.
        </p>
        <p>
            The main purpose of BIIGLE is to allow users to annotate images and videos. They create annotations as points or regions on the image/video and then attach labels to these annotations. But BIIGLE allows you to "annotate" whole images and videos as well. To do this you don't have to draw an annotation that encompasses the whole image/video, you can simply attach a label to the file, too. This can be useful to identify "bad" files where the camera flash did not work properly or to label files by main sediment type, just to name a few examples.
        </p>


        <h3>Attach file labels</h3>

        <p>
            File labels are attached and modified in the volume overview. To activate the image/video labelling mode, click the <button class="btn btn-default btn-xs"><i class="fa fa-tags"></i></button> button in the sidebar on the left. This expands the label trees tab that you may already know from the annotation tool. You might also notice, that you can no longer click on the files to get to the annotation tool. This is not possible in the file labelling mode.
        </p>

        <p>
            To attach a file label, select the appropriate label from the label trees tab. Next, click on the image/video to which the label should be attached. The file thumbnail will show a blue border if the selected label can be attached. If no border is shown, the label is already attached to the file. While the newly attached label is being saved, a yellow border is shown. Successful saving is indicated by a green border.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/image_labels_1.png')}}"><img src="{{asset('assets/images/manual/image_labels_1.png')}}" width="30%"></a>
            <a href="{{asset('assets/images/manual/image_labels_2.png')}}"><img src="{{asset('assets/images/manual/image_labels_2.png')}}" width="30%"></a>
            <a href="{{asset('assets/images/manual/image_labels_3.png')}}"><img src="{{asset('assets/images/manual/image_labels_3.png')}}" width="30%"></a>
        </p>

        <p>
            To show all labels that are attached to the files activate the "Show labels of each image/video" switch in the <i class="fa fa-tags"></i> image/video labels tab. This will show the list of all attached labels on each file. Click the <button class="close" style="float: none;">×</button> button next to a file label to detach it.
        </p>

        <h3>Filter by file label</h3>

        <p>
            Images and videos can be filtered by file label in the volume overview. This can help you to quickly find, explore and annotate those files of a large volume that are relevant to you. To filter files by label, open the filter tab in the volume overview with a click on the <button class="btn btn-default btn-xs"><i class="fa fa-filter"></i></button> button in the sidebar. Now select the "image/video label" filter from the dropdown menu and enter the name of the label in the field below. Finally, click <button class="btn btn-default btn-xs">Add rule</button> to activate the new filter rule. Of course you can combine this with other filter rules, too.
        </p>

        <div class="panel panel-info">
            <div class="panel-body">
                You can also view and edit file labels in the image/video annotation tool with the <a href="{{route('manual-tutorials', ['annotations', 'sidebar'])}}#image-labels-tab">image label tab</a> and the <a href="{{route('manual-tutorials', ['videos', 'sidebar'])}}#video-labels-tab">video label tab</a>, respectively.
            </div>
        </div>
    </div>
@endsection
