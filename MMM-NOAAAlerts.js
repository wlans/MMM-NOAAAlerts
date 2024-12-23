/*
    MMM-NOAAAlerts Module
        A Magic Mirror module to display current local weather warning and alerts.
        Data is sourced from a NOAA CAP alerts served via the NOAA API  
        https://www.weather.gov/documentation/services-web-api 
 */
const NOAA_ALERTS_FETCH_MESSAGE = "FETCH_NOAA_ALERTS";

Module.register("MMM-NOAAAlerts", {
    config: null,
    APIData: {},
    rotateTimer: null,
    activeItem: 0,

    // Defaults to be added to the configuration
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
        return {
            config: this.config,
            APIData: this.APIData
        };
    },

    // Return list of stylesheet files
    getStyles: function () {
        return [
            "MMM-NOAAAlerts.css"
        ];
    },

    // Header configuration
    getHeader: function () {
        return this.data.header;
    },

    // Rotate through list of events
    scheduleRotateInterval: function () {
        if (this.rotateTimer) {
            clearInterval(this.rotateTimer);
        }

        const pause = (duration) => new Promise(resolve => setTimeout(resolve, duration));

        const rotateAlerts = async () => {
            while (true) {
                const container = document.querySelector("#NOAA_Alert");
                const currentAlert = document.querySelector(`#NOAA_Alert .alert:nth-child(${this.activeItem + 1})`);

                if (currentAlert && container && this.config.showAsMarquee) {
                    const scrollDistance = currentAlert.scrollWidth - container.clientWidth;
                    container.scrollLeft = 0;

                    // Scroll smoothly across the alert
                    let startTime = null;
                    const duration = scrollDistance * 10;

                    const step = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        const progress = Math.min((timestamp - startTime) / duration, 1);
                        container.scrollLeft = progress * scrollDistance;

                        if (progress < 1) {
                            requestAnimationFrame(step);
                        } else {
                            setTimeout(async () => {
                                container.scrollLeft = 0;
                                await pause(2000); // Pause for 2 seconds
                                this.advanceToNextAlert();
                            }, 2000);
                        }
                    };

                    requestAnimationFrame(step);
                } else {
                    await pause(2000); // Pause for 2 seconds
                    this.advanceToNextAlert();
                }
            }
        };

        rotateAlerts();
    },

    // Advance to the next alert
    advanceToNextAlert: function () {
        this.activeItem++;
        if (this.activeItem > this.APIData.alerts.length - 1) {
            this.activeItem = 0;
        }

        document.querySelectorAll("#NOAA_Alert .alert").forEach((alert, index) => {
            if (index === this.activeItem) {
                alert.classList.add("active");
                alert.classList.remove("inactive");
            } else {
                alert.classList.add("inactive");
                alert.classList.remove("active");
            }
        });

        this.updateDom(100);
    },

    // Handle notifications from other modules
    notificationReceived: function (notification, payload, sender) {
        if (notification === "ALL_MODULES_STARTED") {
            this.sendSocketNotification("CONFIG", this.config);
        }
    },

    // Handle socket notifications
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
