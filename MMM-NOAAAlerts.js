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
        rotateInterval: 15000,          // 15 seconds delay between rotations
        userAgent: "MagicMirrorMMTSWENG",
        showDescription: true,
        showInstruction: false,
        showNoAlertText: false,
        noAlertText: "There are no active weather alerts in this area",
        removeGap: true,
        // When true, the module will output a marquee ticker (CSS handles the continuous scroll)
        showAsMarquee: false
    },

    // Module properties
    APIData: {},
    activeItem: 0,

    /**
     * getScripts:
     * In non-marquee mode we use the smooth-scroll library (which is loaded via CDN);
     * in marquee mode we rely solely on CSS.
     */
    getScripts: function () {
        if (!this.config.showAsMarquee) {
            return [
                "https://cdnjs.cloudflare.com/ajax/libs/smooth-scroll/16.1.3/smooth-scroll.polyfills.min.js"
            ];
        } else {
            return [];
        }
    },

    getStyles: function () {
        return ["MMM-NOAAAlerts.css"];
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

    getHeader: function () {
        return this.data.header;
    },

    /**
     * scheduleRotateInterval:
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
        this.rotateAlerts();
    },

    /**
     * rotateAlerts:
     * Increments the active alert index, updates the DOM classes and then:
     * - If showAsMarquee is false: uses smooth scrolling to transition to the new alert.
     * - If showAsMarquee is true: simply waits (letting the CSS marquee animation do the scrolling)
     *   before rotating to the next alert.
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
        // (Ensure your template renders a container with id="NOAA_Alert" and each alert with the class "alert".)
        let alertElements = document.querySelectorAll("#NOAA_Alert .alert");
        if (!alertElements || alertElements.length === 0) {
            if (this.config.debug) {
                console.log("MMM-NOAAAlerts: No alert elements found in the DOM. Check your template.");
            }
            return;
        }

        // Update each alert element's classes: only the current alert gets the "active" class.
        alertElements.forEach((al, idx) => {
            if (idx === myID) {
                al.classList.add("active");
                al.classList.remove("inactive");
                if (this.config.debug) {
                    console.log(`MMM-NOAAAlerts: Alert ${myID} set active.`);
                }
            } else {
                al.classList.add("inactive");
                al.classList.remove("active");
            }
        });

        // If not in marquee mode, perform smooth scrolling to the active alert.
        if (!this.config.showAsMarquee) {
            if (typeof SmoothScroll !== "undefined") {
                let scroll = new SmoothScroll();
                scroll.animateScroll(alertElements[myID], null, {
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
                // Fallback if SmoothScroll is not loaded
                if (this.config.debug) {
                    console.log("MMM-NOAAAlerts: SmoothScroll not available, using fallback timeout.");
                }
                setTimeout(() => {
                    this.rotateAlerts();
                }, this.config.rotateInterval);
            }
        } else {
            // In marquee mode, let the CSS animation run. Wait for the rotateInterval then rotate.
            if (this.config.debug) {
                console.log(`MMM-NOAAAlerts: Marquee mode active. Waiting ${this.config.rotateInterval}ms before next rotation.`);
            }
            setTimeout(() => {
                this.rotateAlerts();
            }, this.config.rotateInterval);
        }
    },

    /**
     * notificationReceived:
     * Once all modules have started, sends configuration to the node_helper.
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
     * socketNotificationReceived:
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
