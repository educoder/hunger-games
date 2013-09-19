(function () {
  "use strict";

  var copycat = this.copycat || {};
  var runs = ['5ag', '5at', '5bj'];

  // instantiate rollcall so I can read and write the users
  copycat.rollcall = new Rollcall('http://drowsy.badger.encorelab.org', 'rollcall');

  copycat.copy_hard = function() {
    // _.each(runs, function(run) {
      // pull roster from UICs drowsy
      // jQuery.when(jQuery.ajax('http://ltg.evl.uic.edu:9292/roster/people?selector=%7B"run"%3A"'+run+'"%7D&strict=false'), copycat.rollcall.users())
      jQuery.when(jQuery.ajax('http://ltg.evl.uic.edu:9292/roster/people'), copycat.rollcall.users())
        .done(function (run_roster, rollcall_users) {
          console.log(run_roster);
          console.log(rollcall_users);

          _.each(run_roster[0], function(uic_user) {
            // has roster user a run that matches defined runs?
            if (_.contains(runs, uic_user.run)) {
              var userId = uic_user._id.substring(4,7);
              var result = rollcall_users.findWhere({username: userId});
              if (result) {
                console.log('Update user: '+result.get('username'));
                var tags = result.get('tags');
                tags.push(uic_user.run);
                tags.push(uic_user.run);
                result.set('tags', _.uniq(tags));
                result.save();
              } else {
                console.log('user not found - create');
                var newUser = new copycat.rollcall.User({
                  username: userId,
                  tags: [uic_user.run],
                  rfid_tag: uic_user.rfid_tag,
                  color: uic_user.color,
                  color_label: uic_user.color_label
                });
                newUser.save();
                rollcall_users.add(newUser);
                console.log('Created user with username: '+userId);
              }
            }
          });
          
          // result.set('test', 'testy');

          // _.each(run_roster, function(user) {
          //   var uic_user = _.clone(user);
          //   var user_id = uic_user._id.substring(4,7);

          //   // jQuery.ajax({
          //   //   url: 'http://drowsy.badger.encorelab.org/rollcall/users?selector=%7B%22username%22%3A%22'+user_id+'%22%7D&strict=false',
          //   //   context: uic_user,
          //   //   success: function(existing_user) {
          //   //     if (existing_user.length > 0) {
          //   //       console.log('existing user found, update user');
          //   //       _.first(existing_user).tags.push(uic_user.run);

          //   //       // jQuery.ajax({
          //   //       //   type: 'POST',
          //   //       //   url: 'http://drowsy.badger.encorelab.org/rollcall/users?selector=%7B%22username%22%3A%22'+existing_user.username+'%22%7D&strict=false',
          //   //       //   data: _.first(existing_user),
          //   //       //   success: function(user){
          //   //       //     console.log('Updates user: '+ user.username);
          //   //       //   }
          //   //       // });
          //   //     } else {
          //   //       console.log('no existing user found, create new user');
          //   //       var newUser = new copycat.rollcall.User({
          //   //         username: uic_user._id.substring(4,7),
          //   //         tags: [uic_user.run],
          //   //         rfid_tag: uic_user.rfid_tag,
          //   //         color: uic_user.color,
          //   //         color_label: uic_user.color_label
          //   //       });
          //   //       //newUser.save();
          //   //     }
          //   //   }
          //   // });

          //   copycat.rollcall.userExists(user_id)
          //   .done(function (exists) {
          //     if (exists) {
          //       console.log('User: '+uic_user._id.substring(4,7)+' exists, update!');
          //     } else {
          //       console.log('User: '+uic_user._id.substring(4,7)+' does NOT exist, create!');
          //       var newUser = new copycat.rollcall.User({
          //         username: uic_user._id.substring(4,7),
          //         tags: [uic_user.run],
          //         rfid_tag: uic_user.rfid_tag,
          //         color: uic_user.color,
          //         color_label: uic_user.color_label
          //       });
          //       newUser.save();
          //     }
          //     // console.log(uic_user);
          //     // console.log(exists);
          //   });
          // });
        });
    // });
  };

  this.copycat = copycat;

}).call(this);