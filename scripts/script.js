// I hope, I will no need to go back to this project

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
	_setDescription() {
		//prettier-ignore
		const months = [
			'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
		];

		this.description = `${this.type[0].toUpperCase()}${this.type.slice(
			1
		)} on ${
			months[this.date.getMonth()]
		} ${this.date.getDate()}`;
	}

	click() {
		this.clicks++;
	}
}

class Running extends Workout {
	type = 'running';
	constructor(coords, distance, duration, cadence) {
		super(coords, distance, duration);
		this.cadence = cadence;
		this.calcPace();
		this._setDescription();
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
		this._setDescription();
	}
	calcSpeed() {
		// km/h
		this.speed = this.distance / (this.duration / 60);
		return this.speed;
	}
}

////////////////////////////////////////////
// APPLICATION ARCHITECTURE

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
	#mapZoomLevel = 13;
	#workouts = [];
	constructor() {
		this._getPosition();

		this._getLocalStorage();

		// Event handlers
		form.addEventListener(
			'submit',
			this._newWorkout.bind(this)
		);
		inputType.addEventListener(
			'change',
			this._toggleElevetionField.bind(this)
		);
		containerWorkouts.addEventListener(
			'click',
			this._moveToPopup.bind(this)
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
		this.#map = L.map('map').setView(
			coords,
			this.#mapZoomLevel
		);
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
		this.#workouts.forEach((work) => {
			this._createMarker(work);
		});
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
		e.preventDefault();
		const validInputs = (...inputs) =>
			inputs.every((input) => Number.isFinite(input));
		const allPositive = (...inputs) =>
			inputs.every((input) => input > 0);

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
		this._renderWorkout(workout);
		this._createMarker(workout);
		this._resetFields();
		this._setLocaleStorage();
	}
	_renderWorkout = (workout) => {
		let html = `
		<li
			class="workout workout--${workout.type}"
			data-id="${workout.id}"
		>
			<h2 class="workout__title">
				${workout.description}
			</h2>
			<div class="workout__details">
				<span class="workout__icon">${
					workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
				}</span>
				<span class="workout__value">${workout.distance}</span>
				<span class="workout__unit">km</span>
			</div>
			<div class="workout__details">
				<span class="workout__icon">⏱</span>
				<span class="workout__value">${workout.duration}</span>
				<span class="workout__unit">min</span>
			</div>
		`;
		if (workout.type == 'running')
			html += `
				<div class="workout__details">
					<span class="workout__icon">⚡️</span>
					<span class="workout__value">${workout.pace.toFixed(
						1
					)}</span>
				<span class="workout__unit">min/km</span>
				</div>
				<div class="workout__details">
					<span class="workout__icon">🦶🏼</span>
					<span class="workout__value">${workout.cadence}</span>
					<span class="workout__unit">spm</span>
				</div>
			</li>
			`;
		else
			html += `
				<div class="workout__details">
					<span class="workout__icon">⚡️</span>
					<span class="workout__value">${workout.speed.toFixed(
						1
					)}</span>
					<span class="workout__unit">km/h</span>
				</div>
				<div class="workout__details">
					<span class="workout__icon">⛰</span>
					<span class="workout__value">${workout.elevation}</span>
					<span class="workout__unit">m</span>
				</div>
			</li>
		`;
		form.insertAdjacentHTML('afterend', html);
	};
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
			.setPopupContent(
				`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
					workout.description
				}`
			)
			.openPopup();
	};
	_resetFields = () => {
		inputType.value = inputType.children[0].value;
		inputDistance.value = '';
		inputDuration.value = '';
		inputCadence.value = '';
		inputElevation.value = '';
		this.#mapEvent = null;
		form.style.display = 'none';
		form.classList.add('hidden');
		setTimeout(() => {
			form.style.display = 'grid';
		}, 1000);
	};
	_moveToPopup(e) {
		const workoutEl = e.target.closest('.workout');
		if (!workoutEl) return;
		const workout = this.#workouts.find(
			(work) => work.id === workoutEl.dataset.id
		);
		this.#map.setView(workout.coords, this.#mapZoomLevel, {
			animate: true,
			pan: {
				duration: 1,
			},
		});
	}
	_setLocaleStorage() {
		localStorage.setItem(
			'workouts',
			JSON.stringify(this.#workouts)
		);
	}
	_getLocalStorage() {
		const data = JSON.parse(
			localStorage.getItem('workouts')
		);

		if (!data) return;

		this.#workouts = data;
		this.#workouts.forEach((work) => {
			this._renderWorkout(work);
		});
	}
	reset() {
		localStorage.removeItem('workouts');
		location.reload();
	}
}
const app = new App();
