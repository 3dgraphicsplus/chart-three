export default class DataClient {
    constructor() {

        // Dummy Data
        // Line Step
        this.input_value = [];
        // this.input_value = TEST_DATA;
        this.last = undefined;
        this.currentIndex = -1;
        let websocket;
        websocket = new WebSocket(
            `wss://stream.binance.com:9443/ws/btcusdt@ticker`
        );

        websocket.onmessage = (event) => {
            let data = JSON.parse(event.data);
            let datetime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 19).replace('T', ' ');
            let date = datetime.substring(0, 11)
            let time = datetime.substring(11, datetime.length)

            let input_object = {
                price: this.convertToData(data.c),
                date: date,
                time: time

            }
            // console.log(input_object)
            this.input_value.push(input_object)
            // return parseFloat(data.c)
            // update graph price here
        }
    };

    getSyncNext(now) {//FIXME will be diffirent for real data
        if ((!this.last || now - this.last >= 1000)) {
            // this.getDataFromSocket();
            this.last = now;
            if (this.currentIndex < this.input_value.length - 1) {
                // this.currentIndex++;
                return this.input_value[this.currentIndex];
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
        return (parseFloat(x)*100000).toFixed(0)
    }

    convertToData(x) {
        return (parseFloat(x)/100000)
    }
}