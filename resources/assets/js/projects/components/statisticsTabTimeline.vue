<template>
    <v-chart class="chart grid-col-span-3" :option="option" @updateAxisPointer="handleUpdate"></v-chart>
</template>

<script>
import * as echarts from 'echarts/core';
import {
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components';
import { LineChart, PieChart } from 'echarts/charts';
import { UniversalTransition, LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { TitleComponent } from 'echarts/components';
import VChart, { THEME_KEY } from "vue-echarts";


echarts.use([
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  CanvasRenderer,
  UniversalTransition,
  LabelLayout,
  TitleComponent
]);


export default {
    name: "Annotation-Timeline",
    props: {
        annotationTimeSeries: {required:true, type:Array}
    },
    components: {
        VChart
    },
    provide: {
        [THEME_KEY]: "dark"
    },
    methods: {
        handleUpdate(event) {
            const xAxisInfo = event.axesInfo[0];
            if (xAxisInfo) {
                const dimension = xAxisInfo.value + 1;
                // console.log('DIMENSION: ', dimension);
                this.pieObj.label.formatter = '{b}: {@[' + dimension + ']} ({d}%)';
                this.pieObj.encode.value = dimension;
                this.pieObj.encode.tooltip = dimension;
            }
        }
    },
    // created() {
    //     console.log(this.annotationTimeSeries);
    //     // this.sourcedata = this.transformData(this.annotationTimeSeries);
    //     console.log('sourcedata: ', JSON.stringify(this.sourcedata));
    // },
    computed: {
        sourcedata() {
            let dat = this.annotationTimeSeries;
            let chartdata = [];

            // get all X-Axis data
            let xAxis = dat.map((entry) => {
                return entry.year.toString();
            });
            // filter duplicated years
            xAxis = [...new Set(xAxis)];
             // sort the years (increasing)
            xAxis.sort();

            // get all unique User-names
            let id = dat.map((entry) => {
                return entry.fullname;
            });
            // filter duplicated name-entries
            let id_unique = [...new Set(id)];
            let idDict = {};
            // create object with "year-slots" for each user (e.g. {id: {"2020":0, "2021":0, "2022":0]}))
            for(let x of id_unique) {
                let yearDict = {};
                for(let y of xAxis) {
                    yearDict[y] = 0;
                }
                idDict[x] = yearDict;
            }
            // console.log('xAxis: ', xAxis);
            // console.log('ID: ', id_unique);

            // assemble the annotations of each user in correct order of year
            // each user has its own year-timeseries in idDict (e.g. {id: {"2020":10, "2021":4, "2022":6]})
            for(let year of xAxis) {
                for(let entry of dat) {
                    if(entry.year.toString() == year) {
                        idDict[entry.fullname][year] += entry.count;
                    } else {
                        idDict[entry.fullname][year] += 0;
                    }
                }
            }

            // setup of whole chartdata object
            // include axis-name in front
            xAxis.unshift('year');
            chartdata.push(xAxis);
            // reduce user-timeseries to values only
            Object.entries(idDict).forEach(entry => {
                if(entry[0] === " ") {
                    chartdata.push([ 'Deleted Account', ...Object.values(entry[1]) ]);
                } else {
                    chartdata.push([ entry[0], ...Object.values(entry[1]) ]);
                }
            });

            // console.log('ID-Dict: ', JSON.stringify(idDict));
            // console.log('FINAL: ', JSON.stringify(chartdata));
            return [...chartdata];
        },
        option() {
            // create a series Array
            let snippet = {
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' }
                };
            // repeat as often as number of users in the project
            let seriesObj = Array( (this.sourcedata.length-1) ).fill(snippet);
            // append the pie-chart specific snippet
            seriesObj.push(this.pieObj);

            return {
                legend: {
                    left: '2%',
                    top: '24%',
                    orient: 'vertical'
                },
                tooltip: {
                trigger: 'axis',
                showContent: false
                },
                backgroundColor: '#222222',
                title: {
                    text: 'Total contribution',
                    subtext: 'annotations per user across all volumes of the project, sorted by year',
                    top: '5%',
                    left: '2%',
                    textAlign: "left",
                    textStyle: {
                        fontSize: 20
                    },
                    subtextStyle: {
                        width: 250,
                        overflow: "break",
                        lineHeight: 15,
                        align: "center",
                        verticalAlign: "top"
                    },
                },
                dataset: {
                    source: this.sourcedata
                },
                xAxis: { type: 'category' },
                yAxis: { 
                    gridIndex: 0,
                    name: "annotations",
                    nameLocation: "middle",
                    nameTextStyle: { verticalAlign: "middle" },
                    nameGap: 60 },
                grid: { 
                    top: '60%', 
                    bottom: '10%',
                    left: '20%',
                    right: '5%'
                },
                series: seriesObj
            }
        }
    },
    data() {
        return {
            pieObj: {
                type: 'pie',
                id: 'pie',
                radius: '30%',
                center: ['55%', '30%'],
                emphasis: {
                focus: 'self'
                },
                label: {
                    // formatter: function (params){
                    //     return `${params.name}: ${params.value[1]} (${params.percent}%)`;
                    // }
                    formatter: '{b}: {@[1]} ({d}%)'
                },
                encode: {
                itemName: 'year',
                tooltip:  1,
                value: 1
                }
            }
        }
    }
};
</script>