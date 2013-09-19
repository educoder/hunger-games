/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:false */
/*global Backbone, _, jQuery, Sail */

(function() {
  "use strict";
  var HG = this.HG || {};
  this.HG.Mobile = this.HG.Mobile || {};
  var app = this.HG.Mobile;
  app.View = {};

  /**
    MobileView
  **/
  app.View.IndexView = Backbone.View.extend({
    events: {
      'keyup :input': function(ev) {
        var view = this,
          field = ev.target.name,
          input = jQuery('#'+ev.target.id).val();
        // clear timer on keyup so that a save doesn't happen while typing
        window.clearTimeout(app.autoSaveTimer);

        // save after 10 keystrokes
        app.autoSave(view.model, field, input, false);

        // setting up a timer so that if we stop typing we save stuff after 5 seconds
        app.autoSaveTimer = setTimeout(function(){
          app.autoSave(view.model, field, input, true);
        }, 5000);
      }
    },

    initialize: function () {
      console.log("Initializing IndexView...",this.el);
    }
  });

  /**
    ListView
  **/
  app.View.ListView = Backbone.View.extend({
    template: "#list-view-template",

    initialize: function () {
      var view = this;

      console.log('Initializing InputView...', this.el);

      HG.Model.awake.notes.on('add', function(n) {
        console.log('Note added...');
        view.render();
      });

      jQuery('#activity-dropdown').on('change', function() {
        console.log('Dropdown changed...');
        view.render();
      });

      view.render();

      return view;
    },

    events: {
      'click #new-note-btn': 'createNewNote'
    },

    createNewNote: function() {
      console.log('New note clicked');
    },

    render: function () {
      var view = this;
      console.log('Rendering InputView');

      // find the list where items are rendered into
      var list = this.$el.find('ul');
      list.html('');                            // TODO: I'm going to cause problems later! Better to make the each smarter by using dropping an id into a data element to reside in the DOM

      HG.Model.awake.notes.each(function(n) {
        if (n.get('part_1') && n.get('part_2') && (n.get('related_activity') === jQuery('#activity-dropdown').val())) {
          console.log('Showing each note...');
          var data = n.toJSON();

          var listItem = _.template(jQuery(view.template).text(), data);
          list.append(listItem);         
        }
      });
    }

  });

  /**
    DetailsView
  **/
  app.View.DetailsView = Backbone.View.extend({

  });

  /**
    InputView
  **/
  app.View.InputView = Backbone.View.extend({
    initialize: function () {
      var view = this;
      console.log('Initializing InputView...', this.el);
      view.updatePrompts();
    },

    events: {
      'click #share-note-btn': 'shareNewNote',
      'click .note-entry-field': 'updateEllipses',
      'change #activity-dropdown': 'updatePrompts'
    },

    shareNewNote: function () {
      var p1 = this.$el.find('#note-part-1-entry').val();
      var p2 = this.$el.find('#note-part-2-entry').val();
      if (p1.slice(-3) != "..." && p2.slice(-3) != "...") {
        var newNote = {};
        newNote.author = app.username;
        newNote.part_1 = p1;
        newNote.part_2 = p2;
        newNote.related_activity = this.$el.find('#activity-dropdown').val();

        HG.Mobile.createNewNote(newNote);

        view.updatePrompts();       
      } else {
        jQuery().toastmessage('showErrorToast', "Please fill out both parts of the note");
      }

    },

    updateEllipses: function (ev) {
      var str = jQuery(ev.target).val();
      if (str.slice(-3) === "...") {
        jQuery(ev.target).val(str.substring(0, str.length - 3) + " ");
      }
    },

    updatePrompts: function () {
      var activity = jQuery('#activity-dropdown').val();
      if (activity === "activity-1") {
        jQuery('#note-part-1-entry').val("The strategy I tended to use was...");
        jQuery('#note-part-2-entry').val("In order to do better next time I will...");
      } else if (activity === "activity-2") {
        jQuery('#note-part-1-entry').val("Compared to an ideal distribution, our results were...");
        jQuery('#note-part-2-entry').val("This was because...");
      } else {
        jQuery('#note-part-1-entry').val("");
        jQuery('#note-part-2-entry').val("");
      }
    },

    render: function () {
      console.log('Rendering InputView');
    }
  });

  /**
    LoginButtonsView
  **/
  app.View.LoginButtonsView = Backbone.View.extend({
    initialize: function () {
      console.log('Initializing LoginButtonsView...', this.el);
    },

    events: {
      //'click #share-note-btn': 'shareNewNote'
    },

    shareNewNote: function () {
      // var newHeadline = this.$el.find('#note-headline-entry').val();
      // var newNoteText = this.$el.find('#note-body-entry').val();
      // var newNote = {};
      // newNote.headline = newHeadline;
      // newNote.body = newNoteText;
      // // if (jQuery.trim(newTag).length < 2) {
      // //   return; // don't allow tags shorter than 2 characters
      // // }
      // HG.Mobile.createNewNote(newNote);
      
      // this.$el.find('#note-headline-entry').val('');
      // this.$el.find('#note-body-entry').val('');
    },

    render: function () {
      console.log('Rendering LoginButtonsView');
    }


  });


  this.HG = HG;
}).call(this);
