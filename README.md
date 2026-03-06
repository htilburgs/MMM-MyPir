# MMM-MyPir

## Configuration
```
{
    module: "MMM-MyPir",
    position: "fullscreen_above",
    config: {
        pirPin: 17,
        timeout: 120,
        x11OnCommand: "xrandr --output <output> --auto",
        x11OffCommand: "xrandr --output <output> --off",
        waylandOnCommand: "wlr-randr --output <output> --on",
        waylandOffCommand: "wlr-randr --output <output> --off"
    }
}
```
