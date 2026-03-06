const NodeHelper = require("node_helper");
const Gpio = require("onoff").Gpio;

module.exports = NodeHelper.create({
    start: function() {
        this.config = {};
        this.pir = null;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.initPir();
        }
    },

    initPir: function() {
        if (this.pir) return; // al geïnitialiseerd
        this.pir = new Gpio(this.config.pirPin, "in", "rising");

        this.pir.watch((err, value) => {
            if (err) {
                console.error("PIR Error:", err);
                return;
            }
            this.sendSocketNotification("MOTION_DETECTED");
        });

        console.log("PIR sensor watching on pin " + this.config.pirPin);
    }
});
