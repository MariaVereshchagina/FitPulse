"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    const months = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];

    this.description = `${this.type === "running" ? "Бег" : "Велосипед"} ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}, ${this.date.getFullYear()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  _workouts = [];
  _map;
  _mapEvent;

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleField.bind(this));
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Вы не предоставили доступ к своей локации");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    ymaps.ready(() => {
      this._map = new ymaps.Map("map", {
        center: coords,
        zoom: 15,
      });

      this._map.events.add("click", this._showForm.bind(this));
      this._workouts.forEach((work) => this._renderWorkoutMarker(work));
    });
  }

  _showForm(mapE) {
    this._mapEvent = mapE.get("coords");
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _toggleField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp) && inp > 0);

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    if (type === "running") {
      const cadence = +inputCadence.value;
      if (!validInputs(distance, duration, cadence)) {
        return alert("Необходимо ввести положительные числа");
      }
      workout = new Running(this._mapEvent, distance, duration, cadence);
    } else if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (!validInputs(distance, duration, elevation)) {
        return alert("Необходимо ввести положительные числа");
      }
      workout = new Cycling(this._mapEvent, distance, duration, elevation);
    }

    this._workouts.push(workout);
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    const placemark = new ymaps.Placemark(
      workout.coords,
      {
        hintContent: workout.description,
        balloonContent: `
          <strong>${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${
          workout.description
        }</strong><br>
          Дистанция: ${workout.distance} км<br>
          Продолжительность: ${workout.duration} мин
          ${
            workout.type === "running"
              ? `<br>Темп: ${workout.pace.toFixed(1)} мин/км`
              : `<br>Скорость: ${workout.speed.toFixed(1)} км/ч`
          }`,
      },
      {
        balloonMaxWidth: 250,
        balloonCloseButton: true,
      }
    );

    this._map.geoObjects.add(placemark);
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">км</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">мин</span>
        </div>`;

    if (workout.type === "running") {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">мин/км</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">шаг/мин</span>
        </div>`;
    } else if (workout.type === "cycling") {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">км/ч</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">м</span>
        </div>`;
    }

    html += `</li>`;
    form.insertAdjacentHTML("afterend", html);
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    form.classList.add("hidden");
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;

    const workout = this._workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );
    if (!workout) return;

    this._map.panTo(workout.coords, {
      duration: 600,
      flying: true,
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this._workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;

    this._workouts = data.map((work) => {
      if (work.type === "running") {
        const running = new Running(
          work.coords,
          work.distance,
          work.duration,
          work.cadence
        );
        running.date = new Date(work.date);
        running._setDescription();
        return running;
      } else if (work.type === "cycling") {
        const cycling = new Cycling(
          work.coords,
          work.distance,
          work.duration,
          work.elevation
        );
        cycling.date = new Date(work.date);
        cycling._setDescription();
        return cycling;
      }
    });

    this._workouts.forEach((work) => this._renderWorkout(work));
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
