import Stats from './libs/stats.module.js';
import TWEEN, { Tween } from './libs/tween.esm.js';
import DataClient from './DataClient.js';
import * as THREE from './libs/three/build/three.module.js'

//FIXME
import * as Factory from './Factory.js';

window.dataClient = new DataClient();

let container, stats;
let camera, scene, raycaster, renderer;

const ZOOM_STEP = 100;

let initialCameraPos = { x: 0, y: 0, z: 1 }
let last = 0; // timestamp of the last render() call
let points = [];

let activeGroup = new THREE.Group();

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
let finishLine;

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
function onAddNewData(newVal) {
    newData.push(newVal)
}

function getRange(points, start, end) {
    let minVal = Infinity;
    let maxVal = -Infinity
    for (let i = start; i <= end; i++) {
        const point = points[i];
        minVal = Math.min(minVal, point.price);
        maxVal = Math.max(maxVal, point.price);
    }
    return [minVal, maxVal]

    // let sum = 0;
    // for(let i = start; i <= end; i++)
    //     sum += points[i].price;


    // let center = sum/(end - start + 1);

    // console.log("Test ",minVal/2+maxVal/2, " ",center)
    //let center = points[end].price;
    //return center;
}

function getMedium(points, start, end) {
    console.log("start, end ", start, end)
    let sum = 0;
    for (let i = start; i <= end; i++) {
        sum += points[i].price;
    }

    let center = sum / (end - start + 1);

    //let center = points[end].price;
    return center;
}

function init() {

    initColorPicker();
    currentRound();

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
    //MIN_VIEW_Y = initialCameraPos.y;
    //MAX_VIEW_Y = container.clientHeight;
    camera.position.set(initialCameraPos.x, initialCameraPos.y, initialCameraPos.z);

    Factory.setGrid(container.clientHeight, container.clientWidth + 100);//FIXME ,fack number
    calculateAxis(true);

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
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    document.addEventListener('visibilitychange', function () {
        //no need, we will get all latest data
        //last = 0;
    });

    //show css overlay
    showOverlay();

    showZoomButtons();

    dataClient.onNew = onAddNewData;
}

let rescaleData = []

function calculateAxis(forced) {
    //in fact, just use lastest point as origin
    let newRange = getRange(dataClient.input_value, beginViewingIndex, endViewingIndex);
    let newOrigin = getMedium(dataClient.input_value, beginViewingIndex, endViewingIndex);;//newRange[0] / 2 + newRange[1] / 2

    Factory.axisXConfig.stepX = container.clientWidth / Factory.currentZoom();//2mins
    Factory.axisYConfig.initialValueY = initialCameraPos.y + (container.clientHeight) / 2;
    Factory.axisYConfig.stepY = container.clientHeight / Factory.currentZoom();///2;
    if (forced) {
        Factory.axisYConfig.origin = newOrigin;
        return;
    }
    //let newY = container.clientHeight / Factory.currentZoom() / 2

    let minY = Factory.convertBack(0, 30, 0)[1];
    let maxY = Factory.convertBack(0, container.clientHeight - 30, 0)[1];

    if (rescaleData.length == 0 && (Math.abs(newOrigin - Factory.axisYConfig.origin) * Factory.axisYConfig.stepY > 10 || minY > newRange[0] || maxY < newRange[1])) {//TODO
        console.log("Medium: ", newOrigin)
        rescaleData.push({ origin: newOrigin, stepY: Factory.axisYConfig.stepY })
        //Factory.axisYConfig.origin = newOrigin;
        //Factory.axisYConfig.stepY = newY;
    }
    if (points.length)//only run for updating, not init
        updateListOfViewingIndex();
}

function initScene(drawingGroup) {
    //FIXME
    points = dataClient.input_value.map((point, index) => Factory.convert(point, index))
    //rescale(Factory.axisYConfig.stepY, beginViewingIndex, endViewingIndex, Factory.axisYConfig.initialValueY);

    activeGroup.add(activePoligonObjs);
    Factory.addPolygon(activePoligonObjs, activePoligonObjs, points, beginViewingIndex);
    //FIXME - other feature
    const point = points[points.length - 1];
    if (point[0] > Factory.GRID_RIGHTMOST_LINE / 2) {
        activePoligonObjs.position.x -= (point[0] - container.clientWidth / 2);
    }

    // Draw the data line
    Factory.addDataLine(activePoligonObjs, points, beginViewingIndex, container.clientWidth, container.clientHeight);
    // console.log("lines: ", activeDataLineObjs.length, points.length);

    let higher = Factory.drawHigherButton(scene, Factory.GRID_RIGHTMOST_LINE);
    upMesh = higher.upMesh
    higherButton = higher.higherButton
    higherText = higher.higherText
    let lower = Factory.drawLowerButton(scene, Factory.GRID_RIGHTMOST_LINE);
    downMesh = lower.downMesh
    lowerButton = lower.lowerButton
    lowerText = lower.lowerText



    const currentX = points[points.length - 1][0] + activePoligonObjs.position.x;
    Factory.drawVerticalGrid(activePoligonObjs, Factory.GRID_TOPLINE, currentX);

    // Draw the grid
    Factory.drawHorizontalGrid(drawingGroup, activeHorizontalGridObjs, Factory.GRID_TOPLINE, Factory.GRID_RIGHTMOST_LINE)

    // // Draw the active line
    let activePriceView = Factory.drawActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE, activePoligonObjs.position.x);

    // Draw the purchase line
    purchaseTime = Date.now();
    activePurchaseModel = Factory.drawPurchaseLine(activePurchaseView, [points[points.length - 1]], Factory.GRID_TOPLINE, Factory.axisXConfig.stepX, countDownTimer);
    // Draw the finish line
    goalTime = purchaseTime;
    finishLine = Factory.drawFinishLine(activePurchaseView, Factory.GRID_TOPLINE, GOAL_DURATION);

    activePoligonObjs.add(activePurchaseView)


    drawingGroup.add(activePriceView);
    activePoligonObjs.add(activePriceStatusObjs[0].greenDot)//FIXME

    //drawingGroup.add(newbkg)
    //bkgObjs.push(newbkg)
    lowhighButtons.push(higherButton);
    lowhighButtons.push(lowerButton);
    //scene.add(newbkg);


    //animate green infinity
    const start = 30;
    const end = Factory.GREEN_GLOW_SCALE;
    const duration = 1000;
    let forward = new TWEEN.Tween({ val: start }).to({ val: end }, duration).onUpdate(function (size) {
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

    return Math.floor(x / Factory.axisXConfig.stepX) + beginViewingIndex
}

function recalculate() {
    for (let i = cachedBegin; i <= cacheEnd; i++) {
        points[i] = Factory.convert(dataClient.input_value[i], i); // move the left points of the zoom line to the left, right points of the zoom line to right
        //points[i][0] -= offset

        //debug
        //if (i == pivotIndex) {
        //console.log("Pivot value ", points[i][0])
        //console.log("offset ", offset)
        //}
    }
}

function zoomAll(pivotIndex) {
    //pivotIndex = endViewingIndex;
    //console.log("pivotIndex ",pivotIndex)

    let offset = Factory.convert(dataClient.input_value[pivotIndex], pivotIndex)[0] - points[pivotIndex][0]
    // Find the point at which the zoom happens
    recalculate();
    activePoligonObjs.position.x -= offset;


    //force update purchase sline

    Factory.updatePurchaseLine(activePurchaseModel, countDownTimer, points[points.length - 1][0]);

}

// Called when zoomint/out, in onWheel function
let zooming = false;
function zoom(zoomValue, pivotIndex) {
    Factory.setZoom(zoomValue);

    calculateAxis();

    // Init the index of point where the zoom happens
    //zoomFrom(zoomPoint.x, zoomValue);
    zoomAll(pivotIndex)

    //rescale(Factory.axisYConfig.stepY,beginViewingIndex,endViewingIndex,Factory.axisYConfig.initialValueY);
    return true;
}

let animating = [];
function zoomWithEffect(zoomValue, isButton) {
    animating.push(zoomValue);
}

// Event triggered when zoom
function onWheel(event) {
    let pivotPoint = { x: event.clientX, y: event.clientY }
    // Find the intersect point to detect the data index where the zoom happens
    //pivotPoint.x = event.clientX;
    //zoomPoint.x = pivotPoint.x;
    //zoomPoint.y = pivotPoint.y;//not use
    // basically, from the pivotPoint zoom points on the left of the point to the left
    // and the right points to the right
    zoomWithEffect([pivotPoint, event.deltaY]);
}

// Event mouse move, use this for both drag and drawing the line at the mouse cursor
function onPointerMove(event) {
    //event.preventDefault();

    // If mouse is down, then it is drag
    if (mouseDown == true) {
        let deltaX = event.clientX - clickMousePos.x;
        clickMousePos.x = event.clientX;

        //middle is most left
        if (deltaX < 0 && points[points.length - 1][0] + activePoligonObjs.position.x + activeGroup.position.x <= container.clientWidth / 2) {
            return;
        }
        //right side is most right
        else if (deltaX > 0 && points[0][0] + activePoligonObjs.position.x + activeGroup.position.x >= 0) {
            return;
        }
        activePoligonObjs.position.x += deltaX;
        getPriceBackward();
        //if (points.length)//only run (for updating, not init
        //   updateListOfViewingIndex();

        // otherwise, just update the line at the mouse cursor
    } else {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left; //x position within the element.
        const y = event.clientY - rect.top;  //y position within the element.

        //calculate mouse time from current time(greenpoint)
        const currentX = points[points.length - 1][0] + activePoligonObjs.position.x;
        const values = Factory.convertBack(x, container.clientHeight - y, currentX);
        Factory.updateMouseMoveLine(scene, x, container.clientHeight - y, ...values);

        if (enablePriceMark == true) {
            let mouseClick = { x: 0, y: 0 };
            mouseClick.x = ((event.clientX - container.offsetLeft) / (container.clientWidth)) * 2 - 1;
            mouseClick.y = - ((event.clientY - container.offsetTop) / (container.clientHeight)) * 2 + 1;
            updateHigherLower(mouseClick)//FIXME
        }
    }
}

function updateHigherLower(mouseClick) {
    raycaster.setFromCamera(mouseClick, camera);
    let intersects2 = raycaster.intersectObjects(lowhighButtons);
    if (intersects2.length > 0) {//FIXME
        // updateMouseMoveLine(intersects[0].point.x, intersects[0].point.y);
        if (higherButton == intersects2[0].object) {
            // console.log("HIGHER");
            activePriceStatusObjs[0].higherArea.scale.y = 1;
            activePriceStatusObjs[0].downArrow.visible = false;
            activePriceStatusObjs[0].upArrow.visible = true;
            Factory.enableHigherActiveLines(higherButton, activePriceStatusObjs);
            activePriceStatusObjs[0].lowerArea.scale.y = 0;
        }

        if (lowerButton == intersects2[0].object) {
            // console.log("LOWER");
            activePriceStatusObjs[0].lowerArea.scale.y = 1
            activePriceStatusObjs[0].upArrow.visible = false
            activePriceStatusObjs[0].downArrow.visible = true
            Factory.enableLowerActiveLines(lowerButton, activePriceStatusObjs);
            activePriceStatusObjs[0].higherArea.scale.y = 0;
        }
    } else {
        activePriceStatusObjs[0].downArrow.visible = false;
        activePriceStatusObjs[0].upArrow.visible = false;
        Factory.disableHigherActiveLines(higherButton, activePriceStatusObjs);
        Factory.disableLowerActiveLines(lowerButton, activePriceStatusObjs);
        activePriceStatusObjs[0].lowerArea.scale.y = 0
        activePriceStatusObjs[0].higherArea.scale.y = 0
    }
}

function handleHigherButtonClick(invest) {
    let from = { x: 1, y: 1 };
    let to = { x: 0.8, y: 0.8 };
    let initialScale = upMesh.scale.clone();
    Factory.drawMark(activePoligonObjs, activeMarkObjs, [points[points.length - 1]], false, points.length - 1, Factory.GRID_RIGHTMOST_LINE, activePoligonObjs.position.x, invest, flipflop);
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

function sendGETRequest(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 201) {
            console.log(xhr.responseText); // Another callback here
        }
    };
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJiYWxhbmNlIjo1MDAwLCJleHAiOjI2NDg4MDM1MzgsImdhbWVJRCI6MSwicGFydG5lcklEIjoxLCJwbGF5ZXJJRCI6MywicmVmcmVzaFRva2VuIjoiZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmlZV3hoYm1ObElqbzFNREF3TENKbGVIQWlPakUyTkRjNU16WTFOVFVzSW1kaGJXVkpSQ0k2TVN3aWNHRnlkRzVsY2tsRUlqb3hMQ0p3YkdGNVpYSkpSQ0k2TXl3aWRYTmxjbTVoYldVaU9pSm5iMllpZlEuRXpQb3ZIaFA4NUlHMFFfNVlQRHVUX3dzT3FqWk1MZnRpdjhxdWVqNDJRVSIsInVzZXJuYW1lIjoiZ29mIn0.AdP4nL2tLuz3PLMci8Cty0IhSKg7nTCm3VGGQ1kOl7A');
    xhr.setRequestHeader('x-api-key', '1F736AE85A8EEE14B7CBBDF7E9E77D1D2372C45752F3B1DFFBD0BB746056FB6F');
    xhr.send();

    xhr.onload = function () {
        if (xhr.status != 200) { // analyze HTTP status of the response
            console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
        } else { // show the result
            if (typeof callback == "function") {
                callback(JSON.parse(xhr.response))
            }
            console.log(`Done, got ${xhr.response.length} bytes with data is ${xhr.response}`); // response is the server response
        }
    };
}

function updateResultCallback(result) {
    document.getElementById('profit-per').textContent = result.summaryProfitPercent.length == 0 ? "0" : result.summaryProfitPercent.length
    document.getElementById('price').value = result.credit
    document.getElementById('profit-val').innerHTML = '+' + result.profit + '$'
}

function sendPOSTRequest(url, betContent) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 201) {
            console.log(xhr.responseText); // Another callback here
        }
    };
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJiYWxhbmNlIjo1MDAwLCJleHAiOjI2NDg4MDM1MzgsImdhbWVJRCI6MSwicGFydG5lcklEIjoxLCJwbGF5ZXJJRCI6MywicmVmcmVzaFRva2VuIjoiZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmlZV3hoYm1ObElqbzFNREF3TENKbGVIQWlPakUyTkRjNU16WTFOVFVzSW1kaGJXVkpSQ0k2TVN3aWNHRnlkRzVsY2tsRUlqb3hMQ0p3YkdGNVpYSkpSQ0k2TXl3aWRYTmxjbTVoYldVaU9pSm5iMllpZlEuRXpQb3ZIaFA4NUlHMFFfNVlQRHVUX3dzT3FqWk1MZnRpdjhxdWVqNDJRVSIsInVzZXJuYW1lIjoiZ29mIn0.AdP4nL2tLuz3PLMci8Cty0IhSKg7nTCm3VGGQ1kOl7A');
    xhr.setRequestHeader('x-api-key', '1F736AE85A8EEE14B7CBBDF7E9E77D1D2372C45752F3B1DFFBD0BB746056FB6F');
    xhr.send(betContent);

    xhr.onload = function () {
        if (xhr.status != 200) { // analyze HTTP status of the response
            console.log(`Error ${xhr.status}: ${xhr.response}`); // e.g. 404: Not Found
        } else { // show the result
            console.log(`Done, got ${xhr.response.length} bytes with data is ${xhr.response}`); // response is the server response
        }
    };
    console.log(betContent)
}

function getPriceBackward() {
    let url = 'https://wrk-graph-price-api-vg56rovkka-as.a.run.app/prices/backward?d=5'
    sendGETRequest(url);
}

function getPriceLength() {
    let url = 'https://wrk-graph-price-api-vg56rovkka-as.a.run.app/prices/length?st=1646757174510&sp=1646757473566'
    sendGETRequest(url);
}

function placeOrder(amount, price, lowhigh, timestamp) {
    document.getElementById('audio').play();
    console.log(timestamp)
    let url = 'https://wrk-graph-price-api-vg56rovkka-as.a.run.app/orders'
    // Date.prototype.toJSON = function(){ return moment(this).format(); }
    let d = new Date(timestamp);
    let betContent = JSON.stringify({
        "price": '' + price,
        "type": lowhigh,
        "amount": parseFloat(amount),
        "time": d
    })
    sendPOSTRequest(url, betContent)
    // o.d.toJSON = function(){ return moment(this).format(); }
}

function createResultRound() {
    let url = 'https://wrk-graph-price-api-vg56rovkka-as.a.run.app/rounds/results/6247d9b7f84ce5bc376efcfa'
    sendPOSTRequest(url, '')
}

function endRound() {
    let url = 'https://wrk-graph-price-api-vg56rovkka-as.a.run.app/rounds/results'
    sendGETRequest(url, updateResultCallback);
}

function currentRound() {
    let url = 'https://wrk-graph-price-api-vg56rovkka-as.a.run.app/rounds'
    sendGETRequest(url);
}

function higherButtonClickCallback(value, price, currentTimeStamp) {
    console.log("Callback when click on HigherButton with ", value)
    document.getElementById('audio').play();
    let amount = document.getElementById('price').value;
    // endRound()
    getPriceLength();
    placeOrder(amount, price, "high", currentTimeStamp);
}

function lowerButtonClickCallback(value, price, currentTimeStamp) {
    console.log("Callback when click on LowerButton with ", value)
    document.getElementById('audio').play();
    let amount = document.getElementById('price').value;
    getPriceLength();
    placeOrder(amount, price, "low", currentTimeStamp);
}

function handleLowerButtonClick(invest) {
    let from = { x: 1, y: 1 };
    let to = { x: 0.8, y: 0.8 };

    Factory.drawMark(activePoligonObjs, activeMarkObjs, [points[points.length - 1]], true, points.length - 1, Factory.GRID_RIGHTMOST_LINE, activeGroup.position.x, invest, flipflop);
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
                higherButtonClickCallback($("#price").val(), dataClient.input_value[dataClient.input_value.length - 1].price, dataClient.input_value[dataClient.input_value.length - 1].origin_time);
            }

            if (lowerButton == intersects2[0].object) {
                handleLowerButtonClick($("#price").val());
                lowerButtonClickCallback($("#price").val(), dataClient.input_value[dataClient.input_value.length - 1].price, dataClient.input_value[dataClient.input_value.length - 1].origin_time);
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

let cachedBegin, cacheEnd
// Find the list of points in the current view
function updateListOfViewingIndex() {
    let newBegin = -1;
    let newEnd = points.length - 1;

    //new end default is latest point, but if moving further than right side, newEnd is smaller
    let xLeft = Math.min(0, activePoligonObjs.position.x);
    newEnd = points.length - Math.ceil((points[newEnd][0] + xLeft - container.clientWidth) / Factory.axisXConfig.stepX);

    newEnd = Math.min(points.length - 1, newEnd);

    newBegin = newEnd - Math.ceil((points[newEnd][0] + activePoligonObjs.position.x) / Factory.axisXConfig.stepX)

    newBegin = Math.max(newBegin, 0);

    if (newBegin > newEnd) {
        console.log(newBegin, " ", newEnd);
        debugger;
    }


    //add cache view for viewing area
    cachedBegin = newBegin - (newEnd - newBegin);
    cacheEnd = newEnd + (newEnd - newBegin);

    //limit to real datasize//FIXME should base on points, not input_value
    cachedBegin = 0;//Math.min(Math.max(cachedBegin, 0), points.length - 2);//NOTE not support 2 points data
    cacheEnd = points.length - 1;//Math.min(Math.max(cacheEnd, 0), points.length - 1);

    beginViewingIndex = newBegin;//test
    endViewingIndex = newEnd;

    //FIXME, not update here
    const beginX = points[beginViewingIndex][0] + activePoligonObjs.position.x;
    const currentX = points[points.length - 1][0] + activePoligonObjs.position.x;
    Factory.updateVerticalGrid(activePoligonObjs, Factory.GRID_TOPLINE, beginX, currentX, mouseDown || zoomTween);




}

// Use to recalculate the data and update view for autoscaling
var purchaseTime, goalTime
function updateView(now) {

    updateGeometries(beginViewingIndex, endViewingIndex);


    Factory.updatePurchaseLine(activePurchaseModel, countDownTimer, countDownTimer == PURCHASE_DURATION ? points[points.length - 1][0] : undefined);
    Factory.updateFinishLine(finishLine, GOAL_DURATION)


    // If need to change current zoom level then need to add/remove grids
    if (beginViewingIndex < 0 || beginViewingIndex > points.length - 1) {
        debugger;
    }

    Factory.updateHorizontalGrid(activeHorizontalGridObjs);


    //update purchase line and goal line lifetime
    countDownTimer = PURCHASE_DURATION - Math.floor((now - purchaseTime) / 1000);
    finishTimer = PURCHASE_DURATION + GOAL_DURATION - Math.floor((now - goalTime) / 1000);

}

function updateActiveGroup(now, last) {
    let moveInOneFrame = Factory.axisXConfig.stepX * (now - last) / 1000.0

    if (mouseDown == false && moving == false) {
        activePoligonObjs.position.x -= moveInOneFrame
    }

    Factory.updateActiveLines(activePriceStatusObjs, [points[points.length - 1]], Factory.GRID_RIGHTMOST_LINE, activePoligonObjs.position.x);
    // }

    //udpate hover line
    //raycaster.setFromCamera(mouse, camera);
    // let intersects = raycaster.intersectObjects(bkgObjs);
    // if (intersects.length) {
    //     let dataIndex = x2DataIndex(intersects[0].point.x);
    //     if (dataIndex < dataClient.input_value.length) {
    //         let val = dataClient.input_value[dataIndex].time;
    //         //console.log("hover point " + dataIndex + " " + val);
    //         if (intersects.length > 0) {
    //             //console.log(intersects[0].point.x)
    //             Factory.updateMouseMoveLine(scene, intersects[0].point.x, intersects[0].point.y, Factory.axisXConfig.initialValueX, val, beginViewingIndex);
    //         }
    //     }
    // }


    //return newPos;
}

function triggerAtFinishingTime(value) {
    console.log("Reach finishing time with ", value)
    createResultRound()
    endRound()
}

//FIXME????
function updatePurchaseCycle(triggerAtPurchaseCallback, triggerAtFinishingCallback) {

    if (countDownTimer <= 0 && enablePriceMark) {
        //console.warn("Pass purchase line")
        // Greyout buttons
        enablePriceMark = false;
        Factory.disableHigherActiveLines(higherButton, activePriceStatusObjs, 0x1a6625);
        Factory.disableLowerActiveLines(lowerButton, activePriceStatusObjs, 0x782719);
        // Draw new PurchaseLine
        //countDownTimer = PURCHASE_DURATION + 1000;//hide it

        if (typeof triggerAtPurchaseCallback == "function") {
            triggerAtPurchaseCallback("no problem")
        }
    }
    if (finishTimer <= 0 && !enablePriceMark) {
        console.warn("Pass goal line")
        round += 1;
        // Remove all marks
        Factory.removeMarks(activePoligonObjs, activeMarkObjs);
        activeMarkObjs = []
        // Re-enable buttons
        Factory.enableHigherActiveLines(higherButton, activePriceStatusObjs);
        Factory.enableLowerActiveLines(lowerButton, activePriceStatusObjs);
        enablePriceMark = true;
        countDownTimer = PURCHASE_DURATION;
        finishTimer = countDownTimer + GOAL_DURATION;
        purchaseTime = Date.now();
        goalTime = purchaseTime;

        if (typeof triggerAtFinishingCallback == "function") {
            triggerAtFinishingCallback("no problem")
        }
    }
}


var lastAdding = 0;
// Fetch new data from input and draw it with animation
let newTween = undefined;
function drawNewData(newPrice, now) {
    if (mouseDown || (lastAdding && now < lastAdding + 500)) {
        //not animate, just add points
        points.push(Factory.convert(newPrice, points.length));
        lastAdding = now;
        return;
    }
    lastAdding = now;


    //Just push new and updating value in real-time
    let source = { x: points[points.length - 1][0], y: points[points.length - 1][1] };
    let newPoint = Factory.convert(newPrice, points.length);
    let target = { x: newPoint[0], y: newPoint[1] };
    points.push([source.x, source.y, 0]);

    const maxSpeed = 200;//ms
    let duration = maxSpeed + Math.abs(target.y - source.y);
    let lastX = source.x;
    let lastY = source.y;
    newTween = new TWEEN.Tween(source).to(target, duration).onUpdate(current => {
        points[points.length - 1][0] += (current.x - lastX);
        points[points.length - 1][1] += (current.y - lastY);
        lastX = current.x;
        lastY = current.y;
        //console.log(current.x)
        //Factory.updateNewPolygon(activePoligonObjs.children[0], points);
        //Factory.updateNewLine(activePoligonObjs.children[1], points);
    }).easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
            newTween = undefined;
        })
        .onStop(() => {

        })
        .start();


    //let newPolygon = Factory.addPolygon(activeGroup, activePoligonObjs, points, points.length - 2);
    //let newLine = Factory.addDataLine(activeGroup, activeDataLineObjs, points, points.length - 2, container.clientWidth, container.clientHeight)
    //Factory.updateNewPolygon(newPolygon, points);
    //Factory.updateNewLine(newLine, points);

    //updateOtherStuff(triggerAtPurchaseTime, triggerAtFinishingTime);
}

function updateGeometries(beginIndex, endIndex) {
    // Update the data line, note that two points make one data line
    Factory.updateDataLine(activePoligonObjs.children[1], points, beginIndex, endIndex);
    //  Two points make one poligon also
    Factory.updatePolygon(activePoligonObjs.children[0], points, beginIndex, endIndex);
    // activeGroup.position.set(activeGroup.position.x + (stretchValue) * 2, activeGroup.position.y, activeGroup.position.z);

    Factory.updateMarks(activeMarkObjs, points, Factory.GRID_RIGHTMOST_LINE, activePoligonObjs.position.x);

    //green is alway same with final points

    activePriceStatusObjs[0].greenDot.position.x = points[points.length - 1][0]
    activePriceStatusObjs[0].greenDot.position.y = points[points.length - 1][1]

}


function render() {
    //draw frame
    renderer.render(scene, camera);
}

let zoomTween = undefined;
function processZoom() {
    while (animating.length) {

        if (zoomTween || scaleTween) return

        if (newTween) {
            newTween.stop();
            newTween = undefined;

        }

        let zoomParams = animating.shift();
        let zoomValue = zoomParams[1];

        //limit zoom
        let lastZoom = Factory.currentZoom();
        let newZoom = lastZoom + zoomValue;
        if ((newZoom <= Factory.minZoom() && zoomValue < 0) ||
            (newZoom >= Factory.maxZoom() && zoomValue > 0)) {
            console.warn("Out of zoom limitation")
            zooming = false;
            return false;
        }

        //find zoom pivot
        let pivotIndex = x2DataIndex(zoomParams[0].x);
        if (isNaN(pivotIndex)) pivotIndex = points.length - 1;

        pivotIndex = Math.min(pivotIndex, points.length - 1);
        //console.log("Zoom pivot ",pivotIndex)

        //animate
        let gridFrom = ({ x: lastZoom, y: 0, z: 0 });
        let gridTo = ({ x: newZoom, y: 0, z: 0 });
        //adaptive duration
        const duration = Math.abs(zoomValue) / Math.pow(animating.length + 1, 2);//more action, higher speed
        let nextZoom = new TWEEN.Tween(gridFrom).to(gridTo, duration).onUpdate(function (current) {
            let ok = zoom(current.x, pivotIndex);
        }).easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                console.log(animating.length)
                zoomTween = undefined;
            })
        if (!zoomTween) {
            zoomTween = nextZoom;
            zoomTween.start();
        } else {
            zoomTween.chain(nextZoom);
            zoomTween = nextZoom;
        }
    }
}

function processNewData(now) {
    if (animating.length || newTween || scaleTween) return;
    while (newData.length) {
        drawNewData(newData.shift(), now)

        calculateAxis();
        //break;
    }
}

let scaleTween = undefined;
function processScale() {
    if (rescaleData.length) {

        if (zoomTween) return;
        let newScale = rescaleData.shift();
        let oldScale = { origin: Factory.axisYConfig.origin, stepY: Factory.axisYConfig.stepY };
        scaleTween = new TWEEN.Tween(oldScale).to(newScale, 200).onUpdate(function (current) {
            Factory.axisYConfig.origin = current.origin;
            //Factory.axisYConfig.stepY = current.stepY;
            recalculate();
        }).easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                scaleTween = undefined;
            }).start();
    }
}

function update() {
    let now = Date.now();

    TWEEN.update();

    processNewData(now)

    processZoom()

    processScale();


    if (last == 0) {
        last = Date.now();
    }

    updateActiveGroup(now, last);


    updateView(now);

    updatePurchaseCycle(triggerAtPurchaseTime, triggerAtFinishingTime);
    last = now;

}

function animate() {

    update();

    render();
    stats.update();

    requestAnimationFrame(animate);
}

function showOverlay() {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("totalcredit").style.display = "block";
    document.getElementById("triangle").style.display = "block";
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
        if (zoomTween) {
            console.warn("Still zooming. try again")
            return;
        }
        console.log("Zoom in")
        // Zoom in means negative, zoom out mean positive
        //zoomPoint.x = (container.clientWidth + 100) / 2; // zoom using middle point of screen
        //zoom to green
        let pivotX = points[points.length - 1][0] + activeGroup.position.x + activePoligonObjs.position.x;
        zoomWithEffect([pivotX, -ZOOM_STEP], true);
    })

    $("#zoomout").click(function (e) {
        if (zoomTween) {
            console.warn("Still zooming. try again")
            return;
        }
        console.log("Zoom out")
        //zoomPoint.x = (container.clientWidth + 100) / 2; // zoom using middle point of screen
        //zoom to green
        let pivotX = points[points.length - 1][0] + activeGroup.position.x + activePoligonObjs.position.x;
        zoomWithEffect([pivotX, ZOOM_STEP], true);
    })

    $("#focus").click(function (e) {

        if (zoomTween) {
            console.warn("Still zooming. try again")
            return;
        }
        let tweenFrom = ({ x: points[points.length - 1][0] + activeGroup.position.x + activePoligonObjs.position.x });
        let tweenTo = ({ x: container.clientWidth / 2 });
        let lastX = tweenFrom.x;
        zoomTween = new TWEEN.Tween(tweenFrom).to(tweenTo, 500).onUpdate(function (object) {
            activePoligonObjs.position.x += (object.x - lastX);
            lastX = object.x
        }).onComplete(function () {
            zoomTween = undefined;
        }).easing(TWEEN.Easing.Quadratic.Out)
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
            console.log(arrayColor.join(""))
            Factory.changeDataLineColor(activePoligonObjs.children[1], arrayColor.join(""));
        }

    }).on('clear', instance => {
        console.log('Event: "clear"', instance);
        Factory.changeDataLineColor(activePoligonObjs.children[1], "f27303");
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
            Factory.changePolygonColor(activePoligonObjs.children[0], arrayColor.join(""));
        }

    }).on('clear', instance => {
        console.log('Event: "clear"', instance);
        Factory.changePolygonColor(activePoligonObjs.children[0], "9f561c");
    })
}

//handle window active/inactive
var service
function onBlur() {
    console.log("Inactive");
    service = setInterval(update, 200)

};
function onFocus() {
    console.log("Active");
    if (service) {
        clearInterval(service);
        service = undefined;
    }
};

//start//detect inactive view
let isActive = true;
document.addEventListener("visibilitychange", event => {
    isActive = !document.hidden;
    if (isActive) onFocus(event);
    else onBlur(event);
});
showProgress();