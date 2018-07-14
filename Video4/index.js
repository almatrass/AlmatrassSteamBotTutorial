const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const http = require('http');
const express = require('express');
const handlebars = require('express-handlebars');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const socket = require('socket.io');

const config = require('./config');

const app = express();
const server = http.Server(app);
const io = socket(server);

passport.serializeUser((user, done) => {
	console.log(user._json);
	done(null, user._json);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});

passport.use(new SteamStrategy({
	returnURL: 'http://localhost:3000/auth/steam/return'
	, realm: 'http://localhost:3000/'
	, apiKey: config.apiKey
}, (identifier, profile, done) => {
	return done(null, profile);
}));

app.engine('hbs', handlebars({
	extname: '.hbs'
	, partialsDir: './views/partials'
	, helpers: {
		bonusprice: function (coinprice) {
			return Math.floor(coinprice * 0.95);
		},
		gethey: function() {
			return 'hey';
		}
	}
}));

app.set('view engine', 'hbs');

app.use(cookieParser());
app.use(session({
	key: 'session_id'
	, secret: 'almatrass'
	, resave: true
	, saveUninitialized: true
	, cookie: {
		maxAge: 259200000
	}
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/public', express.static(__dirname + '/public'));

let online = 0;
io.on('connection', socket => {
	online += 1;
	io.emit('onlinechange', online);
	
	socket.on('disconnect', function() {
		online -= 1;
		io.emit('onlinechange', online);
	});
	
	socket.on('alertme', function(data) {
		io.emit('alert', data.message, 'success');
	});
});

app.get('/', (req, res) => {
	if (req.user) {
		res.render('main', {
			user: req.user
		})
	} else {
		res.render('main', {

		})
	}
});

app.get(/^\/auth\/steam(\/return)?$/, passport.authenticate('steam', {
	failureRedirect: '/'
}), (req, res) => {
	res.redirect('/');
});

app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

server.listen(3000);