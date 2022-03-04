export default class DataClient {
    constructor() {

        //detect inactive view
        let isActive = true;
        document.addEventListener("visibilitychange", event=>{
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
        websocket = new WebSocket(
            `wss://stream.binance.com:9443/ws/btcusdt@ticker`
            // `wss://grypto-price-3a6ks.ondigitalocean.app`
        );

        websocket.onmessage = (event) => {

            //no need if tab is invisiable
            //if(!isActive)return;

            let data = JSON.parse(event.data);
            let datetime =  new Date(new Date(data.E).getTime() - new Date(data.E).getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 19).replace('T', ' ');
            // console.log(datetime)
            let date = datetime.substring(0, 11)
            let time = datetime.substring(11, datetime.length)

            let input_object = {
                price: this.convertToData(data.c),
                date: date,
                time: time

            }
            // console.log(data.c)
            console.log(input_object.time +": "+ input_object.price)
            this.input_value.push(input_object)
            // return parseFloat(data.c)
            // update graph price here

            //limit cache
            if(this.input_value.length > 500){
                this.input_value.shift();
            }
        }

        this._lastTimestamp = 0;
    };

    shift(){
        this.input_value.shift();
    }

    getHistoricalData(totalData) {
        var xmlHttp = new XMLHttpRequest();
        let results = this.input_value;
        let self = this;
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                let MAXSLICE = parseInt(totalData / 60, 10) + 1;
                let data = JSON.parse(xmlHttp.responseText).slice(MAXSLICE*-1)
                // console.log(data)

                // Get the data in the time order
                for (let i = data.length-1; i >= 0; i--) {
                    for (let j = 0; j < 60; j++) {
                        if (results.length >= totalData) {
                            return;
                        }
                        let miliseconds = data[i][0] + j*1000
                        let datetime = new Date(new Date(miliseconds).getTime() - new Date(miliseconds).getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 19).replace('T', ' ');
                        // console.log(datetime)
                        let date = datetime.substring(0, 11)
                        let time = datetime.substring(11, datetime.length)

                        let input_object = {
                            price: (parseFloat(data[i][1])).toFixed(2),// / 100000),
                            date: date,
                            time: time

                        }
                        results.push(input_object);
                        self._internalIndex++;
                    }
                }
            }
        }
        xmlHttp.open("GET", 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m', true); // true for asynchronous 
        xmlHttp.send(null);
    }

    getSyncNext(now) {//FIXME will be diffirent for real data
        if (this.input_value.length > this.currentIndex+1) {
            // this.getDataFromSocket();
            if (this.currentIndex < this.input_value.length - 1) {
                // this.currentIndex++;
                if(this.input_value[this.currentIndex].time != this._lastTimestamp){
                    this._lastTimestamp = this.input_value[this.currentIndex].time ;

                    this.last = now;
                    return this.input_value[this.currentIndex++];
                }else{
                    this.currentIndex += (this.currentIndex < this.input_value.length - 1?1:0);
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