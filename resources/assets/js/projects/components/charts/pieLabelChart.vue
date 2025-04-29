<template>
     <span ref="root" class="chart"></span>
</template>

<script>
import { use, init } from 'echarts/core';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import { PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { SVGRenderer } from 'echarts/renderers';
import { markRaw } from "vue";

export default {
    props: {
        annotationLabels: {
            required: true,
            type: Array,
        },
        subtitle: {
            required:false,
            type:String,
        },
    },
    data() {
        return {
            chart: null,
        };
    },
    computed: {
        data() {
            let ret = [];
            for (let entry of this.annotationLabels) {
                let formatObj = {
                    name: entry.name,
                    value: entry.count,
                    itemStyle: {
                        color: "#" + entry.color,
                        borderColor: '#222222',
                    },
                };
                ret.push(formatObj);
            }

            return ret.sort((a, b) => b.value - a.value);
        },
        option() {
            return {
                backgroundColor: 'transparent',
                title: {
                    text: 'Abundance of annotation labels',
                    subtext: this.subtitle,
                    left: 'center',
                    top: '5%',
                    textStyle: {
                        fontSize: 15
                    },
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{b} : <b>{c}</b> ({d}%)'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: '5%',
                    left: 'center',
                    type: 'scroll',
                },
                series: [
                    {
                        type: 'pie',
                        radius: '50%',
                        avoidLabelOverlap: false,
                        label: {
                            show: true,
                            position: 'outside',
                            width: 150,
                            overflow: 'truncate',
                        },
                        labelLine: {
                            show: true
                        },
                        data: this.data,
                        emphasis: {
                            focus: 'self'
                        },
                    },
                ],
            };
        },
    },
    watch: {
        option() {
            if (this.chart) {
                this.chart.setOption(this.option);
            }
        },
    },
    beforeCreate() {
        use([
            TitleComponent,
            TooltipComponent,
            PieChart,
            SVGRenderer,
            LabelLayout,
        ]);
    },
    mounted() {
        this.chart = markRaw(init(this.$refs.root, 'dark', { renderer: 'svg' }));
        this.chart.setOption(this.option);
    },
}
</script>
