![demo gif](https://github.com/Erhannis/AFrame-Quick-UI/blob/master/quick-ui-demo.gif)

Package for A-Frame, to easily/quickly make UIs, with the primary use case of on-controller menus in mind.  Some of the code comes from A-Painter, in which context and codebase I originally wrote this code.  There may still be cruft left over, sorry.  It also may be somewhat hacky or non-idiomatic in places; sorry again.  See AFrame-Quick-UI-Test for an example of how to use it.  See also examples/quick-ui.js for examples of how to use different kinds of UI.  See src/components/quick-ui.js (the core of the UI code) for the different layouts etc. available.  (There's a list at the bottom.)  Finally, if the previous are insufficient, here's a run down of how you might make a project that uses this package:

```
npm init
```

```
// Not sure which of these three are really necessary, if any
npm install webpack-dev-server
npm install webpack-cli
npm install webpack
```

```
npm install aframe-quick-ui
```

In package.json, have `scripts` be:
```
  "scripts": {
    "start": "webpack serve"
  },
```

Create ./src/index.js :
```
require("aframe-quick-ui");
```

Create ./index.html :
```
<html>
    <head>
        <script src="main.js"></script>
    </head>
    <body>
        <a-scene>
            <a-entity id="cameraRig">
                <a-entity id="acamera" camera wasd-controls look-controls orbit-controls></a-entity>
                <a-entity id="left-hand"
                    ui-controller="hand: left"
                    ui>
                    <script> 
                        QuickUI.loadUi(({UI}) =>
                            UI.UiButton({text:"A", oncontrollerdown:()=>{console.log("log")}})
                        );
                    </script>
                </a-entity>
                <a-entity id="right-hand"
                    ui-controller="hand: right"
                    ui>
                </a-entity>
            </a-entity>
        </a-scene>    
    </body>
</html>
```

```
npm start
```

Open localhost:8080 in a browser.

License: MIT

-Erhannis