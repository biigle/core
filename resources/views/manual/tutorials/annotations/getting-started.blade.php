@extends('manual.base')

@section('manual-title', 'Getting Started')

@section('manual-content')
    <div class="row">
        <p class="lead">
            A quick introduction to the image annotation tool.
        </p>

        <p>
            The image annotation tool can be used to navigate and explore images and their annotations. Project editors, experts or admins can also create new annotations as well as modify or delete existing ones.
        </p>

        <p>
            You can access the image annotation tool by clicking on an individual image in the volume overview:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/getting_started_1.jpg')}}"><img src="{{asset('assets/images/manual/getting_started_1.jpg')}}" width="75%"></a>
        </p>
        <p>
            The main element of the image annotation tool is the image which you can navigate similar to an interactive map (like Google Maps). You can grab and move the image with the mouse or zoom in and out using the mouse wheel.
        </p>
        <p>
            On the right there is the image annotation tool sidebar with different tabs like <i class="fa fa-map-marker-alt"></i> annotations, <i class="fa fa-tags"></i> label trees, <i class="fa fa-adjust"></i> color adjustment or the <i class="fa fa-cog"></i> settings. Open a tab by clicking on an icon.
        </p>
        <p>
            On the top right over the image there is the minimap. It always shows the entire image and highlights your current viewport depending on the zoom level and position.
        </p>
        <p>
            Finally, on the bottom there is the tool bar. Starting from the left there are the image navigation buttons (backward and forward), the annotation tools to create new annotations and the manipulation tools to edit existing annotations.
        </p>
        <p>
            Let's create an annotation. First, select one of the labels from the <i class="fa fa-tags"></i> label trees tab in the sidebar:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/getting_started_2.jpg')}}"><img src="{{asset('assets/images/manual/getting_started_2.jpg')}}" width="75%"></a>
        </p>
        <p>
            Note that the selected label is displayed on the bottom right of the image as well so you don't have to keep the sidebar open all the time.
        </p>
        <p>
            Now select one of the annotation tools from the tool bar. Let's take the rectangle tool:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/getting_started_3.jpg')}}"><img src="{{asset('assets/images/manual/getting_started_3.jpg')}}" width="75%"></a>
        </p>
        <p>
            Finally draw the rectangle annotation by clicking multiple times on the image:
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/getting_started_4.jpg')}}"><img src="{{asset('assets/images/manual/getting_started_4.jpg')}}" width="75%"></a>
        </p>
        <p>
            Now you should be able to use the annotation tool for basic tasks. But this was not all you can learn about the tool. Continue reading the other tutorials to become an expert annotator:
        </p>
        <ul>
            <li><a href="{{route('manual-tutorials', ['annotations', 'creating-annotations'])}}">Learn about all the tools that are available to create new image annotations.</a></li>
            <li><a href="{{route('manual-tutorials', ['annotations', 'editing-annotations'])}}">Learn about all the tools to modify or delete existing image annotations.</a></li>
            <li><a href="{{route('manual-tutorials', ['annotations', 'navigating-images'])}}">Learn about advanced ways to navigate the images in the image annotation tool.</a></li>
            <li><a href="{{route('manual-tutorials', ['annotations', 'sidebar'])}}">All sidebar tabs of the image annotation tool explained.</a></li>
            <li><a href="{{route('manual-tutorials', ['annotations', 'shortcuts'])}}">A list of all available shortcut keys in the image annotation tool.</a></li>
        </ul>
    </div>
@endsection
