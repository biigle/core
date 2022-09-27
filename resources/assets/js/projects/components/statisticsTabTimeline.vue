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
        annotationTimeSeries: {required:true, type:Array},
        container: {required:true, type:String},
        subtitle: {required:true, type:String},
        volumeType: {required:false, type:String},
    },
    components: {
        VChart
    },
    provide: {
        [THEME_KEY]: "dark"
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
                    formatter: '{b}: {@[0]} ({d}%)'
                },
                encode: {
                itemName: 'year',
                tooltip:  0,
                value: 0
                }
            }
        }
    },
    methods: {
        handleUpdate(event) {
            const xAxisInfo = event.axesInfo[0];
            if (xAxisInfo) {
                // if mouse hovered on the x-axis of timeline
                // skip first two entries (+2) of sourcedata annotation-array-user (see sourcedata-property)
                const dimension = xAxisInfo.value + 2;
                // console.log('DIMENSION: ', dimension);
                this.pieObj.label.formatter = '{b}: {@[' + dimension + ']} ({d}%)';
                this.pieObj.encode.value = dimension;
                this.pieObj.encode.tooltip = dimension;
            } else {
                // if mouse not over any x-axis line, use the first entry (0) of user-series from sourcedata (the total contribution)
                this.pieObj.label.formatter = '{b}: {@[' + 0 + ']} ({d}%)';
                this.pieObj.encode.value = 0;
                this.pieObj.encode.tooltip = 0;
            }
        },
        extractYear() {
            // helper-function to get all X-Axis data (years)
            let xAxis = this.annotationTimeSeries.map((entry) => {
                return entry.year.toString();
            });
            // filter duplicated years
            xAxis = [...new Set(xAxis)];
             // sort the years (increasing)
            return xAxis.sort();
        }
    },
    computed: {
        sourcedata() {
            // provides special information specifically to pie-chart, namely total contribution of each user 
            // returns array of type [xAxis-array, annotation-array-user1, annotation-array-user2, etc.]:
            // [['all', 'year', 2020, 2021, 2022], [1195,"Name1",1195,0,0], [6,"Name2",0,2,4], [...]]
            let dat = this.annotationTimeSeries;
            let xAxis = this.extractYear();
            let chartdata = [];

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
            // include an entry of the sum over all years
            xAxis.unshift('all');
            chartdata.push(xAxis);
            // reduce user-timeseries to values only
            Object.entries(idDict).forEach(entry => {
                // calculate the sum over all years and include in the array on position 0
                let sum = 0;
                Object.values(entry[1]).forEach(val => {
                    sum += val;
                })
                // case of deleted account
                if(entry[0] === " ") {
                    chartdata.push([sum, 'Deleted Account', ...Object.values(entry[1]) ]);
                } else { // case of existing user
                    chartdata.push([sum, entry[0], ...Object.values(entry[1]) ]);
                }
            });

            // console.log('ID-Dict: ', JSON.stringify(idDict));
            // console.log('FINAL: ', JSON.stringify(chartdata));
            return [...chartdata];
        },
        createTimelineSeries() {
            // create a series Array with entries for each user, used for the timeline-plot
            let series = [];
            let end = this.sourcedata[0].length;

            // create a series of data which is specific to each user
            // skip first entry (idx=1), as it is an array of x-axis names and not user-data
            // sourcedata-structure: [['all', 'year', 2020, 2021, 2022], [1195,"Name1",1195,0,0], [6,"Name2",0,2,4]]
            for(let idx=1; idx < this.sourcedata.length; idx++) {
                let snippet = {
                    name: this.sourcedata[idx][1],
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' },
                    // skip first two entries as they are irrelevant for the timeline-data
                    data: this.sourcedata[idx].slice(2,end)
                };
                series.push(snippet)
            }
            // console.log('series: ', JSON.stringify(series));
            return series;
        },
        option() {
            let seriesObj = this.createTimelineSeries;
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
                    subtext: this.subtitle,
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
                xAxis: { 
                    type: 'category',
                    data: this.extractYear()
                },
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
    }
};
</script>
