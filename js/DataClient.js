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

        //detect inactive view
        let isActive = true;
        document.addEventListener("visibilitychange", event => {
            isActive = !document.hidden;
            console.log("Tab visibility changed " + isActive);
        });
        // Dummy Data
        // Line Step
        this.input_value = [];
        // this.input_value = TEST_DATA;
        this.last = undefined;
        this.currentIndex = -1;
        let websocket;
        const socket = io("wss://grypto-price-3a6ks.ondigitalocean.app");
        //const socket = io("wss://wrk-graph-price-5cqsj.ondigitalocean.app");
        //wss://wrk-graph-price-5cqsj.ondigitalocean.app
        // get only first message to historical data
        let self = this;
        this.loadingDone = false;
        socket.on('message', async (msg) => {
            if(!msg)return;
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
                if (self.loadingDone)
                    this.addValue(JSON.parse(msg))
            }


        }
        )

        this._lastTimestamp = 0;
    }

    length(){
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
        let d = new Date(value[0] | value.E);
        let isDate = true;//this.validateDate(d)//assume it is always correct
        if (!isDate) {
            console.warn("Wrong data format " + JSON.stringify(value));
            return;
        }
        let datetime = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 19).replace('T', ' ');
        // console.log(datetime)
        let date = datetime.substring(0, 11)
        let time = datetime.substring(11, datetime.length)
        let input_object = {
            price: parseFloat((value[1]?parseFloat(value[1]):parseFloat(value.c)).toFixed(2)),// / 100000),
            date: date,
            time: time
        }
        this.input_value.push(input_object);
        self._internalIndex++;

        //limit cache
        if (this.input_value.length > 3600) {
            this.input_value.shift();
            self._internalIndex--;
            self.currentIndex--;
        }
    }

    shift() {
        this.input_value.shift();
    }

    getHistoricalData(totalData) {
        return;
        const socket = io("wss://grypto-price-3a6ks.ondigitalocean.app");
        // get only first message to historical data
        socket.on('message', async (msg) => {
            // console.info(msg);
            //socket.close();
            let data = msg;

            // // Get the data in the time order
            for (let i = 0; i < data.length - 1; i = i + 5) { // get every 5 seconds data
                let datetime = new Date(new Date(data[i][0]).getTime() - new Date(data[i][0]).getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 19).replace('T', ' ');
                // console.log(datetime)
                let date = datetime.substring(0, 11)
                let time = datetime.substring(11, datetime.length)
                let input_object = {
                    price: (parseFloat(data[i][1])).toFixed(2),// / 100000),
                    date: date,
                    time: time
                }
                this.input_value.push(input_object);
                self._internalIndex++;
            }

            if (this.input_value.length > totalData) {
                this.input_value.splice(0, this.input_value.length - totalData);
            }
        });
    }

    getSyncNext(now) {//FIXME will be diffirent for real data
        if (this.input_value.length > this.currentIndex + 1) {
            // this.getDataFromSocket();
            if (this.currentIndex < this.input_value.length - 1) {
                // this.currentIndex++;
                if (this.input_value[this.currentIndex].time != this._lastTimestamp) {
                    this._lastTimestamp = this.input_value[this.currentIndex].time;

                    this.last = now;
                    return this.input_value[this.currentIndex++];
                } else {
                    this.currentIndex += (this.currentIndex < this.input_value.length - 1 ? 1 : 0);
                }
            }
        }
    }

    getNext() {
        if (this.currentIndex < this.input_value.length - 1) {
            // this.getDataFromSocket();
            this.currentIndex++;
            // console.log(this.currentIndex);
            return this.input_value[this.currentIndex];
        }
    }

    updateSequence() {
        this.currentIndex++;
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