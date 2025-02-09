/* MMM-NOAAAlerts Module
 * A Magic Mirror module to display current local weather warnings and alerts.
 * Data is sourced from NOAA CAP alerts via the NOAA API:
 * https://www.weather.gov/documentation/services-web-api
 */
const NOAA_ALERTS_FETCH_MESSAGE = "FETCH_NOAA_ALERTS";
const SmoothScroll = require('smooth-scroll');

Module.register("MMM-NOAAAlerts", {
    config: null,
    APIData: {},
    activeItem: 0,
    rotateTimer: null,

    defaults: {
        debug: false,
        APIURL: "https://api.weather.gov/alerts/active?point=47.593,-122.333",
        updateInterval: 30 * 60 * 1000, // 30 minutes
        rotateInterval: 15000, // 15 seconds between rotations
        userAgent: "MagicMirrorMMTSWENG",
        showDescription: true,
        showInstruction: false,
        showNoAlertText: false,
        noAlertText: 'There are no active weather alerts in this area',
        removeGap: true,
        showAsMarquee: false
    },

    getTemplate: function () {
        if (this.config.debug) {
            console.log("MMM-NOAAAlerts: getTemplate called.");
        }
        return "MMM-NOAAAlerts.njk";
    },

    getTemplateData: function () {
        if (this.config.debug) {
            console.log("MMM-NOAAAlerts: getTemplateData called. APIData:", this.APIData);
        }
        return {
            config: this.config,
            APIData: this.APIData
        };
    },

    getStyles: function () {
        return ["MMM-NOAAAlerts.css"];
    },

    getHeader: function () {
        return this.data.header;
    },

    // This method starts the rotation once alerts have been loaded.
    scheduleRotateInterval: function () {
        if (!this.APIData.alerts || this.APIData.alerts.length === 0) {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: No alerts available to rotate.");
            }
            return;
        }
        if (this.config.debug) {
            console.log("MMM-NOAAAlerts: Starting rotation of alerts.");
        }
        // Start the rotation
        this.rotateAlerts();
    },

    // Rotate through the alerts. Only moves to the next alert after smooth scrolling finishes.
    rotateAlerts: function () {
        if (!this.APIData.alerts || this.APIData.alerts.length === 0) {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: rotateAlerts called but no alerts available.");
            }
            return;
        }

        // Advance to the next alert index
        this.activeItem++;
        if (this.activeItem >= this.APIData.alerts.length) {
            this.activeItem = 0;
        }
        let myID = this.activeItem;
        if (this.config.debug) {
            console.log(`MMM-NOAAAlerts: Rotating to alert index ${myID}`);
        }

        // Get the alert elements from the DOM
        let alertElements = document.querySelectorAll("#NOAA_Alert .alert");
        if (!alertElements || alertElements.length === 0) {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: No alert elements found in the DOM. Check your template.");
            }
            return;
        }

        // Update classes for active/inactive alerts and perform smooth scrolling on the active one.
        alertElements.forEach((al, idx) => {
            if (idx === myID) {
                al.classList.add("active");
                al.classList.remove("inactive");
                if (this.config.debug) {
                    console.log(`MMM-NOAAAlerts: Setting alert ${myID} active and starting smooth scroll.`);
                }
                let scroll = new SmoothScroll();
                scroll.animateScroll(al, null, {
                    speed: 600,
                    easing: "easeInOutCubic",
                    after: () => {
                        if (this.config.debug) {
                            console.log(`MMM-NOAAAlerts: Smooth scrolling finished for alert ${myID}. Waiting ${this.config.rotateInterval}ms before next rotation.`);
                        }
                        // Wait rotateInterval ms before proceeding to the next alert.
                        setTimeout(() => {
                            this.rotateAlerts();
                        }, this.config.rotateInterval);
                    }
                });
            } else {
                al.classList.add("inactive");
                al.classList.remove("active");
            }
        });
    },

    // Receive notifications from other modules and the system.
    notificationReceived: function (notification, payload, sender) {
        if (notification === "ALL_MODULES_STARTED") {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: ALL_MODULES_STARTED received. Sending configuration to node_helper.");
            }
            this.sendSocketNotification("CONFIG", this.config);
        }
    },

    // Handle socket notifications from the node_helper.
    socketNotificationReceived: function (notification, payload) {
        if (notification === NOAA_ALERTS_FETCH_MESSAGE) {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: Received NOAA_ALERTS_FETCH_MESSAGE with payload:", payload);
            }
            this.APIData = payload;

            // Check if APIData contains alerts. Adjust this if your data structure is different.
            if (!this.APIData.alerts || this.APIData.alerts.length === 0) {
                if (this.config.debug) {
                    console.log("MMM-NOAAAlerts: APIData does not contain any alerts.");
                }
            } else {
                if (this.config.debug) {
                    console.log(`MMM-NOAAAlerts: APIData contains ${this.APIData.alerts.length} alert(s).`);
                }
            }
            this.scheduleRotateInterval();
            this.updateDom(100);
        }
    }
});
