<script type="text/javascript">
    biigle.$declare('annotations.exportArea', {!! json_encode(\Biigle\Modules\Export\Volume::convert($volume)->exportArea) !!});
</script>
<script src="{{ cachebust_asset('vendor/export/scripts/annotations.js') }}"></script>
