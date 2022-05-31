/* globals Chart:false, feather:false */

(function () {
    'use strict'
    var models = document.getElementById("chartScript").getAttribute("data-models");

    var models = document.currentScript.dataset.models;
    models = JSON.parse(models)
    for (let i = 0; i < models.length; i++) {
        console.log(models[i]);
    }

    // var spy = document.currentScript.dataset.spy;
    // var obj = JSON.parse(models);
    // var keys = Object.keys(obj)
    // var spy = JSON.parse(spy)
    // var spys = Object.values(spy)

    // for (let i = 0; i < keys.length; i++) {
    //     var id = keys[i]
    //     var xs = obj[id][0]
    //     var y1s = obj[id][1]
    //     // Graphs
    //     const canvas = document.getElementById(id);
    //     if (!canvas) continue
    //     const ctx = canvas.getContext('2d');
    //     // eslint-disable-next-line no-unused-vars

    //     var likeModes = document.currentScript.dataset.likedids;
    //     if (!likeModes || (likeModes && likeModes.includes(id))) {
    //         if (document.getElementById(id + "-blur")) {
    //             document.getElementById(id + "-blur").style.display = "none"
    //         }
    //     } else {
    //     }
    //     var myChart = new Chart(canvas, {
    //         type: 'line',
    //         data: {
    //             labels: xs,
    //             datasets: [{
    //                 label: "prediction",
    //                 data: y1s,
    //                 lineTension: 0,
    //                 backgroundColor: 'transparent',
    //                 borderColor: '#007bff',
    //                 borderWidth: 1,
    //                 pointBackgroundColor: '#007bff',
    //                 pointRadius: 1,
    //                 pointHoverRadius: 5
    //             },
    //             {
    //                 label: "spy-base",
    //                 data: spys[1],
    //                 lineTension: 0,
    //                 backgroundColor: 'transparent',
    //                 borderColor: '#808080',
    //                 borderWidth: 0.5,
    //                 pointBackgroundColor: '#808080',
    //                 pointRadius: 1,
    //                 pointHoverRadius: 5
    //             },
    //             ]
    //         },
    //         options: {
    //             scales: {
    //                 yAxes: [{
    //                     ticks: {
    //                         beginAtZero: false
    //                     }
    //                 }]
    //             },
    //             legend: {
    //                 display: false
    //             }
    //         }
    //     });
    // }
})()
