const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const config = require('./config');

const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager({
	steam: client,
	community: community,
	language: 'en'
});

const logInOptions = {
	accountName: config.accountName,
	password: config.password,
	twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)
};

client.logOn(logInOptions);

client.on('loggedOn', () => {
	console.log('logged on');
	
	client.setPersona(SteamUser.Steam.EPersonaState.Online);
	client.gamesPlayed('nodejs tutorial');
});

client.on('webSession', (sid, cookies) => {
	manager.setCookies(cookies);
	community.setCookies(cookies);
	community.startConfirmationChecker(20000, config.identitySecret);
});