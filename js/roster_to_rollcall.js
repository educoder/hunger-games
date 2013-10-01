(function () {
  "use strict";

  var copycat = this.copycat || {};
  var runs = ['5ag', '5at', '5bj'];

  // instantiate rollcall so I can read and write the users
  copycat.rollcall = new Rollcall('http://drowsy.badger.encorelab.org', 'rollcall');

  copycat.copyHard = function() {
    jQuery.when(jQuery.ajax('http://ltg.evl.uic.edu:9292/roster/people'), copycat.rollcall.users())
      .done(function (runRoster, rollcallUsers) {
        console.log(runRoster);
        console.log(rollcallUsers);

        _.each(runRoster[0], function(uicUser) {
          // has roster user a run that matches defined runs?
          if (_.contains(runs, uicUser.run)) {
            var userId = uicUser._id.substring(4,uicUser._id.length);
            var user = rollcallUsers.findWhere({username: userId});
            if (user) {
              console.log('Update user: '+user.get('username'));
              // user.set('display_name', userId.toUpperCase());
              var tags = user.get('tags');
              tags.push(uicUser.run);
              user.set('tags', _.uniq(tags));

              if (uicUser.teacher === true) {
                user.set('user_role', 'teacher');
              }
              // user.save();
            } else {
              console.log('user not found - create');
              var newUser = new copycat.rollcall.User({
                username: userId,
                display_name: userId.toUpperCase(),
                tags: [uicUser.run],
                rfid_tag: uicUser.rfid_tag,
                color: uicUser.color,
                color_label: uicUser.color_label,
                user_role: 'student'
              });

              if (uicUser.teacher === true) {
                newUser.set('user_role', 'teacher');
              }
              // newUser.save();
              rollcallUsers.add(newUser);
              console.log('Created user with username: '+userId);
            }
          }
        });

        rollcallUsers.each(function (u) {
          u.save();
        });
      });
  };

  this.copycat = copycat;

}).call(this);