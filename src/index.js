/* eslint-disable no-case-declarations */
/* eslint-disable no-extra-semi */
import packageInfo from "../package.json" assert {type: "json"};
import dotenv from "dotenv";
import chalk from "chalk";

import fs from "fs";
import path from "path";
import readline from "readline";

import Logger from "./logger/Logger.js";
import FacebookClient from "./client/FacebookClient.js";
import Utils from "./Utils.js";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false,
	prompt: chalk.hex("#E2D1F9").underline.italic.bold("treebot@cli") + " " + chalk.gray("»") + " "
});

const START_TIME = Date.now();
const LOGS_PATH = path.join(process.cwd(), "logs");
const PLUGINS_PATH = path.join(process.cwd(), "plugins");
const APPSTATE_PATH = path.join(process.cwd(), "appstate.json");
const APPSTATE_DATA = fs.existsSync(APPSTATE_PATH) ? JSON.parse(fs.readFileSync(APPSTATE_PATH, "utf-8") || "{}") : {};

const api = {
	_env: {
		facebookEmail: process.env.FACEBOOK_EMAIL,
		facebookPassword: process.env.FACEBOOK_PASSWORD,
		botName: process.env.BOT_NAME,
		botPrefix: process.env.BOT_PREFIX
	},
	loginOptions: {
		logLevel: "silent",
		selfListen: true,
		selfListenEvent: true,
		listenEvents: true,
		updatePresence: false,
		autoMarkRead: false,
		autoMarkDelivery: false,
		forceLogin: true
	},
	globalVars: {
		START_TIME,
		LOGS_PATH,
		PLUGINS_PATH,
		APPSTATE_PATH,
		APPSTATE_DATA
	},
	readline: rl,
	logger: null,
	facebookClient: null
};

api.logger = new Logger(api, "Tree̷" + "e" + "Bot", "yellow");
api.utils = new Utils(api);
api.facebookClient = new FacebookClient(api);

api.logger.info("=".repeat(process.stdout.columns - 55));
api.logger.info("Starting", chalk.magentaBright.underline.bold("Tree̷eBot"), chalk.gray("v" + packageInfo.version));
api.logger.info("(C) 2022 Kaysil - Do not copy");
api.logger.info("=".repeat(process.stdout.columns - 55));

if (!api.utils.ensureExists(LOGS_PATH)) api.logger.info("logs/ folder not found, creating...");
if (!api.utils.ensureExists(PLUGINS_PATH)) api.logger.info("plugins/ folder not found, creating...");
if (!fs.existsSync(path.join(process.cwd(), ".env"))) {
	api.readline.setPrompt("");
	api.logger.warn("No .env file found, exiting...");
	process.exit(0);
}

api.logger.setLogPath(path.join(LOGS_PATH, `${START_TIME} - treebot.log`));
api.facebookClient.setLoginOptions(api.loginOptions);

; (async () => {
	// catching signal and handle before exiting...
	for (let signal of [
		"SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT",
		"SIGBUS", "SIGFPE", "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGTERM"
	]) {
		rl.on(signal, () => process.emit(signal));
		process.on(signal, () => handleSignal(signal));
	}

	// the handle signal function
	const handleSignal = (signal) => {
		if (typeof signal === "string") {
			rl.setPrompt("");
			api.logger.info("Received signal", signal);
			api.logger.info("Exiting...");
			process.exit();
		}
	};

	// handle the command input
	const handleCommandInput = async (line) => {
		rl.prompt(true);
		try {
			switch (line.toLowerCase()) {
				case "exit":
				case "quit":
					process.emit("SIGTERM");
					break;
				case "reload":
					// reload the bot
					break;
				case "clear":
					console.clear();
					api.logger.info("Cleared console!");
					break;
				default:
					// replace all console. to API.logger. in line string (the line below is suggest by copilot :P)
					line = line.replace(/console\./g, "API.logger.");
					let evalResult = eval(line);
					if (evalResult === undefined) return;
					api.logger.debug("Eval result:", evalResult);
					break;
			}
		} catch (err) {
			api.logger.debug("Eval error:", err);
		}
	};

	rl.on("line", handleCommandInput);

	// Login to Facebook and start listening for events
	api.facebookApi = await api.facebookClient.login(api._env.facebookEmail, api._env.facebookPassword, api.globalVars.APPSTATE_DATA);
})().catch((err) => {
	api.logger.error("Main process error:", err);
});