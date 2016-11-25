var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var Account = require('../models/account');
var configAuth = require('./auth');

module.exports = function(passport) {
	passport.serializeUser(function(user, done){
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done){
		Account.findById(id, function(err, user){
			done(err, user);
		});
	});

	// Local Signup

	passport.use('local-signup', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	}, function(req, email, password, done) {
		process.nextTick(function(){
			Account.findOne({'local.email': email}, function(err, user){
				if (err) {
					return done(err);
				}

				if (user) {
					return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
				} else {
					var newUser = new Account();
					newUser.local.email = email;
					newUser.local.password = newUser.generateHash(password);

					newUser.save(function(err){
						if (err) throw err;
						return done(null, newUser);
					});

				}
			});
		});
	}));

	passport.use('local-login', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	}, function(req, email, password, done) {
		Account.findOne({ 'local.email' : email}, function(err, user) {
			if (err) {
			 return done(err);
			}

			if (!user) {
				return done(null, false, req.flash('loginMessage', 'User Not Found!'));			
			}

			if (!user.validPassword(password)) {
				return done(null, false, req.flash('loginMessage', 'Wrong Password!'));			
			}

			return done(null, user);
		});
	}));

	passport.use(new FacebookStrategy({
		clientID: configAuth.facebookAuth.clientID,
		clientSecret: configAuth.facebookAuth.clientSecret,
		callbackURL: configAuth.facebookAuth.callbackURL,
		profileFields: ['id', 'displayName', 'photos', 'email']
	}, 
	function(token, refreshToken, profile, done) {
		console.log(profile);
		process.nextTick(function(){
			Account.findOne({'facebook.id':profile.id}, function(err, user){
				if (err) return done(err);

				if (user) {
					return done(null, user);
				} else {
					var newUser = new Account();

					newUser.facebook.id = profile.id;
					newUser.facebook.token = token;
					newUser.facebook.name =  profile.displayName;
					newUser.facebook.email = profile.emails[0].value;
					newUser.facebook.pictureUrl = profile.photos[0].value;
					newUser.save(function(err){
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}));

	passport.use(new TwitterStrategy({
		consumerKey: configAuth.twitterAuth.consumerKey,
		consumerSecret: configAuth.twitterAuth.consumerSecret,
		callbackURL: configAuth.twitterAuth.callbackURL


	},function(token, tokenSecret, profile, done) {
		process.nextTick(function(){
			console.log('twitter profile: ',profile);
			Account.findOne({'twitter.id':profile.id}, function(err, user){
				if (err) return done(err);

				if (user) {
					return done(null, user);
				} else {
					var newUser = new Account();

					newUser.twitter.id = profile.id;
					newUser.twitter.token = token;
					newUser.twitter.username = profile.username;
					newUser.twitter.displayName = profile.displayName;
					newUser.twitter.pictureUrl = profile.photos[0].value;

					newUser.save(function(err){
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});

	}));

	passport.use(new GoogleStrategy({
		clientID: configAuth.googleAuth.clientID,
		clientSecret: configAuth.googleAuth.clientSecret,
		callbackURL: configAuth.googleAuth.callbackURL
	}, function(token, refreshToken, profile, done){
		console.log(profile);
		process.nextTick(function(){
			Account.findOne({'google.id': profile.id}, function(err, user){
				if (err) return done(err);

				if (user) {
					return done(null, user);
				} else {
					var newUser = new Account();

					newUser.google.id = profile.id;
					newUser.google.token = token;
					newUser.google.displayName = profile.displayName;
					newUser.google.email = profile.emails[0].value;
					newUser.google.pictureUrl = profile.photos[0].value;

					newUser.save(function(err){
						if (err) throw err;

						return done(null, newUser);
					});
				}

			});
		});
	}));

};