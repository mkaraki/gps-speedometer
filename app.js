const speedometer = {
    positionOptions: {
        maximumAge: 0,
        timeout: 5000,
        enableHighAccuracy: true,
    },
    appState: {
        locked: false,
    },
    initialize: function () {
        if (this.appState.locked) return;
        console.trace('Start initializing speedometer');
        if (!navigator.geolocation) {
            alert('This device does not support gps speedometer');
            return;
        }

        navigator.geolocation.watchPosition(this.onPositionReceived, this.onPositionError, this.positionOptions);
        this.appState.locked = true;
    },
    onPositionReceived: function (position) {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        const speed = position.coords.speed;
        if (speed !== null) {
            const speedInKmPerHour = speed * 3.6; // means: data(m/s) * 3600 / 1000
            elementSpeed.innerText = speedInKmPerHour.toFixed(2);
            const time = new Date();
            const timeStr = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
            gTimes.push(timeStr);
            gSpeeds.push(speedInKmPerHour);

            if (gSpeeds.length > 100) {
                gTimes.shift();
                gSpeeds.shift();
            }

            chart.update('none');

            if (saveHistory) {
                const sTr = document.createElement('tr')
                const sTcu = document.createElement('td');
                sTcu.innerText = Date.now().toString();
                sTcu.classList.add('hide');
                sTr.appendChild(sTcu);
                const sTct = document.createElement('th');
                sTct.innerText = timeStr;
                sTct.setAttribute('scope', 'row');
                sTr.appendChild(sTct);
                const sTcs = document.createElement('td');
                sTcs.innerText = speedInKmPerHour.toFixed(2);
                sTr.appendChild(sTcs);

                if (latitude !== null && longitude !== null) {
                    const sTcla = document.createElement('td');
                    sTcla.innerText = latitude;
                    sTcla.classList.add('hide');
                    sTr.appendChild(sTcla);

                    const sTclo = document.createElement('td');
                    sTclo.innerText = longitude;
                    sTclo.classList.add('hide');
                    sTr.appendChild(sTclo);
                }

                if (position.coords.accuracy !== null) {
                    const sTca = document.createElement('td');
                    sTca.innerText = position.coords.accuracy.toString();
                    sTca.classList.add('hide');
                    sTr.appendChild(sTca);
                }

                speedTable.insertAdjacentElement('afterbegin', sTr);
            };
        }

        if (longitude !== null && latitude !== null) {
            elementPosition.innerText = `${latitude}, ${longitude}`;

            if (lastQuery > Date.now() - 5000) {
                return;
            }

            fetch(appConfig.reverseGeoEndpoint + `?lat=${latitude}&lon=${longitude}`).then((r) => r.json()).then((r) => {
                elementReversedPosition.innerText = r['location'];
                elementReversedPositionAttribution.innerText = r['attribution'] ?? '';
            }).catch((e) => { console.error(e) });
        }

        if (position.coords.accuracy !== null) {
            elementPosition.innerHTML += ` <small>(${Math.round(position.coords.accuracy * 10) / 10}m)</small>`;
        }

    },
    onPositionError: function (error) {
        alert('Error: ' + error.message);
    },
};

const elementSpeed = document.getElementById('speed');
const elementPosition = document.getElementById('position');
const elementReversedPosition = document.getElementById('reversedPosition');
const elementReversedPositionAttribution = document.getElementById('reversedPositionAttribution');
const speedTable = document.getElementById('speedTable');
let speedChartElem = document.getElementById('speedChart');

let lastQuery = 0;

let gTimes = [];
let gSpeeds = [];


function dlTable() {
    const table = document.getElementById('spdTable');
    const trs = table.querySelectorAll('tr');
    let contents = '';
    trs.forEach((element) => {
        const tds = element.querySelectorAll('td,th');
        let lines = '';
        tds.forEach(td => {
            contents += td.innerText + ',';
        });
        lines = lines.substring(0, lines.length - 1);
        contents += lines + '\r\n';
    });

    const link = document.createElement('a');
    link.setAttribute('target', '_blank');
    link.setAttribute('download', `speed_${Date.now()}_.csv`);
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(contents));
    speedTable.appendChild(link);
    link.click();
    speedTable.removeChild(link);
}

let chart = null;

function clearChart() {
    gTimes = [];
    gSpeeds = [];
    chart.update();
}

const genChart = () => {
    chart = new Chart(speedChartElem, {
        type: 'line',
        animation: false,
        responsive: false,
        data: {
            labels: gTimes,
            datasets: [{
                data: gSpeeds,
                label: "Speed",
                fill: false
            }]
        },
    });
}

window.onload = () => {
    speedometer.initialize();

    genChart();
};