@extends('manual.base')
@section('manual-title', 'Label Tree Versions')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Everything you need to know about versioned label trees.
        </p>

        <p>
            In the <a href="{{route('manual-tutorials', ['label-trees', 'manage-labels'])}}">previous section</a> you have learned how to create, modify or delete labels of a label tree. If a label is modified, all annotations that are using this label are affected. For this reason, modification of a label should always be carried out with care. But if you are conducting a scientific study, you may not even want to be able to modify or delete labels. You may want to agree on a fixed state of a label tree beforehand and use this fixed state throughout the whole study. This is where label tree versions come in handy.
        </p>

        <p>
            A label tree version is a copy of a label tree as it was at the time when the label tree version was created. Each label tree may have many versions, which track how the label tree changed over time. Each version is identified by a unique short name. In contrast to the original label tree, which is always called the "latest" version of the label tree, a label tree version cannot be modified. Labels of a label tree version cannot be added, deleted or changed. This way you can be sure that you get exactly the same set of labels if you use the same version of a label tree.
        </p>

        <p>
            New versions of a label tree can be created by admins of the label tree. Click on the <button class="btn btn-default btn-xs">Version: <strong>latest</strong> <span class="caret"></span></button> button right of the label tree name and then on "<i class="fa fa-plus"></i> new version". Now choose a name for the new version. Version names should be short and sequential, similar to software version names (e.g. <code>v1.0</code>, <code>v1.1</code>, <code>v1.2</code>). You can also choose to change the description of the label tree for a new version. Changes to the name, visibility or the authorized projects of a label tree are automatically propagated to all of its versions.
        </p>

        <p>
            You can also specify a <a href="https://www.doi.org/">DOI</a> for a new label tree version. This comes in handy if you have published the label tree version elsewhere. You can also create the label tree version first, then publish it to get a DOI and update the label tree version with the DOI later. @if(class_exists(\Biigle\Modules\Sync\SyncServiceProvider::class)) To publish a label tree version you can <a href="{{route('manual-tutorials', ['sync', 'label-trees'])}}">download it</a> and use the label tree export file for publishing. @endif
        </p>

        <p>
            All available versions of a label tree can be displayed with a click on the <button class="btn btn-default btn-xs">Version: <strong>latest</strong> <span class="caret"></span></button> button right of the label tree name. Click on the name of a version in the dropdown to be redirected to that version. A specific version of a label tree is indicated by the label tree name followed by an "@" and the version name (e.g. "My Labels @ v1.0").
        </p>

        <p>
            Versions of a label tree can be attached to a project just like regular label trees. You can identify a specific version by its suffix "@" followed by the version name. You can even use the "latest" label tree and one or more of its versions at the same time in a project. Just be sure not to confuse the labels of the "latest" label tree with those of its versions.
        </p>

        <p>
            A label tree version can be deleted at any time unless one of its labels is attached to an annotation, image or video.
        </p>


    </div>
@endsection
