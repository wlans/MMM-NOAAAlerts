/* MMM-NOAAAlerts Module
 * A Magic Mirror module to display current local weather warning and alerts.
 * Data is sourced from NOAA CAP alerts via the NOAA API
 * https://www.weather.gov/documentation/services-web-api
 */
const NOAA_ALERTS_FETCH_MESSAGE = "FETCH_NOAA_ALERTS";
const SmoothScroll = require('smooth-scroll');

Module.register("MMM-NOAAAlerts", {
    config: null,
    APIData: {},
    activeItem: 0,

    defaults: {
        debug: false,
        APIURL: "https://api.weather.gov/alerts/active?point=47.593,-122.333",
        updateInterval: 30 * 60 * 1000,
        rotateInterval: 15 * 1000,
        userAgent: "MagicMirrorMMTSWENG",
        showDescription: true,
        showInstruction: false,
        showNoAlertText: false,
        noAlertText: 'There are no active weather alerts in this area',
        removeGap: true,
        showAsMarquee: false
    },

    getTemplate: function () {
        return "MMM-NOAAAlerts.njk";
    },

    getTemplateData: function () {
        return { config: this.config, APIData: this.APIData };
    },

    getStyles: function () {
        return ["MMM-NOAAAlerts.css"];
    },

    getHeader: function () {
        return this.data.header;
    },

    // Rotate through alerts only after previous scroll completes
    scheduleRotateInterval: function () {
        if (this.APIData.alerts && this.APIData.alerts.length > 0) {
            this.rotateAlerts();
        }
    },

    rotateAlerts: function () {
        this.activeItem++;
        if (this.activeItem >= this.APIData.alerts.length) {
            this.activeItem = 0;
        }

        var myID = this.activeItem;
        console.log(`Rotating to alert ${myID}`);

        document.querySelectorAll('#NOAA_Alert .alert').forEach(function (al, idx) {
            if (idx === myID) {
                al.classList.add('active');
                al.classList.remove('inactive');

                // Smooth scroll to the active alert
                let scroll = new SmoothScroll();
                scroll.animateScroll(al, null, {
                    speed: 600,
                    easing: 'easeInOutCubic',
                    after: function () {
                        console.log(`Scrolling finished for alert ${myID}, ready for next.`);
                        // Wait 3 seconds before rotating to the next alert
                        setTimeout(() => {
                            Module.instances.forEach((instance) => {
                                if (instance.name === "MMM-NOAAAlerts") {
                                    instance.rotateAlerts();
                                }
                            });
                        }, 3000);
                    }
                });

            } else {
                al.classList.add('inactive');
                al.classList.remove('active');
            }
        });
    },

    notificationReceived: function (notification, payload, sender) {
        if (notification === "ALL_MODULES_STARTED") {
            this.sendSocketNotification("CONFIG", this.config);
        }
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === NOAA_ALERTS_FETCH_MESSAGE) {
            if (this.config.debug) {
                Log.log(this.name + " received a Fetch Message: " + payload);
            }
            this.APIData = payload;
            this.scheduleRotateInterval();
            this.updateDom(100);
        }
    }
});
