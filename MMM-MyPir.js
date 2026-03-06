Module.register("MMM-MyPir", {
    defaults: {
        pirPin: 4,           // GPIO pin voor PIR sensor
        timeout: 60          // tijd in seconden voordat scherm uitgaat
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.lastMotion = Date.now();
        this.screenOn = false;
        this.motionDetected = false;
        this.isWayland = false;

        this.detectDisplayServer();
        this.sendSocketNotification("CONFIG", this.config);

        // Timer check voor timeout
        setInterval(() => {
            if (this.screenOn && (Date.now() - this.lastMotion) / 1000 > this.config.timeout) {
                this.toggleScreen(false);
                this.motionDetected = false;
                this.updateDom();  // update interface
            }
        }, 1000);
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.style.padding = "10px";
        wrapper.style.textAlign = "center";
        wrapper.style.fontSize = "18px";

        const screenStatus = document.createElement("div");
        screenStatus.textContent = "Screen: " + (this.screenOn ? "ON" : "OFF");
        screenStatus.style.color = this.screenOn ? "green" : "red";
        wrapper.appendChild(screenStatus);

        const motionStatus = document.createElement("div");
        motionStatus.textContent = "Motion: " + (this.motionDetected ? "Detected" : "None");
        motionStatus.style.color = this.motionDetected ? "orange" : "gray";
        wrapper.appendChild(motionStatus);

        return wrapper;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "MOTION_DETECTED") {
            this.lastMotion = Date.now();
            this.motionDetected = true;
            if (!this.screenOn) {
                this.toggleScreen(true);
            }
            this.updateDom();  // update interface
        }
    },

    detectDisplayServer: function() {
        const x11Check = process.env.DISPLAY;
        const waylandCheck = process.env.WAYLAND_DISPLAY;
        if (waylandCheck) {
            this.isWayland = true;
            Log.info("MMM-MyPir detected Wayland display server");
        } else if (x11Check) {
            this.isWayland = false;
            Log.info("MMM-MyPir detected X11 display server");
        } else {
            Log.warn("MMM-MyPir could not detect display server, defaulting to X11");
            this.isWayland = false;
        }
    },

    toggleScreen: function(on) {
        this.screenOn = on;
        const exec = require("child_process").exec;

        if (this.isWayland) {
            // Wayland: dynamisch alle outputs detecteren
            const listOutputsCmd = "swaymsg -t get_outputs -r -f json";
            exec(listOutputsCmd, (err, stdout, stderr) => {
                if (err) {
                    Log.error("MMM-MyPir: failed to list Wayland outputs: " + err);
                    return;
                }
                try {
                    const outputs = JSON.parse(stdout);
                    outputs.forEach(output => {
                        const name = output.name;
                        const cmd = on
                            ? `swaymsg output "${name}" enable`
                            : `swaymsg output "${name}" disable`;
                        exec(cmd, (error) => {
                            if (error) Log.error("MMM-MyPir: failed to toggle output " + name + ": " + error);
                        });
                    });
                } catch (parseErr) {
                    Log.error("MMM-MyPir: failed to parse outputs JSON: " + parseErr);
                }
            });
        } else {
            // X11
            const cmd = on ? "xset dpms force on" : "xset dpms force off";
            exec(cmd, (error) => {
                if (error) Log.error("MMM-MyPir: failed to toggle X11 screen: " + error);
            });
        }

        this.updateDom(); // update interface na toggle
    }
});
