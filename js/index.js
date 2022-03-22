import Stats from './libs/stats.module.js';
import TWEEN, { Tween } from './libs/tween.esm.js';
import DataClient from './DataClient.js';
import * as THREE from './libs/three/build/three.module.js'

//FIXME
import * as Factory from './Factory.js';

window.dataClient = new DataClient();

let container, stats;
let camera, scene, raycaster, renderer;

const ZOOM_STEP = 10;

var MIN_VIEW_Y = 100;
var MAX_VIEW_Y = 800;
const MIN_DIFF_Y = 1;


let initialCameraPos = { x: 0, y: 0, z: 1 }
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
const PURCHASE_DURATION = 60;
const GOAL_DURATION = 30
let countDownTimer = PURCHASE_DURATION;

let fromCountDownToFinish = GOAL_DURATION;
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
let activePurchaseView = new THREE.Group();
let activePurchaseModel = {}
let activeDataLineObjs = [];
let activePoligonObjs = new THREE.Group();
let activeMarkObjs = [];

//let stretchValue;
let zoomPoint = { x: 0, y: 0 }

let lowerButton;
let higherButton;
let lowerText, higherText;
let upMesh, downMesh;
let lowhighButtons = [];

//Draw demo 100 points at start point??
let drawCount = 1799;
let beginViewingIndex = 0;
let endViewingIndex = drawCount;
let currentProgress = 0;

let enablePriceMark = true;

let round = 1;
// let originIndex = 0;
let totalMouseMovement = 0;

let newData = [];
function update(newVal) {
    newData.push(newVal)
}

function getCenter(points, start, end) {
    let minVal = Infinity;
    let maxVal = -Infinity
    for (let i = start; i <= end; i++) {
        const point = points[i];
        minVal = Math.min(minVal, point.price);
        maxVal = Math.max(maxVal, point.price);
    }
    return (minVal + maxVal) / 2
}

function init() {

    //initColorPicker();

    drawCount = dataClient.input_value.length;
    beginViewingIndex = drawCount - Factory.currentZoom();
    beginViewingIndex = beginViewingIndex > 0 ? beginViewingIndex : 0;
    endViewingIndex = drawCount - 1;

    let profitPercent = document.getElementById('profit-per').textContent.replace(/\D/g, '')
    let investTotal = document.getElementById('price').value
    let profitVal = document.getElementById('profit-val')

    let calculatedProfit = parseFloat(profitPercent) * parseFloat(investTotal) / 100
    // console.log(profitPercent, investTotal, calculatedProfit)
    profitVal.innerHTML = '+' + calculatedProfit + '$'

    container = document.getElementById('container');
    camera = new THREE.OrthographicCamera(0, container.clientWidth,
        container.clientHeight, 0, -1, 1);
    initialCameraPos.x = 0;//container.clientWidth / 2;
    initialCameraPos.y = 0;//container.clientHeight / 2;
    MIN_VIEW_Y = initialCameraPos.y;
    MAX_VIEW_Y = container.clientHeight;
    camera.position.set(initialCameraPos.x, initialCameraPos.y, initialCameraPos.z);

    Factory.setGrid(container.clientHeight, container.clientWidth + 100);//FIXME ,fack number
    calculateAxis();

    scene = new THREE.Scene();
    // camera.lookAt( scene.position );
    raycaster = new THREE.Raycaster();

    scene.add(camera);
    scene.add(activeGroup);

    // Use activeGroup to include all items that needs moving, so move this group
    // to make it feels like the graph is moving
    initScene(activeGroup);

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

    dataClient.onNew = update;
}

function calculateAxis() {
    Factory.axisXConfig.stepX = container.clientWidth / Factory.currentZoom();//2mins
    Factory.axisYConfig.stepY = (MAX_VIEW_Y - MIN_VIEW_Y) / Factory.currentZoom();//price range 100 for maximum zoom- level5
    Factory.axisYConfig.initialValueY = initialCameraPos.y + (MAX_VIEW_Y - MIN_VIEW_Y) / 2;
    Factory.axisYConfig.origin = getCenter(dataClient.input_value, beginViewingIndex, endViewingIndex);

    if (points.length)//only run for updating, not init
        updateListOfViewingIndex();
}

function initScene(drawingGroup) {
    //FIXME
    points = dataClient.input_value.map((point, index) => Factory.convert(point, index))
    //rescale(Factory.axisYConfig.stepY, beginViewingIndex, endViewingIndex, Factory.axisYConfig.initialValueY);

    activeGroup.add(activePoligonObjs);
    Factory.addPolygon(activePoligonObjs, points, beginViewingIndex);
    //FIXME - other feature
    const point = points[points.length - 1];
    if (point[0] > Factory.GRID_RIGHTMOST_LINE / 2) {
        activeGroup.position.x = activeGroup.position.x - (point[0] - (Factory.GRID_RIGHTMOST_LINE / 2 - activeGroup.position.x));
    }

    // Draw the data line
    Factory.addDataLine(activePoligonObjs,points, beginViewingIndex, container.clientWidth, container.clientHeight);
    // console.log("lines: ", activeDataLineObjs.length, points.length);

    let higher = Factory.drawHigherButton(scene, Factory.GRID_RIGHTMOST_LINE);
    upMesh = higher.upMesh
    higherButton = higher.higherButton
    higherText = higher.higherText
    let lower = Factory.drawLowerButton(scene, Factory.GRID_RIGHTMOST_LINE);
    downMesh = lower.downMesh
    lowerButton = lower.lowerButton
    lowerText = lower.lowerText


    // Draw the grid
    Factory.drawHorizontalGrid(activeHorizontalGridObjs, 0, Factory.GRID_TOPLINE, Factory.GRID_RIGHTMOST_LINE - 120, beginViewingIndex)

    Factory.drawVerticalGrid(drawingGroup, activeVerticalGridObjs, points, Math.floor(drawCount / Factory.defaultZoomLevel()), Factory.GRID_TOPLINE, beginViewingIndex)

    //let newbkg = Factory.drawBackground(0, drawCount, gridStepX);

    // // Draw the active line
    Factory.drawActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE - 120, drawingGroup.position.x);

    // Draw the purchase line
    purchaseTime = Date.now();
    activePurchaseModel = Factory.drawPurchaseLine(activePurchaseView, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, countDownTimer);
    // Draw the finish line
    goalTime = purchaseTime;
    Factory.drawFinishLine(activePurchaseView, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, finishTimer);

    activeGroup.add(activePurchaseView)


    drawingGroup.add(activePriceStatusObjs[0].dashedLine)
    drawingGroup.add(activePriceStatusObjs[0].line)
    activePoligonObjs.add(activePriceStatusObjs[0].greenDot)
    scene.add(activePriceStatusObjs[0].priceShape)
    scene.add(activePriceStatusObjs[0].priceText)
    scene.add(activePriceStatusObjs[0].priceActiveText)

    for (let i = 0; i < activeHorizontalGridObjs.length; i++) {
        scene.remove(activeHorizontalGridObjs[i].line)
        scene.remove(activeHorizontalGridObjs[i].text)

        scene.add(activeHorizontalGridObjs[i].line)
        scene.add(activeHorizontalGridObjs[i].text)
    }

    //drawingGroup.add(newbkg)
    //bkgObjs.push(newbkg)
    lowhighButtons.push(higherButton);
    lowhighButtons.push(lowerButton);
    //scene.add(newbkg);


    //animate green infinity
    const start = 30;
    const end = 90;
    const duration = 1000;
    let forward = new TWEEN.Tween({val:start}).to({val:end}, duration).onUpdate(function (size) {
        activePriceStatusObjs[0].greenGlow.scale.set(size.val, size.val, 1)

        //activePriceStatusObjs[0].greenGlow.needsUpdate = true;
    }).easing(TWEEN.Easing.Quadratic.InOut)
    .yoyo(true)
    .repeat(Infinity)
    .start()
    
}

function triggerAtPurchaseTime(value) {
    console.log("Reach purchase time with ", value)
}

function showProgress() {
    if (currentProgress == 0) {
        currentProgress = dataClient.input_value.length / drawCount * 100;
        var elem = document.getElementById("myBar");
        var width = currentProgress;
        var id = setInterval(frame, 15);//60fps
        function frame() {
            if (dataClient.loadingDone) {
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
    let xLine = x - activeGroup.position.x - activePoligonObjs.position.x; // find the actual x value of the viewing area (show on the screen)

    // Find the point at which the zoom happens
    for (let i = beginViewingIndex; i < endViewingIndex; i++) {
        if (points[i][0] <= xLine && points[i + 1][0] >= xLine) { // basically return the index if the x is between two consecutive points
            dataIndex = (xLine - points[i][0] > points[i + 1][0] - xLine ? i : i + 1);
            break;
        }
    }

    return dataIndex
}

// Zoom along the x axis
function zoomFrom(x, zoomValue) {
    console.log(beginViewingIndex, "  ", endViewingIndex)
    let xLine = x - activeGroup.position.x; // find the actual x value of the viewing area

    // Find the point at which the zoom happens
    for (let i = beginViewingIndex; i <= endViewingIndex; i++) {
        points[i][0] -= (zoomValue) * (points[i][0] - xLine); // move the left points of the zoom line to the left, right points of the zoom line to right
    }

}

function zoomAll(pivotIndex) {
    //pivotIndex = endViewingIndex;
    console.log(beginViewingIndex, "  ", endViewingIndex)

    let offset = Factory.convert(dataClient.input_value[pivotIndex], pivotIndex)[0] - points[pivotIndex][0]
    // Find the point at which the zoom happens
    for (let i = 0; i <= endViewingIndex; i++) {
        points[i] = Factory.convert(dataClient.input_value[i], i); // move the left points of the zoom line to the left, right points of the zoom line to right
        //points[i][0] -= offset

        //debug
        if (i == pivotIndex) {
            console.log("Pivot value ", points[i][0])
            console.log("offset ", offset)
        }
    }
    activePoligonObjs.position.x -= offset;

    //keep pivot static
    //test focus on green points
    //activeGroup.position.x = activeGroup.position.x - (points[endViewingIndex][0]+ activeGroup.position.x) + container.clientWidth/2;

}

// Called when zoomint/out, in onWheel function
function zoom(zoomValue) {
    // Find the position of wheel
    let lastZoomLevel = Factory.currentZoom();
    let newZoom = lastZoomLevel + zoomValue;
    if ((newZoom <= Factory.minZoom() && zoomValue < 0) ||
        (newZoom >= Factory.maxZoom() && zoomValue > 0)) {
        console.warn("Out of zoom limitation")
        return;
    }

    let pivotIndex = x2DataIndex(zoomPoint.x);
    console.log("Zoom index ", pivotIndex);
    pivotIndex = Math.min(pivotIndex, points.length - 1);
    pivotIndex = Math.max(pivotIndex, 0);

    Factory.currentZoom(newZoom);

    calculateAxis();

    // Init the index of point where the zoom happens
    //zoomFrom(zoomPoint.x, zoomValue);
    zoomAll(pivotIndex)

    //rescale(Factory.axisYConfig.stepY,beginViewingIndex,endViewingIndex,Factory.axisYConfig.initialValueY);

    return true;
}

function zoomWithEffect(stretchValue, isButton) {

    let gridFrom = ({ x: 0, y: 0, z: 0 });
    let gridTo = ({ x: stretchValue*10, y: 0, z: 0 });
    const duration = 200;
    new TWEEN.Tween(gridFrom).to(gridTo, Math.abs(stretchValue)*1).onUpdate(function (current) {
        zoom(current.x);
    }).easing(TWEEN.Easing.Quadratic.Out)
    .start()

}

// Event triggered when zoom
function onWheel(event) {
    let pivotPoint = { x: 0, y: 0 }
    // Find the intersect point to detect the data index where the zoom happens
    pivotPoint.x = event.clientX;
    zoomPoint.x = pivotPoint.x;
    zoomPoint.y = pivotPoint.y;//not use
    // basically, from the pivotPoint zoom points on the left of the point to the left
    // and the right points to the right
    if (event.deltaY > 0) {
        zoomWithEffect(event.deltaY / 10.0);
    } else {
        zoomWithEffect(event.deltaY / 10.0);
    }
}

// Event mouse move, use this for both drag and drawing the line at the mouse cursor
function onPointerMove(event) {
    //event.preventDefault();

    // If mouse is down, then it is drag
    if (mouseDown == true) {
        let deltaX = event.clientX - clickMousePos.x;
        clickMousePos.x = event.clientX;

        //middle is most left
        if(deltaX < 0 && points[points.length-1][0] + activePoligonObjs.position.x + activeGroup.position.x <= container.clientWidth/2 ){
            return;
        }
        //right side is most right
        else if(deltaX > 0 && points[0][0] + activePoligonObjs.position.x + activeGroup.position.x >= 0 ){
            return;
        }
        activeGroup.position.x += deltaX;
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
            if (0 <= dataIndex && dataIndex < dataClient.input_value.length) {
                let val = dataClient.input_value[dataIndex].time;
                Factory.updateMouseMoveLine(scene, intersects[0].point.x, intersects[0].point.y, Factory.axisXConfig.initialValueX, val, beginViewingIndex);
            }
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
    //beginIndex = 0;
    //endIndex = points.length-1;
    for (let i = beginIndex; i <= endIndex; i++) {
        // console.log("rescaled: ", points[i]);
        if (points[i] == undefined || i >= dataClient.input_value.length) {
            continue;
        }
        points[i][1] = (dataClient.input_value[i].price - dataClient.input_value[beginIndex].price) * newStepDelta + newInitialValueYDelta;
        if (isNaN(points[i][1])) {
        }
    }
}

// Find the list of points in the current view
function updateListOfViewingIndex() {
    let beginningLine = initialCameraPos.x;
    let xLeftLine = beginningLine - activeGroup.position.x; // leftline is the left most line of the view
    let xRightLine = Factory.GRID_RIGHTMOST_LINE - activeGroup.position.x; // right line is the right most line of the view
    let newBegin = -1;
    let newEnd = points.length-1;
    for (let i = 1; i < points.length; i++) {
        if (newBegin < 0 && points[i][0] >= xLeftLine && points[i - 1][0] <= xLeftLine) {
            newBegin = i;
        }

        if (points[i][0] >= xRightLine && points[i - 1][0] <= xRightLine) {
            newEnd = i;
            break;
        }
    }
    if (newBegin < 0) newBegin = 0;
    if (newBegin >= newEnd) newBegin = newEnd - 1;


    //add cache view for viewing area
    let cachedBegin = newBegin - (newEnd - newBegin);
    let cacheEnd = newEnd + (newEnd - newBegin);

    //limit to real datasize//FIXME should base on points, not input_value
    cachedBegin = Math.min(Math.max(cachedBegin, 0), points.length - 2);//NOTE not support 2 points data
    cacheEnd = Math.min(Math.max(cacheEnd, 0), points.length - 1);

    beginViewingIndex = cachedBegin;//test
    endViewingIndex = cacheEnd;

}

// Use to recalculate the data and update view for autoscaling
var scaleTween = null;
var lastTimestamp = 0;
var purchaseTime, goalTime
function updateView(now) {

    //update purchase line and goal line lifetime
    countDownTimer = PURCHASE_DURATION - Math.floor((now - purchaseTime) / 1000);
    finishTimer = GOAL_DURATION - Math.floor((now - goalTime) / 1000);

    updateGeometries(beginViewingIndex,endViewingIndex);


    // If need to change current zoom level then need to add/remove grids
    //Factory.removeRedundantVerticalGrid(activeGroup, activeVerticalGridObjs);
    //Factory.updateVerticalGrid(activeVerticalGridObjs, points, Factory.currentZoom(), Factory.GRID_TOPLINE, beginViewingIndex);
    //Factory.drawVerticalGrid(activeGroup, activeVerticalGridObjs, points, Math.floor(dataClient.currentIndex() / Factory.defaultZoomLevel()), Factory.GRID_TOPLINE, beginViewingIndex)
    //Factory.updateActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);

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
        if (dataIndex < dataClient.input_value.length) {
            let val = dataClient.input_value[dataIndex].time;
            //console.log("hover point " + dataIndex + " " + val);
            if (intersects.length > 0) {
                //console.log(intersects[0].point.x)
                Factory.updateMouseMoveLine(scene, intersects[0].point.x, intersects[0].point.y, Factory.axisXConfig.initialValueX, val, beginViewingIndex);
            }
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
        countDownTimer = PURCHASE_DURATION + 1000;//hide it

        if (typeof triggerAtPurchaseCallback == "function") {
            triggerAtPurchaseCallback("no problem")
        }
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
        countDownTimer = PURCHASE_DURATION;
        finishTimer = countDownTimer + fromCountDownToFinish;

        if (typeof triggerAtFinishingCallback == "function") {
            triggerAtFinishingCallback("no problem")
        }
    }
    Factory.drawVerticalGrid(activeGroup, activeVerticalGridObjs, points, 1, Factory.GRID_TOPLINE, beginViewingIndex);
}


var lastAdding = 0;
var newDataInterpolate

// Fetch new data from input and draw it with animation
function drawNewData(newPrice) {
    if (lastAdding && Date.now() < lastAdding + 500) {
        //not animate, just add points
        points.push(Factory.convert(newPrice, points.length));
        return;
    }
    lastAdding = Date.now();


    //Just push new and updating value in real-time
    points.push(Factory.convert(newPrice, points.length));


    //let newPolygon = Factory.addPolygon(activeGroup, activePoligonObjs, points, points.length - 2);
    //let newLine = Factory.addDataLine(activeGroup, activeDataLineObjs, points, points.length - 2, container.clientWidth, container.clientHeight)
    //Factory.updateNewPolygon(newPolygon, points);
    //Factory.updateNewLine(newLine, points);

    updateOtherStuff(triggerAtPurchaseTime, triggerAtFinishingTime);
}

function updateGeometries(beginIndex, endIndex) {
    // Update the data line, note that two points make one data line
    Factory.updateDataLine(activePoligonObjs.children[1], points, beginIndex, endIndex);
    //  Two points make one poligon also
    Factory.updatePolygon(activePoligonObjs.children[0], points, beginIndex, endIndex);
    // activeGroup.position.set(activeGroup.position.x + (stretchValue) * 2, activeGroup.position.y, activeGroup.position.z);

    Factory.updateHorizontalGrid(activeHorizontalGridObjs, 0, Factory.GRID_TOPLINE, Factory.GRID_RIGHTMOST_LINE - 120, beginViewingIndex);


    Factory.updateActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);

    Factory.updatePurchaseLine(activePurchaseModel, countDownTimer);

    Factory.updateMarks(activeMarkObjs, points, Factory.GRID_RIGHTMOST_LINE - 120, activeGroup.position.x);

    //green is alway same with final points

    activePriceStatusObjs[0].greenDot.position.x = points[points.length-1][0]
    activePriceStatusObjs[0].greenDot.position.y = points[points.length-1][1]

}


function render() {
    //draw frame
    renderer.render(scene, camera);
}

function animate() {

    while (newData.length) {
        drawNewData(newData[0])
        newData.shift()

        calculateAxis();
    }

    TWEEN.update();
    let now = Date.now();

    if (last == 0) {
        last = Date.now();
    }

    updateActiveGroup(now, last);


    updateView(now);

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

var isZooming = false;
function showZoomButtons() {
    document.getElementById("zoombuttons").style.display = "block";
    //setup gui event
    $("#zoomin").click(function (e) {
        if (isZooming) {
            console.warn("Still zooming. try again")
            return;
        }
        isZooming = true;
        console.log("Zoom in")
        // Zoom in means negative, zoom out mean positive
        //zoomPoint.x = (container.clientWidth + 100) / 2; // zoom using middle point of screen
        //zoom to green
        zoomPoint.x = points[points.length - 1][0] + activeGroup.position.x;
        zoomWithEffect(-ZOOM_STEP, true);
    })

    $("#zoomout").click(function (e) {
        if (isZooming) {
            console.warn("Still zooming. try again")
            return;
        }
        isZooming = true;
        console.log("Zoom out")
        //zoomPoint.x = (container.clientWidth + 100) / 2; // zoom using middle point of screen
        //zoom to green
        zoomPoint.x = points[points.length - 1][0] + activeGroup.position.x;
        zoomWithEffect(ZOOM_STEP, true);
    })

    $("#focus").click(function (e) {
        // console.log("Focus")

        // console.log("total ", totalMouseMovement);
        let tweenFrom = ({ x: activeGroup.position.x, y: 0, z: 0 });
        let tweenTo = ({ x: activeGroup.position.x - totalMouseMovement, y: 0, z: 0 });
        new TWEEN.Tween(tweenFrom).to(tweenTo, 1000).onUpdate(function (object) {
            let xRightLine = (Factory.GRID_RIGHTMOST_LINE / 2 - activeGroup.position.x);
            activeGroup.position.set(object.x, activeGroup.position.y, activeGroup.position.z);
        }).onComplete(function () {
            moving = false;
            totalMouseMovement = 0;
        }).easing(TWEEN.Easing.Quadratic.InOut)
            .start();

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

//start
showProgress();