import Stats from './libs/stats.module.js';
import TWEEN from './libs/tween.esm.js';
import DataClient from './DataClient.js';
import * as THREE from './libs/three/build/three.module.js'

//FIXME
import * as Factory from './Factory.js';

window.dataClient = new DataClient();

let container, stats;
let camera, scene, raycaster, renderer;

const DEFAULT_GRID_STEP = 200
const MAX_GRID_STEP = 300
const MIN_GRID_STEP = 150
const SCROLL_STEP = 1;

const MIN_VIEW_Y = 300;
const MAX_VIEW_Y = 700;
const MIN_DIFF_Y = 100;


let initialCameraPos = { x: Factory.axisXConfig.initialValueX - 50, y: 100, z: 1 }
let GRID_LEFT_MOST_LINE = Factory.axisXConfig.initialValueX


const pointer = new THREE.Vector2();
let mouseTimeLine, mousePriceText, mousePriceLine;
let mouse = { x: 0, y: 0 };
// let circlePos = [0, 0, 0];
let bkgObjs = [];
let last; // timestamp of the last render() call
let lastBlink; // green dot
let points = [];

let activeGroup = new THREE.Group();

let groupTo = { x: 0, y: 0, z: 0 };

// Initial number of second to trigger count down, for example: graph drawing at 13:05:15, if countDownTimer 
// is set 15, then the countdown will be at 13:05:30
let countDownTimer = 15

// Initial number of second to trigger finish timer, for example: graph drawing at 13:05:15, if finishTimer
// is set at 45, then the finishing timer will be at 13:06:00
let finishTimer = 45

let mouseDown = false;
let clickMousePos = { x: 0, y: 0 };
let moving = false;

//let activeGroupMovement = 0;

let activeHorizontalGridObjs = [];
let activeVerticalGridObjs = {};
let activePriceStatusObjs = [];
let activePurchaseLineObjs = [];
let activeFinishLineObjs = [];
let activeDataLineObjs = [];
let activePoligonObjs = [];
let activeMarkObjs = [];

let dataObjs = [];
let wheeling = false;
let noTween = true;
let stretchValue;
let zoomPoint = { x: 0, y: 0 }
let zooming = false;
let tweenZoom;

let lowerButton;
let higherButton;
let lowerText, higherText;
let upMesh, downMesh;
let lowhighButtons = [];

//Draw demo 100 points at start point??
const drawCount = 100;
let beginViewingIndex = 0;
let endViewingIndex = drawCount;
let currentProgress = 0;

let enablePriceMark = true;

showProgress();
dataClient.getHistoricalData(drawCount);

function init() {

    container = document.getElementById('container');
    camera = new THREE.OrthographicCamera(0, container.clientWidth,
        container.clientHeight, 0, -1, 1);
    // initialCameraPos.x += container.clientWidth / 10;
    camera.position.set(initialCameraPos.x, initialCameraPos.y, initialCameraPos.z);

    Factory.setGrid(container.clientHeight + container.offsetTop + 50, container.clientWidth + 100);

    last = Date.now();

    scene = new THREE.Scene();
    // camera.lookAt( scene.position );
    raycaster = new THREE.Raycaster();

    scene.add(camera);
    scene.add(activeGroup);

    let currentGridStep = Factory.axisXConfig.stepX * Factory.defaultZoomLevel()

    // Use activeGroup to include all items that needs moving, so move this group
    // to make it feels like the graph is moving
    initScene(activeGroup, currentGridStep);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x21293c, 0.5);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('wheel', onWheel);

    //show css overlay
    showOverlay();
}

function initScene(drawingGroup, gridStepX) {
    //FIXME
    points = [];
    Factory.drawInitialData(points, drawCount, activeGroup, activePoligonObjs);
    // console.log(points.length, dataClient.currentIndex)

    // console.log("totalpoligons: ", activePoligonObjs.length, drawCount)
    beginViewingIndex = dataClient.currentIndex - Factory.XStepCount - 1;
    endViewingIndex = dataClient.currentIndex;

    let higher = Factory.drawHigherButton(scene, Factory.GRID_RIGHTMOST_LINE);
    upMesh = higher.upMesh
    higherButton = higher.higherButton
    higherText = higher.higherText
    let lower = Factory.drawLowerButton(scene, Factory.GRID_RIGHTMOST_LINE);
    downMesh = lower.downMesh
    lowerButton = lower.lowerButton
    lowerText = lower.lowerText

    // Draw the data line
    Factory.addDataLine(drawingGroup, activeDataLineObjs, points, 0, container.clientWidth, container.clientHeight);
    // console.log("lines: ", activeDataLineObjs.length, points.length);

    // Draw the grid
    Factory.drawHorizontalGrid(activeHorizontalGridObjs, 0, Factory.GRID_TOPLINE, Factory.GRID_RIGHTMOST_LINE - 120)

    Factory.drawVerticalGrid(drawingGroup, activeVerticalGridObjs, points, Math.floor(drawCount / Factory.defaultZoomLevel()), Factory.GRID_TOPLINE, 0)

    let newbkg = Factory.drawBackground(0, drawCount, gridStepX);

    // // Draw the active line
    Factory.drawActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE - 120, drawingGroup.position.x);

    // Draw the purchase line
    Factory.drawPurchaseLine(activePurchaseLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, countDownTimer);

    // Draw the finish line
    Factory.drawFinishLine(activeFinishLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, finishTimer);

    drawingGroup.add(activePurchaseLineObjs[0].purchaseLine)
    drawingGroup.add(activePurchaseLineObjs[0].purchaseText)
    drawingGroup.add(activePurchaseLineObjs[0].timeText)
    drawingGroup.add(activePurchaseLineObjs[0].countDownText)
    drawingGroup.add(activePurchaseLineObjs[0].stopwatch)

    drawingGroup.add(activeFinishLineObjs[0].finishLine)
    drawingGroup.add(activeFinishLineObjs[0].flag)

    drawingGroup.add(activePriceStatusObjs[0].dashedLine)
    drawingGroup.add(activePriceStatusObjs[0].line)
    drawingGroup.add(activePriceStatusObjs[0].greenDot)
    scene.add(activePriceStatusObjs[0].priceShape)
    scene.add(activePriceStatusObjs[0].priceText)
    scene.add(activePriceStatusObjs[0].priceActiveText)

    for (let i = 0; i < activeHorizontalGridObjs.length; i++) {
        scene.remove(activeHorizontalGridObjs[i].line)
        // scene.remove(activeHorizontalGridObjs[i].text)

        scene.add(activeHorizontalGridObjs[i].line)
        // scene.add(activeHorizontalGridObjs[i].text)
    }

    drawingGroup.add(newbkg)
    bkgObjs.push(newbkg)
    lowhighButtons.push(higherButton);
    lowhighButtons.push(lowerButton);
    scene.add(newbkg);
}

function showProgress() {
    if (currentProgress == 0) {
        currentProgress = dataClient.input_value.length;
        var elem = document.getElementById("myBar");
        var width = currentProgress;
        var id = setInterval(frame, currentProgress);
        function frame() {
            if (width > 100) {
                clearInterval(id);
                elem.remove();
                var progressElem = document.getElementById("myProgress");
                progressElem.remove();
                init();
                animate();
            } else {
                // console.log(dataClient.input_value.length)
                width = (dataClient.input_value.length / drawCount * 100).toFixed(0);
                elem.style.width = width + "%";
                elem.innerHTML = width + "%";
            }
        }
    }
}

function onWindowResize() {

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);

    // bkg.scale.set(container.clientWidth, container.clientHeight);
    // bkg.position.set(container.clientWidth / 2, container.clientHeight / 2)

}

// Called when zoomint/out, in onWheel function
function zoom(zoomValue) {
    // Find the position of wheel
    let newGridStep = (Factory.axisXConfig.stepX - zoomValue) * Factory.defaultZoomLevel();
    let lastZoomLevel = Factory.currentZoom();
    let zoomChange = false;
    // Check if need to update grid, remove or add new grid
    if (newGridStep > MAX_GRID_STEP) {
        // zoom in at max for current level, need to change level of zoom
        if (Factory.currentZoom() < Factory.listZoomLevel().length - 1 && Factory.currentZoom() > 0) {
            Factory.currentZoom(Factory.currentZoom() - 1);
            zoomChange = true;
        } else {
            return;
        }
    } else if (newGridStep < MIN_GRID_STEP) {
        // zoom out at max for current level, need to change level of zoom
        if (Factory.currentZoom() >= 0 && Factory.currentZoom() < Factory.listZoomLevel().length - 1 - 1) {
            Factory.currentZoom(Factory.currentZoom() + 1);
            zoomChange = true;
        } else {
            return;
        }
    }

    // Update step between two consecutive data points
    Factory.axisXConfig.stepX -= zoomValue;
    Factory.setXStepCount(Math.floor(Factory.GRID_RIGHTMOST_LINE / Factory.axisXConfig.stepX));

    // Init the index of point where the zoom happens
    let dataIndex = points.length - 1;
    let xLine = zoomPoint.x - activeGroup.position.x;

    // Find the point at which the zoom happens
    for (let i = 0; i < points.length - 1; i++) {
        if (points[i][0] <= xLine && points[i + 1][0] >= xLine) {
            dataIndex = i;
            break;
        }
    }

    // Zoom in/out at the found data point
    for (let i = 0; i < points.length; i++) {
        if (i < dataIndex) {
            points[i][0] += (zoomValue) * (dataIndex - i);
        } else if (i > dataIndex) {
            points[i][0] -= (zoomValue) * (i - dataIndex);
        }
    }

    // Update the data line
    Factory.updateDataLine(activeDataLineObjs, points, 0, points.length - 1);

    // If need to change current zoom level then need to add/remove grids
    if (zoomChange == true) {
        Factory.removeRedundantVerticalGrid(activeGroup, activeVerticalGridObjs);
        Factory.updateVerticalGrid(activeVerticalGridObjs, points, lastZoomLevel, Factory.GRID_TOPLINE);
        //??FIXME update?not create
        Factory.drawVerticalGrid(activeGroup, activeVerticalGridObjs, points, Math.floor(dataClient.currentIndex / Factory.defaultZoomLevel()), Factory.GRID_TOPLINE, 0)
        zoomChange = false;
    } else { //otherwise, update only the geometry of current grid
        Factory.updateVerticalGrid(activeVerticalGridObjs, points, lastZoomLevel, Factory.GRID_TOPLINE);
    }

    // Draw the poligon
    Factory.updatePolygon(activePoligonObjs, points, 0, points.length - 1);

    Factory.updateActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);

    //FIXME update 
    //activeGroup.remove(activePurchaseLineObjs[0].purchaseLine)
    //activeGroup.remove(activePurchaseLineObjs[0].purchaseText)
    //activeGroup.remove(activePurchaseLineObjs[0].timeText)
    //activeGroup.remove(activePurchaseLineObjs[0].countDownText)
    //activeGroup.remove(activePurchaseLineObjs[0].stopwatch)

    //activePurchaseLineObjs = []
    //FIXME update , not draw Factory.drawPurchaseLine(activePurchaseLineObjs, [points[points.length-1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, countDownTimer);
    //activeGroup.add(activePurchaseLineObjs[0].purchaseLine)
    //activeGroup.add(activePurchaseLineObjs[0].purchaseText)
    //activeGroup.add(activePurchaseLineObjs[0].timeText)
    //activeGroup.add(activePurchaseLineObjs[0].countDownText)
    //activeGroup.add(activePurchaseLineObjs[0].stopwatch)
    // wheeling = false;
}

// Event triggered when zoom
function onWheel(event) {
    let pivotPoint = { x: 0, y: 0 }
    // Find the intersect point to detect the data index where the zoom happens
    pivotPoint.x = ((event.clientX - container.offsetLeft) / (container.clientWidth)) * 2 - 1;
    pivotPoint.y = - ((event.clientY - container.offsetTop) / (container.clientHeight)) * 2 + 1;
    let intersects = raycaster.intersectObjects(bkgObjs);
    if (intersects.length > 0) {
        // console.log("pos: ", activeGroup.position.x)
        stretchValue = SCROLL_STEP;
        // Zoom in means negative, zoom out mean positive
        zoomPoint.x = intersects[0].point.x;
        zoomPoint.y = intersects[0].point.y;
        let gridFrom = ({ x: 0.1, y: 0, z: 0 });
        let gridTo = ({ x: stretchValue, y: 0, z: 0 });
        if (tweenZoom) {
            tweenZoom.stop();
        }
        tweenZoom = new TWEEN.Tween(gridFrom).to(gridTo, 200).onUpdate(function (object) {
            if (event.deltaY > 0) {
                zoom(object.x);
            } else {
                zoom(-object.x);
            }
        }).onComplete(function () {
            // currentGridStep += stretchValue * Factory.defaultZoomLevel();
            // currentGridStep = Math.abs(points[5][0] - points[0][0])
            // console.log("Steps of 5: ", Math.abs(points[5][0] - points[0][0]))
            Factory.setXStepCount(Math.floor(Factory.GRID_RIGHTMOST_LINE / Factory.axisXConfig.stepX));
            updateView();
        })
            .easing(TWEEN.Easing.Linear.None).start();
    }
}

// Event mouse move, use this for both drag and drawing the line at the mouse cursor
function onPointerMove(event) {
    //event.preventDefault();

    // If mouse is down, then it is drag
    if (mouseDown == true) {
        let deltaX = (event.clientX - clickMousePos.x);
        clickMousePos.x = event.clientX;
        clickMousePos.y = event.clientY;
        let beginningLine = initialCameraPos.x;
        let xLeftLine = beginningLine - activeGroup.position.x;
        let xRightLine = (Factory.GRID_RIGHTMOST_LINE / 2 - activeGroup.position.x);
        // console.log("currentIndex: ", currentIndex, deltaX);
        if (deltaX > 0) {
            if (xLeftLine > points[0][0] - 2 * Factory.axisXConfig.stepX) {
                activeGroup.position.set(activeGroup.position.x + deltaX, activeGroup.position.y, activeGroup.position.z);
                // beginViewingIndex -= Math.floor(deltaX / Factory.axisXConfig.stepX);
                // endViewingIndex -= Math.floor(deltaX / Factory.axisXConfig.stepX);
                // console.log(deltaX);
            }
            moving = true;
            updateView();
        } else {
            if (xRightLine > points[dataClient.currentIndex - 2][0]) {
                moving = false;
            } else {
                activeGroup.position.set(activeGroup.position.x + deltaX, activeGroup.position.y, activeGroup.position.z);
                // beginViewingIndex += Math.floor(deltaX / Factory.axisXConfig.stepX);
                // endViewingIndex += Math.floor(deltaX / Factory.axisXConfig.stepX);
                // console.log(deltaX);
                moving = true;
                updateView();
            }
        }
        // otherwise, just update the line at the mouse cursor
    } else {
        mouse.x = ((event.clientX - container.offsetLeft) / (container.clientWidth)) * 2 - 1;
        mouse.y = - ((event.clientY - container.offsetTop) / (container.clientHeight)) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(bkgObjs);
        if (intersects.length > 0) {
            Factory.updateMouseMoveLine(scene, intersects[0].point.x, intersects[0].point.y, Factory.axisXConfig.initialValueX);
        }

        if (enablePriceMark == true) {
            let intersects2 = raycaster.intersectObjects(lowhighButtons);
            if (intersects2.length > 0) {
                // updateMouseMoveLine(intersects[0].point.x, intersects[0].point.y);
                if (higherButton == intersects2[0].object) {
                    // console.log("HIGHER");
                    scene.add(activePriceStatusObjs[0].higherArea)
                    activeGroup.remove(activePriceStatusObjs[0].downArrow)
                    activeGroup.add(activePriceStatusObjs[0].upArrow)
                    Factory.enableHigherActiveLines(higherButton, activePriceStatusObjs);
                    scene.remove(activePriceStatusObjs[0].lowerArea)
                }

                if (lowerButton == intersects2[0].object) {
                    // console.log("LOWER");
                    activeGroup.remove(activePriceStatusObjs[0].upArrow)
                    activeGroup.add(activePriceStatusObjs[0].downArrow)
                    Factory.enableLowerActiveLines(lowerButton, activePriceStatusObjs);
                    scene.add(activePriceStatusObjs[0].lowerArea)
                    scene.remove(activePriceStatusObjs[0].higherArea)
                }
            } else {
                activeGroup.remove(activePriceStatusObjs[0].downArrow)
                activeGroup.remove(activePriceStatusObjs[0].upArrow)
                Factory.disableHigherActiveLines(higherButton, activePriceStatusObjs);
                Factory.disableLowerActiveLines(lowerButton, activePriceStatusObjs);
                scene.remove(activePriceStatusObjs[0].lowerArea)
                scene.remove(activePriceStatusObjs[0].higherArea)
            }
        }
    }
}

function handleHigherButtonClick(higherCallback) {
    let from = { x: 1, y: 1 };
    let to = { x: 0.8, y: 0.8 };
    let initialScale = upMesh.scale.clone();
    Factory.drawMark(activeGroup, activeMarkObjs, [points[points.length - 1]], false, points.length - 1, Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);
    new TWEEN.Tween(from).to(to, 150).onUpdate(function (object) {
        // higherGroup.scale.set(object.x, object.y)
        higherButton.scale.set(object.x, object.y);
        higherText.scale.set(object.x, object.y);
        // upMesh.scale.set(initialScale.x * object.x, initialScale.y * object.y);
        // intersects2[0].object.scale.set(object.x, object.y);
    }).onComplete(function () {
        let restoreFrom = { x: 0.8, y: 0.8 };
        let restoreTo = { x: 1, y: 1 };
        new TWEEN.Tween(restoreFrom).to(restoreTo, 150).onUpdate(function (object) {
            higherButton.scale.set(object.x, object.y);
            higherText.scale.set(object.x, object.y);
            // upMesh.scale.set(initialScale.x / object.x, initialScale.y / object.y);
            // higherGroup.scale.set(object.x, object.y)
        }).onComplete(function () {
            if (typeof higherCallback == "function") {
                higherCallback("no problem");
            }
        })
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    })
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
}

function higherButtonClickCallback(value) {
    console.log("Callback when click on HigherButton with ", value)
}

function lowerButtonClickCallback(value) {
    console.log("Callback when click on LowerButton with ", value)
}

function handleLowerButtonClick(lowerCallback) {
    let from = { x: 1, y: 1 };
    let to = { x: 0.8, y: 0.8 };

    Factory.drawMark(activeGroup, activeMarkObjs, [points[points.length - 1]], true, points.length - 1, Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);
    new TWEEN.Tween(from).to(to, 200).onUpdate(function (object) { // zoom out button
        lowerButton.scale.set(object.x, object.y);
        lowerText.scale.set(object.x, object.y);
    }).onComplete(function () { // restore button
        let restoreFrom = { x: 0.8, y: 0.8 };
        let restoreTo = { x: 1, y: 1 };
        new TWEEN.Tween(restoreFrom).to(restoreTo, 200).onUpdate(function (object) {
            lowerButton.scale.set(object.x, object.y);
            lowerText.scale.set(object.x, object.y);
        }).onComplete(function () {
            if (typeof higherCallback == "function") {
                lowerCallback("no problem");
            }
        })
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    })
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
}

// Mouse down event to detect if it is a drag or not
function onPointerDown(event) {
    //event.preventDefault();
    clickMousePos.x = event.clientX;
    clickMousePos.y = event.clientY;
    mouseDown = true;
    let mouseClick = { x: 0, y: 0 };
    mouseClick.x = ((event.clientX - container.offsetLeft) / (container.clientWidth)) * 2 - 1;
    mouseClick.y = - ((event.clientY - container.offsetTop) / (container.clientHeight)) * 2 + 1;
    raycaster.setFromCamera(mouseClick, camera);
    if (enablePriceMark == true) {
        let intersects2 = raycaster.intersectObjects(lowhighButtons);
        if (intersects2.length > 0) {
            // console.log(intersects2[0].object)
            // intersects2[0].object.scale.setScalar(0.8);
            if (higherButton == intersects2[0].object) {
                handleHigherButtonClick(higherButtonClickCallback);
            }

            if (lowerButton == intersects2[0].object) {
                handleLowerButtonClick(lowerButtonClickCallback);
            }
            let biggerFrom = { x: 1, y: 1 };
            let biggerTo = { x: 2, y: 2 };
            new TWEEN.Tween(biggerFrom).to(biggerTo, 200).onUpdate(function (object) {
                activeMarkObjs.slice(-1)[0].ovalMesh.scale.set(object.x * 2, object.y * 1.5);
                activeMarkObjs.slice(-1)[0].investText.scale.set(object.x, object.y);
            }).onComplete(function () {
                let restoreFrom = { x: 2, y: 2 };
                let restoreTo = { x: 1, y: 1 };
                new TWEEN.Tween(restoreFrom).to(restoreTo, 200).onUpdate(function (object) {
                    activeMarkObjs.slice(-1)[0].ovalMesh.scale.set(object.x * 2, object.y * 1.5);
                    activeMarkObjs.slice(-1)[0].investText.scale.set(object.x, object.y);
                })
                    .easing(TWEEN.Easing.Quadratic.InOut)
                    .start();
            }).easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }
    }
}

function onPointerUp(event) {
    mouseDown = false;
}

// Use to rescale the data so it will fit into the view
function rescale(newStepDelta, beginIndex, endIndex, newInitialValueYDelta) {
    // console.log("rescale: ", beginIndex, endIndex, points.length);
    for (let i = beginIndex; i <= endIndex; i++) {
        // console.log("rescaled: ", points[i]);
        if (points[i] == undefined) {
            continue;
        }
        points[i][1] = (dataClient.input_value[i].price - dataClient.getOrigin().price) * newStepDelta * 1000 + newInitialValueYDelta;
    }
}

// Find the list of points in the current view
function updateListOfViewingIndex() {
    let beginningLine = initialCameraPos.x;
    let xLeftLine = beginningLine - activeGroup.position.x; // leftline is the left most line of the view
    let xRightLine = Factory.GRID_RIGHTMOST_LINE - activeGroup.position.x; // leftline is the right most line of the view
    beginViewingIndex = 0;
    endViewingIndex = dataClient.currentIndex;
    for (let i = 0; i < points.length - 1; i++) {
        if (points[i][0] <= xLeftLine && points[i + 1][0] >= xLeftLine) {
            beginViewingIndex = i;
        }

        if (points[i][0] <= xRightLine && points[i + 1][0] >= xRightLine) {
            endViewingIndex = i;
        }
    }
}

function calculateAxisY(newConfig) {

    let maxY = points[beginViewingIndex][1];
    let minY = points[beginViewingIndex][1];
    let maxYIndex = beginViewingIndex;
    let minYIndex = beginViewingIndex;
    // console.log("beginViewIndex and endViewingIndex and currentIndex: ", beginViewingIndex, endViewingIndex, dataClient.currentIndex);
    for (let i = beginViewingIndex; i < endViewingIndex; i++) {
        if (points[i] == undefined) {
            continue;
        }
        if (points[i][1] > maxY) {
            maxY = points[i][1];
            maxYIndex = i;
        }

        if (points[i][1] < minY) {
            minY = points[i][1];
            minYIndex = i;
        }
    }
    let newStepY = Factory.axisYConfig.stepY;
    let currentPos = (dataClient.input_value[dataClient.currentIndex].price - dataClient.getOrigin().price) * Factory.axisYConfig.stepY * 1000 + Factory.axisYConfig.initialValueY;
    let prevPos = (dataClient.input_value[dataClient.currentIndex - 1].price - dataClient.getOrigin().price) * Factory.axisYConfig.stepY * 1000 + Factory.axisYConfig.initialValueY;
    // if update is needed
    if (minY < MIN_VIEW_Y || maxY > MAX_VIEW_Y || (currentPos - prevPos) < MIN_DIFF_Y) {
        // console.log("Rescale needed: ", maxY, minY);
        // To calculate the newY that will fit into the view, use the predefined max, min view Y
        newStepY = ((MAX_VIEW_Y - MIN_VIEW_Y)) / 1000 / (dataClient.input_value[maxYIndex].price - dataClient.input_value[minYIndex].price);
        let newInitialValueY = Factory.axisYConfig.initialValueY;
        if (minY < MIN_VIEW_Y) {
            // console.log("Rescale needed MIN_VIEW: ", input_value[maxYIndex].price - input_value[minYIndex].price);
            newInitialValueY = (MIN_VIEW_Y - (dataClient.input_value[minYIndex].price - dataClient.getOrigin().price) * newStepY * 1000);
            // console.log("newInitialValueY: ", newInitialValueY);
        } else if (maxY > MAX_VIEW_Y) {
            // console.log("Rescale needed MAX_VIEW: ", input_value[maxYIndex].price - input_value[minYIndex].price);
            newInitialValueY = (MAX_VIEW_Y - (dataClient.input_value[maxYIndex].price - dataClient.getOrigin().price) * newStepY * 1000);
            // console.log("newInitialValueY: ", newInitialValueY);
        }
        newConfig.stepY = newStepY;
        newConfig.initialValueY = newInitialValueY;
        return true;//need to update
    }

    return false;

}

// Use to recalculate the data and update view for autoscaling
var scaleTween = null;
function updateView(addNewData, refreshView) {
    // Check current list of showing
    if (moving == true) {
        updateListOfViewingIndex();
    } else {
        beginViewingIndex = dataClient.currentIndex - Factory.XStepCount > 0 ? dataClient.currentIndex - Factory.XStepCount : 0;//FIXME??
        endViewingIndex = dataClient.currentIndex;
    }

    let newConfig = Factory.axisYConfig.clone();
    let need2Update = calculateAxisY(newConfig);
    // console.log("stepY, initY ", Factory.axisYConfig.stepY, Factory.axisYConfig.initialValueY);
    // console.log("begin, end ", beginViewingIndex, endViewingIndex, dataClient.currentIndex, Factory.XStepCount);
    if (need2Update) {
        // console.log("Need Update");
        new TWEEN.Tween(Factory.axisYConfig).to(newConfig, 400).onUpdate(function (object) {
            //We also update geometry while rescale -> render is updated
            // console.log(object)
            rescale(object.stepY, beginViewingIndex, endViewingIndex, object.initialValueY);
            updateGeometries(beginViewingIndex, endViewingIndex);//FIXME,so risky
        }).easing(TWEEN.Easing.Quadratic.InOut)
            .start();
        Factory.axisYConfig.stepY = newConfig.stepY;
        Factory.axisYConfig.initialValueY = newConfig.initialValueY;
    } else {
        if (refreshView == true) {
            updateGeometries();//FIXME
        }
    }
}

function updateActiveGroup(newY) {
    // Find new pos here based on the old pos and step of X
    // let newY = (input_value[currentIndex].price - input_value[0].price) * Factory.axisYConfig.stepY * 1000 + Factory.axisYConfig.initialValueY;
    // let newY = (dataClient.input_value[dataClient.currentIndex].price - dataClient.getOrigin().price) * Factory.axisYConfig.stepY * 1000 + Factory.axisYConfig.initialValueY;
    let tempPos = [points[points.length - 1]];
    let newPos = [tempPos[0][0] + Factory.axisXConfig.stepX, newY, 0];
    // points.push([parseFloat(newPos[0]), parseFloat(newPos[1]), 0]);
    // updateView(true);
    // newPos[1] = points[dataClient.currentIndex - 1][1];
    // console.log("newPos: ", newPos)
    // console.log("Factory.axisXConfig.stepX: ", Factory.axisXConfig.stepX)
    groupTo = ({ x: activeGroup.position.x - Factory.axisXConfig.stepX, y: activeGroup.position.y, z: 0 });

    // Move the activeGroup so that it feels like moving
    if (newPos[0] > (Factory.GRID_RIGHTMOST_LINE / 2 - activeGroup.position.x)) {
        // console.log(drawingGroup.position.x);
        // console.log(point.x - (Factory.GRID_RIGHTMOST_LINE/2 - drawingGroup.position.x));
        //activeGroupMovement -= (newPos[0] - (Factory.GRID_RIGHTMOST_LINE / 2 - activeGroup.position.x));
        // drawingGroup.position.x = drawingGroup.position.x - (newPos[0] - (Factory.GRID_RIGHTMOST_LINE/2 - drawingGroup.position.x));
        groupTo = ({ x: activeGroup.position.x - (newPos[0] - (Factory.GRID_RIGHTMOST_LINE / 2 - activeGroup.position.x)), y: activeGroup.position.y, z: 0 });
        // activeGroupMovement -= (point.x - Factory.axisXConfig.stepX);
        // drawingGroup.position.x = drawingGroup.position.x - Factory.axisXConfig.stepX;
        // drawingGroup.position.set(drawingGroup.position.x - (point.x - Factory.GRID_RIGHTMOST_LINE / 2), drawingGroup.position.y, drawingGroup.position.z);
        if (mouseDown == false && moving == false) {
            // but only move if there is no dragging
            new TWEEN.Tween(activeGroup.position).to(groupTo, 400).onUpdate(function () {
            })
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }
    }

    return newPos;
}

function triggerAtPurchaseTime(value) {
    console.log("Reach purchase time with ", value)
}

function triggerAtFinishingTime(value) {
    console.log("Reach finishing time with ", value)
}

//FIXME????
function updateOtherStuff(triggerAtPurchaseCallback, triggerAtFinishingCallback) {
    countDownTimer--;
    finishTimer--;
    if (countDownTimer == 0) {
        // Greyout buttons
        enablePriceMark = false;
        Factory.disableHigherActiveLines(higherButton, activePriceStatusObjs, 0x1a6625);
        Factory.disableLowerActiveLines(lowerButton, activePriceStatusObjs, 0x782719);
        // Draw new PurchaseLine
        countDownTimer = 60;

        if (typeof triggerAtPurchaseCallback == "function") {
            triggerAtPurchaseCallback("no problem")
        }
    }
    if (finishTimer == 0) {
        // Remove all marks
        Factory.removeMarks(activeGroup, activeMarkObjs);
        // Re-enable buttons
        Factory.enableHigherActiveLines(higherButton, activePriceStatusObjs);
        Factory.enableLowerActiveLines(lowerButton, activePriceStatusObjs);
        enablePriceMark = true;
        countDownTimer = 60;
        finishTimer = 70;

        if (typeof triggerAtFinishingCallback == "function") {
            triggerAtFinishingCallback("no problem")
        }
    }
    Factory.drawVerticalGrid(activeGroup, activeVerticalGridObjs, points, 1, Factory.GRID_TOPLINE, Math.floor(dataClient.currentIndex / Factory.defaultZoomLevel()) * Factory.defaultZoomLevel());
    Factory.updatePurchaseLine(activeGroup, activePurchaseLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, countDownTimer);
    Factory.updateFinishLine(activeGroup, activeFinishLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, finishTimer);
}

// Fetch new data from input and draw it with animation
//function drawNewData(newY, enableAnimation) {
function drawNewData(newY) {
    let newPos = updateActiveGroup(newY);//???
    // tempdata here is just for tween
    let tempDataObjs = [];
    let tempPolyPoints = [];
    let tempPolyObjs = [];
    let tempPos = [points[points.length - 1]];
    let tweenFrom = ({ x: tempPos[0][0], y: tempPos[0][1], z: 0 });
    let tweenTo = ({ x: newPos[0], y: newPos[1], z: 0 });
    //tempPolyPoints.push([tweenFrom.x, tweenFrom.y, 0]);
    //points.push([tweenFrom.x, tweenFrom.y, 0]);

    //Just push new and updating value in real-time

    points.push([tweenFrom.x, tweenFrom.y, 0]);
    Factory.addPolygon(activeGroup, activePoligonObjs, points, points.length - 2);
    Factory.addDataLine(activeGroup, activeDataLineObjs, points, points.length - 2, container.clientWidth, container.clientHeight)
    dataClient.updateSequence();
    let lastX = tempPos[0][0];
    let lastY = tempPos[0][1];
    let newDataInterpolate = new TWEEN.Tween(tweenFrom).to(tweenTo, 400).onUpdate(function (object) {
        //tempPolyPoints.push([parseFloat(object.x), parseFloat(object.y), 0])
        // Draw new lines so it make smooth animation but because tween create too many points,
        // so these temporary lines, polygon will be removed later
        //Factory.addDataLine(activeGroup, tempDataObjs, tempPolyPoints,tempPolyPoints.length-2, container.clientWidth, container.clientHeight)

        points[points.length - 1][0] += object.x - lastX;
        points[points.length - 1][1] += object.y - lastY;
        Factory.updatePolygonSingle(activePoligonObjs, tempPos[0][0], tempPos[0][1], points[points.length - 1][0], points[points.length - 1][1], points.length - 2);
        Factory.updateDataLineSingle(activeDataLineObjs, tempPos[0][0], tempPos[0][1], points[points.length - 1][0], points[points.length - 1][1], points.length - 2);
        lastX = object.x;
        lastY = object.y;

        Factory.updateActiveLines(activePriceStatusObjs, [[points[points.length - 1][0], points[points.length - 1][1], 0]], Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);
    }).onComplete(function () {


        //update view if need
        // if (onUpdated) {
        //     onUpdated(true);
        // }
        // console.log(points.length, activePoligonObjs.length)
        //currentIndex++; // increase the current index of the data//????FIXME


        updateOtherStuff(triggerAtPurchaseTime, triggerAtFinishingTime);
    })
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
}

function updateGreenPoint(now) {
    if (!lastBlink || now - lastBlink >= 900) {
        if (activePriceStatusObjs[0].greenGlow != undefined) {
            lastBlink = now;
            let percent = 1;
            let tempPos = [points[points.length - 1]];
            let newY = (dataClient.input_value[dataClient.currentIndex].price - dataClient.getOrigin().price) * Factory.axisYConfig.stepY * 1000 + Factory.axisYConfig.initialValueY;//????FIXME
            let newPos = [tempPos[0][0] + Factory.axisXConfig.stepX, newY, 0];
            let tweenFrom = ({ x: tempPos[0][0], y: tempPos[0][1], z: 0 });
            let tweenTo = ({ x: newPos[0], y: newPos[1], z: 0 });
            new TWEEN.Tween(tweenFrom).to(tweenTo, 500).onUpdate(function (object) {
                percent = percent + 3.2;
                activePriceStatusObjs[0].greenGlow.scale.set(percent, percent, 1)

                activePriceStatusObjs[0].greenGlow.needsUpdate = true;
            }).easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }
    }
}

function updateGeometries(beginIndex, endIndex) {
    beginIndex = beginIndex === undefined ? beginViewingIndex : beginIndex;
    endIndex = endIndex === undefined ? endViewingIndex : endIndex;
    // Update the data line, note that two points make one data line
    Factory.updateDataLine(activeDataLineObjs, points, beginIndex, endIndex);
    // activeGroup.position.set(activeGroup.position.x + (stretchValue) * 2, activeGroup.position.y, activeGroup.position.z);
    // Draw the poligon

    //  Two points make one poligon also
    Factory.updatePolygon(activePoligonObjs, points, beginIndex, endIndex);

    Factory.updateActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);

    Factory.updatePurchaseLine(activeGroup, activePurchaseLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, countDownTimer);

    Factory.updateFinishLine(activeGroup, activeFinishLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, finishTimer);

    Factory.updateMarks(activeMarkObjs, points, Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);
}

//dummy or real data from server. Should be prepared asyn into cache
function getNewY(now) {
    let newVal = dataClient.getSyncNext(now);
    if (newVal === undefined) return;

    return newVal;
}

function update(now) {
    let newVal = getNewY(now);
    if (newVal) {//???WHAT IS FOR
        // console.log("before", Factory.axisYConfig.stepY, Factory.axisYConfig.initialValueY)
        let newY = (newVal.price - dataClient.getOrigin().price) * Factory.axisYConfig.stepY * 1000 + Factory.axisYConfig.initialValueY;
        drawNewData(newY);
        updateView(false, false);
        // console.log("after", Factory.axisYConfig.stepY, Factory.axisYConfig.initialValueY)
    }
    //updateView(newY);
}

function render() {
    //draw frame
    renderer.render(scene, camera);
}

function animate() {

    TWEEN.update();
    let now = Date.now();


    //FIXME green point is also in view
    update(now);

    // control the blink of the green point
    updateGreenPoint(now);


    render();

    stats.update();

    requestAnimationFrame(animate);
}

function showOverlay(){
    document.getElementById("overlay").style.display="block";
}