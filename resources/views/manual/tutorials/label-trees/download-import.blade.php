@extends('manual.base')

@section('manual-title', 'Download and import')

@section('manual-content')
<div class="row">
    <p class="lead">
        Learn more on how you can download a label tree and use it elsewhere.
    </p>
    <p>
        To download a label tree, click <button class="btn btn-default btn-xs"></i> Download</button> in the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu at the top of the label tree overview. This will start the download of the label tree export file. The label tree export file can be useful in many scenarios. You can use it to publish the label tree on platforms like <a href="https://zenodo.org/">Zenodo</a> so it gets a DOI and can accompany one of your publications. You can also use the export file to import the label tree in another BIIGLE instance.
    </p>
    <p>
        To import a label tree from an export file, first click the <button class="btn btn-default btn-xs"><i class="fa fa-tags"></i> Create Label Tree</button> button on your dashboard. Next, click the <button class="btn btn-default btn-xs"><i class="fa fa-upload"></i> Import</button> button in the create label tree view. In the next view, you can select the export file of the label tree that you wish to import. Click <button class="btn btn-success btn-xs">Import</button> to upload the file and perform the import. Label trees that already exist in a BIIGLE instance cannot be imported again. You can <a href="{{route('manual-tutorials', ['label-trees', 'about'])}}#fork-a-label-tree">fork</a> the label tree in this case.
    </p>
    <h3>Label tree export format</h3>
    <p>
        A label tree export file is a ZIP archive that contains two files, <code>label_tree.json</code> and <code>labels.csv</code>.
    </p>
    <h4>label_tree.json</h4>
    <p>
        This is a JSON file that contains the following properties of the label tree:
    </p>
    <ul>
        <li>
            <code>id</code>: The ID of the label tree in the BIIGLE database.
        </li>
        <li>
            <code>name</code>: The name of the label tree.
        </li>
        <li>
            <code>description</code>: The description of the label tree. May be empty.
        </li>
        <li>
            <code>created_at</code>: The date and time when the label tree was created.
        </li>
        <li>
            <code>updated_at</code>: The date and time when the label tree was last modified.
        </li>
        <li>
            <code>uuid</code>: The globally unique identifier of the label tree (UUID4).
        </li>
        <li>
            <code>version</code>: An object that contains the <code>id</code>, <code>name</code> and <code>doi</code> of the version of the label tree. This is <code>null</code> if the label tree has no version.
        </li>
    </ul>
    <p>
        Example:
    </p>
<pre>
{
    "id": 240,
    "name": "CATAMI",
    "description": "The CATAMI classification scheme.",
    "created_at": "2019-06-13 08:55:41",
    "updated_at": "2019-06-13 09:20:30",
    "uuid": "620b4105-124e-43a8-af43-16964a9fa192",
    "version": {
        "id": 122,
        "name": "v1.4",
        "doi": "10.5281/zenodo.3374162"
    }
}
</pre>
    <h4>labels.csv</h4>
    <p>
        This is a CSV file that contains a list of all labels of the label tree. The CSV file has the following columns:
    </p>
    <ol>
        <li>
            <code>id</code>: The ID of the label in the BIIGLE database.
        </li>
        <li>
            <code>name</code>: The name of the label.
        </li>
        <li>
            <code>parent_id</code>: The ID of the parent label of this label. The ID must match one of the IDs in the first column. May be empty if the label has no parent.
        </li>
        <li>
            <code>color</code>: The RGB color code of the label in hex notation.
        </li>
        <li>
            <code>label_tree_id</code>: The ID of the label tree to which the label belongs. This must match the ID of the label tree in <code>label_tree.json</code>.
        </li>
        <li>
            <code>source_id</code>: An arbitrary identifier of the label in an external database like <a href="http://www.marinespecies.org/">WoRMS</a>. May be empty.
        </li>
    </ol>
    <p>
        Example:
    </p>
    <table class="table">
        <thead>
            <tr>
                <th>id</th>
                <th>name</th>
                <th>parent_id</th>
                <th>color</th>
                <th>label_tree_id</th>
                <th>source_id</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>17402</td><td>Acorn</td><td>17412</td><td>e70411</td><td>240</td><td></td></tr>
            <tr><td>17406</td><td>Articulated calcareous</td><td>17553</td><td>52bef9</td><td>240</td><td></td></tr>
            <tr><td>17407</td><td>Ascidians</td><td>17418</td><td>d7ea4b</td><td>240</td><td></td></tr>
            <tr><td>17408</td><td>Attached</td><td>17640</td><td>21f68d</td><td>240</td><td></td></tr>
            <tr><td>17409</td><td>Bacterial mats</td><td>17418</td><td>69f0ba</td><td>240</td><td></td></tr>
            <tr><td>17410</td><td>Balls</td><td>17556</td><td>1430ec</td><td>240</td><td></td></tr>
            <tr><td>17411</td><td>Barnacle plates</td><td>17417</td><td>f3c064</td><td>240</td><td></td></tr>
            <tr><td>17412</td><td>Barnacles</td><td>17472</td><td>dbf249</td><td>240</td><td></td></tr>
            <tr><td>17417</td><td>Biologenic</td><td>17583</td><td>4739f1</td><td>240</td><td></td></tr>
            <tr><td>17418</td><td>Biota</td><td></td><td>38ed82</td><td>240</td><td></td></tr>
            <tr><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
        </tbody>
    </table>
</div>
@endsection
