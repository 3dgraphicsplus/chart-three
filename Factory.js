//static factory - FIXME as class later

import { Text } from './troika-three-text.esm.js'
import { Line2 } from './three/examples/jsm/lines/Line2.js';
import { LineMaterial } from './three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './three/examples/jsm/lines/LineGeometry.js';

let mouseTimeLineGeo, mousePriceLineGeo;


// GUI Constants
// Colors
let DATA_LINE_CORLOR = 0xf27303
let GRADIENT_DATALINE_COLOR = 0x9f561c
let BACKGROUND_COLOR = 0x191f2d
let TIME_TEXT_COLOR = 0x524f56
let HORIZONTAL_PRICE_TEXT_COLOR = 0x9ca0aa
let GRID_LINE_CORLOR = 0x9ca0aa
let GREEN_COLOR = 0x238933;
let HIGHER_BUTTON_COLOR = 0x2cac40;
let HIGHER_BUTTON_COLOR_ENABLE = 0x238933;
let LOWER_BUTTON_COLOR = 0xdb4931;
let LOWER_BUTTON_COLOR_ENABLE = 0xad4235;

// Line Width
const DATA_LINE_WIDTH = 2.0
const GRID_LINE_WIDTH = 0.5
const PURCHASE_LINE_WIDTH = 0.8
const MOUSE_MOVE_LINE_WIDTH = 1

var GRID_TOPLINE, GRID_RIGHTMOST_LINE;


// const DEFAULT_ZOOM_LEVEL = [5, 10, 15, 30, 60, 120, 300, 900, 1800, 3600, 7200, 3600 * 4, 3600 * 6, 3600 * 12]
const DEFAULT_ZOOM_LEVEL = [5, 10, 15, 30]
// Index of the DEFAULT_ZOOM_LEVEL array
let currentZoomLevel = 0;

let timestampShape, timestampText;
let mousePriceShape, mouseAlertShape;
let mouseTimeLine, mousePriceText, mousePriceLine;

let lastVerticalGrid;

let enableHigherActive = false;
let enableLowerActive = false;

const DEFAULT_GRID_STEP = 200
const MAX_GRID_STEP = 300
const MIN_GRID_STEP = 150
const SCROLL_STEP = 1;

const MIN_VIEW_Y = 300;
const MAX_VIEW_Y = 800;
const MIN_DIFF_Y = 200;
let XStepCount = 50;
let axisXConfig = { stepX: 30, initialValueX: 0 }
let axisYConfig = {
    stepY: 30, initialValueY: 1400,
    clone: function () { return { stepY: this.stepY, initialValueY: this.initialValueY }; }
}

function drawInitialData(points, count, activeGroup, activePoligonObjs) {

    XStepCount = Math.floor(GRID_RIGHTMOST_LINE / axisXConfig.stepX);
    // Get the data
    points.push([parseFloat(axisXConfig.initialValueX), parseFloat(axisYConfig.initialValueY), 0]);

    let originY = dataClient.getNext();
    originY.price = parseFloat(originY.price);
    const point = new THREE.Vector3(axisXConfig.initialValueX, axisYConfig.initialValueY);
    for (let i = 0; i < count; i++) {
        let currentIndex = dataClient.currentIndex;
        point.x += (axisXConfig.stepX);
        point.y = (parseFloat(dataClient.getNext().price) - originY.price) * axisYConfig.stepY * 1000 + axisYConfig.initialValueY;

        if (Number.isNaN((point.x)) == true || Number.isNaN((point.y)) == true) {
            continue;
        }

        //FIXME - other feature
        if (point.x > GRID_RIGHTMOST_LINE / 2) {
            // activeGroupMovement -= axisXConfig.stepX;
            // activeGroup.position.set(activeGroup.position.x - axisXConfig.stepX, activeGroup.position.y, activeGroup.position.z);
            //activeGroupMovement -= (point.x - (GRID_RIGHTMOST_LINE / 2 - activeGroup.position.x));
            activeGroup.position.x = activeGroup.position.x - (point.x - (GRID_RIGHTMOST_LINE / 2 - activeGroup.position.x));
        }

        //add active point to list
        points.push([parseFloat(point.x), parseFloat(point.y), 0]);

        // Draw the poligon for last points
        addPolygon(activeGroup, activePoligonObjs, points, points.length - 2);
    }
}

function drawHigherButton(scene, gridRightBound) {
    var initY = 600;
    let coordinatesList = [
        new THREE.Vector3(gridRightBound - 150 - 120, initY, 0),
        new THREE.Vector3(gridRightBound - 150 - 10, initY, 0),
        new THREE.Vector3(gridRightBound - 150 - 10, initY - 110, 0),
        new THREE.Vector3(gridRightBound - 150 - 120, initY - 110, 0)
    ];

    // shape
    let geomShape = new THREE.BoxGeometry(110, 110, 1);
    let matShape = new THREE.MeshBasicMaterial({ color: HIGHER_BUTTON_COLOR, transparent: true, opacity: 1.0 });
    let higherButton = new THREE.Mesh(geomShape, matShape);
    higherButton.renderOrder = 10;
    higherButton.position.x = gridRightBound - 150 - 65;
    higherButton.position.y = initY - 50;

    let upGeo = new THREE.BoxGeometry(110, 110, 1);
    let upMesh = new THREE.Mesh(upGeo, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("up.png", map => {
                upMesh.scale.set(map.image.width * 0.0005, map.image.height * 0.0005);
            }),
            transparent: true,
            opacity: 1.0,
            color: 0xffffff,
        }));
    upMesh.position.x = gridRightBound - 150 - 65;
    upMesh.position.y = initY - 50;
    upMesh.renderOrder = 100;

    let upGeo2 = new THREE.BoxGeometry(110, 110, 1);
    let upMesh2 = new THREE.Mesh(upGeo2, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("upArrow.png", map => {
                upMesh2.scale.set(map.image.width * 0.004, map.image.height * 0.004);
            }),
            transparent: true,
            opacity: 1.0,
            color: HIGHER_BUTTON_COLOR,
        }));
    upMesh2.position.x = gridRightBound - 150 - 65;
    upMesh2.position.y = initY + 50;
    upMesh2.renderOrder = 200;

    let downGeo2 = new THREE.BoxGeometry(110, 110, 1);
    let downMesh2 = new THREE.Mesh(downGeo2, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("downArrow.png", map => {
                downMesh2.scale.set(map.image.width * 0.004, map.image.height * 0.004);
            }),
            transparent: true,
            opacity: 1.0,
            color: LOWER_BUTTON_COLOR,
        }));
    downMesh2.position.x = gridRightBound - 150 - 65;
    downMesh2.position.y = initY - 50;
    downMesh2.renderOrder = 200;

    let higherText = new Text()
    higherText.renderOrder = 200;
    // activeGroup.add(priceText);

    // Set properties to configure:
    higherText.text = "HIGHER"
    //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    higherText.fontSize = 18
    higherText.position.z = 0
    higherText.position.x = gridRightBound - 150 - 100;
    higherText.position.y = initY - 70;
    higherText.color = "white"
    // Update the rendering:
    higherText.sync()

    scene.add(higherButton)
    scene.add(higherText);
    scene.add(upMesh);


    return { higherButton, upMesh };
}

function drawLowerButton(scene, gridRightBound) {
    var initY = 482;
    // shape
    // let geomShape = new THREE.ShapeBufferGeometry(new THREE.Shape(coordinatesList));
    let geomShape = new THREE.BoxGeometry(110, 110, 1);
    let matShape = new THREE.MeshBasicMaterial({ color: LOWER_BUTTON_COLOR, transparent: true, opacity: 1.0 });
    let lowerButton = new THREE.Mesh(geomShape, matShape);
    lowerButton.renderOrder = 10;
    lowerButton.position.x = gridRightBound - 150 - 65;
    lowerButton.position.y = initY - 50;

    let downGeo = new THREE.BoxGeometry(110, 110, 1);
    let downMesh = new THREE.Mesh(downGeo, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("down.png", map => {
                downMesh.scale.set(map.image.width * 0.0005, map.image.height * 0.0005);
            }),
            transparent: true,
            opacity: 1.0,
            color: 0xffffff,
        }));
    downMesh.position.x = gridRightBound - 150 - 65;
    downMesh.position.y = initY - 50;
    downMesh.renderOrder = 200;

    let lowerText = new Text()
    lowerText.renderOrder = 200;
    // activeGroup.add(priceText);

    // Set properties to configure:
    lowerText.text = "LOWER"
    //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    lowerText.fontSize = 18
    lowerText.position.z = 0
    lowerText.position.x = gridRightBound - 150 - 100;
    lowerText.position.y = initY - 70;
    lowerText.color = "white"
    // Update the rendering:
    lowerText.sync()

    scene.add(lowerButton)
    scene.add(downMesh)
    scene.add(lowerText)
    return { lowerButton, downMesh };
}

// Update the position of the line at the mouse cursor    
let mousePriceLineMat = null;
let mouseTimeLineMat = null;
let matShape = new THREE.MeshBasicMaterial({ color: 0x525a71, transparent: false });
function updateMouseMoveLine(scene, posX, posY, initialValueX) {
    scene.remove(mouseTimeLine);
    scene.remove(mousePriceLine);
    mousePriceLineGeo = new LineGeometry();
    mousePriceLineGeo.setPositions([initialValueX - 250, posY, 0, GRID_RIGHTMOST_LINE - 225 - 120, posY, 0]);

    if (!mousePriceLineMat || mousePriceLineMat.resolution.x != container.clientWidth || mousePriceLineMat.resolution.y != container.clientHeight) {
        mousePriceLineMat = new LineMaterial({
            color: TIME_TEXT_COLOR,
            linewidth: MOUSE_MOVE_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
            vertexColors: false,
            resolution: new THREE.Vector2(container.clientWidth, container.clientHeight),
            //resolution:  // to be set by renderer, eventually
            dashed: false,
            alphaToCoverage: false,

        });
    }

    mousePriceLine = new Line2(mousePriceLineGeo, mousePriceLineMat);
    mousePriceLine.computeLineDistances();
    mousePriceLine.scale.set(1, 1, 1);
    mousePriceLine.renderOrder = 10;
    scene.add(mousePriceLine)
    // scene.add(mouseTimeLine)

    mouseTimeLineGeo = new LineGeometry();
    mouseTimeLineGeo.setPositions([posX, 140, 0, posX, GRID_TOPLINE, 0]);
    if (!mouseTimeLineMat || mouseTimeLineMat.resolution.x != container.clientWidth || mouseTimeLineMat.resolution.y != container.clientHeight) {

        mouseTimeLineMat = new LineMaterial({
            color: TIME_TEXT_COLOR,
            linewidth: MOUSE_MOVE_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
            vertexColors: false,
            resolution: new THREE.Vector2(container.clientWidth, container.clientHeight),
            //resolution:  // to be set by renderer, eventually
            dashed: false,
            alphaToCoverage: false,

        });
    }

    mouseTimeLine = new Line2(mouseTimeLineGeo, mouseTimeLineMat);
    mouseTimeLine.computeLineDistances();
    mouseTimeLine.scale.set(1, 1, 1);
    mouseTimeLine.renderOrder = 10;
    scene.add(mouseTimeLine)
    // scene.add(mousePrice)

    if (timestampShape == undefined) {
        let coordinatesList = [
            new THREE.Vector3(posX - 60, 140, 0),
            new THREE.Vector3(posX + 60, 140, 0),
            new THREE.Vector3(posX + 60, 120, 0),
            new THREE.Vector3(posX - 60, 120, 0)
        ];

        // shape
        let geomShape = new THREE.ShapeBufferGeometry(new THREE.Shape(coordinatesList));

        timestampShape = new THREE.Mesh(geomShape, matShape);
        timestampShape.renderOrder = 10;
        scene.add(timestampShape);
        // console.log(priceShape.geometry.attributes.position.array);
    } else {
        let p = timestampShape.geometry.attributes.position.array;
        let i = 0;
        p[i++] = posX - 70;
        p[i++] = 142;
        p[i++] = 0;
        p[i++] = posX + 70;
        p[i++] = 142;
        p[i++] = 0;
        p[i++] = posX + 70;
        p[i++] = 122;
        p[i++] = 0;
        p[i++] = posX - 70;
        p[i++] = 122;
        p[i++] = 0;
        timestampShape.geometry.attributes.position.needsUpdate = true;
        // console.log(priceShape.geometry.attributes.position.array)
    }
    let currentdate = new Date();
    let datetime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 19).replace('T', ' ');
    if (timestampText != undefined) {
        timestampText.text = datetime
        timestampText.position.z = 0
        timestampText.position.x = posX - 55
        timestampText.position.y = 140
        timestampText.color = 0xffffff
        // Update the rendering:
        timestampText.sync()
    } else {
        timestampText = new Text()
        timestampText.renderOrder = 10;
        scene.add(timestampText);
        // scene.add(priceText)

        // Set properties to configure:
        timestampText.text = datetime
        //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        timestampText.fontSize = 12
        timestampText.position.z = 0
        timestampText.position.x = posX - 55
        timestampText.position.y = 140
        timestampText.color = 0xffffff
        // Update the rendering:
        timestampText.sync()
    }

    if (mouseAlertShape == undefined) {
        let geomShape = new THREE.PlaneGeometry(16, 16);
        let matShape = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load("custom_bell.png", map => {
                mouseAlertShape.scale.set(map.image.width * 0.01, map.image.height * 0.01);
            }),
            color: 0xffffff, transparent: true, opacity: 1.0
        });
        mouseAlertShape = new THREE.Mesh(geomShape, matShape);
        mouseAlertShape.position.set(GRID_RIGHTMOST_LINE - 223 - 120, posY, 0)
        mouseAlertShape.renderOrder = 100;
        scene.add(mouseAlertShape);
        // console.log(priceShape.geometry.attributes.position.array);
    } else {
        mouseAlertShape.renderOrder = 100;
        mouseAlertShape.position.set(GRID_RIGHTMOST_LINE - 223 - 120, posY, 0)
        mouseAlertShape.geometry.attributes.position.needsUpdate = true;
        // console.log(priceShape.geometry.attributes.position.array)
    }

    if (mousePriceShape == undefined) {
        let coordinatesList = [
            new THREE.Vector3(GRID_RIGHTMOST_LINE - 213 - 120, posY + 8, 0),
            new THREE.Vector3(GRID_RIGHTMOST_LINE - 155 - 120, posY + 8, 0),
            new THREE.Vector3(GRID_RIGHTMOST_LINE - 155 - 120, posY - 8, 0),
            new THREE.Vector3(GRID_RIGHTMOST_LINE - 213 - 120, posY - 8, 0)
        ];

        // shape
        let geomShape = new THREE.ShapeBufferGeometry(new THREE.Shape(coordinatesList));
        let matShape = new THREE.MeshBasicMaterial({ color: 0x525a71, transparent: true, opacity: 0.9 });
        mousePriceShape = new THREE.Mesh(geomShape, matShape);
        mousePriceShape.renderOrder = 100;
        scene.add(mousePriceShape);
        // console.log(priceShape.geometry.attributes.position.array);
    } else {
        let p = mousePriceShape.geometry.attributes.position.array;
        let i = 0;
        p[i++] = GRID_RIGHTMOST_LINE - 213 - 120;
        p[i++] = posY + 8;
        p[i++] = 0;
        p[i++] = GRID_RIGHTMOST_LINE - 155 - 120;
        p[i++] = posY + 8;
        p[i++] = 0;
        p[i++] = GRID_RIGHTMOST_LINE - 155 - 120;
        p[i++] = posY - 8;
        p[i++] = 0;
        p[i++] = GRID_RIGHTMOST_LINE - 213 - 120;
        p[i++] = posY - 8;
        p[i++] = 0;
        mousePriceShape.geometry.attributes.position.needsUpdate = true;
        // console.log(priceShape.geometry.attributes.position.array)
    }

    if (mousePriceText != undefined) {
        mousePriceText.text = '1.13208'
        mousePriceText.position.z = 0
        mousePriceText.position.x = GRID_RIGHTMOST_LINE - 205 - 120
        mousePriceText.position.y = posY + 6
        mousePriceText.color = 'white'
        mousePriceText.renderOrder = 100;
        // Update the rendering:
        mousePriceText.sync()
    } else {
        mousePriceText = new Text()
        mousePriceText.renderOrder = 100;
        scene.add(mousePriceText);
        // scene.add(priceText)

        // Set properties to configure:
        mousePriceText.text = '1.13208'
        //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        mousePriceText.fontSize = 12
        mousePriceText.position.z = 0
        mousePriceText.position.x = GRID_RIGHTMOST_LINE - 200 - 120
        mousePriceText.position.y = posY + 6
        mousePriceText.color = 'white'
        // Update the rendering:
        mousePriceText.sync()
    }
}

function drawBackground(startingLine, loopCount, gridStep) {
    lastVerticalGrid = startingLine + gridStep * (loopCount - 1);
    //background
    let bkgGeo = new THREE.PlaneGeometry(lastVerticalGrid, container.clientHeight);
    // const material = new THREE.MeshBasicMaterial( {color: 0x2e3851, side: THREE.DoubleSide} );
    let bkg = new THREE.Mesh(bkgGeo, new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(BACKGROUND_COLOR) }
        },
        vertexShader: document.getElementById('vertexshaderbg').textContent,
        fragmentShader: document.getElementById('fragmentshaderbg').textContent,
        transparent: true,
        opacity: 0.4
    }));
    bkg.scale.set(1.5, 1.5)
    bkg.position.set(startingLine, 500)
    bkg.renderOrder = 1;
    return bkg;
}

let horizontalGridMaterial = null;
function drawHorizontalGrid(horizontalGrids, startingLine, gridTopBound, gridRightBound) {
    for (let j = 0; j < 10; j++) {
        const horizontalGridGeo = new LineGeometry();
        if (j == 1) {
            horizontalGridGeo.setPositions([startingLine - 200, gridTopBound - 200 * j, 0, gridRightBound - 200, gridTopBound - 200 * j, 0]);
        } else {
            horizontalGridGeo.setPositions([startingLine - 200, gridTopBound - 200 * j, 0, gridRightBound - 200, gridTopBound - 200 * j, 0]);
        }
        if (!horizontalGridMaterial || horizontalGridMaterial.resolution.x != container.clientWidth || horizontalGridMaterial.resolution.y != container.clientHeight) {

            horizontalGridMaterial = new LineMaterial({
                color: GRID_LINE_CORLOR,
                linewidth: GRID_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
                vertexColors: false,
                resolution: new THREE.Vector2(container.clientWidth, container.clientHeight),
                //resolution:  // to be set by renderer, eventually
                dashed: false,
                alphaToCoverage: true,
                transparent: true,
                opacity: 1.0,
            });
        }

        let horizontalGridLine = new Line2(horizontalGridGeo, horizontalGridMaterial);
        horizontalGridLine.computeLineDistances();
        horizontalGridLine.scale.set(1, 1, 1);


        let priceText = new Text()
        // Set properties to configure:
        priceText.text = '3501' + j;
        //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        priceText.fontSize = 12
        priceText.position.z = 0
        priceText.position.x = gridRightBound - 195
        priceText.position.y = gridTopBound - 200 * j + 8
        priceText.color = HORIZONTAL_PRICE_TEXT_COLOR

        priceText.sync()
        horizontalGrids.push({ line: horizontalGridLine, text: priceText })
    }
}
let verticalGridMaterial = null;
function drawVerticalGrid(drawingGroup, verticalGrids, dataPoints, loopCount, gridTopBound, startingIndex) {
    // console.log(startingIndex)
    // console.log(loopCount)
    for (let i = 0; i < loopCount; i++) {
        let index = startingIndex + i * DEFAULT_ZOOM_LEVEL[currentZoomLevel];
        // console.log(index, dataPoints.length)
        if (verticalGrids.hasOwnProperty(index)) {
            continue;
        }
        let currentPos = 0;
        const verticalGridGeo = new LineGeometry();
        if (dataPoints[index] == undefined) {
            if (verticalGrids[(i - 1) * DEFAULT_ZOOM_LEVEL[currentZoomLevel]] == undefined) {
                continue;
            }
            let previousPos = verticalGrids[(i - 1) * DEFAULT_ZOOM_LEVEL[currentZoomLevel]].text.position.x + 30
            currentPos = previousPos + axisXConfig.stepX * DEFAULT_ZOOM_LEVEL[currentZoomLevel];
        } else {
            currentPos = dataPoints[index][0];
        }
        verticalGridGeo.setPositions([currentPos, 150, 0, currentPos, gridTopBound, 0]);
        if (!verticalGridMaterial || verticalGridMaterial.resolution.x != container.clientWidth || verticalGridMaterial.resolution.y != container.clientHeight) {

            verticalGridMaterial = new LineMaterial({
                color: TIME_TEXT_COLOR,
                linewidth: GRID_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
                vertexColors: false,
                resolution: new THREE.Vector2(container.clientWidth, container.clientHeight),
                //resolution:  // to be set by renderer, eventually
                dashed: false,
                alphaToCoverage: true,
            });
        }

        let verticalGridLine = new Line2(verticalGridGeo, verticalGridMaterial);
        verticalGridLine.computeLineDistances();
        verticalGridLine.scale.set(1, 1, 1);
        verticalGridLine.visible = true;
        // verticalGridLine.renderOrder = 1000;

        let myText = new Text()
        // Set properties to configure:
        if (dataClient.input_value[index] != undefined) {
            myText.text = dataClient.input_value[index].time
        }
        else {
            // console.log("length ", input_value.length, startingIndex + i * DEFAULT_ZOOM_LEVEL[currentZoomLevel])
            myText.text = ""
        }

        //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        myText.fontSize = 12
        myText.position.z = 0
        myText.position.x = currentPos - 30
        myText.position.y = 140
        myText.color = TIME_TEXT_COLOR
        myText.sync()
        verticalGrids[index] = { line: verticalGridLine, text: myText };
        drawingGroup.add(verticalGridLine);
        drawingGroup.add(myText);
    }
}

// Call when zoom in/out, remove grids that not belong to the current scale.
function removeRedundantVerticalGrid(drawingGroup, verticalGrids) {
    for (const [key, value] of Object.entries(verticalGrids)) {
        // For example: DEFAULT_ZOOM_LEVEL[currentZoomLevel] = 10 -> draw grids every 10 points so remove grid at point 15th,...
        if (key % DEFAULT_ZOOM_LEVEL[currentZoomLevel] != 0) {
            drawingGroup.remove(value.line)
            drawingGroup.remove(value.text)
            delete verticalGrids[key]
        }
    }
}

// Update geometry of the vertical grid using updated points data
function updateVerticalGrid(verticalGrids, data, lastZoomLevel, gridTopBound) {
    for (const [key, value] of Object.entries(verticalGrids)) {
        let i = key / DEFAULT_ZOOM_LEVEL[lastZoomLevel]

        // Recalculate the position using new points data
        let currentPos = 0;
        if (data[key] == undefined) {
            if (verticalGrids[(i - 1) * DEFAULT_ZOOM_LEVEL[lastZoomLevel]] == undefined) {
                continue;
            }
            let previousPos = verticalGrids[(i - 1) * DEFAULT_ZOOM_LEVEL[lastZoomLevel]].text.position.x + 30
            currentPos = previousPos + axisXConfig.stepX * DEFAULT_ZOOM_LEVEL[lastZoomLevel];
        } else {
            currentPos = data[key][0];
        }
        const verticalGridGeo = new LineGeometry();
        verticalGridGeo.setPositions([currentPos, 150, 0, currentPos, gridTopBound, 0]);
        value.line.geometry.dispose();
        value.line.geometry = verticalGridGeo;
        value.text.position.x = currentPos - 30
        // value.line.geometry = currencyLineGeo;
        value.line.geometry.attributes.position.needsUpdate = true;
        value.text.sync()
    }
}

// Draw the line at the green point, circlePos is the position of the green point
// movedDistance is the movement of the activeGroup. This function will only be called once.
function drawActiveLines(activePriceStatusObjs, circlePos, gridRightBound, movedDistance) {
    const horizontalDashed = new LineGeometry();

    horizontalDashed.setPositions([0, circlePos[0][1], 0, circlePos[0][0], circlePos[0][1], 0]);
    let horizontalMat = new LineMaterial({
        color: "white",
        linewidth: MOUSE_MOVE_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
        vertexColors: false,
        resolution: new THREE.Vector2(container.clientWidth, container.clientHeight),
        //resolution:  // to be set by renderer, eventually
        dashed: true,
        dashScale: 0.2,
        alphaToCoverage: false,
    });

    let verdashedLine = new Line2(horizontalDashed, horizontalMat);
    verdashedLine.computeLineDistances();
    verdashedLine.scale.set(1, 1, 1);
    verdashedLine.renderOrder = 10;

    const verticalline = new LineGeometry();
    verticalline.setPositions([circlePos[0][0], circlePos[0][1], 0, gridRightBound - 250 - movedDistance, circlePos[0][1], 0]);
    let verlineMat = new LineMaterial({
        color: "white",
        linewidth: MOUSE_MOVE_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
        vertexColors: false,
        resolution: new THREE.Vector2(container.clientWidth, container.clientHeight),
        //resolution:  // to be set by renderer, eventually
        dashed: false,
        alphaToCoverage: false,
    });
    let verLine = new Line2(verticalline, verlineMat);
    verLine.computeLineDistances();
    verLine.scale.set(1, 1, 1);
    verLine.renderOrder = 10;

    let coordinatesList = [
        new THREE.Vector3(gridRightBound - 250, circlePos[0][1], 0),
        new THREE.Vector3(gridRightBound - 250 + 15, circlePos[0][1] + 15, 0),
        new THREE.Vector3(gridRightBound - 250 + 90, circlePos[0][1] + 15, 0),
        new THREE.Vector3(gridRightBound - 250 + 90, circlePos[0][1] - 15, 0),
        new THREE.Vector3(gridRightBound - 250 + 15, circlePos[0][1] - 15, 0)
    ];

    // shape
    let geomShape = new THREE.ShapeBufferGeometry(new THREE.Shape(coordinatesList));
    let matShape = new THREE.MeshBasicMaterial({ color: "white", transparent: true, opacity: 0.7 });
    let priceShape = new THREE.Mesh(geomShape, matShape);
    priceShape.renderOrder = 30;

    let priceText = new Text()
    priceText.renderOrder = 50;
    // activeGroup.add(priceText);

    // Set properties to configure:
    priceText.text = '' + parseInt(dataClient.getOrigin().price*100000)
    //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    priceText.fontSize = 12
    priceText.position.z = 0
    priceText.position.x = gridRightBound - 250 + 22
    priceText.position.y = circlePos[0][1] + 7
    priceText.color = 0x000000
    if (enableHigherActive == true || enableLowerActive == true) {
        priceText.color = "white"
    } else {
        priceText.color = 0x000000;
    }
    // Update the rendering:
    priceText.sync()

    let i = Math.floor(Math.random() * 100);
    let priceActiveText = new Text()
    priceActiveText.renderOrder = 50;

    // Set properties to configure:
    priceActiveText.text = '' + i
    //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    priceActiveText.fontSize = 18
    priceActiveText.position.z = 0
    priceActiveText.position.x = gridRightBound - 250 + 60
    priceActiveText.position.y = circlePos[0][1] + 12
    priceActiveText.color = i % 2 == 0 ? GREEN_COLOR : 'red'
    if (enableHigherActive == true || enableLowerActive == true) {
        priceActiveText.color = "white"
    } else {
        priceActiveText.color = i % 2 == 0 ? GREEN_COLOR : 'red'
    }
    // Update the rendering:
    priceActiveText.sync()

    let geometry = new THREE.CircleGeometry(3, 50);
    let material = new THREE.MeshBasicMaterial({ color: GREEN_COLOR, transparent: true, opacity: 1.0 });
    let greenDot = new THREE.Mesh(geometry, material);
    greenDot.renderOrder = 100;
    greenDot.onBeforeRender = function (renderer) { renderer.clearDepth(); };
    // SUPER SIMPLE GLOW EFFECT
    // use sprite because it appears the same from all angles
    let spriteMaterial = new THREE.SpriteMaterial(
        {
            map: new THREE.TextureLoader().load("glow2.png"),
            color: 0x238933, transparent: false, blending: THREE.AdditiveBlending
        });
    let greenGlow = new THREE.Sprite(spriteMaterial);

    greenGlow.scale.set(80, 80, 1.0);
    greenDot.add(greenGlow);

    let lowerAreaShape = new THREE.Shape();
    lowerAreaShape.moveTo(-100, circlePos[0][1]);
    lowerAreaShape.lineTo(gridRightBound - 250 + 90, circlePos[0][1]);
    lowerAreaShape.lineTo(gridRightBound - 250 + 90, 0);
    lowerAreaShape.lineTo(-100, 0);
    let lowerAreaGeo = new THREE.ShapeGeometry(lowerAreaShape);
    let lowerAreaMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(LOWER_BUTTON_COLOR) }
        },
        vertexShader: document.getElementById('vertexshaderlower').textContent,
        fragmentShader: document.getElementById('fragmentshaderlower').textContent,
        transparent: true,
        opacity: 0.4
    });
    let lowerArea = new THREE.Mesh(lowerAreaGeo, lowerAreaMaterial);
    lowerArea.renderOrder = 1;

    let higherAreaShape = new THREE.Shape();
    higherAreaShape.moveTo(-100, circlePos[0][1]);
    higherAreaShape.lineTo(gridRightBound - 250 + 90, circlePos[0][1]);
    higherAreaShape.lineTo(gridRightBound - 250 + 90, container.clientHeight*2);
    higherAreaShape.lineTo(-100, container.clientHeight*2);
    let higherAreaGeo = new THREE.ShapeGeometry(higherAreaShape);
    let higherAreaMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(HIGHER_BUTTON_COLOR) }
        },
        vertexShader: document.getElementById('vertexshaderhigher').textContent,
        fragmentShader: document.getElementById('fragmentshaderhigher').textContent,
        transparent: true,
        opacity: 0.4
    });
    let higherArea = new THREE.Mesh(higherAreaGeo, higherAreaMaterial);
    higherArea.renderOrder = 1;

    let upGeo2 = new THREE.BoxGeometry(80, 80, 1);
    let upMesh2 = new THREE.Mesh(upGeo2, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("upArrow.png", map => {
                upMesh2.scale.set(map.image.width * 0.004, map.image.height * 0.004);
            }),
            transparent: true,
            opacity: 1.0,
            color: HIGHER_BUTTON_COLOR,
        }));
    upMesh2.position.x = circlePos[0][0] + 10;
    upMesh2.position.y = circlePos[0][1] + 40;
    upMesh2.renderOrder = 200;

    let downGeo2 = new THREE.BoxGeometry(80, 80, 1);
    let downMesh2 = new THREE.Mesh(downGeo2, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("downArrow.png", map => {
                downMesh2.scale.set(map.image.width * 0.004, map.image.height * 0.004);
            }),
            transparent: true,
            opacity: 1.0,
            color: LOWER_BUTTON_COLOR,
        }));
    downMesh2.position.x = circlePos[0][0] + 10;
    downMesh2.position.y = circlePos[0][1] - 40;
    downMesh2.renderOrder = 200;

    let higherText = new Text()
    higherText.renderOrder = 200;

    activePriceStatusObjs.push({
        dashedLine: verdashedLine, line: verLine, priceShape: priceShape,
        priceText: priceText, priceActiveText: priceActiveText, greenDot: greenDot,
        greenGlow: greenGlow, lowerArea: lowerArea, higherArea: higherArea,
        upArrow: upMesh2, downArrow: downMesh2
    })
}

// Update the geometry if the line at the green points, almost the same as drawActiveLines, only not
// creating new objects.
function updateActiveLines(activePriceStatusObjs, circlePos, gridRightBound, movedDistance) {
    //FIXME, new in realtime?
    const horizontalDashed = new LineGeometry();
    horizontalDashed.setPositions([0, circlePos[0][1], 0, circlePos[0][0], circlePos[0][1], 0]);

    activePriceStatusObjs[0].dashedLine.geometry.dispose();
    activePriceStatusObjs[0].dashedLine.geometry = horizontalDashed;
    activePriceStatusObjs[0].dashedLine.computeLineDistances();
    activePriceStatusObjs[0].dashedLine.geometry.attributes.position.needsUpdate = true;
    activePriceStatusObjs[0].dashedLine.material.needsUpdate = true;

    const verticalline = new LineGeometry();
    verticalline.setPositions([circlePos[0][0], circlePos[0][1], 0, gridRightBound - 250 - movedDistance, circlePos[0][1], 0]);

    activePriceStatusObjs[0].line.geometry.dispose();
    activePriceStatusObjs[0].line.geometry = verticalline;
    activePriceStatusObjs[0].line.computeLineDistances();
    activePriceStatusObjs[0].line.geometry.attributes.position.needsUpdate = true;

    // Update price shape
    let pricePolygon = activePriceStatusObjs[0].priceShape.geometry.attributes.position.array;
    let i = 0;
    pricePolygon[i++] = gridRightBound - 250;
    pricePolygon[i++] = circlePos[0][1];
    pricePolygon[i++] = 0;
    pricePolygon[i++] = gridRightBound - 250 + 15;
    pricePolygon[i++] = circlePos[0][1] + 15;
    pricePolygon[i++] = 0;
    pricePolygon[i++] = gridRightBound - 250 + 90;
    pricePolygon[i++] = circlePos[0][1] + 15;
    pricePolygon[i++] = 0;
    pricePolygon[i++] = gridRightBound - 250 + 90;
    pricePolygon[i++] = circlePos[0][1] - 15;
    pricePolygon[i++] = 0;
    pricePolygon[i++] = gridRightBound - 250 + 15;
    pricePolygon[i++] = circlePos[0][1] - 15;
    pricePolygon[i++] = 0;
    activePriceStatusObjs[0].priceShape.renderOrder = 10;
    activePriceStatusObjs[0].priceShape.geometry.attributes.position.needsUpdate = true;

    activePriceStatusObjs[0].priceText.position.z = 0
    activePriceStatusObjs[0].priceText.position.x = gridRightBound - 250 + 22
    activePriceStatusObjs[0].priceText.position.y = circlePos[0][1] + 7
    if (enableHigherActive == true || enableLowerActive == true) {
        activePriceStatusObjs[0].priceText.color = "white"
    } else {
        activePriceStatusObjs[0].priceText.color = 0x000000;
    }
    // Update the rendering:
    activePriceStatusObjs[0].priceText.sync()

    i = Math.floor(Math.random() * 100);
    activePriceStatusObjs[0].priceActiveText.position.z = 0
    activePriceStatusObjs[0].priceActiveText.position.x = gridRightBound - 250 + 60
    activePriceStatusObjs[0].priceActiveText.position.y = circlePos[0][1] + 12
    if (enableHigherActive == true || enableLowerActive == true) {
        activePriceStatusObjs[0].priceActiveText.color = "white"
    } else {
        activePriceStatusObjs[0].priceActiveText.color = i % 2 == 0 ? GREEN_COLOR : 'red'
    }
    activePriceStatusObjs[0].priceActiveText.text = '' + i

    // Update the rendering:
    activePriceStatusObjs[0].priceActiveText.sync()

    let geometry = new THREE.CircleGeometry(3, 50);
    let material = new THREE.MeshBasicMaterial({ color: GREEN_COLOR, transparent: true, opacity: 1.0 });
    let greenDot = new THREE.Mesh(geometry, material);
    activePriceStatusObjs[0].greenDot.renderOrder = 100;
    activePriceStatusObjs[0].greenDot.onBeforeRender = function (renderer) { renderer.clearDepth(); };

    activePriceStatusObjs[0].greenDot.position.set(circlePos[0][0], circlePos[0][1], circlePos[0][2]);
    activePriceStatusObjs[0].greenDot.geometry.attributes.position.needsUpdate = true;

    let lowerAreaShape = new THREE.Shape();
    lowerAreaShape.moveTo(-100, circlePos[0][1]);
    lowerAreaShape.lineTo(gridRightBound - 250 + 90, circlePos[0][1]);
    lowerAreaShape.lineTo(gridRightBound - 250 + 90, 0);
    lowerAreaShape.lineTo(-100, 0);
    let lowerAreaGeo = new THREE.ShapeGeometry(lowerAreaShape);
    activePriceStatusObjs[0].lowerArea.geometry.dispose();
    activePriceStatusObjs[0].lowerArea.geometry = lowerAreaGeo;
    activePriceStatusObjs[0].lowerArea.geometry.attributes.position.needsUpdate = true;

    let higherAreaShape = new THREE.Shape();
    higherAreaShape.moveTo(-100, circlePos[0][1]);
    higherAreaShape.lineTo(gridRightBound - 250 + 90, circlePos[0][1]);
    higherAreaShape.lineTo(gridRightBound - 250 + 90, container.clientHeight*2);
    higherAreaShape.lineTo(-100, container.clientHeight*2);
    let higherAreaGeo = new THREE.ShapeGeometry(higherAreaShape);
    activePriceStatusObjs[0].higherArea.geometry.dispose();
    activePriceStatusObjs[0].higherArea.geometry = higherAreaGeo;
    activePriceStatusObjs[0].higherArea.geometry.attributes.position.needsUpdate = true;

    activePriceStatusObjs[0].upArrow.position.x = circlePos[0][0] + 10;
    activePriceStatusObjs[0].upArrow.position.y = circlePos[0][1] + 40;

    activePriceStatusObjs[0].downArrow.position.x = circlePos[0][0] + 10;
    activePriceStatusObjs[0].downArrow.position.y = circlePos[0][1] - 40;
}

function enableHigherActiveLines(higherButton, activePriceStatusObjs) {
    higherButton.material.color.setHex(HIGHER_BUTTON_COLOR_ENABLE);
    enableHigherActive = true;

    activePriceStatusObjs[0].dashedLine.material.color.setHex(HIGHER_BUTTON_COLOR);
    activePriceStatusObjs[0].dashedLine.material.needsUpdate = true;
    activePriceStatusObjs[0].line.material.color.setHex(HIGHER_BUTTON_COLOR);
    activePriceStatusObjs[0].line.material.needsUpdate = true;
    activePriceStatusObjs[0].priceShape.material.color.setHex(HIGHER_BUTTON_COLOR);
    activePriceStatusObjs[0].priceShape.material.needsUpdate = true;
}

function disableHigherActiveLines(higherButton, activePriceStatusObjs) {
    higherButton.material.color.setHex(HIGHER_BUTTON_COLOR);

    enableHigherActive = false;

    activePriceStatusObjs[0].dashedLine.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].dashedLine.material.needsUpdate = true;
    activePriceStatusObjs[0].line.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].line.material.needsUpdate = true;
    activePriceStatusObjs[0].priceShape.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].priceShape.material.needsUpdate = true;
}

function enableLowerActiveLines(lowerButton, activePriceStatusObjs) {
    lowerButton.material.color.setHex(LOWER_BUTTON_COLOR_ENABLE);

    enableLowerActive = true;

    activePriceStatusObjs[0].dashedLine.material.color.setHex(LOWER_BUTTON_COLOR);
    activePriceStatusObjs[0].dashedLine.material.needsUpdate = true;
    activePriceStatusObjs[0].line.material.color.setHex(LOWER_BUTTON_COLOR);
    activePriceStatusObjs[0].line.material.needsUpdate = true;
    activePriceStatusObjs[0].priceShape.material.color.setHex(LOWER_BUTTON_COLOR);
    activePriceStatusObjs[0].priceShape.material.needsUpdate = true;
}

function disableLowerActiveLines(lowerButton, activePriceStatusObjs) {
    lowerButton.material.color.setHex(LOWER_BUTTON_COLOR);

    enableLowerActive = false;

    activePriceStatusObjs[0].dashedLine.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].dashedLine.material.needsUpdate = true;
    activePriceStatusObjs[0].line.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].line.material.needsUpdate = true;
    activePriceStatusObjs[0].priceShape.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].priceShape.material.needsUpdate = true;
}

// Update the geometry of the polygons in a selected range: from, to
function updatePolygon(poligons, poly, from, to) {
    //FIXME call this realtime is  so bad
    for (let i = from; i < to; i++) {
        if (poly[i] == undefined || poly[i + 1] == undefined) {
            continue;
        }
        let shape = new THREE.Shape();
        shape.moveTo(poly[i][0], poly[i][1]);
        shape.lineTo(poly[i + 1][0], poly[i + 1][1]);
        shape.lineTo(poly[i + 1][0], 0);
        shape.lineTo(poly[i][0], 0);
        let geometry = new THREE.ShapeGeometry(shape);
        poligons[i].geometry.dispose();
        poligons[i].geometry = geometry;
        poligons[i].geometry.attributes.position.needsUpdate = true;
    }
}

function updatePolygonSingle(poligons, x0, y0, x, y, offset) {
    //FIXME call this realtime is  so bad
    let i = offset;
    let shape = new THREE.Shape();
    shape.moveTo(x0, y0);
    shape.lineTo(x, y);
    shape.lineTo(x, 0);
    shape.lineTo(x0, 0);
    let geometry = new THREE.ShapeGeometry(shape);
    poligons[i].geometry.dispose();
    poligons[offset].geometry = geometry;
    poligons[offset].geometry.attributes.position.needsUpdate = true;
}

// Create the polygon using the list of points
let polygonMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(GRADIENT_DATALINE_COLOR) }
    },
    vertexShader: document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent,
    transparent: true,
    opacity: 0.4
});
function addPolygon(drawingGroup, poligons, poly, offset = 0) {
    // activeGroup.remove(poligon);
    let shape = new THREE.Shape();
    shape.moveTo(poly[0 + offset][0], poly[0 + offset][1]);
    for (let i = 1 + offset; i < poly.length; ++i)
        shape.lineTo(poly[i][0], poly[i][1]);
    shape.lineTo(poly[poly.length - 1][0], 0);
    shape.lineTo(poly[0 + offset][0], 0);

    let geometry = new THREE.ShapeGeometry(shape);

    let poligon = new THREE.Mesh(geometry, polygonMaterial);
    poligon.renderOrder = 5;
    drawingGroup.add(poligon);
    poligons.push(poligon);
}

// Draw the data lines which map data points
var matLine = null;

function addDataLine(drawingGroup, dataLines, data, offset, width, height) {
    if (!matLine || matLine.resolution.x != width || matLine.resolution.y != height) {
        matLine = new LineMaterial({
            color: DATA_LINE_CORLOR,
            vertexColors: false,
            linewidth: DATA_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
            resolution: new THREE.Vector2(width, height),//FIXME we need to update, not new material
            //resolution:  // to be set by renderer, eventually
            dashed: false,
            alphaToCoverage: true,
            transparent: true,
            opacity: 1.0,
        });
    }
    for (let i = offset; i < data.length - 1; i++) {
        let currencyLineGeo = new LineGeometry();
        // if (Number.isNaN(parseFloat(data[i])) == true || Number.isNaN(parseFloat(data[i + 4])) == true || Number.isNaN(parseFloat(data[i + 5])) == true) {
        //     continue;
        // }
        currencyLineGeo.setPositions([parseFloat(data[i][0]), parseFloat(data[i][1]), parseFloat(data[i][2]), parseFloat(data[i + 1][0]), parseFloat(data[i + 1][1]), parseFloat(data[i + 1][2])])

        let currencyLine = new Line2(currencyLineGeo, matLine);
        // currencyLine.computeLineDistances();
        currencyLine.scale.set(1, 1, 1);
        currencyLine.renderOrder = 10;
        dataLines.push(currencyLine);
        drawingGroup.add(currencyLine);
    }
}

// Update the geometry of created data lines
function updateDataLine(dataLines, data, from, to) {
    for (let i = from; i < to; i++) {
        if (data[i] == undefined || data[i + 1] == undefined) {
            continue;
        }
        let currencyLineGeo = new LineGeometry();
        currencyLineGeo.setPositions([parseFloat(data[i][0]), parseFloat(data[i][1]), parseFloat(data[i][2]), parseFloat(data[i + 1][0]), parseFloat(data[i + 1][1]), parseFloat(data[i + 1][2])])
        dataLines[i].geometry.dispose();
        dataLines[i].geometry = currencyLineGeo;
        dataLines[i].geometry.attributes.position.needsUpdate = true;
    }
}


// Update the geometry of created data lines
function updateDataLineSingle(dataLines, x0, y0, x, y, offset) {
    let i = offset;
    let currencyLineGeo = new LineGeometry();
    currencyLineGeo.setPositions([x0, y0, 0, x, y, 0])
    dataLines[i].geometry.dispose();
    dataLines[i].geometry = currencyLineGeo;
    dataLines[i].geometry.attributes.position.needsUpdate = true;
}

// Draw the purchase line using position of the green points and the remaining time of the countdown timer.
// circlePos is the pos of the greenpoint
function drawPurchaseLine(purchaseLineObjs, circlePos, gridTopBound, stepX, countDownTimer) {
    let verticalPurchaseLinePos = [circlePos[0][0] + countDownTimer * axisXConfig.stepX, 150, 0, circlePos[0][0] + countDownTimer * axisXConfig.stepX, gridTopBound, 0];

    const verticalPurchaseGeo = new LineGeometry();
    verticalPurchaseGeo.setPositions(verticalPurchaseLinePos);
    let verticalPurchaseMaterial = new LineMaterial({
        color: 0xffffff,
        linewidth: PURCHASE_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
        vertexColors: false,
        resolution: new THREE.Vector2(container.clientWidth, container.clientHeight),
        //resolution:  // to be set by renderer, eventually
        dashed: true,
        dashScale: 0.4,
    });

    let verticalPurchaseLine = new Line2(verticalPurchaseGeo, verticalPurchaseMaterial);
    verticalPurchaseLine.computeLineDistances();
    verticalPurchaseLine.scale.set(1, 1, 1);
    verticalPurchaseLine.renderOrder = 20;

    let purchaseText = new Text()
    purchaseText.renderOrder = 10;

    // Set properties to configure:
    purchaseText.text = 'PURCHASE'
    purchaseText.font = "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    purchaseText.fontSize = 11
    purchaseText.position.z = 0
    purchaseText.position.x = verticalPurchaseLinePos[0] - 95
    purchaseText.position.y = GRID_TOPLINE - 40
    purchaseText.color = 0xffffff

    // Update the rendering:
    purchaseText.sync();

    let timeText = new Text()
    timeText.renderOrder = 10;
    // Set properties to configure:
    timeText.text = 'TIME'
    timeText.font = "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    timeText.fontSize = 11
    timeText.position.z = 0
    timeText.position.x = verticalPurchaseLinePos[0] - 65
    timeText.position.y = GRID_TOPLINE - 55
    timeText.color = 0xffffff

    // Update the rendering:
    timeText.sync()


    // if (blink == true) {
    let countDownText = new Text()
    countDownText.renderOrder = 10;

    // Set properties to configure:
    countDownText.text = (countDownTimer == 60 ? '1:00' : (countDownTimer < 10 ? '00:' + '0' + countDownTimer : '00:' + countDownTimer))
    countDownText.font = "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    countDownText.fontSize = 25
    countDownText.position.z = 0
    countDownText.position.x = verticalPurchaseLinePos[0] - 32
    countDownText.position.y = GRID_TOPLINE - 35
    countDownText.color = 0xffffff

    // Update the rendering:
    countDownText.sync()
    // } else {
    countDownText.position.x = verticalPurchaseLinePos[0] - 32
    countDownText.text = (countDownTimer == 60 ? '1:00' : (countDownTimer < 10 ? '00:' + '0' + countDownTimer : '00:' + countDownTimer))
    // Update the rendering:
    countDownText.sync()
    // }

    let stopwatchGeo = new THREE.CircleGeometry(12, 64);
    let stopwatchMesh = new THREE.Mesh(stopwatchGeo, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("stopwatch.png", map => {
                stopwatchMesh.scale.set(map.image.width * 0.012, map.image.height * 0.012);
            }),
            transparent: true,
            opacity: 1.0,
            color: 0xffffff,
        }));
    stopwatchMesh.position.set(verticalPurchaseLinePos[0], 160);
    stopwatchMesh.renderOrder = 10;
    purchaseLineObjs.push({ purchaseLine: verticalPurchaseLine, purchaseText: purchaseText, timeText: timeText, countDownText: countDownText, stopwatch: stopwatchMesh })
}

// Update the geometry of the purchase line using greenpoint position
function updatePurchaseLine(drawingGroup, purchaseLineObjs, circlePos, gridTopBound, stepX, countDownTimer) {
    let verticalPurchaseLinePos = [circlePos[0][0] + countDownTimer * axisXConfig.stepX, 150, 0, circlePos[0][0] + countDownTimer * axisXConfig.stepX, gridTopBound, 0];

    const verticalPurchaseGeo = new LineGeometry();
    verticalPurchaseGeo.setPositions(verticalPurchaseLinePos);
    purchaseLineObjs[0].purchaseLine.geometry.dispose();
    purchaseLineObjs[0].purchaseLine.geometry = verticalPurchaseGeo;
    purchaseLineObjs[0].purchaseLine.computeLineDistances();
    purchaseLineObjs[0].purchaseLine.geometry.attributes.position.needsUpdate = true;

    purchaseLineObjs[0].purchaseText.position.z = 0
    purchaseLineObjs[0].purchaseText.position.x = verticalPurchaseLinePos[0] - 95
    purchaseLineObjs[0].purchaseText.position.y = gridTopBound - 40

    // Update the rendering:
    purchaseLineObjs[0].purchaseText.sync()

    purchaseLineObjs[0].timeText.position.z = 0
    purchaseLineObjs[0].timeText.position.x = verticalPurchaseLinePos[0] - 65
    purchaseLineObjs[0].timeText.position.y = gridTopBound - 55

    // Update the rendering:
    purchaseLineObjs[0].timeText.sync()

    if (countDownTimer <= 3) {
        let countDownText = new Text()
        countDownText.renderOrder = 10;

        // Set properties to configure:
        countDownText.text = (countDownTimer == 60 ? '01:00' : (countDownTimer < 10 ? '00:' + '0' + countDownTimer : '00:' + countDownTimer))
        countDownText.font = "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        countDownText.fontSize = 25
        countDownText.position.z = 0
        countDownText.position.x = verticalPurchaseLinePos[0] - 32
        countDownText.position.y = gridTopBound - 35
        countDownText.color = 0xffffff

        // Update the rendering:
        countDownText.sync()
        drawingGroup.remove(purchaseLineObjs[0].countDownText)
        purchaseLineObjs[0].countDownText = countDownText;
        drawingGroup.add(purchaseLineObjs[0].countDownText)
    } else {
        purchaseLineObjs[0].countDownText.position.x = verticalPurchaseLinePos[0] - 32
        purchaseLineObjs[0].countDownText.text = (countDownTimer == 60 ? '1:00' : (countDownTimer < 10 ? '00:' + '0' + countDownTimer : '00:' + countDownTimer))
        // Update the rendering:
        purchaseLineObjs[0].countDownText.sync()
    }
    purchaseLineObjs[0].stopwatch.position.set(verticalPurchaseLinePos[0], 160);
    purchaseLineObjs[0].stopwatch.geometry.attributes.position.needsUpdate = true;
}



function setGrid(top, right) {
    GRID_TOPLINE = top;
    GRID_RIGHTMOST_LINE = right;
}

function defaultZoomLevel() {
    return DEFAULT_ZOOM_LEVEL[currentZoomLevel];
}

function listZoomLevel() {
    return DEFAULT_ZOOM_LEVEL;
}

function currentZoom(val) {
    if (val !== undefined) currentZoomLevel = val;
    return currentZoomLevel
}

function setXStepCount(val) {
    XStepCount = val;
}

export {
    updatePurchaseLine,
    drawPurchaseLine,
    updateDataLine,
    addDataLine,
    addPolygon,
    updatePolygon,
    updateActiveLines,
    drawActiveLines,
    updateVerticalGrid,
    removeRedundantVerticalGrid,
    drawVerticalGrid,
    drawHorizontalGrid,
    drawBackground,
    updateMouseMoveLine,
    drawInitialData,
    setGrid,
    GRID_TOPLINE,
    GRID_RIGHTMOST_LINE,
    defaultZoomLevel,
    listZoomLevel,
    currentZoom,
    axisYConfig,
    axisXConfig,
    setXStepCount,
    XStepCount,
    drawHigherButton,
    LOWER_BUTTON_COLOR_ENABLE,
    HIGHER_BUTTON_COLOR_ENABLE,
    LOWER_BUTTON_COLOR,
    HIGHER_BUTTON_COLOR,
    enableHigherActiveLines,
    enableLowerActiveLines,
    disableHigherActiveLines,
    disableLowerActiveLines,
    drawLowerButton,
    updatePolygonSingle,
    updateDataLineSingle
}