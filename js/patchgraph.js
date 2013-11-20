
(function() {
  "use strict";
  var HG = this.HG || {};
  HG.Patchgraph = this.HG.Patchgraph || new HG.App();
  var app = HG.Patchgraph;

  // Information for REST calls to dataset
  var baseUrl = null;
  var DATABASE = null;
  var runId = null;
  var habitatConfiguration = null;
  var boutId = null;

  var PREDATION = 'predation';

  var w = 1000;
  var h = 600;
  var padding = 45;
  var maxW = w - (padding * 3); // leaving a padding left and right is the max width of the graph
  var d_starving = 1200;
  var d_surviving = 1350;
  var d_max = 2500;
  var xScale;
  var yScale;
  var svg;
  var statistics_data = [];
  var yAxisLabelNames;
  var yAxisRightLabelNames;
  var xAxisLabel;
  var xAxis;
  var yAxis;
  var yAxisRight;
  var yLabelTexts = {
                harvest:         ['More', 'Less'],
                avg_quality:     ['Richer', 'Poorer'],
                avg_competition: ['More','Less'],
                total_moves:     ['More','Fewer'],
                arbitrage:       ['Better','Worse'],
                avg_risk:        ['Riskier','Safer']
  };


  app.init = function (drowsyUrl, database, run_id) {
    baseUrl = drowsyUrl;
    DATABASE = database;
    runId = run_id;

    // hide predation button until data tells us otherwise
    showPredationButton(false);

    var promise = fetchDataSetAndRedraw();

    return promise;
  };

  app.refresh = function () {
    d3.select(".patchgraph").remove();

    // hide predation button until data tells us otherwise
    showPredationButton(false);

    var promise = fetchDataSetAndRedraw();

    return promise;
  };

  app.showGraphForBout = function(habitatConf, bout) {
    d3.select(".patchgraph").remove();

    habitatConfiguration = habitatConf;
    boutId = bout.toString();

    // retrieve data for selected bout
    var bout_data = _.find(statistics_data, function (d) {
      return (d.habitat_configuration == habitatConf && d.bout_id === boutId);
    });

    if (bout_data) {
      if (bout_data.habitat_configuration === PREDATION) {
        showPredationButton(true);
      } else {
        showPredationButton(false);
      }

      // sort user_stats alphabetically by name
      var sortedUserStats = _.sortBy(bout_data.user_stats, function(d) {
        return d.name;
      });

      draw(sortedUserStats);
    } else {
      console.warn('No bout data found for habitat_configuration '+habitatConf+' and bout: '+bout);
    }
  };

  /*
  * Replaced static data by loading this data via Ajax from local file system.
  * Once Chicago is ready we pull data from their URL, transform the data so it
  * looks like dataset and then call draw.
  */
  var fetchDataSetAndRedraw = function () { 
    var jqXHR = jQuery.ajax(baseUrl+'/'+DATABASE+'/statistics?selector=%7B%22run_id%22%3A%22'+runId+'%22%7D')
      .then (function (data) {
        if (data && data.length > 0) {
          console.log('successfully fetched patchgraph data');
          // store fetched data so we have later access to it when
          // user switches bout and we can avoid ajax call
          statistics_data = _.sortBy(data, function(d) {
            return d.bout_id;
          });
          updateBoutPicker(statistics_data); // populate the bout picker
          // retrieve the data of the bout we show by default (newest)
          var defaultBoutData = _.last(statistics_data);

          if (defaultBoutData.habitat_configuration === PREDATION) {
            showPredationButton(true);  
          }

          habitatConfiguration = defaultBoutData.habitat_configuration;
          boutId = defaultBoutData.bout_id;

          // sort user_stats alphabetically by name
          var sortedUserStats = _.sortBy(defaultBoutData.user_stats, function(d) {
            return d.name;
          });

          draw(sortedUserStats);
        } else {
          console.warn('No data found for run: '+runId);
        }
      })
      .fail(function(error) {
        console.error('Ajax request failed with status code: '+jqXHR.status);
      });

    return jqXHR;
  };

  var draw = function (dataset) {
    // xScale = d3.scale.linear()
    //             .domain([0, d3.max(dataset, function(d){
    //                     return d.harvest; })])
    //             .range([padding, w - (padding*2)]);

    xScale = d3.scale.linear()
      .domain([0,d_max])
      .range([padding, maxW]);

    yScale = d3.scale.ordinal()
                .domain(d3.range(dataset.length))
                .rangeRoundBands([padding, h- padding], 0.1);

    svg = d3.select("#graphs-screen div")
                .append("svg")
                .attr("class", "patchgraph")
                .attr("width", w)
                .attr("height", h);

    // var xAxisLabel = d3.scale.ordinal()
    //                 .domain(["Low", "Middle", "High"])
    //                 .rangeRoundBands([padding, h - padding], 0.05);

    yAxisLabelNames = d3.scale.ordinal()
                    .domain(dataset.map(function(d){
                        return d.name.toUpperCase();}))
                    .rangeRoundBands([padding, h - padding], 0.05);

    yAxisRightLabelNames = d3.scale.ordinal()
                    .domain(dataset.map(function(d){
                      // return d.name.toUpperCase();
                      return '';
                    }))
                    .rangeRoundBands([padding, h - padding], 0.05);

    // xAxisLabel = d3.scale.linear()
    //                 .domain([0, d3.max(dataset, function(d){
    //                     return d.harvest; })])
    //                 .range([padding, w -padding]);

    xAxisLabel = d3.scale.linear()
                    .domain([0, d_max])
                    .range([padding, w -(padding*2)]);

    xAxis = d3.svg.axis()
                    .scale(xAxisLabel)
                    .orient("bottom")
                    ;

    yAxis = d3.svg.axis()
                      .scale(yAxisLabelNames)
                      .orient("left");
    
    yAxisRight = d3.svg.axis()
                  .scale(yAxisRightLabelNames)
                  .orient("right");

    /*
    * Starving range 
    */                      
    var starvingPercent = d_starving / d_max;      
    svg.append("rect")
      .attr("y", padding)
      .attr("x", padding)
      .attr("width", function(){
        return (maxW * starvingPercent);
      })
      .attr("height", h -padding*2)
      // .attr("fill", "rgba(255,0,0, 0.3")
      .attr("class", "legendBar legendBar1");

    svg.append("text")
      .text("Starving")
      .attr("text-anchor", "middle")
      .attr("y", padding -7)
      .attr("x", padding +100)
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    /*
    * Surviving range 
    */
    var survivingPercent = (d_surviving - d_starving) / d_max;
    svg.append("rect")
      .attr("y", padding)
      .attr("x", function() {
        return (maxW * starvingPercent) + padding;
      })
      .attr("width", function() {
        return (maxW * survivingPercent);
      })
      .attr("height", h -padding*2)
      // .attr("fill", "rgba(0,255,0, 0.3")
      .attr("class", "legendBar legendBar2");

    svg.append("text")
      .text("Surviving")
      .attr("text-anchor", "middle")
      .attr("y", padding -7)
      .attr("x", function () {
        return (maxW * starvingPercent) + 65;
      })
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    /*
    * Prospering range 
    */
    var prosperingPercent = (d_max - d_surviving) / d_max;
    svg.append("rect")
      .attr("y", padding)
      .attr("x", function () {
        return (maxW * (starvingPercent + survivingPercent)) + padding;
      })
      .attr("width", function () {
        return (maxW * prosperingPercent);
      })
      .attr("height", h -padding*2)
      // .attr("fill", "rgba(0,0,255, 0.3")
      .attr("class", "legendBar legendBar3");

    svg.append("text")
      .text("Prospering")
      .attr("text-anchor", "middle")
      .attr("y", padding -7)
      .attr("x", function () {
        return maxW - 100;
      })
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    svg.selectAll("rect.bars")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("class", "bars")
      .attr("x", 0 + padding)
      .attr("y", function(d, i){
          return yScale(i);
      })
      .attr("rx", "3")
      .attr("yx", "3")
      .attr("width", function(d) {
        // return xScale(d.harvest);
        if (d.harvest < d_max) {
          return xScale(d.harvest);
        } else {
          return xScale(d_max);
        }
      })
      .attr("height", yScale.rangeBand())
      .attr("fill", function(d) {
        if (d.name) {
          var userColor = HG.Mobile.users.findWhere({username:d.name}).get('color');

          // var color = "rgba(";
          // color += d.color.r +", ";
          // color += d.color.g +", ";
          // color += d.color.b +", ";
          // color += ".7)";

          return userColor;
        } else {
          return "rgba(75, 75, 75, 1)";
        }
      })
      // .attr("stroke-width", 1)
      // .attr("stroke", "rgb(0,0,0)")
      .on("click", function(){
        console.log('clicked on bar in graph');
        // this is the result of weird usernames. Embrace for impact! 
        // var username = this.__data__.name; //hack
        var username = _.first(d3.select(this).data()).name;
        // TODO call Colin's 
        HG.Mobile.populateMoveTracker(username, habitatConfiguration, boutId);
      });

    // svg.selectAll("text.name")
    //   .data(dataset)
    //   .enter()
    //   .append("text")
    //   .text(function(d) {
    //       return d.name.toUpperCase();
    //   })
    //   .attr("text-anchor", "middle")
    //   .attr("y", function(d, i) {
    //     return yScale(i) + yScale.rangeBand() /2 +4;
    //   })
    //   .attr("x", function(d) {
    //     return 80;
    //   })
    //   .attr("font-family", "sans-serif")
    //   .attr("font-size", "12px")
    //   .attr("fill", function(d) {
    //     var c = HG.Mobile.users.findWhere({username:d.name}).get('color_label');
    //     if (c === 'black' || c === 'purple' || c === 'brown' || c === 'blue') {
    //       return 'white';
    //     } else {
    //       return 'black';
    //     }
    //   })
    //   .attr("class", "name-labels");

   
    svg.selectAll("text.values")
      .data(dataset)
      .enter()
      .append("text")
      .text(function(d) {
          // return Math.round(d.harvest*10)/10; // round to one decimal after the point
          return Math.round(d.harvest); // round to full integer
      })
      .attr("text-anchor", "middle")
      .attr("y", function(d, i) {
        return yScale(i) + yScale.rangeBand() /2 +4;
      })
      .attr("x", function(d) {
        if (d.harvest < d_max) {
          return xScale(d.harvest) +65;
        } else {
          return xScale(d_max);
        }
      })
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", "black")
      .attr("class", "labels");

    /*
    * Click listeners for sort buttons
    */
    d3.selectAll(".graph-sort-btn").on("click", function(){
      var selector = jQuery(this).data('selector');

      // remove highlight from all graph sorting buttons
      jQuery('.graph-sort-btn').removeClass('btn-danger');
      jQuery('.graph-sort-btn').addClass('btn-success');
      // highlight clicked button
      jQuery(this).removeClass('btn-success');
      jQuery(this).addClass('btn-danger');

      sortGraphBars(selector);
      // sortLabelNames(selector);

      // svg.select(".y").call(yAxis);
      // resort the graph data
      var sortedData = dataset.sort(function(a, b){
        return d3.descending(a[selector], b[selector]);
      });

      changeYaxis(sortedData, selector);
      changeYAxixRight(sortedData, selector);
    });

  
    //Create X axis
    // svg.append("g")
    //   .attr("class", "x axis")
    //   .attr("transform", "translate(0," + (h - padding) + ")")
    //   .call(xAxis);

    //Create Y axis
    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + padding + ",0)")
      .call(yAxis);

    //Create Y axis right
    svg.append("g")
      .attr("class", "right-y axis")
      .attr("transform", "translate(" + (w-(padding*2)) + ",0)")
      .call(yAxisRight);

  };

  var sortGraphBars = function (selector) {
    svg.selectAll("rect.bars")
      .sort(function(a, b){
        return d3.descending(a[selector], b[selector]);
      })
      .transition()
      .delay(function(d, i){
        return i *50;
      })
      .duration(1000)
      .attr("y", function(d, i) {
        return yScale(i);
      });

      svg.selectAll(".labels")
        .sort(function(a, b){
            return d3.descending(a[selector], b[selector]);
        })
        .transition()
        .delay(function(d, i){
          return i * 50;
        })
        .duration(1000)
        .attr("text-anchor", "middle")
        .attr("y", function(d, i) {
          return yScale(i) +yScale.rangeBand() /2 +4;
        });
  };

  // var sortLabelNames = function (dataField) {
  //   svg.selectAll(".name-labels")
  //     .sort(function(a, b){
  //         return d3.descending(a[dataField], b[dataField]);
  //     })
  //     .transition()
  //     .delay(function(d, i){
  //       return i * 50;
  //     })
  //     .duration(1000)
  //     .attr("text-anchor", "middle")
  //     .attr("y", function(d, i) {
  //       return yScale(i) +yScale.rangeBand() /2 +4;
  //     });
  // };

  // var changeGraph = function (sortedData) {
  //   svg.selectAll("rect")
  //       .data(sortedData)
  //     .transition()
  //       .duration(1000)
  //       .attr("y", function(d, i) {
  //           return yScale(i)
  //       });

  //     svg.selectAll(".labels")
  //         .data(sortedData)
  //       .transition()
  //         .duration(1000)
  //         .attr("text-anchor", "middle")
  //         .attr("y", function(d, i) {
  //           return yScale(i) +yScale.rangeBand() /2 +4;
  //         });
  // };

  /* Tom
    d. i'd like to remove the numeric labels on the axes completely.
on the y-axis, though, we need text labels. Label 1 should be
centered about 1/4 of the way up the left axis (starting at the
bottom), and Label 2 about 1/3 of the way from the top of the
axis. (these are consistent with the "increasing" nature of moving
up along the y-axis.)


      Label 1     Label 2

Quality:    Poorer      Richer
Competition:  Less        More
Moves:    Fewer     More
Arbitrage:    Worse     Better
Predation:  Safer     Riskier

  */

  /* This function rearranges the y Axis. If you return d.name in the map function
     it will show the names of each student. However I am showing the data range we
     sorted with. This doesn't work quit yet and I might need some help to figure
     this out */
  var changeYaxis = function (sortedData, selector) {
    // var yAxisLabel;
    // if (selector === 'harvest') {
    //   yAxisLabel = d3.scale.ordinal()
    //                 .domain(sortedData.map(function(d){
    //                     return d.name.toUpperCase();}))
    //                 .rangeRoundBands([padding, h - padding], 0.05);
    // } else {
    //   yAxisLabel = d3.scale.ordinal()
    //     .domain(yLabelTexts[selector])
    //     .rangePoints([padding, h-padding], 1);

    //     // yAxisLabel = d3.scale.ordinal()
    //     //   .domain(sortedData.map(function(d){
    //     //       return Math.round(d[selector]);
    //     //   }))
    //     //   .rangeRoundBands([padding, h - padding], 0.05);
    // }

    var yAxisLabel = d3.scale.ordinal()
                    .domain(sortedData.map(function(d){
                        return d.name.toUpperCase();
                    }))
                    .rangeRoundBands([padding, h - padding], 0.05);

    var yAxisNew = d3.svg.axis()
      .scale(yAxisLabel)
      .orient("left");

    svg.select(".y.axis")
      .transition()
      .duration(1600)
      .call(yAxisNew);
  };

  var changeYAxixRight = function (sortedData, selector) {
    // TODO: here goes tom's labeling
    var yAxisLabel;
    // if (selector === 'harvest') {
    //   yAxisLabel = d3.scale.ordinal()
    //                 .domain(sortedData.map(function(d){
    //                     return d.name.toUpperCase();}))
    //                 .rangeRoundBands([padding, h - padding], 0.05);
    // } else {
    yAxisLabel = d3.scale.ordinal()
      .domain(yLabelTexts[selector])
      .rangePoints([padding, h-padding], 1);
    // }

    var yAxisNew = d3.svg.axis()
      .scale(yAxisLabel)
      .orient("right");

    svg.select(".right-y.axis")
      .transition()
      .duration(1600)
      .call(yAxisNew);
  };

  var updateBoutPicker = function(data) {
    jQuery('#bout-picker').html('');
    _.each(data, function (d, iterator) {
      //<li><a tabindex="-1" href="#" data-bout="3">Something else here</a></li>
      var listItem = jQuery('<li>');
      // listItem.append('<a tabindex="-1" href="#" data-habitat-configuration="'+d.habitat_configuration+'" data-bout="'+d.bout_id+'">'+d.bout_id+' - '+d.habitat_configuration.substring(0,1).toUpperCase()+' </a>');
      listItem.append('<a tabindex="-1" href="#" data-habitat-configuration="'+d.habitat_configuration+'" data-bout="'+d.bout_id+'">Bout '+d.bout_id+'</a>');
      jQuery('#bout-picker').append(listItem);
    });

    // show last bout element name in bout picker name
    jQuery('#bout-picker-label').html('');
    var d = _.last(data);
    // jQuery('#bout-picker-label').append(d.bout_id+' - '+d.habitat_configuration.substring(0,1).toUpperCase()+' ');
    jQuery('#bout-picker-label').append('Bout '+d.bout_id);
    jQuery('#bout-picker-label').append(jQuery('<span class="caret"></span>'));
  };

  var showPredationButton = function(visible) {
    if (visible) {
      if (jQuery('#predation').exists()) {
        console.log('predation button already there, nothing to add...');
      } else {
        var predationButton = jQuery('<button type="button" class="btn btn-large btn-success graph-sort-btn" id="predation" data-selector="avg_risk">Predation</button>');
        // jQuery('#predation').removeClass('hidden');
        jQuery('.sort-buttons').append(predationButton);
      }
    } else {
      jQuery('#predation').remove();
    }
  };

  app.svg = svg;

  //HG.Patchgraph = Patchgraph;
  this.HG = HG;

}).call(this);