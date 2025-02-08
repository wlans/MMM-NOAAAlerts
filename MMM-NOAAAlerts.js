/*
    MMM-NOAAAlerts Module
        A Magic Mirror module to display current local weather warning and alerts.
        Data is sourced from a NOAA CAP alerts served via the NOAA API  
            https://www.weather.gov/documentation/services-web-api 
 */

// Import Anime.js for smooth scrolling animations.
import anime from "animejs/lib/anime.es.js";

const NOAA_ALERTS_FETCH_MESSAGE = "FETCH_NOAA_ALERTS";

Module.register("MMM-NOAAAlerts", {
    config: null,
    APIData: {},
    rotateTimer: null,
    activeItem: 0,

    // Anything here in defaults will be added to the config data
    // and replaced if the same property is provided in config.
    defaults: {
        debug: false,
        APIURL: "https://api.weather.gov/alerts/active?point=47.593,-122.333",
        updateInterval: 30 * 60 * 1000,
        rotateInterval: 15 * 1000,          // Time to show each alert in non-marquee mode.
        marqueeDelay: 2000,                // Delay after a full marquee scroll (default: 2 seconds).
        userAgent: "MagicMirrorMMTSWENG",
        showDescription: true,
        showInstruction: false,
        showNoAlertText: false,
        noAlertText: 'There are no active weather alerts in this area',
        removeGap: true,
        showAsMarquee: false               // Set to true to enable marquee scrolling.
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

    // Return list of stylesheet files if any.
    getStyles: function () {
        return [
            "MMM-NOAAAlerts.css"
        ];
    },

    // Only called if the module header was configured in config.js.
    getHeader: function () {
        return this.data.header;
    },

    // Rotate through list of events.
    scheduleRotateInterval: function () {
        // Clear timer if it already exists.
        if (this.rotateTimer) {
            clearInterval(this.rotateTimer);
        }
        const self = this;

        if (this.config.showAsMarquee) {
            // In marquee mode, we use a recursive function (via setTimeout) and Anime.js to animate scrolling.
            const animateNextAlert = function () {
                // Increment active alert.
                self.activeItem++;
                if (self.activeItem >= self.APIData.alerts.length) {
                    self.activeItem = 0;
                }

                // Update alert classes for visibility.
                const alerts = document.querySelectorAll('#NOAA_Alert .alert');
                alerts.forEach((al, idx) => {
                    if (idx === self.activeItem) {
                        al.classList.add('active');
                        al.classList.remove('inactive');
                    } else {
                        al.classList.add('inactive');
                        al.classList.remove('active');
                    }
                });

                const container = document.querySelector('#NOAA_Alert');
                const currentAlert = alerts[self.activeItem];

                if (container && currentAlert) {
                    // Calculate the total distance needed to scroll:
                    const scrollDistance = currentAlert.scrollWidth - container.clientWidth;
                    // Reset scroll position.
                    container.scrollLeft = 0;
                    // Calculate the duration based on a speed factor (e.g., 10ms per pixel).
                    const speedFactor = 10; // milliseconds per pixel
                    const duration = scrollDistance * speedFactor;

                    // Animate the scrolling using Anime.js.
                    anime({
                        targets: container,
                        scrollLeft: scrollDistance,
                        duration: duration,
                        easing: 'linear',
                        complete: function () {
                            // After the scroll completes, wait for the marqueeDelay,
                            // then reset the scroll and animate the next alert.
                            setTimeout(() => {
                                container.scrollLeft = 0;
                                animateNextAlert();
                            }, self.config.marqueeDelay);
                        }
                    });
                } else {
                    // If the container or alert isn't found, try again after rotateInterval.
                    setTimeout(animateNextAlert, self.config.rotateInterval);
                }
            };

            // Start the marquee rotation.
            animateNextAlert();
        } else {
            // Non-marquee mode: simply use setInterval to update the active alert.
            this.rotateTimer = setInterval(() => {
                self.activeItem++;
                if (self.activeItem >= self.APIData.alerts.length) {
                    self.activeItem = 0;
                }
                var myID = self.activeItem;

                document.querySelectorAll('#NOAA_Alert .alert').forEach(function (al, idx) {
                    if (idx == myID) {
                        al.classList.add('active');
                        al.classList.remove('inactive');
                    } else {
                        al.classList.add('inactive');
                        al.classList.remove('active');
                    }
                });
            }, self.config.rotateInterval);
        }
    },

    // Messages received from other modules and the system (NOT from your node helper).
    notificationReceived: function (notification, payload, sender) {
        // Once every module is loaded:
        if (notification === "ALL_MODULES_STARTED") {
            this.sendSocketNotification("CONFIG", this.config);
        }
    },

    // Messages received from your node helper (NOT other modules or the system).
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
