//utils
function asyncLoop(arr, callback, onComplete) {
    (function loop(i) {

        //do stuff here
        if (i < arr.length) {
            callback(arr[i]);                   //the condition
            setTimeout(function () { loop(++i) }, 0); //rerun when condition is true
        } else {
            onComplete();
        }
    }(0));                                         //start with 0
}

export default class DataClient {
    constructor() {

        // Dummy Data
        // Line Step
        this.input_value = [];
        // this.input_value = TEST_DATA;
        this.last = undefined;
        let websocket;
        const socket = io("wss://wrk-graph-price-5cqsj.ondigitalocean.app");
        //const socket = io("wss://wrk-graph-price-5cqsj.ondigitalocean.app");
        //wss://wrk-graph-price-5cqsj.ondigitalocean.app
        // get only first message to historical data
        let self = this;
        this.loadingDone = false;
        socket.on('message', async (msg) => {
            if (!msg) return;
            //test
            //if (this.currentIndex > 400) return;
            //no need if tab is invisiable
            //if(!isActive)return;

            if (msg instanceof Array) {
                if (!self.loadingDone)
                    asyncLoop(msg, val => {
                        self.addValue(val)
                    }, () => {
                        self.loadingDone = true;
                    })
            } else {
                if (self.loadingDone) {
                    this.addValue(JSON.parse(msg))
                }
            }


        }
        )

        this._lastTimestamp = 0;

        this.onNew = undefined;
    }

    currentIndex() {
        return this.input_value.length - 1;
    }

    getNExt

    length() {
        return this.input_value.length;
    }

    validateDate(d) {
        if (Object.prototype.toString.call(d) === "[object Date]") {
            // it is a date
            if (isNaN(d)) { // d.getTime() or d.valueOf() will also work
                // date object is not valid
            } else {
                // date object is valid
                return true;
            }
        } else {
            // not a date object
        }
        return false;
    }

    addValue(value) {
        //validate date
        let d = new Date(value.C | value.E);
        let isDate = true;//this.validateDate(d)//assume it is always correct
        if (!isDate) {
            console.warn("Wrong data format " + JSON.stringify(value));
            return;
        }
        let priceTested = parseFloat(parseFloat(value.c).toFixed(2));
        if (isNaN(priceTested)) {
            console.error("broken data ", value);
            return;
        }

        let datetime = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 19).replace('T', ' ');
        // console.log(datetime)
        let date = datetime.substring(0, 11)
        let time = datetime.substring(11, datetime.length)
        let input_object = {
            price: priceTested,// / 100000),
            date: date,
            time: time,
            origin_time: value.C
        }
        this.input_value.push(input_object);
        this._internalIndex++;

        //limit cache
        if (this.input_value.length > 5000) {
            this.input_value.shift();
            this._internalIndex--;
        }

        if (this.loadingDone && this.onNew) {
            this.onNew(input_object)
        }


        //console.log("new data message ",value.E ,": ",value.c )
        //console.log("new data ",input_object.time ,": ",input_object.price )
    }


    getPriceBackward(callback) {
        let url = 'https://wrk-graph-price-api-vg56rovkka-as.a.run.app/prices/backward?d=1'
        this.sendGETRequest(url, data => {
            console.log(data);
            data.forEach(e => {
                this.addValueToBeginning(e);
            })

            callback(data.length);
        });
    }

    addValueToBeginning(value) {
        //validate date
        let d = new Date(value.C);
        let isDate = true;//this.validateDate(d)//assume it is always correct

        if (!isDate) {
            console.warn("Wrong data format " + JSON.stringify(value));
            return;
        }

        let priceTested = parseFloat(value.c).toFixed(2);
        if (isNaN(priceTested)) {
            console.error("broken data ", value);
            return;
        }

        let datetime = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 19).replace('T', ' ');
        // console.log(datetime)
        let date = datetime.substring(0, 11)
        let time = datetime.substring(11, datetime.length)
        let input_object = {
            price: priceTested,// / 100000),
            date: date,
            time: time,
            origin_time: value.C
        }
        this.input_value.unshift(input_object);
        this._internalIndex++;

        //limit cache
        if (this.input_value.length > 5000) {
            this.input_value.shift();
            this._internalIndex--;
        }

    }

    shift() {
        this.input_value.shift();
    }


    sendGETRequest(url, callback) {
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
                // console.log(`Done, got ${xhr.response.length} bytes with data is ${xhr.response}`); // response is the server response
            }
        };
    }

    sendPOSTRequest(url, betContent) {
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

    getOrigin() {
        return this.input_value[0];
    }

    convertToDisplay(x) {
        return (parseFloat(x))
    }

    convertToData(x) {
        return (parseFloat(x))
    }
}