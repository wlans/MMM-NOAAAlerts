# MMM-NOAAAlerts

Magic Mirror module to display current local weather warnings and alerts.

I built this module more by need than anything else — the Seattle area where I live had been hit by some relatively severe weather, causing real problems for the region. While I wasn't caught off-guard by this storm, I realized that the MM weather modules I had didn't emphasize local warnings, alerts, and weather watches. So I built a module expressly for solving that problem.

**MMM-NOAAAlerts**

Special Weather Statement:  
![Warning.png](https://lh3.googleusercontent.com/u/0/drive-viewer/AFDK6gPV45GV5zEDzP-HqwTzxDEk1-8k-Vj8dd2CE12qRxLcTvVG5HtqRVNoLyz2mkDnEcXmk95XCcFHICqwG191LyxBP4rlUg=w1870-h993) 

Flood Warning:  
![Flood.png](https://lh3.googleusercontent.com/u/0/drive-viewer/AFDK6gOgA5fX27DFSv1HLobd4aHPUc4YAK-8yXMxVHTAfFOfzyZRS7tUl754fUtIRXVixUCAL4JQ1s8tg2ri0bLPb60em8Y1Xw=w1870-h993)

---

## USING THE MODULE

### Standard installation

```bash
git clone https://github.com/mmtsweng/MMM-NOAAAlerts
cd MMM-NOAAAlerts
npm install 
```

### Basic configuration

Below is an example configuration. Note that the new `marqueeDelay` option (defaulting to 2000 ms) is used when `showAsMarquee` is enabled. When marquee mode is enabled, the module will scroll the entire text smoothly, pause for the specified delay, and then advance to the next alert.

```js
{
  module: "MMM-NOAAAlerts",
  position: "top_bar",
  config: {
      userAgent: "Magic Mirror (xxxxxxxxxxxx@gmail.com)", // Custom contact information
      APIURL: "https://api.weather.gov/alerts/active?point=47.593,-122.333", // See below for other options
      debug: false, // [Optional] Print extended debugging logs to the console
      rotateInterval: 15 * 1000, // [Optional] How often to rotate to the next alert in non-marquee mode
      updateInterval: 30 * 60 * 1000, // [Optional] How often to ping the API for updated data
      showDescription: true,  // [Optional] Show detailed description of the alert
      showInstruction: false, // [Optional] Show instructions provided by NOAA
      showNoAlertText: false, // [Optional] Display noAlertText when there are no active alerts
      noAlertText: 'There are no active weather alerts in this area', // [Optional] Text to display if no alerts are available
      showAsMarquee: true,  // [Optional] When true, text scrolls from left-to-right
      marqueeDelay: 2000    // [Optional] Delay (in ms) after a full marquee scroll before advancing (default: 2000 ms)
  }
},
```

---

## NOAA API Information

NOAA provides a [free API](https://www.weather.gov/documentation/services-web-api) to retrieve weather alerts, which this module uses. No registration is required.

There are multiple ways to set the forecast area. NOAA offers extensive documentation [here](https://www.weather.gov/media/documentation/docs/NWS_Geolocation.pdf) if you need additional help. Below are some of the basic methods:

| **Option** | **URL** |
| --- | --- |
| By State | `https://api.weather.gov/alerts/active?area={state}` |
| By [Zone](https://alerts.weather.gov/cap/wa.php?x=2) | `https://api.weather.gov/alerts/active?zone={zone}` |
| By Lat/Long | `https://api.weather.gov/points/{latitude},{longitude}` |
| By Grid | `https://api.weather.gov/gridpoints/{office}/{grid X},{grid Y}/forecast` |

**Important:** NOAA requires that a User-Agent header be provided. Please set your own custom agent in the configuration with unique contact information. The suggested header format is:  
`User-Agent: (myweatherapp.com, contact@myweatherapp.com)`

---

## Configuration Options

| **Option**       | **Default**                                                     | **Description**                                                                                                               |
| ---------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `updateInterval` | `30 * 60 * 1000` (30 minutes)                                     | How often to request updated data from the NOAA API.                                                                          |
| `rotateInterval` | `15 * 1000` (15 seconds)                                          | How often to switch to the next alert when not using marquee mode.                                                            |
| `APIURL`         | `https://api.weather.gov/alerts/active?point=47.593,-122.333`      | The NOAA API call URL. You can customize this to specify your area by state, zone, lat/long, or grid.                         |
| `userAgent`      | `"MagicMirrorMMTSWENG"`                                           | NOAA API requires a User-Agent header. Use this option to set your custom identification and contact information.              |
| `showDescription`| `true`                                                           | When true, displays the detailed description of each alert.                                                                  |
| `showInstruction`| `false`                                                          | When true, displays instructions provided by NOAA along with the alert.                                                       |
| `showNoAlertText`| `false`                                                          | When true, displays the `noAlertText` if there are no active weather alerts.                                                  |
| `noAlertText`    | `'There are no active weather alerts in this area'`              | Text to display when no alerts are available and `showNoAlertText` is enabled.                                                 |
| `showAsMarquee`  | `false`                                                          | When true, the alert's description and instructions will scroll (marquee effect) from left-to-right.                          |
| `marqueeDelay`   | `2000` (ms)                                                      | **New Option:** Delay after a full marquee scroll before advancing to the next alert. Only used if `showAsMarquee` is enabled.     |
| `debug`          | `false`                                                          | When true, outputs additional debugging information to the console.                                                         |

---

## Updated Marquee Scrolling Behavior

When `showAsMarquee` is enabled:
- The module calculates the full scroll distance required for the alert text.
- It smoothly scrolls the text from left-to-right.
- After the entire text is displayed (i.e., fully scrolled), the module pauses for the duration set by the `marqueeDelay` option (default: 2000 ms) before advancing to the next alert.
- In non-marquee mode, the module will wait for the `rotateInterval` (default: 15 seconds) before advancing.

This ensures that the full text is visible before moving on to the next alert, providing a better user experience.

---

Enjoy using **MMM-NOAAAlerts** for staying informed about local weather alerts! If you encounter any issues or have suggestions for improvements, please feel free to open an issue on the [GitHub repository](https://github.com/mmtsweng/MMM-NOAAAlerts).