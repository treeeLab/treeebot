import fs from "fs";
import path from "path";
import chalk from "chalk";
import readline from "readline";

export default class Logger {
	colorMap = {
		log: "#71C562",
		info: "#315399",
		warn: "#FFC000",
		error: "#A7171A",
		debug: "#008B8B",
		trace: "##A300A3",
	};

	logLevelMap = {
		log: "   LOG     ",
		info: "   INFO    ",
		warn: "   WARN    ",
		error: "   ERROR   ",
		debug: "   DEBUG   ",
		trace: "   TRACE   "
	};

	children = [];
	path = "";

	constructor(api, prefix, customPrefixColor, messagePrefix) {
		this.api = api;
		this.prefix = prefix || "TreeBot";
		this.prefixColor = customPrefixColor || "yellow";
		this.messagePrefix = messagePrefix || "";
	}

	registerChild(childPrefix) {
		let childLogger = new Logger(this.api, this.prefix, this.prefixColor, childPrefix);
		childLogger.setLogPath(this.path);
		this.children.push(childLogger);
		return childLogger;
	}

	setLogPath(logPath) {
		this.path = path.resolve(logPath);
	}

	_log(logLevel, ...message) {
		let logTime = new Date().toISOString();
		readline.cursorTo(process.stdout, 0);
		let log = chalk.gray(`[${logTime}]`);
		log += " ";
		log += chalk[this.prefixColor](`[${this.prefix}]`);
		log += " ";
		log += chalk.bgHex(this.colorMap[logLevel])["italic"](this.logLevelMap[logLevel]);
		log += " ";
		log += chalk.gray("»");
		if (this.messagePrefix) {
			log += " ";
			log += chalk.gray.underline.italic(`[${this.messagePrefix}]`);
		}
		console.log(log, ...message);

		if (this.path) {
			let msg = [];
			for (let _msg of message) {
				if (typeof _msg !== "string")
					msg.push(JSON.stringify(_msg, null, "\t"));
				else msg.push(_msg);
			}

			let logContent = `[${logTime}] [${this.prefix}] [${logLevel}]${this.messagePrefix ? ` [${this.messagePrefix}] ` : " "}${msg.join(" ")}`;
			if (fs.existsSync(this.path)) {
				fs.appendFileSync(this.path, "\n" + logContent);
			} else {
				fs.writeFileSync(this.path, logContent);
			}
		}

		this.api.readline.prompt(true);
	}

	log(...message) { this._log("log", ...message); }
	info(...message) { this._log("info", ...message); }
	warn(...message) { this._log("warn", ...message); }
	error(...message) { this._log("error", ...message); }
	debug(...message) { this._log("debug", ...message); }
	trace(...message) { this._log("trace", ...message); }
};