import { Howl } from "howler";

class SoundManager {
  private sounds: { [key: string]: Howl } = {};
  private backgroundMusic: Howl | null = null;

  constructor() {
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

    this.backgroundMusic = new Howl({
      src: [process.env.PUBLIC_URL + "/sounds/background.mp3"],
      preload: true,
      loop: true,
      volume: 0.2,
      autoplay: true,
    });
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
}

const soundManager = new SoundManager();
export default soundManager;
