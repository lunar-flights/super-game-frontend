import { Howl } from "howler";

class SoundManager {
  private sounds: { [key: string]: Howl } = {};
  private backgroundMusic: Howl | null = null;
  private isMusicOn: boolean = true;

  constructor() {
    const savedMusicState = localStorage.getItem("isMusicOn");
    this.isMusicOn = savedMusicState !== "false";

    this.sounds["shots"] = new Howl({
      src: [process.env.PUBLIC_URL + "/sounds/shots-2.mp3"],
      preload: true,
      volume: 0.2,
      loop: false,
    });

    this.sounds["walk"] = new Howl({
      src: [process.env.PUBLIC_URL + "/sounds/walk.mp3"],
      preload: true,
    });

    this.sounds["jet-move"] = new Howl({
      src: [process.env.PUBLIC_URL + "/sounds/jet-move.mp3"],
      preload: true,
    });

    this.sounds["tank-move"] = new Howl({
      src: [process.env.PUBLIC_URL + "/sounds/tank-move.mp3"],
      preload: true,
    });

    this.sounds["select"] = new Howl({
      src: [process.env.PUBLIC_URL + "/sounds/select.mp3"],
      preload: true,
    });

    this.sounds["ding"] = new Howl({
      src: [process.env.PUBLIC_URL + "/sounds/ding.mp3"],
      preload: true,
    });

    this.sounds["beep"] = new Howl({
      src: [process.env.PUBLIC_URL + "/sounds/beep.wav"],
      preload: true,
    });

    this.backgroundMusic = new Howl({
      src: [process.env.PUBLIC_URL + "/sounds/background.mp3"],
      preload: true,
      loop: true,
      volume: 0.2,
    });

    if (this.isMusicOn) {
      this.playBackgroundMusic();
    }
  }

  play(soundName: string) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.stop();
      sound.play();
    } else {
      console.warn(`Sound "${soundName}" not found.`);
    }
  }

  stop(soundName: string) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.stop();
    } else {
      console.warn(`Sound "${soundName}" not found.`);
    }
  }

  playBackgroundMusic() {
    if (!this.isMusicOn || !this.backgroundMusic) return;
    if (!this.backgroundMusic.playing()) {
      this.backgroundMusic.play();
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
  }

  toggleBackgroundMusic() {
    this.isMusicOn = !this.isMusicOn;

    if (this.isMusicOn) {
      this.playBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }

    localStorage.setItem("isMusicOn", this.isMusicOn.toString());
  }

  isMusicEnabled() {
    return this.isMusicOn;
  }
}

const soundManager = new SoundManager();
export default soundManager;
