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
const MIN_DIFF_Y = 1;


let initialCameraPos = { x: Factory.axisXConfig.initialValueX - 50, y: 100, z: 1 }
let GRID_LEFT_MOST_LINE = Factory.axisXConfig.initialValueX


const pointer = new THREE.Vector2();
let mouseTimeLine, mousePriceText, mousePriceLine;
let mouse = { x: 0, y: 0 };
// let circlePos = [0, 0, 0];
let bkgObjs = [];
let last = 0; // timestamp of the last render() call
let lastBlink; // green dot
let points = [];

let activeGroup = new THREE.Group();

let groupTo = { x: 0, y: 0, z: 0 };

// Initial number of second to trigger count down, for example: graph drawing at 13:05:15, if countDownTimer 
// is set 15, then the countdown will be at 13:05:30
let countDownTimer = 15;

let fromCountDownToFinish = 30;
// Initial number of second to trigger finish timer, for example: graph drawing at 13:05:15, if finishTimer
// is set at 45, then the finishing timer will be at 13:06:00
let finishTimer = countDownTimer + fromCountDownToFinish;

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

const drawCount = 240;
let beginViewingIndex = 0;
let endViewingIndex = drawCount;
let currentProgress = 0;

let enablePriceMark = true;

let lastDraw = { newY: 0, count: 1 };

let round = 1;
// let originIndex = 0;

showProgress();
dataClient.getHistoricalData(drawCount);

function init() {
    initColorPicker();
    let profitPercent = document.getElementById('profit-per').textContent.replace(/\D/g, '')
    let investTotal = document.getElementById('price').value
    let profitVal = document.getElementById('profit-val')

    let calculatedProfit = parseFloat(profitPercent) * parseFloat(investTotal) / 100
    // console.log(profitPercent, investTotal, calculatedProfit)
    profitVal.innerHTML = '+' + calculatedProfit + '$'

    container = document.getElementById('container');
    camera = new THREE.OrthographicCamera(0, container.clientWidth,
        container.clientHeight, 0, -1, 1);
    // initialCameraPos.x += container.clientWidth / 10;
    camera.position.set(initialCameraPos.x, initialCameraPos.y, initialCameraPos.z);

    Factory.setGrid(container.clientHeight + container.offsetTop + 50, container.clientWidth + 100);

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
    document.addEventListener('visibilitychange', function () {
        //no need, we will get all latest data
        //last = 0;
    });

    //show css overlay
    showOverlay();

    showZoomButtons();
}

function initScene(drawingGroup, gridStepX) {
    //FIXME
    points = [];
    Factory.drawInitialData(points, drawCount, activeGroup, activePoligonObjs);
    // console.log(points.length, dataClient.currentIndex)

    // console.log("totalpoligons: ", activePoligonObjs.length, drawCount)
    beginViewingIndex = 0;
    // originIndex = beginViewingIndex;
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
        scene.remove(activeHorizontalGridObjs[i].text)

        scene.add(activeHorizontalGridObjs[i].line)
        scene.add(activeHorizontalGridObjs[i].text)
    }

    drawingGroup.add(newbkg)
    bkgObjs.push(newbkg)
    lowhighButtons.push(higherButton);
    lowhighButtons.push(lowerButton);
    scene.add(newbkg);
}

function triggerAtPurchaseTime(value) {
    console.log("Reach purchase time with ", value)
}

function showProgress() {
    if (currentProgress == 0) {
        currentProgress = dataClient.input_value.length / drawCount * 100;
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
                // console.log(currentProgress)
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

// Having the x value of the screen, find the point from it
function x2DataIndex(x) {
    let dataIndex = points.length - 1; // init value
    let xLine = x - activeGroup.position.x; // find the actual x value of the viewing area (show on the screen)

    // Find the point at which the zoom happens
    for (let i = 0; i < points.length - 1; i++) {
        if (points[i][0] <= xLine && points[i + 1][0] >= xLine) { // basically return the index if the x is between two consecutive points
            dataIndex = i;
            break;
        }
    }
    return dataIndex
}

// Zoom along the x axis
function zoomFrom(x, zoomValue) {
    let xLine = x - activeGroup.position.x; // find the actual x value of the viewing area

    // Find the point at which the zoom happens
    for (let i = 0; i < points.length; i++) {
        points[i][0] -= (zoomValue) * (points[i][0] - xLine); // move the left points of the zoom line to the left, right points of the zoom line to right
    }

    // Update step between two consecutive data points
    // Factory.axisXConfig.stepX -= zoomValue;
    Factory.axisXConfig.stepX = points[1][0] - points[0][0]
    // Factory.setXStepCount((Factory.axisXConfig.stepX - zoomValue) * Factory.defaultZoomLevel());
    // console.log("Updated: ", Factory.axisXConfig.stepX);
}

// Called when zoomint/out, in onWheel function
function zoom(zoomValue) {
    // Find the position of wheel
    let newGridStep = (Factory.axisXConfig.stepX - zoomValue) * Factory.defaultZoomLevel();
    let lastZoomLevel = Factory.currentZoom();
    let newDraw = false;

    if (zoomValue < 0) { // Zoom in
        if (newGridStep > MAX_GRID_STEP) {
            // zoom in at max for current level, need to change level of zoom
            if (Factory.currentZoom() < Factory.listZoomLevel().length - 1 && lastZoomLevel > 0.5) {//avoid float accuracy
                Factory.currentZoom(Factory.currentZoom() - 1);
                newDraw = true;
            } else {
                return;
            }
        }
    } else if (zoomValue > 0) { // Zoom out
        if (newGridStep < MIN_GRID_STEP) {
            if (lastZoomLevel >= 0 && Factory.currentZoom() <= Factory.listZoomLevel().length - 1 - 1) {
                Factory.currentZoom(Factory.currentZoom() + 1);
                newDraw = true;
            } else {
                return;
            }
        }
    } else {
        return;
    }

    // Init the index of point where the zoom happens
    zoomFrom(zoomPoint.x, zoomValue / 10.0);

    // Update the data line
    Factory.updateDataLine(activeDataLineObjs, points, beginViewingIndex, endViewingIndex);

    // If need to change current zoom level then need to add/remove grids
    if (newDraw == true) {
        Factory.removeRedundantVerticalGrid(activeGroup, activeVerticalGridObjs);
        Factory.updateVerticalGrid(activeVerticalGridObjs, points, Factory.currentZoom(), Factory.GRID_TOPLINE);
        //??FIXME update?not create
        Factory.drawVerticalGrid(activeGroup, activeVerticalGridObjs, points, Math.floor(dataClient.currentIndex / Factory.defaultZoomLevel()), Factory.GRID_TOPLINE, 0)
    } else { //otherwise, update only the geometry of current grid
        Factory.updateVerticalGrid(activeVerticalGridObjs, points, Factory.currentZoom(), Factory.GRID_TOPLINE);
    }

    // Draw the poligon
    Factory.updatePolygon(activePoligonObjs, points, beginViewingIndex, endViewingIndex);

    Factory.updateActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);
}

function zoomWithEffect(isZoomIn) {
    // console.log("pos: ", activeGroup.position.x)
    stretchValue = SCROLL_STEP; // fix step of zooming here
    // Zoom in means negative, zoom out mean positive
    let gridFrom = ({ x: 0.1, y: 0, z: 0 });
    let gridTo = ({ x: stretchValue, y: 0, z: 0 });
    if (tweenZoom) {
        tweenZoom.stop();
    }
    tweenZoom = new TWEEN.Tween(gridFrom).to(gridTo, 100).onUpdate(function (object) { // tween supports zooming effect
        if (isZoomIn) {
            zoom(-object.x);
        } else {
            zoom(object.x);
        }
    }).onComplete(function () {
        // console.log("Steps of 5: ", Math.abs(points[5][0] - points[0][0]))
        // count number of steps along the x axis, this will be used to determine the list of point on the graph area
        Factory.setXStepCount(Math.floor(Factory.GRID_RIGHTMOST_LINE / Factory.axisXConfig.stepX));
        Factory.axisYConfig.stepY *= 2;
        // console.log(Factory.axisXConfig.stepX, Factory.currentZoom());
        updateView(false, true);
    })
        .easing(TWEEN.Easing.Linear.None).start();
}

// Event triggered when zoom
function onWheel(event) {
    let pivotPoint = { x: 0, y: 0 }
    // Find the intersect point to detect the data index where the zoom happens
    pivotPoint.x = ((event.clientX - container.offsetLeft) / (container.clientWidth)) * 2 - 1;
    pivotPoint.y = - ((event.clientY - container.offsetTop) / (container.clientHeight)) * 2 + 1;
    let intersects = raycaster.intersectObjects(bkgObjs);
    if (intersects.length > 0) {
        zoomPoint.x = intersects[0].point.x;
        zoomPoint.y = intersects[0].point.y;
        // basically, from the pivotPoint zoom points on the left of the point to the left
        // and the right points to the right
        if (event.deltaY > 0) {
            zoomWithEffect(false);
        } else {
            zoomWithEffect(true);
        }
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
        let xLeftLine = beginningLine - activeGroup.position.x; // beginning line, to check if moving left is still allowed
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
            if (xRightLine > points[dataClient.currentIndex - 2][0]) { // ending line, to check if moving right is still allowed
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
        // just handle the mouse click on buttons
        if (intersects.length > 0) {
            //console.log(intersects[0].point.x)
            let dataIndex = x2DataIndex(intersects[0].point.x);
            let val = dataClient.input_value[dataIndex].time;
            Factory.updateMouseMoveLine(scene, intersects[0].point.x, intersects[0].point.y, Factory.axisXConfig.initialValueX, val);
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

function handleHigherButtonClick(invest) {
    let from = { x: 1, y: 1 };
    let to = { x: 0.8, y: 0.8 };
    let initialScale = upMesh.scale.clone();
    Factory.drawMark(activeGroup, activeMarkObjs, [points[points.length - 1]], false, points.length - 1, Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x, invest, flipflop);
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

        })
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    })
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
}

function higherButtonClickCallback(value, price) {
    console.log("Callback when click on HigherButton with ", value)
    document.getElementById('audio').play();
    let url = 'http://192.168.136.134:10000/bets/'
    let amount = document.getElementById('price').value;
    let currentTimeStamp = Date.now();
    let betContent = JSON.stringify({
        "bets": {
            "amount": amount,
            "point": price,
            "type": "above",
            "time": currentTimeStamp
        },
        "round": round
    })
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 201) {
            alert(xhr.responseText); // Another callback here
        }
    };
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(betContent);
    console.log(betContent)
}

function lowerButtonClickCallback(value, price) {
    console.log("Callback when click on LowerButton with ", value);
    document.getElementById('audio').play();
    let url = 'http://192.168.136.134:10000/bets/'
    let amount = document.getElementById('price').value;
    let currentTimeStamp = Date.now();
    let betContent = JSON.stringify({
        "bets": {
            "amount": amount,
            "point": price,
            "type": "below",
            "time": currentTimeStamp
        },
        "round": round
    })
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 201) {
            alert(xhr.responseText); // Another callback here
        }
    };
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(betContent);
    console.log(betContent)
}

function handleLowerButtonClick(invest) {
    let from = { x: 1, y: 1 };
    let to = { x: 0.8, y: 0.8 };

    Factory.drawMark(activeGroup, activeMarkObjs, [points[points.length - 1]], true, points.length - 1, Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x, invest, flipflop);
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
                handleHigherButtonClick($("#price").val());
                higherButtonClickCallback($("#price").val(), dataClient.input_value[dataClient.input_value.length - 1].price);
            }

            if (lowerButton == intersects2[0].object) {
                handleLowerButtonClick($("#price").val());
                lowerButtonClickCallback($("#price").val(), dataClient.input_value[dataClient.input_value.length - 1].price);
            }
        }
    }
}

// scale up and then scale down the icon
function flipflop(obj) {
    let biggerFrom = { x: obj.scale.x, y: obj.scale.y };
    let biggerTo = { x: obj.scale.x * 2, y: obj.scale.y * 2 };
    new TWEEN.Tween(biggerFrom).to(biggerTo, 200).onUpdate(function (object) {
        obj.scale.set(object.x, object.y);
    }).onComplete(function () {
        let restoreFrom = { x: obj.scale.x, y: obj.scale.y };
        let restoreTo = { x: obj.scale.x / 2, y: obj.scale.y / 2 };
        new TWEEN.Tween(restoreFrom).to(restoreTo, 200).onUpdate(function (object) {
            obj.scale.set(object.x, object.y);//BAD
        })
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }).easing(TWEEN.Easing.Quadratic.InOut)
        .start();
}

function onPointerUp(event) {
    mouseDown = false;
}

// Use to rescale the data so it will fit into the view by recalculating all points in range
function rescale(newStepDelta, beginIndex, endIndex, newInitialValueYDelta) {
    // console.log("rescale: ", beginIndex, endIndex, points.length);
    for (let i = beginIndex; i <= endIndex; i++) {
        // console.log("rescaled: ", points[i]);
        if (points[i] == undefined) {
            continue;
        }
        points[i][1] = (dataClient.input_value[i].price - dataClient.input_value[beginViewingIndex].price) * newStepDelta + newInitialValueYDelta;
    }
}

// Find the list of points in the current view
function updateListOfViewingIndex() {
    let beginningLine = initialCameraPos.x;
    let xLeftLine = beginningLine - activeGroup.position.x; // leftline is the left most line of the view
    let xRightLine = Factory.GRID_RIGHTMOST_LINE - activeGroup.position.x; // right line is the right most line of the view
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

    // console.log("max min: ", maxYIndex, minYIndex);
    let newStepY = Factory.axisYConfig.stepY;
    // let currentPos = (dataClient.input_value[dataClient.currentIndex].price - dataClient.input_value[originIndex].price) * Factory.axisYConfig.stepY + Factory.axisYConfig.initialValueY;
    // let prevPos = (dataClient.input_value[dataClient.currentIndex - 1].price - dataClient.input_value[originIndex].price) * Factory.axisYConfig.stepY + Factory.axisYConfig.initialValueY;
    // if update is needed, by checking if one point is higher/lower than viewing area
    if (minY < MIN_VIEW_Y || maxY > MAX_VIEW_Y) {
        // console.log("Rescale needed: ", maxY, minY, dataClient.input_value[maxYIndex].price, dataClient.input_value[minYIndex].price);
        // To calculate the newY that will fit into the view, use the predefined max, min view Y
        newStepY = ((MAX_VIEW_Y - MIN_VIEW_Y)) / (dataClient.input_value[maxYIndex].price - dataClient.input_value[minYIndex].price);
        let newInitialValueY = Factory.axisYConfig.initialValueY;
        if (minY < MIN_VIEW_Y) {
            // console.log("Rescale needed MIN_VIEW: ", dataClient.input_value[maxYIndex].price - dataClient.input_value[minYIndex].price);
            // assume the minY calculated is equal to the minimum visible point MIN_VIEW_Y
            newInitialValueY = (MIN_VIEW_Y - (dataClient.input_value[minYIndex].price - dataClient.input_value[beginViewingIndex].price) * newStepY);
            // console.log("newInitialValueY: ", newInitialValueY);
        } else if (maxY > MAX_VIEW_Y) {
            // console.log("Rescale needed MAX_VIEW: ", dataClient.input_value[maxYIndex].price - dataClient.input_value[minYIndex].price);
            // assume the maxY calculated is equal to the maximum visible point MAX_VIEW_Y
            newInitialValueY = (MAX_VIEW_Y - (dataClient.input_value[maxYIndex].price - dataClient.input_value[beginViewingIndex].price) * newStepY);
            // console.log("newInitialValueY: ", newInitialValueY);
        }
        newConfig.stepY = newStepY;
        newConfig.initialValueY = newInitialValueY;
        // console.log("Changed: ", newConfig.stepY, newConfig.initialValueY);
        // originIndex = beginViewingIndex;
        return true;
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
    // let need2Update = false;
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

function updateActiveGroup(now, last) {
    let tempPos = [points[points.length - 1]];
    let newPos = [tempPos[0][0] + Factory.axisXConfig.stepX, 0, 0];
    // console.log("newPos: ", newPos)
    // console.log("Factory.axisXConfig.stepX: ", Factory.axisXConfig.stepX)
    let moveInOneFrame = Factory.axisXConfig.stepX * (now - last) / 1000.0

    groupTo = ({ x: activeGroup.position.x - moveInOneFrame, y: activeGroup.position.y, z: 0 });

    // Move the activeGroup so that it feels like moving only if new point position go past the middle of the page
    // console.log(drawingGroup.position.x);
    // console.log(point.x - (Factory.GRID_RIGHTMOST_LINE/2 - drawingGroup.position.x));
    if (mouseDown == false && moving == false) {
        activeGroup.position.x = activeGroup.position.x - moveInOneFrame
    }

    Factory.updateActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);
    // }

    //udpate hover line
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(bkgObjs);
    if (intersects.length) {
        let dataIndex = x2DataIndex(intersects[0].point.x);
        let val = dataClient.input_value[dataIndex].time;
        //console.log("hover point " + dataIndex + " " + val);
        if (intersects.length > 0) {
            //console.log(intersects[0].point.x)
            Factory.updateMouseMoveLine(scene, intersects[0].point.x, intersects[0].point.y, Factory.axisXConfig.initialValueX, val);
        }
    }


    return newPos;
}

function triggerAtFinishingTime(value) {
    console.log("Reach finishing time with ", value)
}

//FIXME????
function updateOtherStuff(triggerAtPurchaseCallback, triggerAtFinishingCallback) {

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

        Factory.updatePurchaseLine(activeGroup, activePurchaseLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, countDownTimer, true);
    }
    else {
        Factory.updatePurchaseLine(activeGroup, activePurchaseLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, countDownTimer, false);
    }
    if (finishTimer == 0) {
        round += 1;
        // Remove all marks
        Factory.removeMarks(activeGroup, activeMarkObjs);
        activeMarkObjs = []
        // Re-enable buttons
        Factory.enableHigherActiveLines(higherButton, activePriceStatusObjs);
        Factory.enableLowerActiveLines(lowerButton, activePriceStatusObjs);
        enablePriceMark = true;
        countDownTimer = 60;
        finishTimer = countDownTimer + fromCountDownToFinish;

        if (typeof triggerAtFinishingCallback == "function") {
            triggerAtFinishingCallback("no problem")
        }
        Factory.updateFinishLine(activeGroup, activeFinishLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, finishTimer);
    }
    Factory.drawVerticalGrid(activeGroup, activeVerticalGridObjs, points, 1, Factory.GRID_TOPLINE, Math.floor(dataClient.currentIndex / Factory.defaultZoomLevel()) * Factory.defaultZoomLevel());
}

// Fetch new data from input and draw it with animation
//function drawNewData(newY, enableAnimation) {
function drawNewData(newY, count) {
    // Find new pos here based on the old pos and step of X
    let tempPos = [points[points.length - 1]];
    let newPos = [tempPos[0][0] + Factory.axisXConfig.stepX * count, newY, 0];

    let tweenFrom = ({ x: tempPos[0][0], y: tempPos[0][1], z: 0 });
    let tweenTo = ({ x: newPos[0], y: newPos[1], z: 0 });
    // console.log(activeGroup.position.x);

    //Just push new and updating value in real-time
    points.push([tweenFrom.x, tweenFrom.y, 0]);

    Factory.addPolygon(activeGroup, activePoligonObjs, points, points.length - 2);
    Factory.addDataLine(activeGroup, activeDataLineObjs, points, points.length - 2, container.clientWidth, container.clientHeight)
    let lastX = tempPos[0][0];
    let lastY = tempPos[0][1];
    let newDataInterpolate = new TWEEN.Tween(tweenFrom).to(tweenTo, 400).onUpdate(function (object) {
        //tempPolyPoints.push([parseFloat(object.x), parseFloat(object.y), 0])
        // Draw new lines so it make smooth animation but because tween create too many points,
        // so these temporary lines, polygon will be removed later
        points[points.length - 1][0] += object.x - lastX;
        points[points.length - 1][1] += object.y - lastY;
        Factory.updatePolygonSingle(activePoligonObjs, tempPos[0][0], tempPos[0][1], points[points.length - 1][0], points[points.length - 1][1], points.length - 2);
        Factory.updateDataLineSingle(activeDataLineObjs, tempPos[0][0], tempPos[0][1], points[points.length - 1][0], points[points.length - 1][1], points.length - 2);
        lastX = object.x;
        lastY = object.y;

        Factory.updateActiveLines(activePriceStatusObjs, [[points[points.length - 1][0], points[points.length - 1][1], 0]], Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);
    }).onComplete(function () {
        countDownTimer--;
        finishTimer--;
        updateView(false, false);
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
            let newY = (dataClient.input_value[dataClient.currentIndex].price - dataClient.input_value[beginViewingIndex].price) * Factory.axisYConfig.stepY + Factory.axisYConfig.initialValueY;//????FIXME
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

    Factory.updateHorizontalGrid(activeHorizontalGridObjs, 0, Factory.GRID_TOPLINE, Factory.GRID_RIGHTMOST_LINE - 120);

    //  Two points make one poligon also
    Factory.updatePolygon(activePoligonObjs, points, beginIndex, endIndex);

    Factory.updateActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);

    Factory.updatePurchaseLine(activeGroup, activePurchaseLineObjs, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, countDownTimer, true);

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
        let newY = (newVal.price - dataClient.input_value[beginViewingIndex].price) * Factory.axisYConfig.stepY + Factory.axisYConfig.initialValueY;
        // console.log(dataClient.getOrigin().price, newVal.price, newY);

        //disable 
        if (1 || Math.floor(newY) != Math.floor(lastDraw.newY) || lastDraw.count >= 3) {
            // console.log(newVal.price, newY, Factory.axisYConfig.stepY, Factory.axisYConfig.initialValueY)
            drawNewData(newY, lastDraw.count);
            lastDraw.newY = newY;
            lastDraw.count = 1;
        } else {
            updateOtherStuff(triggerAtPurchaseTime, triggerAtFinishingTime);
            lastDraw.count++;
        }

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

    if (last == 0) {
        last = Date.now();
    }

    updateActiveGroup(now, last);

    //FIXME green point is also in view
    update(now);

    // control the blink of the green point
    updateGreenPoint(now);

    render();

    stats.update();

    requestAnimationFrame(animate);
    last = now;
}

function showOverlay() {
    document.getElementById("overlay").style.display = "block";
    //setup gui event
    let step = parseFloat($("#price").val()) * 0.01;//TODO upon specs
    $("#plus").click(function (e) {
        let step = parseFloat($("#price").val()) * 0.01;
        $("#price").val((parseFloat($("#price").val()) + step).toFixed(1));
        console.log("Plus " + $("#price").val())
    })
    $("#minus").click(function (e) {
        let step = parseFloat($("#price").val()) * 0.01;
        $("#price").val((parseFloat($("#price").val()) - step).toFixed(1));
        console.log("minus " + $("#price").val())
    })
    $("#price").change(function (e) {
        console.log("price " + $("#price").val())
    })
}

function showZoomButtons() {
    document.getElementById("zoombuttons").style.display = "block";
    //setup gui event
    $("#zoomin").click(function (e) {
        console.log("Zoom in")
        // Zoom in means negative, zoom out mean positive
        zoomPoint.x = (container.clientWidth + 100) / 2; // zoom using middle point of screen
        zoomWithEffect(true);
    })

    $("#zoomout").click(function (e) {
        console.log("Zoom out")
        zoomPoint.x = (container.clientWidth + 100) / 2; // zoom using middle point of screen
        zoomWithEffect(false);
    })

    $("#focus").click(function (e) {
        console.log("Focus")
    })
}

function initColorPicker() {
    document.getElementById("line-picker").style.display = "block";
    document.getElementById("fill-picker").style.display = "block";
    const theme =
        [
            'nano',
            {
                swatches: [
                    'rgba(244, 67, 54, 1)',
                    'rgba(233, 30, 99, 0.95)',
                    'rgba(156, 39, 176, 0.9)',
                    'rgba(103, 58, 183, 0.85)',
                    'rgba(63, 81, 181, 0.8)',
                    'rgba(33, 150, 243, 0.75)',
                    'rgba(3, 169, 244, 0.7)'
                ],

                defaultRepresentation: 'HEXA',
                components: {
                    preview: true,
                    opacity: false,
                    hue: true,

                    interaction: {
                        hex: false,
                        rgba: false,
                        hsva: false,
                        input: true,
                        clear: true,
                        save: true
                    }
                }
            }
        ];

    let linePickr = null;
    const linePickrContainer = document.querySelector('.line-pickr-container');
    const el = document.createElement('p');
    linePickrContainer.appendChild(el);

    linePickr = new Pickr(Object.assign({
        el, theme: theme[0],
        default: "#f27303"
    }, theme[1]));

    // Set events
    linePickr.on('save', (color, instance) => {
        if (color != undefined && color != null) {
            // console.log('Event: "save"', color.toHEXA(), instance);
            let arrayColor = color.toHEXA().slice(0, -1);
            // console.log(arrayColor.join(""))
            Factory.changeDataLineColor(activeDataLineObjs, arrayColor.join(""), container.clientWidth, container.clientHeight);
        }

    }).on('clear', instance => {
        console.log('Event: "clear"', instance);
        Factory.changeDataLineColor(activeDataLineObjs, "f27303", container.clientWidth, container.clientHeight);
    })

    let fillPickr = null;
    const fillPickrContainer = document.querySelector('.fill-pickr-container');
    const fillel = document.createElement('p');
    fillPickrContainer.appendChild(fillel);
    // Create fresh instance
    fillPickr = new Pickr(Object.assign({
        el: fillel, theme: theme[0],
        default: "#9f561c"
    }, theme[1]));

    // Set events
    fillPickr.on('save', (color, instance) => {
        // console.log('Event: "save"', color.toHEXA(), instance);
        if (color != undefined && color != null) {
            let arrayColor = color.toHEXA().slice(0, -1);
            console.log(arrayColor.join(""))
            Factory.changePolygonColor(activePoligonObjs, arrayColor.join(""));
        }

    }).on('clear', instance => {
        console.log('Event: "clear"', instance);
        Factory.changePolygonColor(activePoligonObjs, "9f561c");
    })
}