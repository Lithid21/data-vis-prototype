import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";

import Legend from "@arcgis/core/widgets/Legend";
import Fullscreen from "@arcgis/core/widgets/Fullscreen";
import LayerList from "@arcgis/core/widgets/LayerList";
import Expand from "@arcgis/core/widgets/Expand";

export const createMapView = (container) =>{
    /////////
    // Map initialization
    /////////

    const map = new Map({
        basemap: "dark-gray-vector"
        });

    const view = new MapView({
        map: map,
        container: container,
        ui: {
            components: []  // Removes the default components: zoom and attribution
        },
        center: [-75.165,40.003],
        zoom: 9
    });

    /////////
    // View modifications
    /////////

    // Legend for layer data
    let legend = new Legend({
        view: view
    });
    const legendExpand = new Expand({
        view: view,
        content: legend
    });
    view.ui.add(legendExpand, "bottom-left");

    // Button to make the ArcGIS map fullscreen
    let fullscreen = new Fullscreen({
        view: view
    });
    view.ui.add(fullscreen, "top-right");

    // List of layers with ability to hide
    let layerList = new LayerList({
        view: view
    });
    view.ui.add(layerList, "top-left");

    // Disables the "zoom to" feature of the popups
    view.popup.viewModel.includeDefaultActions = false;

    ////////////
    // Disabling zooming
    ////////////
    // view.on("mouse-wheel", function(evt){
    //   // prevents zooming with the mouse-wheel event
    //   evt.stopPropagation();
    // });

    /////////////
    // Disabling Panning
    //////////////
    view.on("drag", function(evt){
        // prevents panning with the mouse drag event
        evt.stopPropagation();
    });

    view.on("key-down", function(evt){
        // prevents panning with the arrow keys
        var keyPressed = evt.key;
        if(keyPressed.slice(0,5) === "Arrow"){
        evt.stopPropagation();
        }
    });

    return view;
}