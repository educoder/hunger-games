/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:true */
/*global  Backbone, _, jQuery, Rollcall */

(function() {
  "use strict";
  var HG = this.HG || {};
  this.HG.Mobile = this.HG.Mobile || new HG.App();
  var Model = this.HG.Model;
  var app = this.HG.Mobile;

  app.config = null;
  app.requiredConfig = {
    drowsy: {
      url: 'string',
      db: 'string',
      uic_url: 'string'
    },
    wakeful: {
      url: 'string'
    },
    rollcall: {db: 'string'},
    login_picker:'boolean',
    runs:'object'
  };

  app.rollcall = null;
  app.runId= null;
  app.users = null; // users collection
  app.username = null;
  app.runState = null;
  app.userState = null;

  var DATABASE = null;
  app.stateData = null;
  app.configuationData = null;
  app.recentBoutData = null;
  app.notesData = null;

  app.currentNote = null;
  app.currentReply = {};
  app.currentWorthRemembering = null;

  // for use with the RecentBoutData
  app.userLocations = [];
  app.userMove = 0;
  app.patchPopulations = {};

  app.indexView = null;
  app.inputView = null;
  app.listView = null;
  app.worthRememberingInputView = null;
  app.worthRememberingListView = null;  
  app.loginButtonsView = null;

  app.keyCount = 0;
  app.autoSaveTimer = window.setTimeout(function() { console.log("timer activated"); } ,10);

  app.init = function() {
    /* CONFIG */
    app.loadConfig();
    app.verifyConfig(app.config, app.requiredConfig);

    // app.config = {
    //   drowsy: {url: "http://drowsy.badger.encorelab.org"},
    //   wakeful: {url: "http://wakeful.badger.encorelab.org:7777/faye"},
    //   login_picker: true
    // };

    // app.config.drowsy.uic_url = "http://ltg.evl.uic.edu:9292";

    // TODO: should ask at startup
    DATABASE = app.config.drowsy.db;

    // hide all rows initially
    app.hideAllRows();

    if (app.rollcall === null) {
      app.rollcall = new Rollcall(app.config.drowsy.url, app.config.rollcall.db);
    }

    app.handleLogin();

  };

  app.handleLogin = function () {
    // retrieve user name from cookie if possible otherwise ask user to choose name
    app.runId = jQuery.cookie('hunger-games_mobile_runId');
    app.username = jQuery.cookie('hunger-games_mobile_username');

    if (app.username && app.runId) {
      // We have a user in cookies so we show stuff
      console.log('We found user: '+app.username);
      jQuery('.username-display a').text(app.runId+'#'+app.username.toUpperCase());
      //jQuery('.username-display a').text(app.runId+'#'+app.username);

      hideLogin();
      showUsername();

      // make sure the app.users collection is always filled
      app.rollcall.usersWithTags([app.runId])
      .done(function (usersInRun) {
        console.log(usersInRun);
        app.users = usersInRun;

        // sort the collection by username
        app.users.comparator = function(model) {
          return model.get('username');
        };
        app.users.sort();

        app.setup();
      });
    } else {
      console.log('No user and run found so prompt for username and runId');
      hideUsername();
      // fill modal dialog with user login buttons
      if (app.config.login_picker) {
        hideLogin();
        showRunPicker();
        // showUserLoginPicker(app.runId);
      } else {
        showLogin();
        hideUserLoginPicker();
      }
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
  };

  app.setup = function() {
    /* pull users, then initialize the model and wake it up, then pull everything else */
    HG.Model.init(app.config.drowsy.url, DATABASE+'-'+app.runId)
    .then(function () {
      console.log('model initialized - now waking up');
      return HG.Model.wake(app.config.wakeful.url);
    })
    .done(function () {
      console.log('model awake - now calling ready');
      app.ready();
    });

    /* MISC */
    jQuery().toastmessage({
      position : 'middle-center'
    });

  };

  app.ready = function() {
    /* VIEW/MODEL SETUP */
    // if (app.indexView === null) {
    //   app.indexView = new app.View.IndexView({
    //     el: '#notes-screen'
    //   });
    // }

    jQuery.when(tryPullAll()).done(function(stateData, configurationData, recentBoutData) {
      console.log('tryPullAll and Patchgraph.init() finished so we do the rest of ready()');

      if (app.inputView === null) {
        app.inputView = new app.View.InputView({
          el: '#notes-screen'
          // model: app.currentNote
        });
      }

      if (app.listView === null) {
        app.listView = new app.View.ListView({
          el: '#list-screen'
        });
      }

      if (app.worthRememberingInputView === null) {
        app.worthRememberingInputView = new app.View.WorthRememberingInputView({
          el: '#worth-remembering-screen'
        });
      }

      if (app.worthRememberingListView === null) {
        app.worthRememberingListView = new app.View.WorthRememberingListView({
          el: '#worth-remembering-list-screen'
        });
      }

      // Init the Patchgraph
      HG.Patchgraph.init(app.config.drowsy.uic_url, DATABASE, app.runId);

      setUpClickListeners();

      // show notes-screen - is this the default? TODO: check with design team where the first pedagogical step should be
      jQuery('#notes-screen').removeClass('hidden');
    });
  };


  //*************** MAIN FUNCTIONS (RENAME ME) ***************//

  app.addNote = function(noteData) {
    app.currentNote = new Model.Note(noteData);
    app.currentNote.wake(app.config.wakeful.url);
    app.currentNote.save();
    Model.awake.notes.add(app.currentNote);
  };

  app.saveCurrentNote = function() {
    // app.currentNote.published = true;
    app.currentNote.save();
    app.currentNote = null;
  };

  app.createReply = function(noteId) {
    app.currentReply.content = '';
    app.currentReply.author = app.username;
    app.currentReply.related_note_id = noteId;
  };

  app.saveCurrentReply = function(replyText) {
    var note = HG.Model.awake.notes.get(app.currentReply.related_note_id);
    note.addBuildOn(app.username, replyText);
    note.wake(app.config.wakeful.url);
    note.save();
    app.currentReply = {};
  };

  app.createWorthRemembering = function(wrData) {
    app.currentWorthRemembering = new Model.Note(wrData);
    app.currentWorthRemembering.wake(app.config.wakeful.url);
    app.currentWorthRemembering.save();
    Model.awake.notes.add(app.currentWorthRemembering);
  };

  app.saveCurrentWorthRemembering = function() {
    // app.currentNote.published = true;
    app.currentWorthRemembering.save();
    app.currentWorthRemembering = null;
  };

  var populateStaticEqualization = function() {
    // ok, are we using Backbone Views?
    jQuery('#equalization-minutes-field').text(app.configurationData.harvest_calculator_bout_length_in_minutes);

    _.each(app.configurationData.patches, function(p) {
      jQuery('#equalization-screen .'+p.patch_id+' .equalization-quality-field').text(p.quality_per_minute);
    });
  };

  var updateEqualization = function(ev) {
    // (ev.target.parentElement.parentElement).attr('class') gives the patch number of the modified patch
    var selectedPatch;
    // cast it to a base-10 int, cause we love Crockford
    var numSq = parseInt(jQuery(ev.target).val(), 10);
    // have we pulled data?
    if (app.configurationData) {
      // Harvest per squirrel field
      _.each(app.configurationData.patches, function(p) {
        if (jQuery(ev.target.parentElement.parentElement).hasClass(p.patch_id)) {
          selectedPatch = p.patch_id;
          // make sure we don't try to divide by zero (tho JS/Chrome seems to actually handle this gracefully!)
          if (numSq === 0) {
            jQuery('.'+selectedPatch+' .equalization-harvest-field').text('0');
          } else {
            var y = p.quality_per_minute / numSq;
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

  app.populateMoveTracker = function(username, configuration, boutId) {
    var configLabel = null;
    if (configuration === "gameon") {
      configLabel = "G";
    } else if (configuration === "predation") {
      configLabel = "P";
    } else {
      console.error("Invalid configuration type!");
    }
    jQuery('.bout-number').text(configLabel+boutId);
    
    jQuery('.username').text(username.toUpperCase());    

    var startFlag = false;
    var stopFlag = false;

    // go over the array, find where to start and stop (beginning and end of the passed boutId and config params) and pull out all 'rfid_update' events that are related to username
    // note that this works on the assumption that recentBoutData is ordered by timestamp (which is currently is)
    _.each(app.recentBoutData, function(e) {
      if (e.event === "start_bout" && e.payload && e.payload.bout_id && e.payload.bout_id === boutId && e.payload.habitat_configuration_id === configuration) {
        startFlag = true;
      }
      if (e.event === "stop_bout" && e.payload && e.payload.bout_id && e.payload.bout_id === boutId && e.payload.habitat_configuration_id === configuration) {
        stopFlag = true;
      }

      // push all timestamp/location pairs into the array, as long as they are chronologically between the start and end flag times
      if (e.event === "rfid_update" && e.payload.id === username && startFlag === true && stopFlag === false) {
        console.log(username + " has arrived to " + e.payload.arrival + " at " + idToTimestamp(e._id.$oid));
        app.userLocations.push({"timestamp":idToTimestamp(e._id.$oid), "location":e.payload.arrival});
      }
    });

    // set up the move tracker for the first move for this user in this bout
    updateMoveTracker("first", username, configuration);
  };

  var updateMoveTracker = function(move, username, configuration) {
    if (move === "first") {
      app.userMove = 1;
      app.hideAllRows();
      jQuery('#move-tracker-screen').removeClass('hidden');

      if (configuration === "predation") {
        _.each(app.configurationData.patches, function(p) {
          jQuery('#move-tracker-screen .' + p.patch_id + ' .move-tracker-risk-field').text(p.risk_label);
        });
        jQuery('#move-tracker-screen .hidden').removeClass('hidden');
      }

    } else if (move === "next") {
      if (app.userMove < app.userLocations.length) {
        app.userMove++;  
      } else {
        jQuery().toastmessage('showWarningToast', "Last move reached");
      }
    } else if (move === "previous") {
      if (app.userMove > 1) {
        app.userMove--;
      } else {
        jQuery().toastmessage('showWarningToast', "First move reached");
      }
    } else {
      console.error("Unknown move type");
    }

    // the timestamp for Current location (post update)
    var ts = app.userLocations[app.userMove-1].timestamp;

    // update UI: move number
    jQuery("#move-number").text(app.userMove);

    // set up an object with patch_id:quality... likely cleaner with _.map
    var qualObj = {};
    _.each(app.configurationData.patches, function(p) {
      qualObj[p.patch_id] = p.quality_per_minute;
    });

    // update UI: squirrel counts, yield and new yield
    if (app.patchPopulations[ts]) {
      _.each(app.patchPopulations[ts], function(numSq, p) {
        jQuery('#move-tracker-screen .'+p+' .move-tracker-squirrels-field').text(numSq);
        if (numSq > 0) {
          jQuery('#move-tracker-screen .'+p+' .move-tracker-yield-field').text(Math.round(qualObj[p] / numSq));
        } else {
          jQuery('#move-tracker-screen .'+p+' .move-tracker-yield-field').text("0");
        }
        
        jQuery('#move-tracker-screen .'+p+' .move-tracker-new-yield-field').text(Math.round(qualObj[p] / (numSq + 1)));
      });
    } else {
      console.error("No timestamp for this move in the patchPopulations");
    }

    // update UI: location fields 
    if (app.userLocations[app.userMove]) {
      // clear all locations
      jQuery('#move-tracker-screen .patch').removeClass('current-position');
      jQuery('#move-tracker-screen .patch').removeClass('next-position');
      // add the new locations
      jQuery('#move-tracker-screen .'+app.userLocations[app.userMove-1].location).addClass('current-position');
      jQuery('#move-tracker-screen .'+app.userLocations[app.userMove].location).addClass('next-position');
    }

  };

  var sortRecentBoutData = function() {
    // this object contains the running counts of the populations
    var populations = {"patch-a":0,"patch-b":0,"patch-c":0,"patch-d":0,"patch-e":0,"patch-f":0};

    _.each(app.recentBoutData, function(e) {
      if (e.event === "rfid_update" && e.payload.arrival !== "fg-den") {
        // if this event's timestamp does not already exist in the patchPopulations object, create it
        var ts = idToTimestamp(e._id.$oid);
        var arr = e.payload.arrival;
        var dep = e.payload.departure;

        // update the patches for this timestamp with the arrivals and departures
        if (arr) {
          populations[arr]++;
        }
        if (dep) {
          populations[dep]--;
        }
        var clonedPopulationsObj = _.clone(populations);
        app.patchPopulations[ts] = clonedPopulationsObj;
      }
    });
  };

  //*************** HELPER FUNCTIONS ***************//

  var tryPullAll = function() {
    return jQuery.when(tryPullStateData(), tryPullConfigurationData(), tryPullRecentBoutData());
  };

  var tryPullStateData = function() {
    // if (app.runId) {
      var promise = jQuery.get(app.config.drowsy.uic_url+'/'+DATABASE+'/state?selector=%7B%22run_id%22%3A%22'+app.runId+'%22%7D')
      // jQuery.get(app.config.drowsy.uic_url+'/'+DATABASE+'/state?selector=%7B%22run_id%22%3A%22'+app.runId+'%22%7D', function(data) {
      //   app.stateData = data[0];
      // })
      .then(function(data) {
        console.log("State data pulled!");
        app.stateData = data[0];
        // tryPullConfigurationData();
        // tryPullStatisticsData();
        // tryPullRecentBoutData();
        return data;
      })
      .fail(function() { console.error("Error pulling state data..."); });

      return promise;
    // }
  };

  var tryPullConfigurationData = function() {
    // if (app.runId) {
      var promise = jQuery.get(app.config.drowsy.uic_url+'/'+DATABASE+'/configuration?selector=%7B%22run_id%22%3A%22'+app.runId+'%22%7D')
      .then( function(data) {
        app.configurationData = data[0];
        console.log("Configuration data pulled!");

        return data;
      })
      .fail(function() { console.error("Error pulling configuration data..."); });

      return promise;
    // }
  };

  var tryPullStatisticsData = function() {
    // needed: run_id, habitat_configuration, bout_id
    // if (app.runId) {
    //   jQuery.get(app.config.drowsy.uic_url+'/'+DATABASE+'/statistics', function(data) {
    //     app.configurationData = data;
    //   })
    //   .done(function() { console.log("Statistics data pulled!"); })
    //   .fail(function() { error.log("Error pulling configuration data..."); });
    // }
  };

  var tryPullRecentBoutData = function() {
    // to determine the selector, we need the run_id, habitat_configuration, the bout_id
    // in the log collection (chose which based on run) get all events between the bouts' 'game_start' and 'game_stop' timestamps
    // if (app.runId) {
      // +'%3F%253Fsort%253D%5B%22_id%22%252C%22ASC%22%5D'
      var promise = jQuery.get(app.config.drowsy.uic_url+'/'+DATABASE+'/log-'+app.runId)
      .then( function(data) {
        app.recentBoutData = data;
        sortRecentBoutData();
        console.log("Recent bout data pulled!");

        return data;
      })
      // .done(function() { console.log("Recent bout data pulled!"); })
      .fail(function() { console.error("Error pulling recent bout data..."); });

      return promise;
    // }
  };

  var tryPullUsersData = function() {
    if (app.runId) {
      app.rollcall.usersWithTags([app.runId])
      .done(function (availableUsers) {
        console.log("Users data pulled!");
        app.users = availableUsers;
      })
      .fail(function() { console.error("Error pulling users data..."); });
    }
  };

  app.restoreLastNote = function(activity) {
    console.log('Restoring notes...');
    var unpublishedNotes = Model.awake.notes.where({author: app.username, related_activity: activity, published: false, worth_remembering: false});
    if (_.isEmpty(unpublishedNotes)) {
      console.log('Nothing to restore');
      app.currentNote = null;
    } else {
      app.currentNote = _.max(unpublishedNotes, function(n) { return n.get('created_at'); });
    }
  };

  app.restoreWorthRemembering = function() {
    console.log('Restoring worth rememberings...');
    var unpublishedWRs = Model.awake.notes.where({author: app.username, published: false, worth_remembering: true});
    if (_.isEmpty(unpublishedWRs)) {
      console.log('Nothing to restore');
      app.currentWorthRemembering = null;
      jQuery('#worth-remembering-entry').val('');
    } else {
      app.currentWorthRemembering = _.max(unpublishedWRs, function(n) { return n.get('created_at'); });
    }
  };

  var idToTimestamp = function(id) {
    var timestamp = id.substring(0,8);
    var seconds = parseInt(timestamp, 16);
    return seconds;
    // date = new Date( parseInt(timestamp, 16) * 1000 );
    // return date;
  };

  /**
   *  Function where most of the click listener should be setup
   *  called very late in the init process, will try to look it with Promise
   */
  var setUpClickListeners = function () {
    // Show notes screen
    jQuery('.notes-button').click(function() {
      if (app.username) {
        app.hideAllRows();
        jQuery('#notes-screen').removeClass('hidden');
      }
    });

    // Show notes screen
    jQuery('.worth-remembering-button').click(function() {
      if (app.username) {
        app.hideAllRows();
        jQuery('#worth-remembering-screen').removeClass('hidden');
      }
    });

    // Refresh and repull data - this may go eventually
    jQuery('.refresh-button').click(function() {
      jQuery().toastmessage('showNoticeToast', "Refreshing...");

      tryPullAll().done(function(stateData, configurationData, recentBoutData) {
        console.log('tryPullAll finished and we could wait for it or even manipulate data');
      });

      console.log('Refresh the harvest planning graph on user request');
      HG.Patchgraph.refresh().done(function(){
        console.log('Patchgraph data refreshed');
      });
    });

    // Show harvest planning tool
    jQuery('.equalization-button').click(function() {
      if (app.username) {
        app.hideAllRows();
        jQuery('#equalization-screen').removeClass('hidden');
        populateStaticEqualization();
      }
    });


    /*
     * =========================================================
     * Section with functions for the harvest/patch graph
     * =========================================================
    */
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

    // click listener for bout-picker dropdown to re-draw graph for selected bout (no data reload)
    jQuery(document).on('click', '#bout-picker li a', function () {
      console.log("Selected Option:"+ jQuery(this).text());
      console.log("Selected Option with habitat_configuration "+jQuery(this).data("habitat-configuration")+" and bout_id "+jQuery(this).data("bout"));
      HG.Patchgraph.showGraphForBout(jQuery(this).data("habitat-configuration"), jQuery(this).data("bout"));
    });

    // Click listener for graph refresh button - this will reload data and re-draw bout
    // jQuery('#refresh-graph').click(function () {
    //   console.log('Refresh the harvest planning graph on user request');
    //   HG.Patchgraph.refresh();
    // });
    /*
     * =========================================================
     * End of - Section with functions for the harvest/patch graph
     * =========================================================
    */

    jQuery('.equalization-squirrels-field').change(function(ev) {
      updateEqualization(ev);
    });

    jQuery('#move-forward').click(function() {
      updateMoveTracker("next");
    });
    jQuery('#move-backward').click(function() {
      updateMoveTracker("previous");
    });
  };


  //*************** LOGIN FUNCTIONS ***************//

  app.loginUser = function (username) {
    // retrieve user with given username
    app.rollcall.user(username)
    .done(function (user) {
      if (user) {
        console.log(user.toJSON());

        app.username = user.get('username');

        jQuery.cookie('hunger-games_mobile_username', app.username, { expires: 1, path: '/' });
        //jQuery('.username-display a').text(app.runId+'#'+app.username);
        jQuery('.username-display a').text(app.username.toUpperCase());

        // show notes-screen
        jQuery('#notes-screen').removeClass('hidden');

        hideLogin();
        hideUserLoginPicker();
        showUsername();

        app.setup();
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
  };

  var logoutUser = function () {
    jQuery.removeCookie('hunger-games_mobile_username',  { path: '/' });
    jQuery.removeCookie('hunger-games_mobile_runId',  { path: '/' });
    window.location.reload();
  };

  var showLogin = function () {
    jQuery('#login-button').removeAttr('disabled');
    jQuery('#username').removeAttr('disabled');
  };

  var hideLogin = function () {
    jQuery('#login-button').attr('disabled','disabled');
    jQuery('#username').attr('disabled','disabled');
  };

  var hideUserLoginPicker = function () {
    // hide modal dialog
    jQuery('#login-picker').modal('hide');
  };

  var showUsername = function () {
    jQuery('.username-display').removeClass('hide');
  };

  var hideUsername = function() {
    jQuery('.username-display').addClass('hide');
  };

  var showRunPicker = function(runs) {
    jQuery('.login-buttons').html(''); //clear the house
    console.log(app.config.runs);

    _.each(app.config.runs, function(run) {
      var button = jQuery('<button class="btn btn-large btn-primary login-button">');
      button.val(run);
      button.text(run);
      jQuery('.login-buttons').append(button);
    });

    // register click listeners
    jQuery('.login-button').click(function() {
      app.runId = jQuery(this).val();
      jQuery.cookie('hunger-games_mobile_runId', app.runId, { expires: 1, path: '/' });
      // jQuery('#login-picker').modal("hide");
      showUserLoginPicker(app.runId);
    });

    // show modal dialog
    jQuery('#login-picker').modal({backdrop: 'static'});
  };

  var showUserLoginPicker = function(runId) {
    // retrieve all users that have runId
    app.rollcall.usersWithTags([runId])
    .done(function (availableUsers) {
      jQuery('.login-buttons').html(''); //clear the house
      console.log(availableUsers);
      app.users = availableUsers;

      // sort the collection by username
      app.users.comparator = function(model) {
        return model.get('username');
      };
      app.users.sort();

      app.users.each(function(user) {
        var button = jQuery('<button class="btn btn-large btn-primary login-button">');
        button.val(user.get('username'));
        button.text(user.get('username'));
        jQuery('.login-buttons').append(button);
      });

      // register click listeners
      jQuery('.login-button').click(function() {
        var clickedUserName = jQuery(this).val();
        app.loginUser(clickedUserName);
      });

      // show modal dialog
      // jQuery('#login-picker').modal({backdrop: 'static'});
    }); 
  };

  app.hideAllRows = function () {
    jQuery('.row-fluid').each(function (){
      jQuery(this).addClass('hidden');
    });
  };

  // this version of autoSave has been depricated. Use method in Washago or CK instead
  app.autoSave = function(field, input, instantSave) {
    app.keyCount++;

    if ((field === 'part_1' || field === 'part_2') && (instantSave || app.keyCount > 9)) {
      console.log('Note saved');
      app.currentNote.set('part_1', jQuery('#note-part-1-entry').val());
      app.currentNote.set('part_2', jQuery('#note-part-2-entry').val());
      app.currentNote.save();
      app.keyCount = 0;
    } else if ((field === 'reply') && (instantSave || app.keyCount > 9)) {
      console.log('Reply saved');
      app.currentReply.content = input;
      app.keyCount = 0;
    } else if ((field === 'worth_remembering') && (instantSave || app.keyCount > 9)) {
      console.log('WR saved');
      app.currentWorthRemembering.set('part_1', input);
      app.currentWorthRemembering.save();
      app.keyCount = 0;
    }
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