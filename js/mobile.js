/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:true */
/*global  Backbone, _, jQuery, Rollcall */

(function() {
  "use strict";
  var HG = this.HG || {};
  this.HG.Mobile = this.HG.Mobile || {};
  var Model = this.HG.Model;
  var app = this.HG.Mobile;

  app.config = null;
  app.requiredConfig = {
    drowsy: {
      url: 'string',
      db: 'string'
    },
    wakeful: {
      url: 'string'
    },
    curnit:'string'
  };

  app.rollcall = null;
  app.run = null;
  app.user = 'TODO';
  app.username = null;
  app.runState = null;
  app.userState = null;

  var DATABASE = null;
  app.configuationData = null;
  app.recentBoutData = null;
  // app.recentBoutData = {
  //   something: something,
  //   somehtingelse: somethingelse
  // }

  // app.indexModel = null;
  app.indexView = null;     // TODO - think about how necessary making these global is going to be
  app.inputView = null;
  app.listView = null;

  // for use with the RecentBoutData
  app.userLocations = [];
  app.userMove = 0;
  app.patchPopulations = {};

  app.keyCount = 0;
  app.autoSaveTimer = window.setTimeout(function() { console.log("timer activated"); } ,10);

  app.init = function() {
    /* CONFIG */
    // HG.loadConfig();
    // HG.verifyConfig(app.config, this.requiredConfig);

    app.config = {
      drowsy: {url: "http://drowsy.badger.encorelab.org"},
      wakeful: {url: "http://wakeful.badger.encorelab.org:7777/faye"}
    };

    app.UICdrowsy = "http://ltg.evl.uic.edu:9292";

    // TODO: should ask at startup
    DATABASE = "hunger-games-fall-13";

    // TODO: where are these coming from?
    app.run = "period-1";

    // grab the configuration data
    tryPullAll();


    // // TODO: should ask at startup
    // var DATABASE = app.config.drowsy.db;

    // hide all rows initially
    app.hideAllRows();

    if (app.rollcall === null) {
      app.rollcall = new Rollcall('http://drowsy.badger.encorelab.org', 'rollcall');
    }

    /* initialize the model and wake it up */
    HG.Model.init(app.config.drowsy.url, DATABASE)
    .then(function () {
      console.log('model initialized - now waking up');
      return HG.Model.wake(app.config.wakeful.url);
    }).done(function () {
      console.log('model awake - now calling setup');
      app.setup();
    });
  };

  app.setup = function() {
    // retrieve user name from cookie if possible otherwise ask user to choose name
    app.username = jQuery.cookie('hunger-games_mobile_username');

    if (app.username) {
      // We have a user in cookies so we show stuff
      console.log('We found user: '+app.username);
      jQuery('.username-display a').text(app.username);

      // show index-screen aka home
      jQuery('#index-screen').removeClass('hidden');

      hideLogin();
      showUsername();

      app.ready();
    } else {
      console.log('No user found so prompt for username');
      hideUsername();
    }

    // click listener that sets username
    jQuery('#login-button').click(function() {
      app.loginUser(jQuery('#username').val());
      // prevent bubbling events that lead to reload
      return false;
    });

    // click listener that log user out
    jQuery('.logout-user').click(function() {
      logoutUser();
    });

    // Show home / input screen
    jQuery('.home').click(function() {
      if (app.username) {
        app.hideAllRows();
        jQuery('#index-screen').removeClass('hidden');
      }
    });

    // Refresh and repull data - this may go eventually
    jQuery('.refresh-button').click(function() {
      jQuery().toastmessage('showNoticeToast', "Refreshing...");
      tryPullAll();
    });

    // Show harvest planning tool
    jQuery('.equalization-button').click(function() {
      if (app.username) {
        app.hideAllRows();
        jQuery('#equalization-screen').removeClass('hidden');
        populateStaticEqualization();
      }
    });

    // Show move tracker screen
    jQuery('.move-tracker-button').click(function() {
      if (app.username) {
        app.hideAllRows();
        jQuery('#move-tracker-screen').removeClass('hidden');
        populateMoveTracker("1623257");
      }
    });

    // Show 
    jQuery('.graphs-button').click(function() {
      if (app.username) {
        app.hideAllRows();
        jQuery('#graphs-screen').removeClass('hidden');
        // populateStaticHarvestEqualization();
      } else {
        alert ("Show a nicer popup and hide everything until logged in");
        console.log('User not logged in so show nothing and prompt for user');
        app.hideAllRows();
      }
    });

    // Click listener for graph refresh button
    jQuery('#refresh-graph').click(function () {
      console.log('Refresh the harvest planning graph on user request');
      HG.Patchgraph.refresh();
    });

    jQuery('#basic-evl-pull').click(function() {
      console.log('Hey, I dont do shit right now');
    });


    // INNER CLICK LISTENERS - DUMP THOSE THAT ARE GOING TO USE BACKBONE VIEWS //

    jQuery('.equalization-squirrels-field').change(function(ev) {
      updateEqualization(ev);
    });

    jQuery('#move-forward').click(function() {
      updateMoveTracker("next");
    });
    jQuery('#move-backward').click(function() {
      updateMoveTracker("previous");
    });


    // TEMP LISTENERS (FOR TESTING) //
    jQuery('.select-tag-1623972').click(function() {
      populateMoveTracker("1623972");
    });
    jQuery('.select-tag-1623257').click(function() {
      populateMoveTracker("1623257");
    });


    /* MISC */
    jQuery().toastmessage({
      position : 'middle-center'
    });

  };

  app.ready = function() {
    /* VIEW/MODEL SETUP */
    // run
    // user
    // mobile
    
    if (app.indexView === null) {
      app.indexView = new app.View.IndexView({
        el: jQuery('#index-screen')
      });
    }

    if (app.inputView === null) {
      app.inputView = new app.View.InputView({
        el: '#input-screen'
      });
    }

    if (app.listView === null) {
      app.listView = new app.View.ListView({
        el: '#list-screen'
      });
    }

  };





  //*************** MAIN FUNCTIONS (RENAME ME) ***************//

  app.createNewNote = function (noteData) {
    noteData.created_at = new Date();
    var noteModel = new Model.Note(noteData);
    
    noteModel.wake(app.config.wakeful.url);
    noteModel.save();

    return Model.awake.notes.add(noteModel);
  };

  var populateStaticEqualization = function() {
    // ok, are we using Backbone Views?
    jQuery('#equalization-minutes-field').text(app.configurationData.harvest_calculator_bout_length_in_minutes);

    _.each(app.configurationData.patches, function(p) {
      jQuery('#equalization-screen .'+p.patch_id+' .equalization-quality-field').text(p.richness_per_minute);
    });
  };

  var updateEqualization = function(ev) {
    // (ev.target.parentElement.parentElement).attr('class') gives the patch number of the modified patch
    var selectedPatch = jQuery(ev.target.parentElement.parentElement).attr('class');
    // cast it to a base-10 int, cause we love Crockford
    var numSq = parseInt(jQuery(ev.target).val(), 10);
    // have we pulled data?
    if (app.configurationData) {
      // Harvest per squirrel field
      _.each(app.configurationData.patches, function(p) {
        if (p.patch_id === jQuery(ev.target.parentElement.parentElement).attr('class')) {
          // make sure we don't try to divide by zero (tho JS/Chrome seems to actually handle the gracefully!)
          if (numSq === 0) {
            jQuery('.'+selectedPatch+' .equalization-harvest-field').text('0');
          } else {
            var y = p.richness_per_minute / numSq;
            jQuery('.'+selectedPatch+' .equalization-harvest-field').text(y);            
          }
        }
      });
      // Patch time all squirrels field
      var t = app.configurationData.harvest_calculator_bout_length_in_minutes * numSq;
      jQuery('.'+selectedPatch+' .equalization-patch-time-field').text(t);

      // Squirrels assigned field
      var totalSq = 0;
      jQuery('.equalization-squirrels-field').each(function(f) {
        var sCount = parseInt(jQuery(this).val(), 10);
        if (sCount) {
          totalSq += parseInt(jQuery(this).val(), 10);
        }
      });
      jQuery('#squirrels-assigned').text(totalSq);
      
    } else {
      console.error("Missing configuration data...");
    }
  };

  var populateMoveTracker = function(rfidTag) {
    _.each(app.configurationData.patches, function(p) {
      jQuery('#move-tracker-screen .'+p.patch_id+' .move-tracker-quality-field').text(p.richness_per_minute);
    });

    // go over the array and pull out all 'rfid_update' events that are related to user with tag rfidTag
    _.each(app.recentBoutData, function(e) {
      // this only checks the first arrival (so far it seems like there's never more than 1, but could be an issue)
      if (e.event === "rfid_update" && e.payload.arrivals[0] === rfidTag) {
        console.log(rfidTag + " has arrived " + e.destination + " at " + idToTimestamp(e._id.$oid));
        app.userLocations.push({"timestamp":idToTimestamp(e._id.$oid), "location":e.destination});
      }
    });

    updateMoveTracker("first");
  };

  var updateMoveTracker = function(move) {
    if (move === "first") {
      app.userMove = 1;
    } else if (move === "next") {
      if (app.userMove < app.userLocations.length) {
        app.userMove++;  
      } else {
        console.log("Last move reached - should this be a toast?");
      }
    } else if (move === "previous") {
      if (app.userMove > 1) {
        app.userMove--;
      } else {
        console.log("First move reached - should this be a toast?");
      }
    } else {
      console.error("Unknown move type");
    }

    // the timestamp for Current location (post update)
    var ts = app.userLocations[app.userMove-1].timestamp;

    // update UI: move number
    jQuery("#move-number").text(app.userMove);

    // update UI: squirrel counts, yield and new yield
    if (app.patchPopulations[ts]) {
      for (var i = 1; i < 7; i++) {
        var p = "patch-"+i;
        var qual = jQuery('#move-tracker-screen .'+p+' .move-tracker-quality-field').text();
        jQuery('#move-tracker-screen .'+p+' .move-tracker-squirrels-field').text(app.patchPopulations[ts][p]);
        if (app.patchPopulations[ts][p] > 0) {
          jQuery('#move-tracker-screen .'+p+' .move-tracker-yield-field').text(qual / app.patchPopulations[ts][p]);
        } else {
          jQuery('#move-tracker-screen .'+p+' .move-tracker-yield-field').text("0");
        }
        
        jQuery('#move-tracker-screen .'+p+' .move-tracker-new-yield-field').text(qual / (app.patchPopulations[ts][p] + 1));
      }
    } else {
      console.error("No timestamp for this move in the patchPopulations");
    }

    // update UI: location fields 
    if (app.userLocations[app.userMove]) {
      // clear all locations
      jQuery('#move-tracker-screen .move-tracker-location-field').text('');
      if (app.userMove > 1) {
        // app.userLocations[x].location = ie "fg-patch-1"
        jQuery('#move-tracker-screen .'+app.userLocations[app.userMove-2].location.substring(3)+' .move-tracker-location-field').text("Previous");
      }
      jQuery('#move-tracker-screen .'+app.userLocations[app.userMove-1].location.substring(3)+' .move-tracker-location-field').text("Current");
      jQuery('#move-tracker-screen .'+app.userLocations[app.userMove-1].location.substring(3)+' .move-tracker-new-yield-field').text("N/A");
      jQuery('#move-tracker-screen .'+app.userLocations[app.userMove].location.substring(3)+' .move-tracker-location-field').text("Next");
    }

  };

  var sortRecentBoutData = function() {
    // this function manipulates the recentBoutData so that it is actually useful to us
    //
    // 7.x array (how many users on any patch) - better as an object!:
    // time_stamp | patch-1 | patch-2 | patch-3 | patch-4 | patch-5 | patch-6
    // 5262672    |    3    |    1    |    2    |    1    |    6    |    3
    // 5263672    |    2    |    1    |    3    |    1    |    6    |    3
    //
    // 2.x array (where for user_1):
    // time_stamp | location
    // 5262672    |  1
    // 5264672    |  3

    // this object contains the running counts of the populations
    var populations = {"patch-1":0,"patch-2":0,"patch-3":0,"patch-4":0,"patch-5":0,"patch-6":0};

    _.each(app.recentBoutData, function(e) {
      // this only checks the first arrival (so far it seems like there's never more than 1, but could be an issue)
      if (e.event === "rfid_update" && e.destination !== "fg-den") {
        // if this event's timestamp does not already exist in the patchPopulations object, create it
        var ts = idToTimestamp(e._id.$oid);
        var loc = e.destination.substring(3);

        if (!app.patchPopulations[ts]) {
          app.patchPopulations[ts] = {"patch-1":0,"patch-2":0,"patch-3":0,"patch-4":0,"patch-5":0,"patch-6":0};
        }
        
        // update the patches for this timestamp with the arrivals and departures
        if (e.payload.arrivals[0]) {
          populations[loc]++;
          app.patchPopulations[ts][loc] = populations[loc];
        }
        if (e.payload.departures[0]) {
          populations[loc]--;
          app.patchPopulations[ts][loc] = populations[loc];
        }
      }
    });

    // TESTING ONLY
    // var postData = {};
    // postData.boutData = app.patchPopulations;

    // jQuery.ajax({
    //   type: "POST",
    //   url: "https://drowsy.badger.encorelab.org/hg-test/recent_bout/",
    //   data: postData
    // });

    // app.patchPopulations = {
    //     "5262672": {
    //         "patch-1": 3,
    //         "patch-2": 1,
    //         "patch-3": 5,
    //         "patch-4": 0,
    //         "patch-5": 1,
    //         "patch-6": 2
    //     },
    //     "5263673": {
    //         "patch-1": 4,
    //         "patch-2": 1,
    //         "patch-3": 4,
    //         "patch-4": 0,
    //         "patch-5": 1,
    //         "patch-6": 2
    //     }
    // };
  };

  //*************** HELPER FUNCTIONS ***************//

  var tryPullAll = function() {
    // CAREFUL: this may need promises once state is introduced!
    //tryPullStateData();
    tryPullConfigurationData();
    tryPullStatisticsData();
    tryPullRecentBoutData();
  };

  var tryPullStateData = function() {
    if (app.run) {
      jQuery.get(app.UICdrowsy+'/'+DATABASE+'/state?selector=%7B%22run_id%22%3A%22'+app.run+'%22%7D', function(data) {
        app.stateData = data;
      })
      .done(function() { console.log("State data pulled!"); })
      .fail(function() { console.error("Error pulling configuration data..."); });
    }
  };

  var tryPullConfigurationData = function() {
    if (app.run) {
      jQuery.get(app.UICdrowsy+'/'+DATABASE+'/configuration?selector=%7B%22run_id%22%3A%22'+app.run+'%22%7D', function(data) {
        app.configurationData = data[0];
      })
      .done(function() { console.log("Configuration data pulled!"); })
      .fail(function() { console.error("Error pulling configuration data..."); });
    }
  };

  var tryPullStatisticsData = function() {
    // needed: run_id, habitat_configuration, bout_id
    // if (app.run) {
    //   jQuery.get(app.UICdrowsy+'/'+DATABASE+'/statistics', function(data) {
    //     app.configurationData = data;
    //   })
    //   .done(function() { console.log("Statistics data pulled!"); })
    //   .fail(function() { error.log("Error pulling configuration data..."); });
    // }
  };

  var tryPullRecentBoutData = function() {
    // to determine the selector, we need the run_id, habitat_configuration, the bout_id
    // in the log collection (chose which based on run) get all events between the bouts' 'game_start' and 'game_stop' timestamps
    if (app.run) {
      jQuery.get(app.UICdrowsy+'/'+DATABASE+'/log-test', function(data) {
        app.recentBoutData = data;
        sortRecentBoutData();
      })
      .done(function() { console.log("Recent bout data pulled!"); })
      .fail(function() { console.error("Error pulling configuration data..."); });
    }
  };




  var idToTimestamp = function(id) {
    var timestamp = id.substring(0,8);
    var seconds = parseInt(timestamp, 16);
    return seconds;
    // date = new Date( parseInt(timestamp, 16) * 1000 );
    // return date;
  };


  //*************** LOGIN FUNCTIONS ***************//

  app.loginUser = function (username) {
    // retriev user with given username
    app.rollcall.user(username)
    .done(function (user) {
      if (user) {
        console.log(user.toJSON());

        app.username = user.get('username');

        jQuery.cookie('hunger-games_mobile_username', app.username, { expires: 1, path: '/' });
        jQuery('.username-display a').text(app.username);

        // show index-screen aka home
        jQuery('#index-screen').removeClass('hidden');

        hideLogin();
        showUsername();

        app.ready();
      } else {
        console.log('User '+username+' not found!');
        if (confirm('User '+username+' not found! Do you want to create the user to continue?')) {
            // Create user and continue!
            console.log('Create user and continue!');
        } else {
            // Do nothing!
            console.log('No user logged in!');
        }
      }
    });

    // if (username && username !== '') {
    //   jQuery.cookie('hunger-games_mobile_username', username, { expires: 1, path: '/' });
    //   jQuery('.username-display a').text(username);

    //   // show index-screen aka home
    //   jQuery('#index-screen').removeClass('hidden');

    //   hideLogin();
    //   showUsername();

    //   app.ready();
    // } else {
    //   console.error('Username invalid');
    // }
  };

  var logoutUser = function () {
    jQuery.removeCookie('hunger-games_mobile_username',  { path: '/' });
    window.location.reload();
  };

  var hideLogin = function () {
    jQuery('#login-button').attr('disabled','disabled');
    jQuery('#username').attr('disabled','disabled');
  };

  var showUsername = function () {
    jQuery('.username-display').removeClass('hide');
  };

  var hideUsername = function() {
    jQuery('.username-display').addClass('hide');
  };

  app.hideAllRows = function () {
    jQuery('.row-fluid').each(function (){
      jQuery(this).addClass('hidden');
    });
  };

  app.autoSave = function(model, inputKey, inputValue, instantSave) {
    app.keyCount++;
    //console.log("  saving stuff as we go at", app.keyCount);

    // if (model.kind === 'buildOn') {
    //   if (instantSave || app.keyCount > 9) {
    //     // save to buildOn model to stay current with view
    //     // app.buildOn = inputValue;
    //     // save to contribution model so that it actually saves
    //     // var buildOnArray = app.contribution.get('build_ons');
    //     // var buildOnToUpdate = _.find(buildOnArray, function(b) {
    //     //   return b.author === app.userData.account.login && b.published === false;
    //     // });
    //     // buildOnToUpdate.content = inputValue;
    //     // app.contribution.set('build_ons',buildOnArray);
    //     // app.contribution.save(null, {silent:true});
    //     // app.keyCount = 0;
    //   }
    // } else {
      if (instantSave || app.keyCount > 9) {
        console.log('Saved');
        //model.set(inputKey, inputValue);
        //model.save(null, {silent:true});
        app.keyCount = 0;
      }
    //}
  };

  /**
    Function that is called on each keypress on username input field (in a form).
    If the 'return' key is pressed we call loginUser with the value of the input field.
    To avoid further bubbling, form submission and reload of page we have to return false.
    See also: http://stackoverflow.com/questions/905222/enter-key-press-event-in-javascript
  **/
  app.interceptKeypress = function(e) {
    if (e.which === 13 || e.keyCode === 13) {
      app.loginUser(jQuery('#username').val());
      return false;
    }
  };


  this.HG = HG;

}).call(this);