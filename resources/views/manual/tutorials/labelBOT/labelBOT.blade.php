@extends('manual.base')

@section('manual-title', 'LabelBOT')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Your Automatic Classification Assistant.
        </p>

        <p>
            LabelBOT assists in classifying annotations by suggesting up to three labels. It uses vector search to identify the most relevant labels based on existing annotations. This enhances the annotating process and can significantly reduce the time required for manual labeling.
        </p>

        <h3>Feature Vector</h3>
        <p>
            LabelBOT relies on a 384-dimensional feature vector database generated from BIIGLE’s image annotation data. These vectors are extracted using the DINOv2 self-supervised learning model, which captures semantic features from images without requiring manual labeling. These vectors serve as the foundation for classification using similarity-based search.
        </p>

        <h3>K-Nearest Neighbors (KNN) Classification</h3>
        <p>
            Classification in LabelBOT is based on the K-Nearest Neighbors (KNN) algorithm using cosine similarity. When a new annotation is created, the system compares its feature vector to those in the database and retrieves the most similar ones.
        </p>

        <h3>Approximate Nearest Neighbors (ANN)</h3>
        <p>
            To ensure fast responses, LabelBOT employs Approximate Nearest Neighbors (ANN) search using the HNSW (Hierarchical Navigable Small World) index. This allows for efficient similarity search with minimal loss in accuracy.
        </p>

        <h3>Dynamic Index Switching (DIS)</h3>
        <p>
            LabelBOT uses Dynamic Index Switching (DIS) to combine the speed of ANN search with the precision of exact KNN. If the ANN search fails to return reliable results, the system automatically switches to a B-Tree index to perform an exact search. This hybrid strategy ensures robust label suggestions while managing the trade-off between latency and accuracy.
        </p>

        <h3>LabelBOT in BIIGLE</h3>

        <p>
            LabelBOT can be activated in the image annotation tool by opening the <i class="fa fa-tags"></i> label trees tab and clicking the <button class="btn btn-default">LabelBOT<sup>beta</sup></button> button.
        </p>

        <p>
            Once activated, the button turns blue and an indicator appears at the bottom-right corner of the image annotation tool. LabelBOT will then initialize and load the ONNX model. This model is used to generate the feature vector locally in your browser. Depending on your internet connection and system performance, initialization may take a few seconds.
        </p>

        <p>
            The indicator displays one of four possible states:
        </p>

        <ul>
            <li>
                <strong><span class="text-warning">Initializing</span></strong>: LabelBOT is loading the ONNX model and preparing for use
                <div style="text-align: center; margin-top: 0.5em;">
                    <button class="labelbot-indicator initializing">
                        <span class="labelbot-indicator__dot"></span>LabelBOT
                    </button>
                </div>
            </li>

            <li>
                <strong><span class="text-success">Ready</span></strong>: LabelBOT is initialized and ready to process new annotations
                <div style="text-align: center; margin-top: 0.5em;">
                    <button class="labelbot-indicator ready">
                        <span class="labelbot-indicator__dot"></span>LabelBOT
                    </button>
                </div>
            </li>

            <li>
                <strong><span class="text-info">Computing</span></strong>: LabelBOT is actively performing vector search and generating label suggestions
                <div style="text-align: center; margin-top: 0.5em;">
                    <button class="labelbot-indicator computing">
                        <span class="labelbot-indicator__dot"></span>LabelBOT
                    </button>
                </div>
            </li>

            <li>
                <strong>Busy</strong>: LabelBOT is handling the maximum number of simultaneous requests. New requests must wait until one completes, after which the status returns to <span class="text-success">Ready</span>
                <div style="text-align: center; margin-top: 0.5em;">
                    <button class="labelbot-indicator busy">
                        <span class="labelbot-indicator__dot"></span>LabelBOT
                    </button>
                </div>
            </li>
        </ul>

        <p>
            Once LabelBOT finishes computing, a popup will appear showing the suggested labels. The first label is automatically selected and saved, with a progress bar running in the background. If no action is taken before the progress completes, the first suggestion will be confirmed. You can hover over the suggestions to pause the progress bar and manually select a different label. If the desired label is not among the suggestions, you can enter it in the input field and select it manually.
        </p>

        <p>
            You can select a suggested label using the number key shortcuts displayed next to each label in the popup. To quickly focus on or exit the input field, press <kbd>Tab</kbd>.
        </p>
        <p>
            The popup can be freely dragged around the annotation area, and the dashed line will remain connected to the annotation point.
        </p>

        <p class="text-center">
            <a href="{{ asset('assets/images/manual/labelbot_popup.jpg') }}">
                <img src="{{ asset('assets/images/manual/labelbot_popup.jpg') }}" width="75%">
            </a>
        </p>



    </div>
@endsection
