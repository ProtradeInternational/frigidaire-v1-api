/*
 Code by Jhonatan Corella
 https://github.com/jhonatanjavierdev
*/
const axios = require('axios');
const fs = require('fs');
const debug = require('debug')('frigidaire:lib');
const randomstring = require('randomstring');

class Frigidaire {
    constructor({ username, password, apiUrl = 'https://api.us.ecp.electrolux.com', ...options }) {
        this.username = username;
        this.password = password;
        this.apiUrl = apiUrl;
        this.sessionKey = null;
        this.deviceList = [];
        this.pollingInterval = options.pollingInterval || 10000;
        this.clientId = options.clientId || "Gsdwexj38r1sXSXIPVdxj4DGoU5ZoaI6aW6ZckBI";
        this.userAgent = options.userAgent || 'Frigidaire/81 CFNetwork';
    }

    async authenticate() {
        try {
            debug("Authenticating...");
            const { data } = await axios.post(`${this.apiUrl}/authentication/authenticate`, {
                username: this.username,
                password: this.password,
                brand: 'Frigidaire'
            }, { headers: this.getHeaders() });
            
            this.sessionKey = data?.data?.sessionKey;
            debug("Authenticated successfully.");
        } catch (error) {
            console.error("Authentication failed:", error.response?.data || error.message);
        }
    }

    getHeaders() {
        return {
            'x-ibm-client-id': this.clientId,
            'User-Agent': this.userAgent,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.sessionKey}`
        };
    }

    async getDevices() {
        try {
            if (!this.sessionKey) await this.authenticate();
            const { data } = await axios.get(`${this.apiUrl}/user-appliance-reg/users/${this.username}/appliances`, {
                headers: this.getHeaders()
            });
            this.deviceList = data?.data || [];
            debug("Devices fetched successfully.");
        } catch (error) {
            console.error("Failed to fetch devices:", error.response?.data || error.message);
        }
    }

    async getDeviceTelemetry(deviceId) {
        try {
            if (!this.sessionKey) await this.authenticate();
            const { data } = await axios.get(`${this.apiUrl}/elux-ms/appliances/latest?pnc=${deviceId}`, {
                headers: this.getHeaders()
            });
            return data?.data;
        } catch (error) {
            console.error("Failed to fetch telemetry:", error.response?.data || error.message);
        }
    }

    async setDeviceMode(deviceId, mode) {
        try {
            if (!this.sessionKey) await this.authenticate();
            await axios.post(`${this.apiUrl}/commander/remote/sendjson`, {
                timestamp: Date.now(),
                source: "RP1",
                components: [{ name: "mode", value: mode }],
                operationMode: "EXE"
            }, { headers: this.getHeaders() });
            debug("Device mode updated successfully.");
        } catch (error) {
            console.error("Failed to set device mode:", error.response?.data || error.message);
        }
    }
}

module.exports = Frigidaire;
