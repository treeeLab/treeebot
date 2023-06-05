/* eslint-disable no-useless-escape */
import fs from "fs";
import path from "path";
import url from "url";

export default class Utils {
	constructor(api) {
		this.api = api;
	}

	ensureExists(_path, isFile, fileContent) {
		_path = path.resolve(_path);
		if (!fs.existsSync(_path)) {
			if (isFile) {
				fs.writeFileSync(_path, (fileContent || ""));
				return false;
			} else {
				fs.mkdirSync(_path, { recursive: true });
				return false;
			}
		} else {
			return true;
		}
	}

	parseCommand(commandPrefix, message) {
		commandPrefix = commandPrefix.toLowerCase();
		if (!message.startsWith(commandPrefix)) return null;

		let args = message.slice(commandPrefix.length)
			// split message space to args
			.split(/("[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+)/g)
			// remove the element if it is a empty string or a whitespace character or something like that
			.filter(arg => arg.trim() !== "" && arg.trim().replace(/\s/g, "") !== "");

		// remove the double quotes and single quotes of all the elements in the array
		let command = args.shift().toLowerCase();
		let formattedArgs = args.map(arg => (arg.startsWith("\"") || arg.startsWith("'")) && (arg.endsWith("\"") || arg.endsWith("'")) ? arg.slice(1, -1) : arg);

		return { command, args, formattedArgs };
	}

	/**
	 * Original code from https://github.com/c3cbot/legacy-c3cbot
	 * by UIRI aka. BadAimWeeb
	 * @param {string} bingMapsUrl the url of the bing maps
	 * @param {boolean} isFacebookUrl if the bing maps url in "l.facebook.com/l.php?u={url}"... 
	 * @returns {Record<string, string> | null} coordinates or address or null if not found
	 */
	getLocation(bingMapsUrl, isFacebookUrl) {
		if (isFacebookUrl) bingMapsUrl = decodeURIComponent(String(url.parse(bingMapsUrl, true).query["u"]));
		bingMapsUrl = String(url.parse(bingMapsUrl, true).query["where1"]);

		let location = null;

		// check if location is a coordinates (latitude, longitude)
		if (bingMapsUrl.match(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)) {
			bingMapsUrl = bingMapsUrl.replace(/ +/g, "").split(",");
			if (bingMapsUrl.length === 2) location = {
				latitude: bingMapsUrl[0],
				longitude: bingMapsUrl[1]
			};
		} else {
			if (bingMapsUrl.length > 0) location = {
				address: bingMapsUrl
			};
		}

		return (location || null);
	}


	/**
	 * Get the coordinates from Facebook's markers maps
	 * @param {string} imageUrl the url of the image
	 * @returns {Record<string, string> | null} coordinates of pin location in the image 
	 */
	getLocationFromImageUrl(imageUrl) {
		imageUrl = decodeURIComponent(String(url.parse(imageUrl, true).query["markers"]));
		imageUrl = imageUrl.split("|");

		let location = null;
		for (let el of imageUrl) {
			if (el.match(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)) {
				el = el.replace(/ +/g, "").split(",");
				if (el.length === 2) location = {
					latitude: el[0],
					longitude: el[1]
				};
			}
		}
		return (location || null);
	}
};

// module.exports.parseLocationData = (message) => {
// 	let addresses = [];
// 	if (message.attachments)
// 		message.attachments.forEach(attachment => {
// 			let address;
// 			let lon;
// 			let lat;
// 			if (attachment.type === "location") {
// 				if (attachment.latitude && attachment.longitude) {
// 					lon = attachment.longitude;
// 					lat = attachment.latitude;
// 				}
// 				if ((lon && lat) && (lon > -180 && lon < 180) && (lat > -90 && lat < 90)) {
// 					address = [attachment.longitude, attachment.latitude];
// 				} else if (attachment.image) {
// 					address = this.getLocationFromImage(attachment.image);
// 				} else {
// 					address = this.getLocation(attachment.url);
// 				}
// 			} else if (attachment.type === "share") {
// 				if (!attachment.target) return;
// 				if (attachment.target.coordinate && attachment.target.coordinate.longitude && attachment.target.coordinate.latitude) {
// 					lon = attachment.target.coordinate.longitude;
// 					lat = attachment.target.coordinate.latitude;
// 				}
// 				if ((lon && lat) && (lon > -180 && lon < 180) && (lat > -90 && lat < 90)) {
// 					address = [attachment.target.coordinate.longitude, attachment.target.coordinate.latitude];
// 				} else if (attachment.image) {
// 					address = this.getLocationFromImage(attachment.image);
// 				} else {
// 					address = this.getLocation(attachment.target.url, true);
// 				}
// 			}

// 			if (address && address.length > 0) {
// 				if (Array.isArray(address)) {
// 					addresses.push({ lon: address[0], lat: address[1] });
// 				} else if (typeof address === "string") {
// 					addresses.push({ address: address });
// 				}
// 			}
// 		});
// 	return addresses;
// };