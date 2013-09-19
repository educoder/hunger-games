(function () {
  "use strict";

  var copycat = this.copycat || {};
  var runs = ['5ag', '5at', '5bj'];

  // instantiate rollcall so I can read and write the users
  copycat.rollcall = new Rollcall('http://drowsy.badger.encorelab.org', 'rollcall');

  copycat.copy_hard = function() {
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
              // result.save();
            } else {
              console.log('user not found - create');
              var newUser = new copycat.rollcall.User({
                username: userId,
                tags: [uic_user.run],
                rfid_tag: uic_user.rfid_tag,
                color: uic_user.color,
                color_label: uic_user.color_label
              });
              // newUser.save();
              rollcall_users.add(newUser);
              console.log('Created user with username: '+userId);
            }
          }
        });

        rollcall_users.each(function (u) {
          u.save();
        });
      });
  };

  this.copycat = copycat;

}).call(this);