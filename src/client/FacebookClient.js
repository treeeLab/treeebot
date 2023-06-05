/* eslint-disable no-async-promise-executor */
/* eslint-disable no-unused-vars */
import fs from "fs";
import path from "path";
import facebookChatApi from "fb-chat-api";

export default class FacebookClient {
	loginError = null;
	loginOptions = {};
	facebookEmail;
	facebookPassword;
	facebookAppState = {};

	constructor(api) {
		this.api = api;
		this.APPSTATE_PATH = api.globalVars.APPSTATE_PATH;
	}

	setLoginOptions(loginOptions) {
		return Object.assign(this.loginOptions, loginOptions);
	}

	async login(facebookEmail, facebookPassword, facebookAppState) {
		this.facebookEmail = facebookEmail;
		this.facebookPassword = facebookPassword;
		this.facebookAppState = facebookAppState;

		let oldUserAgent = null;
		let loginMethod = "";
		let loginCredentials = {};

		if (Array.isArray(this.facebookAppState)) {
			loginMethod = "appstate";
			loginCredentials = { appState: this.facebookAppState };
		} else {
			oldUserAgent = this.loginOptions.userAgent;
			this.loginOptions.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36";
			loginMethod = "password";
			loginCredentials = { email: this.facebookEmail, password: this.facebookPassword };
		}

		return new Promise((resolve, reject) => {
			this.api.logger.info("Logging in...");
			facebookChatApi(loginCredentials, this.loginOptions, async (err, api) => {
				if (api) {
					Object.assign(this, api);
					this.api.logger.info(`Logged in!`);
					if (loginMethod === "password") {
						this.api.logger.info("Saving appstate for next login session...");
						if (typeof api.getAppState === "function") {
							this.facebookAppState = api.getAppState();
							fs.writeFileSync(this.APPSTATE_PATH, JSON.stringify(this.facebookAppState, null, 3));
						}
					}
					return resolve(api);
				}

				if (err) {
					this.loginError = err;
					if (err && err.error === "login-approval") {
						this.api.logger.warn("Facebook login approval found, please enter approval code to continue...");
						this.api.readline.question("", code => {
							code = code.replace(/ +/g, "");
							if (oldUserAgent) {
								this.loginOptions.userAgent = oldUserAgent;
							} else {
								delete this.loginOptions.userAgent;
							}
							this.api.logger.log("Code recieved:", code);
							err.continue(code);
						});
					} else if (err.errorSummary && err.errorSummary.toLowerCase().includes("Sorry, something went wrong".toLowerCase())) {
						this.api.logger.warn("Facebook login error (not danger). Re-logging again using appstate from this logging session...");
					} else {
						this.api.logger.error("Facebook login error (not login approval)", err);
						reject(err);
					}

					return;
				}
			});
		});
	}
};