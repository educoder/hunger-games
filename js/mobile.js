/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:true */
/*global  Backbone, _, jQuery, Rollcall */

(function() {
  "use strict";
  var HG = this.HG || {};                     // TODO: refactor this to Hunger? HungerGames?
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

    // TODO: where is this coming from? Also abstract to it's own function.
    app.run = "period-1";         

    // grab the configuration data
    tryPullConfigurationData();           // TODO: does this need a callback or a promise? TODO: switch to tryPullAll();
    tryPullRecentBoutData();


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

    // Show harvest planning tool
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
            jQuery('.'+selectedPatch+' .equalization-yield-field').text('0');
          } else {
            var y = p.richness_per_minute / numSq;
            jQuery('.'+selectedPatch+' .equalization-yield-field').text(y);            
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

  //*************** HELPER FUNCTIONS ***************//

  var tryPullAll = function() {
    // CAREFUL: this may need promises!
    tryPullStateData();
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
      })
      .done(function() { console.log("Recent bout data pulled!"); })
      .fail(function() { console.error("Error pulling configuration data..."); });
    }
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