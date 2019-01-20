// Using function syntax to create our singleton
const WearPlateChart = new function() {
    let DATASET_HISTORICAL = 0;
    let DATASET_PREDICTIVE = 1;

    let PREDICTIVE_COUNT = 3;

    let chart_colours = {
        red: 'rgb(255, 99, 132)',
        orange: 'rgb(255, 159, 64)',
        yellow: 'rgb(255, 205, 86)',
        green: 'rgb(75, 192, 192)',
        blue: 'rgb(54, 162, 235)',
        purple: 'rgb(153, 102, 255)',
        grey: 'rgb(201, 203, 207)',
        translucent: 'rgba(0, 0, 0, 0)'
    };
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let data_points_x = [new Date("2018-11-1 12:00"), new Date("2018-12-1 12:00"), new Date("2019-1-1 12:00")];
    let data_points_y = [20, 18, 16];  // Plate thickness in mm
    let config = {
        type: 'line',
        data: {
            labels: [], // Filled in at run-time
            datasets: [
                {
                    label: 'Historical',
                    borderColor: chart_colours.green,
                    backgroundColor: chart_colours.translucent,
                    fill: false,
                    lineTension: 0,
                    data: []  // Filled in at run-time
                },
                {
                    label: 'Predictive',
                    borderColor: chart_colours.blue,
                    backgroundColor: chart_colours.translucent,
                    fill: false,
                    lineTension: 0,
                    data: [],  // Filled in at run-time
                    borderDash: [10,5]
                }
            ],
        },
        options: {
            responsive: true,
            tooltips: {
                mode: 'index'
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Thickness (mm)'
                    },
                    ticks: {
                        suggestedMin: 0,
                        suggestedMax: 40,
                    }
                }]
            }
        }
    };

    this.update_chart = function(chart) {
        // Our extrapolation function
        let extrapolate = new EXTRAPOLATE.LINEAR();

        // Clear any existing data
        config.data.labels = [];
        config.data.datasets[DATASET_HISTORICAL].data = [];
        config.data.datasets[DATASET_PREDICTIVE].data = [];

        // Update historical data
        for(let i = 0; i < data_points_y.length; i++) {
            // Trains our extrapolation
            extrapolate.given(data_points_x[i].getTime()).get(data_points_y[i]);

            // Update historical chart data
            config.data.datasets[DATASET_HISTORICAL].data.push({
                t: data_points_x[i],
                y: data_points_y[i]
            });

            // Add the final data point to the predictive line, meaning the dotted line joins the two data sets
            if(i === (data_points_y.length - 1)) {
                config.data.datasets[DATASET_PREDICTIVE].data.push({
                    t: data_points_x[i],
                    y: data_points_y[i]
                });
            } else {
                config.data.datasets[DATASET_PREDICTIVE].data.push({
                    t: data_points_x[i],
                    y: NaN
                });
            }

            let date = data_points_x[i];
            config.data.labels.push(date.getFullYear() + ' ' + months[date.getMonth()]);
        }

        // Now update predictive data
        let last_date = data_points_x[data_points_x.length - 1];
        for(let i = 0; i < PREDICTIVE_COUNT; i++) {

            // getMonth() plus 2 because it is indexed from 0 (january) but we want to predict a month in advance each iteration
            // There are good date manipulation libraries available but isn't necessary for this basic operation
            const date_str = last_date.getFullYear() + '-' + (last_date.getMonth() + 2) + '-' + last_date.getDay();
            let future_date = new Date(date_str);
            let plate_thickness_mm = Math.round(extrapolate.valueFor(future_date.getTime()));

            config.data.datasets[DATASET_PREDICTIVE].data.push({
                t: future_date,
                y: plate_thickness_mm
            });
            config.data.labels.push(future_date.getFullYear() + ' ' + months[future_date.getMonth()]);

            last_date = future_date;
        }

        chart.update();
    };

    this.set_chart = function(element) {
        let ctx = document.getElementById(element).getContext('2d');
        this.chart = new Chart(ctx, config);
        this.update_chart(this.chart);
    };
};

window.onload = function() {
    WearPlateChart.set_chart('wear_plate_chart');
};