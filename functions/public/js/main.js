//============================================================
// graph visualization (gv)
//------------------------------------------------------------
var network, data;

function init() {
  $.ajax({
    url: '/initialization',
    data: { 
            "data": JSON.stringify({'msg': 'initialization'}),
          }, 
    type: 'POST',
    success: function(graph) {
      console.log("successfully getting data from server!!!")
      var data = JSON.parse(graph);

      create_views(data)
    },
    error: function(error) {
      console.log("error in getting data from server!!!")
      console.log(error);
    }
  });  
}

function create_views(graph) {
  // ========== Step 1: the graph view ==========
  var radius = 200
  var centerx = 200 
  var centery = 200

  // manually layout the ndoes
  var num_node = graph.nodes.length
  for(var i=0; i<num_node; i++) {
    if(i==0) {// set the first node to center
      graph.nodes[i].x = centerx
      graph.nodes[i].y = centery
    }
    else {
      graph.nodes[i].x = gv.utils.getXYfromAngle(360/(num_node-1)*(i-1), radius, centerx, centery).x; 
      graph.nodes[i].y = gv.utils.getXYfromAngle(360/(num_node-1)*(i-1), radius, centerx, centery).y;  
    }
    
  }

  // create a network
  var container = document.getElementById("div_graph_content");
  data = {
    nodes: new vis.DataSet(graph.nodes),
    edges: new vis.DataSet(graph.links),
  };

  var options = {
    autoResize: true,
    height: '100%',
    width: '100%',
    locale: 'en',
    interaction: {
      hover: true,
      hoverConnectedEdges: true,
    },
    physics: false,
    // interaction: {
    //     dragNodes: false,// do not allow dragging nodes
    //     zoomView: false, // do not allow zooming
    //     dragView: false  // do not allow dragging
    // },
    manipulation: {
      editEdge: {
        editWithoutDrag: function (data, callback) {
          // console.info(data);
          // alert("The callback data has been logged to the console.");
          // callback(data);
        },
      },
    },
  };

  network = new vis.Network(container, data, options);

  // all events: view-source:https://visjs.github.io/vis-network/examples/network/events/interactionEvents.html
  network.on("hoverNode", function (params) {
    console.log("hoverNode Event:", params);

    // // update the line chart
    // var container = document.getElementById('div_line_content');

    // function getRandomInt(max) {
    //   return Math.floor(Math.random() * max);
    // }

    // var items = [
    //     {x: '2014-06-11', y: 10, group: 1},
    //     {x: '2014-06-12', y: 25, group: 1},
    //     {x: '2014-06-13', y: 30, group: 1},
    //     {x: '2014-06-14', y: 10, group: 1},
    //     {x: '2014-06-15', y: 15, group: 1},
    //     {x: '2014-06-16', y: getRandomInt(50), group: 1},
    //     {x: '2014-06-11', y: getRandomInt(50), group: 2},
    //     {x: '2014-06-12', y: getRandomInt(50), group: 2},
    //     {x: '2014-06-13', y: getRandomInt(50), group: 2},
    //     {x: '2014-06-14', y: getRandomInt(50), group: 2},
    //     {x: '2014-06-15', y: getRandomInt(50), group: 2},
    //     {x: '2014-06-16', y: getRandomInt(50), group: 2}
    // ];

    // var dataset = new vis.DataSet(items);
    // var options = {
    //     start: '2014-06-10',
    //     end: '2014-06-18'
    // };

    // lineChart.setItems(dataset);
  });

  // // ========== Step 2: the line chart ==========
  // // placeholder: visualize a line chart for any output
  // var container = document.getElementById('div_line_content');

  // var items = [
  //     {x: '2014-06-11', y: 10, group: 1},
  //     {x: '2014-06-12', y: 25, group: 1},
  //     {x: '2014-06-13', y: 30, group: 1},
  //     {x: '2014-06-14', y: 10, group: 1},
  //     {x: '2014-06-15', y: 15, group: 1},
  //     {x: '2014-06-16', y: 30, group: 1},
  //     {x: '2014-06-11', y: 12, group: 2},
  //     {x: '2014-06-12', y: 20, group: 2},
  //     {x: '2014-06-13', y: 14, group: 2},
  //     {x: '2014-06-14', y: 12, group: 2},
  //     {x: '2014-06-15', y: 10, group: 2},
  //     {x: '2014-06-16', y: 15, group: 2}
  // ];

  // var dataset = new vis.DataSet(items);
  // var options = {
  //     start: '2014-06-10',
  //     end: '2014-06-18'
  // };

  // lineChart = new vis.Graph2d(container, dataset, options);
}

function evaluate_graph() {
  network.storePositions()
  nodes = data.nodes.map(({ id, label}) => ({ id, label}))
  links = data.edges.map(({from, to}) => ({from, to}))

  $.ajax({
    url: '/evaluateGraph',
    data: { 
            "data": JSON.stringify({
              'nodes': nodes,
              'links': links
            }),
          }, 
    type: 'POST',
    success: function(data) {
      console.log("successfully getting data from server!!!")
      var data = JSON.parse(data);
      console.log(data)

      document.getElementById('div_line_content').innerHTML = ''

      for(var i=0; i<data.length; i++) {
        document.getElementById('div_line_content').innerHTML += data[i]['metric'] + ": <br/>" + data[i]['value']; 
        document.getElementById('div_line_content').innerHTML +=  "<br/><br/>"
      }
    },
    error: function(error) {
      console.log("error in getting data from server!!!")
      console.log(error);
    }
  }); 
}

function import_graph() {

}

function export_graph() {
  network.storePositions()
  nodePositions = data.nodes.map(({ id, x, y }) => ({ id, x, y }))
  edgeConnections = data.edges.map(({from, to, label}) => ({from, to, label}))

  // save to what ever json format you want
  console.log(nodePositions)
  console.log(edgeConnections)
}

