@extends('manual.base')

@section('manual-title') Annotation and file label import @stop

@section('manual-content')
<div class="row">
    <p class="lead">
        Import annotations and file labels from metadata files.
    </p>
    <p>
        Some <a href="{{route('manual-tutorials', ['volumes', 'file-metadata'])}}">metadata file formats</a> also support storing of annotation and/or file label information for images and videos. If you upload such a metadata file, the form to create a new volume will offer the options to import the annotations and/or file labels for the new volume, too. If you select one of these options, you are guided through a multi-step flow for the import. The individual steps are explained below.
    </p>

    <h3>1. Create the volume</h3>
    <p>
        The import begins when you create the new volume and selected one of the options to import annotations and/or file labels. While the volume is created in the background, you are redirected to the next step.
    </p>

    <h3>2. Choose annotation labels</h3>
    <p>
        This step only applies if you enabled the annotation import in step 1. In this step you are asked to choose all labels of annotations that should be imported. You can select only a subset of labels to import only certain annotations or you can select all labels to import all annotations.
    </p>

    <h3>3. Choose file labels</h3>
    <p>
        This step only applies if you enabled the file label import in step 1. In this step you are asked to choose all file labels that should be imported. You can select only a subset of labels to import only certain file labels or you can select all labels.
    </p>

    <h3>4. Label mapping</h3>
    <p>
        In this step you have to select one label from the BIIGLE database for each label of the metadata file that should be imported. Sometimes the metadata file stores unique identifiers for labels which enables BIIGLE to choose labels automatically. By default, you may choose any label from a label tree that is associated to the project to which the newly created volume (in step 1.) was added. You can also create new labels with pre-filled name (and maybe color) based on the metadata information.
    </p>

    <h3>5. User mapping</h3>
    <p>
        In this step you have to select one user from the BIIGLE database for each user of the metadata file (i.e. creators of annotations and/or file labels) that should be imported. Sometimes the metadata file stores unique identifiers for users which enables BIIGLE to choose users automatically. You can choose any user of the BIIGLE instance (including your own).
    </p>

    <h3>6. Finish import</h3>
    <p>
        This step verifies if all required information for the import is available or if you have to go back and provide additional information. When you click <button class="btn btn-success btn-xs">Finish import</button>, you are redirected to the newly created volume (in step 1.) while the annotation and/or file label import proceeds in the background.
    </p>
</div>
@endsection
