<div class="help-block" v-if="wantsCombination('Annotations', 'Basic')">
    The basic annotation report contains graphical plots of abundances of the different annotation labels (as PDF). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-basic-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('Annotations', 'Extended')">
    The extended annotation report lists the abundances of annotation labels for each image and label (as XLSX). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-extended-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('Annotations', 'Abundance')">
    The abundance annotation report lists the abundances of annotation labels for each image (as XLSX). Abundances can be aggregated to parent labels. See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-abundance-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('Annotations', 'Full')">
    The full annotation report lists the labels, shape and coordinates of all annotations (as XLSX). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-full-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('Annotations', 'Csv')">
    The CSV annotation report is intended for subsequent processing and lists the annotation labels at the highest possible resolution (as CSV files in a ZIP archive). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-csv-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('Annotations', 'Area')">
    The annotation area report lists all rectangle, circle, ellipse or polygon annotations with their dimensions and area in pixels (as XLSX). If a laser point detection was performed, the dimensions in m and area in m² is included, too. See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-area-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageLabels', 'Basic')">
    The basic image label report lists the image labels of all images (as XLSX). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#image-label-basic-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageLabels', 'Csv')">
    The CSV image label report is intended for subsequent processing and lists the image labels at the highest possible resolution (as CSV files in a ZIP archive). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#image-label-csv-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('VideoAnnotations', 'Csv')">
    The CSV video annotation report is intended for subsequent processing and lists the video annotation labels at the highest possible resolution (as CSV files in a ZIP archive). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#video-annotation-csv-report">report schema</a>.
</div>
