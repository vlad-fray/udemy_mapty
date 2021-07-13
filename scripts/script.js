'use strict';

// Classes

class Workout {
	date = new Date();
	id = (Date.now() + '').slice(-10);
	constructor(coords, distance, duration) {
		this.coords = coords;
		this.distance = distance;
		this.duration = duration;
	}
}

class Running extends Workout {
	type = 'running';
	constructor(coords, distance, duration, cadence) {
		super(coords, distance, duration);
		this.cadence = cadence;
		this.calcPace();
	}
	calcPace() {
		// min/km
		this.pace = this.duration / this.distance;
		return this.pace;
	}
}
class Cycling extends Workout {
	type = 'cycling';
	constructor(coords, distance, duration, elevation) {
		super(coords, distance, duration);
		this.elevation = elevation;
		this.calcSpeed();
	}
	calcSpeed() {
		// km/h
		this.speed = this.distance / (this.duration / 60);
		return this.speed;
	}
}

////////////////////////////////////////////
// APPLICATION ARCHITECTURE

const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

const form = document.querySelector('.form');
const containerWorkouts =
	document.querySelector('.workouts');
const inputType = document.querySelector(
	'.form__input--type'
);
const inputDistance = document.querySelector(
	'.form__input--distance'
);
const inputDuration = document.querySelector(
	'.form__input--duration'
);
const inputCadence = document.querySelector(
	'.form__input--cadence'
);
const inputElevation = document.querySelector(
	'.form__input--elevation'
);

class App {
	#map = null;
	#mapEvent = null;
	#workouts = [];
	constructor() {
		this._getPosition();

		// Event listeners
		form.addEventListener(
			'submit',
			this._newWorkout.bind(this)
		);
		inputType.addEventListener(
			'change',
			this._toggleElevetionField.bind(this)
		);
	}
	_getPosition() {
		if (navigator.geolocation)
			navigator.geolocation.getCurrentPosition(
				this._loadMap.bind(this),
				function () {
					alert('Error, couldn`t get your geolocation');
				}
			);
	}
	_loadMap(pos) {
		const { latitude, longitude } = pos.coords;
		const coords = [latitude, longitude];
		this.#map = L.map('map').setView(coords, 13);
		L.tileLayer(
			'//api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
			{
				attribution:
					'Map data &copy; <a href="//www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				maxZoom: 18,
				id: 'mapbox/streets-v11',
				tileSize: 512,
				zoomOffset: -1,
				accessToken:
					'pk.eyJ1IjoicmVrcnV0MzEzIiwiYSI6ImNrcjBmMDlwZzA1Z3oyeXFtNno3c3d3cGYifQ.8awmdm9B-0an3Pzoh0E3Zg',
			}
		).addTo(this.#map);

		this.#map.on('click', this._showForm.bind(this));
	}
	_showForm(mapE) {
		this.#mapEvent = mapE;
		form.classList.remove('hidden');
		inputDistance.focus();
	}
	_toggleElevetionField() {
		inputElevation
			.closest('.form__row')
			.classList.toggle('form__row--hidden');
		inputCadence
			.closest('.form__row')
			.classList.toggle('form__row--hidden');
	}
	_newWorkout(e) {
		const validInputs = (...inputs) =>
			inputs.every((input) => Number.isFinite(input));
		const allPositive = (...inputs) =>
			inputs.every((input) => input > 0);
		e.preventDefault();

		const type = inputType.value;
		const distance = +inputDistance.value;
		const duration = +inputDuration.value;
		const { lat, lng } = this.#mapEvent.latlng;
		let workout = null;

		if (type === 'running') {
			const cadence = +inputCadence.value;
			if (
				!validInputs(distance, duration, cadence) ||
				!allPositive(distance, duration, cadence)
			) {
				return alert(
					'Value in inputs has to be positive numbers'
				);
			}

			workout = new Running(
				[lat, lng],
				distance,
				duration,
				cadence
			);
		}
		if (type === 'cycling') {
			const elevation = +inputElevation.value;
			if (
				!validInputs(distance, duration, elevation) ||
				!allPositive(distance, duration)
			) {
				return alert(
					'Value in inputs has to be positive numbers'
				);
			}
			workout = new Cycling(
				[lat, lng],
				distance,
				duration,
				elevation
			);
		}
		this.#workouts.push(workout);
		console.log(this.#workouts);
		this._createMarker(workout);
		this._resetFields();
	}
	_createMarker = (workout) => {
		L.marker(workout.coords)
			.addTo(this.#map)
			.bindPopup(
				L.popup({
					maxWidth: 250,
					minWidth: 100,
					autoClose: false,
					closeOnClick: false,
					className: `${workout.type}-popup`,
				})
			)
			.setPopupContent(`${workout.distance}`)
			.openPopup();
	};
	_resetFields = () => {
		inputType.value = inputType.children[0].value;
		inputDistance.value = '';
		inputDuration.value = '';
		inputCadence.value = '';
		inputElevation.value = '';
	};
}
const app = new App();
