//static factory - FIXME as class later
import * as THREE from './libs/three/build/three.module.js'
import { Text } from './libs/troika-three-text.esm.js'
import { Line2 } from './libs/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from './libs/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './libs/three/examples/jsm/lines/LineGeometry.js';

let mouseTimeLineGeo, mousePriceLineGeo;


// GUI Constants
// Colors
let DATA_LINE_CORLOR = 0xf27303
let GRADIENT_DATALINE_COLOR = 0x9f561c
let BACKGROUND_COLOR = 0x191f2d
let TIME_TEXT_COLOR = 0x524f56
let HORIZONTAL_PRICE_TEXT_COLOR = 0x9ca0aa
let GRID_LINE_CORLOR = 0x9ca0aa
const EPS = 0.0001;
let GREEN_COLOR = 0x66ff66;
let HIGHER_BUTTON_COLOR = 0x2cac40;
let HIGHER_BUTTON_COLOR_ENABLE = 0x238933;
let LOWER_BUTTON_COLOR = 0xdb4931;
let LOWER_BUTTON_COLOR_ENABLE = 0xad4235;

// Line Width
const DATA_LINE_WIDTH = 2.0
const GRID_LINE_WIDTH = 0.5
const PURCHASE_LINE_WIDTH = 0.8
const MOUSE_MOVE_LINE_WIDTH = 1

const NUMBER_OF_Y_LINE = 6

var GRID_TOPLINE, GRID_RIGHTMOST_LINE;

//if max zoom is 2min: 64,32,16,8,4,2
//DEPRECATED
const DEFAULT_ZOOM_LEVEL = [5, 10, 15, 30, 60, 120, 300, 900, 1800, 3600, 7200, 3600 * 4, 3600 * 6, 3600 * 12]
const MIN_ZOOM_LEVEL = 120;//120s
const MAX_ZOOM_LEVEL = 120 * Math.pow(2, 4);

var currentZoomLevel = MIN_ZOOM_LEVEL;


let timestampShape, timestampText;
let mousePriceShape, mouseAlertShape;
let mouseTimeLine, mousePriceText, mousePriceLine;

let lastVerticalGrid;

let enableHigherActive = false;
let enableLowerActive = false;

let XStepCount = 0;
let axisXConfig = { stepX: 0, initialValueX: 0 }
let axisYConfig = {
    stepY: 0, initialValueY: 0,
    origin: 0
}

function maxZoom() {
    return MAX_ZOOM_LEVEL;
}

function minZoom() {
    return MIN_ZOOM_LEVEL;
}

function drawHigherButton(scene, gridRightBound) {
    let initY = 500;

    // shape
    let geomShape = new THREE.BoxGeometry(110, 110, 1);
    let matShape = new THREE.MeshBasicMaterial({ color: HIGHER_BUTTON_COLOR, transparent: true, opacity: 1.0 });
    let higherButton = new THREE.Mesh(geomShape, matShape);
    higherButton.renderOrder = 10;
    higherButton.position.x = gridRightBound - 150;
    higherButton.position.y = initY - 50;

    let upGeo = new THREE.BoxGeometry(110, 110, 1);
    let upMesh = new THREE.Mesh(upGeo, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("/img/up.png", map => {
                upMesh.scale.set(map.image.width * 0.0005, map.image.height * 0.0005);
            }),
            transparent: true,
            opacity: 1.0,
            color: 0xffffff,
        }));
    upMesh.position.x = gridRightBound - 150;
    upMesh.position.y = initY - 50;
    upMesh.renderOrder = 100;

    let upGeo2 = new THREE.BoxGeometry(110, 110, 1);
    let upMesh2 = new THREE.Mesh(upGeo2, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("/img/upArrow.png", map => {
                upMesh2.scale.set(map.image.width * 0.004, map.image.height * 0.004);
            }),
            transparent: true,
            opacity: 1.0,
            color: HIGHER_BUTTON_COLOR,
        }));
    upMesh2.position.x = gridRightBound - 150;
    upMesh2.position.y = initY + 50;
    upMesh2.renderOrder = 200;

    let downGeo2 = new THREE.BoxGeometry(110, 110, 1);
    let downMesh2 = new THREE.Mesh(downGeo2, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("/img/downArrow.png", map => {
                downMesh2.scale.set(map.image.width * 0.004, map.image.height * 0.004);
            }),
            transparent: true,
            opacity: 1.0,
            color: LOWER_BUTTON_COLOR,
        }));
    downMesh2.position.x = gridRightBound - 150;
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
    higherText.position.x = gridRightBound - 150 - 35;
    higherText.position.y = initY - 70;
    higherText.color = "white"
    // Update the rendering:
    higherText.sync()

    scene.add(higherButton)
    scene.add(higherText);
    scene.add(upMesh);

    return { higherButton, upMesh, higherText };
}

function drawLowerButton(scene, gridRightBound) {
    let initY = 382;
    // shape
    // let geomShape = new THREE.ShapeBufferGeometry(new THREE.Shape(coordinatesList));
    let geomShape = new THREE.BoxGeometry(110, 110, 1);
    let matShape = new THREE.MeshBasicMaterial({ color: LOWER_BUTTON_COLOR, transparent: true, opacity: 1.0 });
    let lowerButton = new THREE.Mesh(geomShape, matShape);
    lowerButton.renderOrder = 10;
    lowerButton.position.x = gridRightBound - 150;
    lowerButton.position.y = initY - 50;

    let downGeo = new THREE.BoxGeometry(110, 110, 1);
    let downMesh = new THREE.Mesh(downGeo, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("/img/down.png", map => {
                downMesh.scale.set(map.image.width * 0.0005, map.image.height * 0.0005);
            }),
            transparent: true,
            opacity: 1.0,
            color: 0xffffff,
        }));
    downMesh.position.x = gridRightBound - 150;
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
    lowerText.position.x = gridRightBound - 150 - 35;
    lowerText.position.y = initY - 70;
    lowerText.color = "white"
    // Update the rendering:
    lowerText.sync()

    scene.add(lowerButton)
    scene.add(downMesh)
    scene.add(lowerText)
    return { lowerButton, downMesh, lowerText };
}

// Update the position of the line at the mouse cursor
let mousePriceLineMat = null;
let mouseTimeLineMat = null;
let matShape = new THREE.MeshBasicMaterial({ color: 0x525a71, transparent: false });
function updateMouseMoveLine(scene, posX, posY, initialValueX, timestamp, startIndex) {
    if (mouseTimeLine) {
        mouseTimeLine.geometry.dispose();
        scene.remove(mouseTimeLine);
    }
    if (mousePriceLine) {
        mousePriceLine.geometry.dispose()
        scene.remove(mousePriceLine);
    }

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
    let datetime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 11).replace('T', ' ') + timestamp;
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
            map: new THREE.TextureLoader().load("/img/custom_bell.png", map => {
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
        let priceValue = dataClient.convertToDisplay((posY - axisYConfig.initialValueY) / axisYConfig.stepY + dataClient.input_value[startIndex].price);
        mousePriceText.text = '' + priceValue.toFixed(2);
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
        let priceValue = dataClient.convertToDisplay((posY - axisYConfig.initialValueY) / axisYConfig.stepY + dataClient.input_value[startIndex].price);
        mousePriceText.text = '' + priceValue.toFixed(2);
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
function drawHorizontalGrid(horizontalGrids, startingLine, gridTopBound, gridRightBound, startIndex) {
    for (let j = NUMBER_OF_Y_LINE - 1; j >= 0; j--) {
        const horizontalGridGeo = new LineGeometry();
        let yValue = gridTopBound - gridTopBound / NUMBER_OF_Y_LINE * j;
        let priceValue = dataClient.convertToDisplay((yValue - axisYConfig.initialValueY) / axisYConfig.stepY + dataClient.input_value[startIndex].price)
        horizontalGridGeo.setPositions([startingLine - 200, yValue, 0, gridRightBound - 200, yValue, 0]);
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
        // console.log(priceValue)
        // Set properties to configure:
        priceText.text = priceValue.toFixed(2);
        //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        priceText.fontSize = 12
        priceText.position.z = 0
        priceText.position.x = gridRightBound - 195
        priceText.position.y = yValue + 8
        priceText.color = HORIZONTAL_PRICE_TEXT_COLOR

        priceText.sync()
        horizontalGrids.push({ line: horizontalGridLine, text: priceText })
    }
}

function updateHorizontalGrid(horizontalGrids, startingLine, gridTopBound, gridRightBound, startIndex) {
    for (let j = NUMBER_OF_Y_LINE - 1; j >= 0; j--) {
        let horizontalGridGeo = new LineGeometry();
        let yValue = gridTopBound - gridTopBound / NUMBER_OF_Y_LINE * j;
        let priceValue = dataClient.convertToDisplay((yValue - axisYConfig.initialValueY) / axisYConfig.stepY + dataClient.input_value[startIndex].price)
        horizontalGridGeo.setPositions([startingLine - 200, yValue, 0, gridRightBound - 200, yValue, 0]);
        horizontalGrids[j].line.geometry.dispose();
        horizontalGrids[j].line.geometry = horizontalGridGeo;
        horizontalGrids[j].line.geometry.attributes.position.needsUpdate = true;


        horizontalGrids[j].text.text = priceValue.toFixed(2);
        // console.log(priceValue)
        // console.log(horizontalGrids[j].text)
        horizontalGrids[j].text.position.y = yValue + 8
        horizontalGrids[j].text.sync();
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
            let previousPos = verticalGrids[(i - 1) * DEFAULT_ZOOM_LEVEL[currentZoomLevel]].text.position.x
            currentPos = previousPos + axisXConfig.stepX * DEFAULT_ZOOM_LEVEL[currentZoomLevel];
        } else {
            // console.log("Draw new ", loopCount, dataPoints[index][0]);
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
            value.line.geometry.dispose();
            drawingGroup.remove(value.line)
            value.text.dispose();
            drawingGroup.remove(value.text)
            delete verticalGrids[key]
        }
    }
}

// Update geometry of the vertical grid using updated points data
function updateVerticalGrid(verticalGrids, data, lastZoomLevel, gridTopBound) {
    let prevX = undefined;
    for (const [key, value] of Object.entries(verticalGrids)) {
        let i = key / DEFAULT_ZOOM_LEVEL[lastZoomLevel]

        // Recalculate the position using new points data
        let currentPos = 0;
        if (data[key] == undefined) {
            if (verticalGrids[(i - 1) * DEFAULT_ZOOM_LEVEL[lastZoomLevel]] == undefined) {
                continue;
            }
            let previousPos = verticalGrids[(i - 1) * DEFAULT_ZOOM_LEVEL[lastZoomLevel]].text.position.x;
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

        //clean visual after zoom to avoif text is occluded
        const minTextSize = 12 * 8
        if (prevX !== undefined && Math.abs(currentPos - prevX) < minTextSize) {
            value.text.visible = false
            value.line.visible = false
        } else {
            value.text.visible = true
            value.line.visible = true
            prevX = currentPos;
        }
    }
}

var prevValue = undefined;
// Draw the line at the green point, circlePos is the position of the green point
// movedDistance is the movement of the activeGroup. This function will only be called once.
function drawActiveLines(activePriceStatusObjs, circlePos, gridRightBound, movedDistance) {
    if (Number.isNaN(circlePos[0][0]) || Number.isNaN(circlePos[0][1])) {
        console.log(circlePos[0])
        return;
    }

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

    let currentValue = dataClient.input_value[dataClient.currentIndex() - 1].price;
    prevValue = dataClient.input_value[dataClient.currentIndex() - 2].price;

    const isChanged = Math.round((currentValue - prevValue) * 1e2) / 1e2;

    let priceText = new Text()
    priceText.renderOrder = 50;
    // activeGroup.add(priceText);

    // Set properties to configure:
    priceText.text = '' + (currentValue).toFixed(0)
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

    let priceActiveText = new Text()
    priceActiveText.renderOrder = 50;

    // Set properties to configure:

    priceActiveText.text = '' + Math.abs(currentValue - prevValue)
    //myText.font ="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    priceActiveText.fontSize = 18
    priceActiveText.position.z = 0
    priceActiveText.position.x = gridRightBound - 250 + 60
    priceActiveText.position.y = circlePos[0][1] + 12
    priceActiveText.color = (currentValue - prevValue) >= 0 ? GREEN_COLOR : 'red'
    if (enableHigherActive == true || enableLowerActive == true) {
        priceActiveText.color = "white"
    } else {
        priceActiveText.color = isChanged == 0 ? 0x000000 : (isChanged >= 0 ? GREEN_COLOR : 'red');
    }
    // Update the rendering:
    priceActiveText.sync()

    let geometry = new THREE.CircleGeometry(3, 50);
    let material = new THREE.MeshBasicMaterial({ color: GREEN_COLOR, transparent: true, opacity: 1.0,depthTest:false });
    let greenDot = new THREE.Mesh(geometry, material);
    greenDot.renderOrder = 100;
    // SUPER SIMPLE GLOW EFFECT
    // use sprite because it appears the same from all angles
    let spriteMaterial = new THREE.SpriteMaterial(
        {
            map: new THREE.TextureLoader().load("/img/glow2.png"),
            color: GREEN_COLOR, transparent: false, blending: THREE.AdditiveBlending,
            depthTest:false 
        });
    let greenGlow = new THREE.Sprite(spriteMaterial);

    greenGlow.scale.set(90, 90, 1.0);//FIXME
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
    higherAreaShape.lineTo(gridRightBound - 250 + 90, container.clientHeight * 2);
    higherAreaShape.lineTo(-100, container.clientHeight * 2);
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
            map: new THREE.TextureLoader().load("/img/upArrow.png", map => {
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
            map: new THREE.TextureLoader().load("/img/downArrow.png", map => {
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
    if (circlePos == undefined || activePriceStatusObjs[0] == undefined) { return; }

    if (Number.isNaN(circlePos[0][0]) || Number.isNaN(circlePos[0][1])) {
        console.log(circlePos[0])
        return;
    }
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
    activePriceStatusObjs[0].priceShape.renderOrder = 30;
    activePriceStatusObjs[0].priceShape.geometry.attributes.position.needsUpdate = true;
    activePriceStatusObjs[0].priceShape.geometry.computeBoundingBox();
    activePriceStatusObjs[0].priceShape.geometry.computeBoundingSphere();

    let currentValue = dataClient.input_value[dataClient.input_value.length - 1].price;
    prevValue = dataClient.input_value[dataClient.input_value.length - 2].price;

    //console.log(currentValue - prevValue)

    const isChanged = Math.round((currentValue - prevValue) * 1e2) / 1e2;

    activePriceStatusObjs[0].priceText.position.z = 0
    activePriceStatusObjs[0].priceText.position.x = gridRightBound - 250 + 22
    activePriceStatusObjs[0].priceText.position.y = circlePos[0][1] + 7
    //if (isChanged != 0) 
    {
        activePriceStatusObjs[0].priceText.text = '' + (currentValue).toFixed(0)
        //if (enableHigherActive == true || enableLowerActive == true) {
        //    activePriceStatusObjs[0].priceText.color = "white"
        //} else {
        activePriceStatusObjs[0].priceText.color = isChanged == 0 ? 0x000000 : (isChanged >= 0 ? GREEN_COLOR : 'red');
        //}

        // Update the rendering:
        activePriceStatusObjs[0].priceText.sync()
    }


    activePriceStatusObjs[0].priceActiveText.position.z = 0
    activePriceStatusObjs[0].priceActiveText.position.x = gridRightBound - 250 + 60
    activePriceStatusObjs[0].priceActiveText.position.y = circlePos[0][1] + 12

    //if (isChanged != 0) 
    {
        //if (enableHigherActive == true || enableLowerActive == true) {
        //    activePriceStatusObjs[0].priceActiveText.color = "white"
        //} else {
        activePriceStatusObjs[0].priceActiveText.color = isChanged == 0 ? 0x000000 : (isChanged >= 0 ? GREEN_COLOR : 'red');
        //}

        activePriceStatusObjs[0].priceActiveText.text = ('' + Math.abs(currentValue - prevValue).toFixed(2)).substr(2)
        // Update the rendering:
        activePriceStatusObjs[0].priceActiveText.sync()
    }


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
    higherAreaShape.lineTo(gridRightBound - 250 + 90, container.clientHeight * 2);
    higherAreaShape.lineTo(-100, container.clientHeight * 2);
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
    //activePriceStatusObjs[0].priceShape.material.color.setHex(HIGHER_BUTTON_COLOR);
    //activePriceStatusObjs[0].priceShape.material.needsUpdate = true;
}

function disableHigherActiveLines(higherButton, activePriceStatusObjs, disabledCorlor) {
    if (disabledCorlor == undefined) {
        higherButton.material.color.setHex(HIGHER_BUTTON_COLOR);
    } else {
        higherButton.material.color.setHex(disabledCorlor);
    }

    enableHigherActive = false;

    activePriceStatusObjs[0].dashedLine.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].dashedLine.material.needsUpdate = true;
    activePriceStatusObjs[0].line.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].line.material.needsUpdate = true;
    // activePriceStatusObjs[0].priceShape.material.color.setHex(0xffffff);
    //activePriceStatusObjs[0].priceShape.material.needsUpdate = true;
}

function enableLowerActiveLines(lowerButton, activePriceStatusObjs) {
    lowerButton.material.color.setHex(LOWER_BUTTON_COLOR_ENABLE);

    enableLowerActive = true;

    activePriceStatusObjs[0].dashedLine.material.color.setHex(LOWER_BUTTON_COLOR);
    activePriceStatusObjs[0].dashedLine.material.needsUpdate = true;
    activePriceStatusObjs[0].line.material.color.setHex(LOWER_BUTTON_COLOR);
    activePriceStatusObjs[0].line.material.needsUpdate = true;
    //activePriceStatusObjs[0].priceShape.material.color.setHex(LOWER_BUTTON_COLOR);
    //activePriceStatusObjs[0].priceShape.material.needsUpdate = true;
}

function disableLowerActiveLines(lowerButton, activePriceStatusObjs, disabledCorlor) {
    if (disabledCorlor == undefined) {
        lowerButton.material.color.setHex(LOWER_BUTTON_COLOR);
    } else {
        lowerButton.material.color.setHex(disabledCorlor);
    }


    enableLowerActive = false;

    activePriceStatusObjs[0].dashedLine.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].dashedLine.material.needsUpdate = true;
    activePriceStatusObjs[0].line.material.color.setHex(0xffffff);
    activePriceStatusObjs[0].line.material.needsUpdate = true;
    //activePriceStatusObjs[0].priceShape.material.color.setHex(0xffffff);
    //activePriceStatusObjs[0].priceShape.material.needsUpdate = true;
}


// Create the polygon using the list of points
let polygonMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(GRADIENT_DATALINE_COLOR) }
    },
    //side:THREE.DoubleSide,
    vertexShader: document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent,
    transparent: true,
    opacity: 0.4
});

function addPolygon(poligons, poly, offset = 0) {
    let geometry = new THREE.BufferGeometry();
    let vertices = [];
    for (let i = 1 + offset; i < poly.length; ++i) {
        vertices.push(poly[i - 1][0], poly[i - 1][1], 0);
        vertices.push(poly[i - 1][0], 0, 0);
        vertices.push(poly[i][0], poly[i][1], 0);


        vertices.push(poly[i][0], poly[i][1], 0);
        vertices.push(poly[i - 1][0], 0, 0);
        vertices.push(poly[i][0], 0, 0);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));

    //test
    //geometry = new THREE.SphereGeometry(300,15,15);

    let poligon = new THREE.Mesh(geometry, polygonMaterial);
    poligon.renderOrder = 5;
    poligons.add(poligon);

    return poligon;
}

function updatePolygon(poligons, poly, offset = 0) {
    let vertices = [];
    for (let i = 1 + 0; i < poly.length; ++i) {
        vertices.push(poly[i - 1][0], poly[i - 1][1], 0);
        vertices.push(poly[i - 1][0], 0, 0);
        vertices.push(poly[i][0], poly[i][1], 0);


        vertices.push(poly[i][0], poly[i][1], 0);
        vertices.push(poly[i - 1][0], 0, 0);
        vertices.push(poly[i][0], 0, 0);
    }

    if (vertices.length != poligons.geometry.attributes.position.array.length) {

        poligons.geometry.dispose();
        poligons.geometry = new THREE.BufferGeometry();
        poligons.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    } else {
        poligons.geometry.attributes.position.array.set(vertices);
    }

    poligons.geometry.attributes.position.needsUpdate = true;

}
function updateNewPolygon(poligon, points) {
    let vertices = [];
    const len = points.length;
    let x0 = points[len - 2][0]
    let y0 = points[len - 2][1]
    let x = points[len - 1][0]
    let y = points[len - 1][1]

    vertices.push(x0, y0, 0);
    vertices.push(x0, 0, 0);
    vertices.push(x, y, 0);


    vertices.push(x, y, 0);
    vertices.push(x0, 0, 0);
    vertices.push(x, 0, 0);
    poligon.geometry.attributes.position.array.set(vertices, 0)

    poligon.geometry.attributes.position.needsUpdate = true;
}
// Draw the data lines which map data points
var matLine = null;
function addDataLine(dataLines, data, offset, width, height) {
    if (!matLine) {
        matLine = new THREE.LineBasicMaterial({
            color: DATA_LINE_CORLOR,
            vertexColors: false,
            linewidth: DATA_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
            //resolution: new THREE.Vector2(width, height),//FIXME we need to update, not new material
            //resolution:  // to be set by renderer, eventually
            dashed: false,
            alphaToCoverage: true,
            transparent: true,
            opacity: 1.0,
        });
    }
    let geometry = new THREE.BufferGeometry();
    let vertices = [];
    if (data.length == offset + 2) {
        vertices.push(data[offset][0], data[offset][1], data[offset][2], data[offset + 1][0], data[offset + 1][1], data[offset + 1][2])
    } else
        vertices = [].concat(...data)

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    let currencyLine = new THREE.Line(geometry, matLine);
    // currencyLine.computeLineDistances();
    currencyLine.scale.set(1, 1, 1);
    currencyLine.renderOrder = 10;
    dataLines.add(currencyLine);
    //}
    return currencyLine;
}

// Update the geometry of created data lines
function updateDataLine(dataLines, data, from = 0, to = 0) {
    //console.log(dataLines.length);
    from = from ? from : 0;
    to = to ? to : data.length;

    const vertices = [].concat(...data);
    if (vertices.length != dataLines.geometry.attributes.position.array.length) {
        dataLines.geometry.dispose();
        dataLines.geometry = new THREE.BufferGeometry();
        dataLines.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    } else {
        dataLines.geometry.attributes.position.array.set(vertices);
    }
    dataLines.geometry.attributes.position.needsUpdate = true;
}


// Update the geometry of created data lines
function updateNewLine(dataLine, points) {
    const len = points.length;
    let x0 = points[len - 2][0]
    let y0 = points[len - 2][1]
    let x = points[len - 1][0]
    let y = points[len - 1][1]
    const target = dataLine.geometry.attributes.position.array;
    target.set([x0, y0, 0, x, y, 0]);
    dataLine.geometry.attributes.position.needsUpdate = true;
}

// Draw the purchase line using position of the green points and the remaining time of the countdown timer.
// circlePos is the pos of the greenpoint
function drawPurchaseLine(purchaseLineObjs, circlePos, gridTopBound, stepX, countDownTimer) {

    let verticalPurchaseLinePos = [circlePos[0][0] + countDownTimer * stepX, 50, 0, circlePos[0][0] + countDownTimer * stepX, gridTopBound, 0];

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
    purchaseText.renderOrder = 21;

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
    timeText.renderOrder = 21;
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
    countDownText.renderOrder = 21;

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
            map: new THREE.TextureLoader().load("/img/stopwatch.png", map => {
                stopwatchMesh.scale.set(map.image.width * 0.012, map.image.height * 0.012);
            }),
            transparent: true,
            opacity: 1.0,
            color: 0xffffff,
        }));
    stopwatchMesh.position.set(verticalPurchaseLinePos[0], verticalPurchaseLinePos[1]);
    stopwatchMesh.renderOrder = 21;
    let object = { purchaseLine: verticalPurchaseLine, purchaseText: purchaseText, timeText: timeText, countDownText: countDownText, stopwatch: stopwatchMesh };
    for (let key in object)
        purchaseLineObjs.add(object[key]);
    return object
}

// Update the geometry of the purchase line using greenpoint position
function updatePurchaseLine(purchaseLineObjs, countDownTimer) {
    //let verticalPurchaseLinePos = [circlePos[0][0] + countDownTimer * stepX, 50, 0, circlePos[0][0] + countDownTimer * axisXConfig.stepX, gridTopBound, 0];

    //console.log(countDownTimer)
    let countDownText = purchaseLineObjs.countDownText
    countDownText.text = (countDownTimer == 60 ? '01:00' : (countDownTimer < 10 ? '00:' + '0' + countDownTimer : '00:' + countDownTimer))
    // Update the rendering:
    countDownText.sync()

    //blink effect
    if(countDownTimer <=3){
        const blinkSpeed = 500;
        countDownText.visible = !(Date.now()%blinkSpeed < blinkSpeed/2);//hide each blinkSpeed ms
    }
    purchaseLineObjs.visible = countDownTimer >=0
}

// Draw the purchase line using position of the green points and the remaining time of the countdown timer.
// circlePos is the pos of the greenpoint
function drawFinishLine(finishLineObjs, circlePos, gridTopBound, stepX, countDownTimer) {
    let verticalFinishLinePos = [circlePos[0][0] + countDownTimer * stepX, 50, 0, circlePos[0][0] + countDownTimer * stepX, gridTopBound, 0];

    const verticalFinishGeo = new LineGeometry();
    verticalFinishGeo.setPositions(verticalFinishLinePos);
    let verticalFinishMaterial = new LineMaterial({
        color: LOWER_BUTTON_COLOR,
        linewidth: PURCHASE_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
        vertexColors: false,
        resolution: new THREE.Vector2(container.clientWidth, container.clientHeight),
        //resolution:  // to be set by renderer, eventually
        dashed: true,
        dashScale: 0.4,
    });

    let verticalFinishLine = new Line2(verticalFinishGeo, verticalFinishMaterial);
    verticalFinishLine.computeLineDistances();
    verticalFinishLine.scale.set(1, 1, 1);
    verticalFinishLine.renderOrder = 20;

    let flagGeo = new THREE.CircleGeometry(12, 64);
    let flagMesh = new THREE.Mesh(flagGeo, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("/img/finishedflag.png", map => {
                flagMesh.scale.set(map.image.width * 0.015, map.image.height * 0.015);
            }),
            transparent: true,
            opacity: 1.0,
        }));
    flagMesh.position.set(verticalFinishLinePos[0], verticalFinishLinePos[1]);
    flagMesh.renderOrder = 21;

    let object = { finishLine: verticalFinishLine, flag: flagMesh };
    for(let key in object)
        finishLineObjs.add(object[key])
    return object
}

// Update the geometry of the purchase line using greenpoint position
function updateFinishLine(drawingGroup, finishLineObjs, circlePos, gridTopBound, stepX, finishTimer) {

}

function drawMark(drawingGroup, markObjs, circlePos, isLower, index, gridRightBound, movedDistance, invest, onloaded) {
    if (Number.isNaN(circlePos[0][0]) || Number.isNaN(circlePos[0][1])) {
        console.log(circlePos[0])
        return;
    }
    let w = 16, h = 16;
    let color = isLower ? LOWER_BUTTON_COLOR : HIGHER_BUTTON_COLOR;
    let markImage = isLower ? "/img/lowermark.png" : "/img/highermark.png"
    // Draw oval with number
    let ovalGeo = new THREE.PlaneGeometry(w, h);
    let ovalMesh = new THREE.Mesh(ovalGeo, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load("/img/higherinvest.png", map => {
                ovalMesh.scale.set(map.image.width * 0.015 * invest.length / 3.0, map.image.height * 0.015);
                if (onloaded) {
                    onloaded(ovalMesh);
                    onloaded(investText);
                }

            }),
            transparent: true,
            opacity: 0.2,
            color: color,
        }));
    ovalMesh.position.set(circlePos[0][0], circlePos[0][1] + 10);
    ovalMesh.renderOrder = 50;

    let investText = new Text()
    investText.renderOrder = 60;

    // Set properties to configure:
    investText.text = '$' + invest;
    investText.font = "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    investText.fontSize = 12
    investText.position.z = 0
    investText.position.x = circlePos[0][0] - investText.fontSize / 2 * investText.text.length / 2
    investText.position.y = circlePos[0][1] + 16
    investText.color = 0xffffff
    investText.sync();

    // Draw price shape
    let coordinatesList = [
        new THREE.Vector3(GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance - 20, circlePos[0][1] + 10, 0),
        new THREE.Vector3(GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance - 20 + 50, circlePos[0][1] + 10, 0),
        new THREE.Vector3(GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance - 20 + 50, circlePos[0][1] - 10, 0),
        new THREE.Vector3(GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance - 20, circlePos[0][1] - 10, 0)
    ];

    // shape
    let geomShape = new THREE.ShapeBufferGeometry(new THREE.Shape(coordinatesList));
    let matShape = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 });
    let markPriceShape = new THREE.Mesh(geomShape, matShape);
    markPriceShape.renderOrder = 50;

    let priceText = new Text()
    priceText.renderOrder = 60
    priceText.text = '' + parseFloat(dataClient.input_value[index].price).toFixed(2);// * 100000
    priceText.font = "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
    priceText.fontSize = 11
    priceText.position.z = 0
    priceText.position.x = GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance - 20 + 5
    priceText.position.y = circlePos[0][1] + 5
    priceText.color = 0xffffff
    priceText.sync();

    // // Draw straigh lines
    // let verticalInvestPos = [circlePos[0][0], circlePos[0][1], 0, circlePos[0][0], circlePos[0][1] + 10, 0];
    // const verticalInvestGeo = new LineGeometry();
    // verticalInvestGeo.setPositions(verticalInvestPos);
    // let verticalInvestMaterial = new LineMaterial({
    //     color: HIGHER_BUTTON_COLOR,
    //     linewidth: MOUSE_MOVE_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
    //     vertexColors: false,
    //     resolution: new THREE.Vector2(600, 400),
    //     //resolution:  // to be set by renderer, eventually
    //     dashed: true,
    //     dashScale: 0.4,
    // });

    // let verticalInvestLine = new Line2(verticalInvestGeo, verticalInvestMaterial);
    // verticalInvestLine.computeLineDistances();
    // verticalInvestLine.scale.set(1, 1, 1);
    // verticalInvestLine.renderOrder = 60;

    // Draw horizontal lines
    const horizontalDashed = new LineGeometry();
    horizontalDashed.setPositions([0, circlePos[0][1], 0, circlePos[0][0], circlePos[0][1], 0]);
    let horizontalMat = new LineMaterial({
        color: color,
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
    verdashedLine.renderOrder = 60;

    const verticalline = new LineGeometry();
    verticalline.setPositions([circlePos[0][0], circlePos[0][1], 0, gridRightBound - 250 - movedDistance, circlePos[0][1], 0]);
    let verlineMat = new LineMaterial({
        color: HIGHER_BUTTON_COLOR,
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
    verLine.renderOrder = 60;
    // Draw marks
    let markGeo = new THREE.CircleGeometry(12, 64);
    let markMesh = new THREE.Mesh(markGeo, new THREE.MeshBasicMaterial(
        {
            map: new THREE.TextureLoader().load(markImage, map => {
                markMesh.scale.set(map.image.width * 0.01, map.image.height * 0.01);
            }),
            transparent: true,
            opacity: 1.0,
        }));
    markMesh.position.set(circlePos[0][0], circlePos[0][1]);
    markMesh.renderOrder = 10;

    drawingGroup.add(ovalMesh)
    drawingGroup.add(investText)
    // drawingGroup.add(verticalInvestLine)
    drawingGroup.add(priceText)
    drawingGroup.add(markPriceShape)
    drawingGroup.add(verdashedLine)
    drawingGroup.add(verLine)
    drawingGroup.add(markMesh)
    markObjs.push({ ovalMesh: ovalMesh, index: index, investText: investText, priceText: priceText, markPriceShape: markPriceShape, verdashedLine: verdashedLine, verLine: verLine, markMesh: markMesh });

}

function updateMarks(markObjs, points, gridRightBound, movedDistance) {
    for (let index = 0; index < markObjs.length; index++) {
        if (markObjs[index] == undefined) {
            continue;
        }

        if (points[markObjs[index].index] == undefined) {
            continue;
        }
        let circlePos = [points[markObjs[index].index]];

        // Update oval with number
        markObjs[index].ovalMesh.position.set(circlePos[0][0], circlePos[0][1] + 10);
        markObjs[index].ovalMesh.geometry.attributes.position.needsUpdate = true;

        markObjs[index].investText.position.x = circlePos[0][0] - parseInt(markObjs[index].investText.fontSize) / 2 * markObjs[index].investText.text.length / 2;
        markObjs[index].investText.position.y = circlePos[0][1] + 10 + 6;
        markObjs[index].investText.sync();
        // Update price shape
        markObjs[index].priceText.position.x = GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance - 20 + 5;
        markObjs[index].priceText.position.y = circlePos[0][1] + 5;
        markObjs[index].priceText.sync();

        let p = markObjs[index].markPriceShape.geometry.attributes.position.array;
        let i = 0;
        p[i++] = GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance - 20;
        p[i++] = circlePos[0][1] + 10;
        p[i++] = 0;
        p[i++] = GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance + 60 - 20;
        p[i++] = circlePos[0][1] + 10;
        p[i++] = 0;
        p[i++] = GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance + 60 - 20;
        p[i++] = circlePos[0][1] - 10;
        p[i++] = 0;
        p[i++] = GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance - 20;
        p[i++] = circlePos[0][1] - 10;
        p[i++] = 0;
        markObjs[index].markPriceShape.geometry.computeBoundingBox();
        markObjs[index].markPriceShape.geometry.attributes.position.needsUpdate = true;
        // Update horizontal lines
        const horizontalDashed = new LineGeometry();
        horizontalDashed.setPositions([0, circlePos[0][1], 0, circlePos[0][0], circlePos[0][1], 0]);
        markObjs[index].verdashedLine.geometry.dispose();
        markObjs[index].verdashedLine.geometry = horizontalDashed;
        markObjs[index].verdashedLine.computeLineDistances();
        markObjs[index].verdashedLine.geometry.attributes.position.needsUpdate = true;

        const verticalline = new LineGeometry();
        verticalline.setPositions([circlePos[0][0], circlePos[0][1], 0, GRID_RIGHTMOST_LINE - 205 - 120 - movedDistance, circlePos[0][1], 0]);
        markObjs[index].verLine.geometry.dispose();
        markObjs[index].verLine.geometry = verticalline;
        markObjs[index].verLine.computeLineDistances();
        markObjs[index].verLine.geometry.attributes.position.needsUpdate = true;
        // Update marks
        markObjs[index].markMesh.position.set(circlePos[0][0], circlePos[0][1]);
        markObjs[index].markMesh.geometry.attributes.position.needsUpdate = true;
    }
}

function removeMarks(drawingGroup, markObjs) {
    for (let i = 0; i < markObjs.length; i++) {
        markObjs[i].ovalMesh.geometry.dispose();
        markObjs[i].ovalMesh.material.dispose();
        drawingGroup.remove(markObjs[i].ovalMesh)
        markObjs[i].ovalMesh = undefined;
        markObjs[i].investText.dispose();
        markObjs[i].priceText.dispose();
        drawingGroup.remove(markObjs[i].investText)
        drawingGroup.remove(markObjs[i].priceText)
        markObjs[i].markPriceShape.geometry.dispose();
        markObjs[i].markPriceShape.material.dispose();
        drawingGroup.remove(markObjs[i].markPriceShape)
        markObjs[i].markPriceShape = undefined;
        markObjs[i].verdashedLine.geometry.dispose();
        markObjs[i].verdashedLine.material.dispose();
        drawingGroup.remove(markObjs[i].verdashedLine)
        markObjs[i].verdashedLine = undefined;
        markObjs[i].verLine.geometry.dispose();
        markObjs[i].verLine.material.dispose();
        drawingGroup.remove(markObjs[i].verLine)
        markObjs[i].verLine = undefined;
        markObjs[i].markMesh.geometry.dispose();
        markObjs[i].markMesh.material.dispose();
        drawingGroup.remove(markObjs[i].markMesh)
        markObjs[i].markMesh = undefined;
    }
}

function setGrid(top, right) {
    GRID_TOPLINE = top;
    GRID_RIGHTMOST_LINE = right;
}

function defaultZoomLevel() {
    return currentZoomLevel;
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

function changeDataLineColor(dataLines, color, width, height) {
    DATA_LINE_CORLOR = "#" + color
    matLine = new LineMaterial({
        color: new THREE.Color(DATA_LINE_CORLOR),
        vertexColors: false,
        linewidth: DATA_LINE_WIDTH, // in world units with size attenuation, pixels otherwise
        resolution: new THREE.Vector2(width, height),//FIXME we need to update, not new material
        //resolution:  // to be set by renderer, eventually
        dashed: false,
        alphaToCoverage: true,
        transparent: true,
        opacity: 1.0,
    });
    for (let i = 0; i < dataLines.length; i++) {
        dataLines[i].material.dispose();
        dataLines[i].material = matLine;
        dataLines[i].material.needsUpdate = true;
    }
}

function changePolygonColor(poligons, color) {
    GRADIENT_DATALINE_COLOR = "#" + color
    polygonMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(GRADIENT_DATALINE_COLOR) }
        },
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent,
        transparent: true,
        opacity: 0.4
    });
    for (let i = 0; i < poligons.length; i++) {
        poligons[i].material.dispose();
        poligons[i].material = polygonMaterial;
        poligons[i].material.needsUpdate = true;
    }
}

function convert(point, index) {
    return [axisXConfig.stepX * index + axisXConfig.initialValueX, axisYConfig.stepY * (point.price - axisYConfig.origin) + axisYConfig.initialValueY, 0]
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
    updateHorizontalGrid,
    drawBackground,
    updateMouseMoveLine,
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
    DATA_LINE_CORLOR,
    GRADIENT_DATALINE_COLOR,
    enableHigherActiveLines,
    enableLowerActiveLines,
    disableHigherActiveLines,
    disableLowerActiveLines,
    drawLowerButton,
    updateNewPolygon,
    updateNewLine,
    drawFinishLine,
    updateFinishLine,
    drawMark,
    updateMarks,
    removeMarks,
    changeDataLineColor,
    changePolygonColor,
    maxZoom,
    minZoom,
    convert
}