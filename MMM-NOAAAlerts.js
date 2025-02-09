/* MMM-NOAAAlerts Module
 * A Magic Mirror module to display current local weather warnings and alerts.
 * Data is sourced from NOAA CAP alerts via the NOAA API:
 * https://www.weather.gov/documentation/services-web-api
 */

const NOAA_ALERTS_FETCH_MESSAGE = "FETCH_NOAA_ALERTS";

Module.register("MMM-NOAAAlerts", {
    // Module defaults (can be overridden in config.js)
    defaults: {
        debug: false,
        APIURL: "https://api.weather.gov/alerts/active?point=47.593,-122.333",
        updateInterval: 30 * 60 * 1000, // 30 minutes
        // rotateInterval is the delay (in ms) after scrolling finishes
        rotateInterval: 15000,          // 15 seconds delay after scrolling before rotating to the next alert
        userAgent: "MagicMirrorMMTSWENG",
        showDescription: true,
        showInstruction: false,
        showNoAlertText: false,
        noAlertText: "There are no active weather alerts in this area",
        removeGap: true,
        showAsMarquee: false
    },

    // Module properties
    APIData: {},
    activeItem: 0,
    rotateTimer: null,

    /**
     * getScripts
     * Loads external scripts before the module is started.
     * Here we load the smooth-scroll library from a CDN.
     */
    getScripts: function () {
        return [
            "https://cdnjs.cloudflare.com/ajax/libs/smooth-scroll/16.1.3/smooth-scroll.polyfills.min.js"
        ];
    },

    /**
     * getStyles
     * Loads the module's CSS file.
     */
    getStyles: function () {
        return ["MMM-NOAAAlerts.css"];
    },

    /**
     * getTemplate
     * Returns the template filename (ensure MMM-NOAAAlerts.njk exists in your module folder).
     */
    getTemplate: function () {
        if (this.config.debug) {
            console.log("MMM-NOAAAlerts: getTemplate called.");
        }
        return "MMM-NOAAAlerts.njk";
    },

    /**
     * getTemplateData
     * Provides the data to the template.
     */
    getTemplateData: function () {
        if (this.config.debug) {
            console.log("MMM-NOAAAlerts: getTemplateData called. APIData:", this.APIData);
        }
        return {
            config: this.config,
            APIData: this.APIData
        };
    },

    /**
     * getHeader
     * Returns the header text if defined.
     */
    getHeader: function () {
        return this.data.header;
    },

    /**
     * scheduleRotateInterval
     * Starts the alert rotation process if alerts are available.
     */
    scheduleRotateInterval: function () {
        if (!this.APIData.alerts || this.APIData.alerts.length === 0) {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: No alerts available to rotate.");
            }
            return;
        }
        if (this.config.debug) {
            console.log("MMM-NOAAAlerts: Starting alert rotation.");
        }
        // Start rotation (immediately rotate to the first alert)
        this.rotateAlerts();
    },

    /**
     * rotateAlerts
     * Increments the active alert index, updates the DOM classes, and uses smooth scrolling.
     * Once smooth scrolling completes, waits for the configured delay before proceeding.
     */
    rotateAlerts: function () {
        if (!this.APIData.alerts || this.APIData.alerts.length === 0) {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: rotateAlerts called but no alerts available.");
            }
            return;
        }

        // Increment activeItem (wrap around if necessary)
        this.activeItem++;
        if (this.activeItem >= this.APIData.alerts.length) {
            this.activeItem = 0;
        }
        let myID = this.activeItem;
        if (this.config.debug) {
            console.log(`MMM-NOAAAlerts: Rotating to alert index ${myID}.`);
        }

        // Retrieve all alert elements from the DOM.
        // Ensure your template renders a container with id="NOAA_Alert" and each alert with the class "alert".
        let alertElements = document.querySelectorAll("#NOAA_Alert .alert");
        if (!alertElements || alertElements.length === 0) {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: No alert elements found in the DOM. Check your template.");
            }
            return;
        }

        // Update classes for active/inactive alerts and perform smooth scrolling on the active element.
        alertElements.forEach((al, idx) => {
            if (idx === myID) {
                al.classList.add("active");
                al.classList.remove("inactive");
                if (this.config.debug) {
                    console.log(`MMM-NOAAAlerts: Setting alert ${myID} active and starting smooth scroll.`);
                }
                // Use the global SmoothScroll (loaded via getScripts)
                let scroll = new SmoothScroll();
                scroll.animateScroll(al, null, {
                    speed: 600,
                    easing: "easeInOutCubic",
                    after: () => {
                        if (this.config.debug) {
                            console.log(`MMM-NOAAAlerts: Smooth scrolling finished for alert ${myID}. Waiting ${this.config.rotateInterval}ms before next rotation.`);
                        }
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

    /**
     * notificationReceived
     * Called when the module receives a notification from other modules or the system.
     * Once all modules are started, sends the configuration to the node_helper.
     */
    notificationReceived: function (notification, payload, sender) {
        if (notification === "ALL_MODULES_STARTED") {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: ALL_MODULES_STARTED received. Sending configuration to node_helper.");
            }
            this.sendSocketNotification("CONFIG", this.config);
        }
    },

    /**
     * socketNotificationReceived
     * Handles messages from the node_helper. When NOAA data is received, the module's APIData
     * is updated, alert rotation is scheduled, and the DOM is updated.
     */
    socketNotificationReceived: function (notification, payload) {
        if (notification === NOAA_ALERTS_FETCH_MESSAGE) {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: Received NOAA_ALERTS_FETCH_MESSAGE with payload:", payload);
            }
            this.APIData = payload;
            if (this.config.debug) {
                if (this.APIData.alerts && this.APIData.alerts.length > 0) {
                    console.log(`MMM-NOAAAlerts: Received ${this.APIData.alerts.length} alert(s).`);
                } else {
                    console.log("MMM-NOAAAlerts: Received no alerts.");
                }
            }
            this.scheduleRotateInterval();
            this.updateDom(100);
        }
    }
});
