@extends('manual.base')

@section('manual-title', 'Editing Video Annotations')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn about all the tools to modify or delete existing video annotations.
        </p>
        <p>
            The video annotation tool provides many ways to edit video annotations. Most of these can be accessed in the tool bar.
        </p>

        <p class="text-center">
            <a href="{{asset('assets/images/manual/videos/editing_annotations_1.jpg')}}"><img src="{{asset('assets/images/manual/videos/editing_annotations_1.jpg')}}" width="50%"></a>
        </p>

        <h3><a name="modify-annotations"></a>Modify annotations</h3>
        <p>
            Only the keyframes of a video annotation can be modified. First, select a keyframe in the <a href="{{route('manual-tutorials', ['videos', 'navigating-timeline'])}}">timeline</a> and then modify or <i class="fa fa-arrows-alt"></i> move the annotation at this keyframe in the same way than a <a href="{{route('manual-tutorials', ['annotations', 'editing-annotations'])}}">still image annotation</a>. If you do not select a keyframe of the annotation first, a new keyframe will be created at the current time of the video. Labels can be <i class="fa fa-tag"></i> attached to, swapped or detached from video annotations in the same way than for <a href="{{route('manual-tutorials', ['annotations', 'editing-annotations'])}}#attach-labels">still image annotations</a>. With the attach or swap label tools activated, you can also click on an annotation clip in the timeline at the bottom to attach a new label to the annotation or swap an existing one.
        </p>

        <h3><a name="link-annotation-clips"></a><i class="fa fa-link"></i> Link annotation clips</h3>
        <p>
            Sometimes an object or region of interest (ROI) might disappear from the video and reappear at a later time. To still count this object or ROI as a single annotation, annotation clips can be linked. First, create two separate annotation clips, marking the object or ROI at both times at which it is visible in the video. Next, select both annotation clips. Finally, click the <button class="btn btn-xs btn-default"><i class="fa fa-link"></i></button> button in the tool bar to link the two annotation clips. The result is a single annotation clip with a gap, which is marked with a dotted line between two keyframes. You can repeat this process to create an annotation clip with several gaps.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/videos/editing_annotations_2.jpg')}}"><img src="{{asset('assets/images/manual/videos/editing_annotations_2.jpg')}}" width="33%"></a><br>
            <a href="{{asset('assets/images/manual/videos/editing_annotations_3.jpg')}}"><img src="{{asset('assets/images/manual/videos/editing_annotations_3.jpg')}}" width="33%"></a>
        </p>


        <h3><a name="split-annotation-clips"></a><i class="fa fa-unlink"></i> Split annotation clips</h3>
        <p>
            Sometimes, e.g. if an <a href="{{route('manual-tutorials', ['videos', 'creating-video-annotations'])}}#object-tracking">object tracking</a> went wrong, you might want to remove part of an annotation clip. You can do this by either deleting the last few keyframes (see below) or by splitting an annotation clip in two and deleting one of them. Annotation clips can also be split at a gap, restoring the separate annotation clips to their state before they were linked. To split an annotation clip, move the current time of the video to the time at which the annotation clip should be split. Then click the <button class="btn btn-xs btn-default"><i class="fa fa-unlink"></i></button> button in the tool bar.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/videos/editing_annotations_6.jpg')}}"><img src="{{asset('assets/images/manual/videos/editing_annotations_6.jpg')}}" width="33%"></a>
            <a href="{{asset('assets/images/manual/videos/editing_annotations_4.jpg')}}"><img src="{{asset('assets/images/manual/videos/editing_annotations_4.jpg')}}" width="33%" style="margin-left: 50px;"></a><br>
            <a href="{{asset('assets/images/manual/videos/editing_annotations_7.jpg')}}"><img src="{{asset('assets/images/manual/videos/editing_annotations_7.jpg')}}" width="33%"></a>
            <a href="{{asset('assets/images/manual/videos/editing_annotations_5.jpg')}}"><img src="{{asset('assets/images/manual/videos/editing_annotations_5.jpg')}}" width="33%" style="margin-left: 50px;"></a>
        </p>
        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                Line or polygon annotation clips cannot be split.
            </div>
        </div>

        <h3><a name="delete-annotations-or-keyframes"></a><i class="fa fa-trash"></i> Delete annotations or keyframes</h3>
        <p>
            To delete an annotation, select it and then click the <button class="btn btn-xs btn-default"><i class="fa fa-trash"></i></button> button in the tool bar. Note that only project experts or admins can delete annotations to which labels were attached by other users. To delete only a keyframe of an annotation clip, select the keyframe in the timeline and then click the <button class="btn btn-xs btn-default"><i class="fa fa-trash"></i></button> button.
        </p>

        <p>
            Read on and learn more about the <a href="{{route('manual-tutorials', ['videos', 'sidebar'])}}">sidebar</a> of the video annotation tool.
        </p>
    </div>
@endsection
