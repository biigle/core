@extends('manual.base')

@section('manual-title', 'Getting Started')

@section('manual-content')
    <div class="row">
        <p class="lead">
            An introduction to the video annotation tool.
        </p>
        <p>
            The video annotation tool can be used to explore videos and their annotations. Project editors, experts or admins can create new video annotations as well as modify or delete existing ones. Each video belongs to a volume. You can access a video by clicking on its thumbnail in the video volume overview.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/videos/getting_started_1.jpg')}}"><img src="{{asset('assets/images/manual/videos/getting_started_1.jpg')}}" width="75%" style="border: 1px solid #111;"></a>
        </p>
        <p>
            The main element of the video annotation tool is the video which you can navigate similar to an interactive map (like Google Maps). You can grab and move the video with the mouse or zoom in and out using the mouse wheel. On the top right of the video there is the minimap. It always shows the entire video and highlights your current viewport depending on the zoom level and position.
        </p>
        <p>
            At the bottom of the video annotation tool there is the video timeline. It indicates the current time of the video with a red line and will show the video annotations if there are any.
        </p>
        <p>
            On the right there is the sidebar with the <i class="fa fa-tags"></i> label trees and <i class="fa fa-cog"></i> settings tabs. Open a tab by clicking on the icon.
        </p>
        <p>
            On the left of the video there are controls to zoom in <button class="btn btn-default btn-xs"><i class="fa fa-plus"></i></button> or out <button class="btn btn-default btn-xs"><i class="fa fa-minus"></i></button>, fit the video to the current viewport <button class="btn btn-default btn-xs"><i class="fa fa-compress"></i></button> or zoom the video to its original resolution <button class="btn btn-default btn-xs"><i class="fa fa-expand"></i></button>. You can also pop out the video to a separate window with the <button class="btn btn-default btn-xs"><i class="fa fa-expand-alt"></i></button> button. This is most useful if you can use multiple screens with one screen for the video timeline and one screen for the video itself.
        </p>
        <p>
            Finally, on the bottom of the video there is the tool bar. Starting from the left there are the video navigation and playback buttons, the annotation tools to create new video annotations and the manipulation tools to edit existing video annotations.
        </p>
        <p>
            Let's create a new video annotation. First, select one of the labels from the <i class="fa fa-tags"></i> label trees tab in the sidebar:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/videos/getting_started_2.jpg')}}"><img src="{{asset('assets/images/manual/videos/getting_started_2.jpg')}}" width="75%" style="border: 1px solid #111;"></a>
        </p>
        <p>
            Note that the selected label is displayed on the bottom right of the video as well so you don't have to keep the sidebar open all the time.
        </p>
        <p>
            Now select one of the annotation tools from the tool bar. Let's take the circle tool:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/videos/getting_started_3.jpg')}}"><img src="{{asset('assets/images/manual/videos/getting_started_3.jpg')}}" width="75%" style="border: 1px solid #111;"></a>
        </p>
        <p>
            Draw the circle with a click to set the center and another click to set the radius. Then click on the <button class="btn btn-xs btn-default"><i class="fa fa-check"></i></button> button above the circle tool to finish the new video annotation.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/videos/getting_started_4.jpg')}}"><img src="{{asset('assets/images/manual/videos/getting_started_4.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/videos/getting_started_5.jpg')}}"><img src="{{asset('assets/images/manual/videos/getting_started_5.jpg')}}" width="32%"></a>
            <a href="{{asset('assets/images/manual/videos/getting_started_6.jpg')}}"><img src="{{asset('assets/images/manual/videos/getting_started_6.jpg')}}" width="32%"></a>
        </p>
        <p>
            The new annotation is displayed both in the video and the video timeline. This annotation is a single-keyframe annotation, marking an object in a single frame of the video. Now you should be able to use the video annotation tool for basic tasks. Learn about more advanced ways to create video annotations in the next articles:
        </p>
        <ul>
            <li><a href="{{route('manual-tutorials', ['videos', 'creating-video-annotations'])}}">Learn how to create different kinds of video annotations.</a></li>
            <li><a href="{{route('manual-tutorials', ['videos', 'navigating-timeline'])}}">Learn about the video timeline and how to navigate it.</a></li>
            <li><a href="{{route('manual-tutorials', ['videos', 'editing-video-annotations'])}}">Learn about all the tools to modify or delete existing video annotations.</a></li>
            <li><a href="{{route('manual-tutorials', ['videos', 'sidebar'])}}">All sidebar tabs of the video annotation tool explained.</a></li>

            <li><a href="{{route('manual-tutorials', ['videos', 'shortcuts'])}}">A list of all available shortcut keys in the video annotation tool.</a></li>
            <li><a href="{{route('manual-tutorials', ['videos', 'url-parameters'])}}">Advanced configuration of the video annotation tool.</a></li>
        </ul>
    </div>
@endsection

