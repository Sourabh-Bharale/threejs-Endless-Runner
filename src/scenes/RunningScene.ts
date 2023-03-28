import {
  Scene, DirectionalLight, AmbientLight, Object3D, AnimationMixer, AnimationAction, Clock, Box3
} from 'three';
import TWEEN, { Tween } from '@tweenjs/tween.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export default class RunningScene extends Scene {
  // entity
  private fbxLoader = new FBXLoader();
  private platform = new Object3D();
  private player = new Object3D();
  private animationMixer!: AnimationMixer;
  private runningAnimation!: AnimationAction;
  private clock = new Clock();
  private delta = 0;
  private platformClone = new Object3D();
  private platformSize = 0;
  private speed = 220;
  private currentAnimation!: AnimationAction;
  // jump
  private jumpingAnimation!: AnimationAction;
  private isJumping = false;
  private jumpingUp!: Tween<any>;
  private jumpingDown!: Tween<any>;
  // slide
  private isSliding = false;
  private slidingAnimation !: AnimationAction;
  private sliderTimeout!: ReturnType<typeof setTimeout>;



  // movements
  private moveLeft() {
    if (this.player.position.x !== -18) {
      const tweenLeft = new TWEEN.Tween(this.player.position)
        .to({ x: this.player.position.x - 18 }, 200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          this.player.rotation.y = -140 * (Math.PI / 180);
          if (this.player.position.x <= -18) {
            this.player.position.x = -18;
          }
        })
        .onComplete(() => {
          this.player.rotation.y = 180 * (Math.PI / 180);
        });
      tweenLeft.start();
    }
  }
  private moveRight() {
    if (this.player.position.x !== 18) {
      this.player.rotation.y = 140 * (Math.PI / 180);
      const tweenRight = new Tween(this.player.position)
        .to({ x: this.player.position.x + 18 }, 200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          if (this.player.position.x >= 18) {
            this.player.position.x = 18;
          }
        })
        .onComplete(() => {
          this.player.rotation.y = 180 * (Math.PI / 180);
        });
      tweenRight.start();
    }
  }
  private slide() {
    if (!this.isSliding) {
      if (this.isJumping) {
        this.jumpingUp.stop();
        this.jumpingDown.stop();
        this.player.position.y = -35;
        this.isJumping = false;
      }
      this.isSliding = true;
      this.player.position.y -= 5;
      this.currentAnimation.stop();
      this.slidingAnimation.reset();
      this.currentAnimation = this.slidingAnimation;
      this.slidingAnimation.clampWhenFinished = true;
      this.slidingAnimation.play();
      this.slidingAnimation.crossFadeTo(this.runningAnimation, 1.9, false).play();
      this.currentAnimation = this.runningAnimation;
      this.sliderTimeout = setTimeout(() => {
        this.player.position.y = -35;
        this.isSliding = false;
      }, 800);
    }
  }
  private jump() {
    if (!this.isJumping) {
      if (this.isSliding) {
        clearTimeout(this.sliderTimeout);
        this.player.position.y = -35;
        this.isSliding = false;
      }
      this.isJumping = true;
      this.currentAnimation.stop();

      this.currentAnimation = this.jumpingAnimation;
      this.currentAnimation.reset();
      this.currentAnimation.setLoop(1, 1);
      this.currentAnimation.clampWhenFinished = true;
      this.currentAnimation.play();
      this.animationMixer.addEventListener('finished', () => {
        this.currentAnimation.crossFadeTo(this.runningAnimation, 0.1, false).play();
        this.currentAnimation = this.runningAnimation;
      });

      this.jumpingUp = new Tween(this.player.position).to({ y: this.player.position.y += 20 }, 400);
      this.jumpingDown = new Tween(this.player.position)
        .to({ y: this.player.position.y -= 20 }, 500);
      this.jumpingUp.chain(this.jumpingDown);
      this.jumpingUp.start();
      this.jumpingDown.onComplete(() => {
        this.isJumping = false;
        this.player.position.y = -35;
      });
    }
  }


  async load() {
    // ambient light
    const ambient = new AmbientLight(0xFFFFFF, 2.5);
    this.add(ambient);

    // sun
    const light = new DirectionalLight(0xFFFFFF, 2.5);
    light.position.set(0, 40, -10);
    this.add(light);

    // load platform
    this.platform = await this.fbxLoader.loadAsync('./assets/models/wooden-cave.fbx');
    this.platform.position.set(0, 0, 0);
    this.platform.scale.set(0.05, 0.05, 0.05);
    this.add(this.platform);

    // load plaformClone
    this.platformClone = this.platform.clone();
    const platformBox = new Box3().setFromObject(this.platformClone);
    this.platformSize = platformBox.max.z - platformBox.min.z - 1;
    this.platformClone.position.z = this.platformClone.position.z + this.platformSize;
    this.add(this.platformClone);

    // load player
    this.player = await this.fbxLoader.loadAsync('../../assets/characters/xbot.fbx');
    this.player.position.z = -110;
    this.player.position.y = -35;
    this.player.scale.set(  0.2,  0.2,   0.2);
    this.player.rotation.y = 180 * (Math.PI / 180);
    this.add(this.player);

    // **load animation** //
    // running
    const runningAnimationObject = await this.fbxLoader.loadAsync('./assets/animations/running.fbx');
    this.animationMixer = new AnimationMixer(this.player);
    this.runningAnimation = this.animationMixer.clipAction(runningAnimationObject.animations[0]);
    this.runningAnimation.play();
    this.currentAnimation = this.runningAnimation;

    //jumping
    const jumpingAnimationObject = await this.fbxLoader.loadAsync('./assets/animations/jumping.fbx')
    this.jumpingAnimation = this.animationMixer.clipAction(jumpingAnimationObject.animations[0]);

    // sliding
    const slidingAnimationObject = await this.fbxLoader.loadAsync('./assets/animations/sliding.fbx');
    slidingAnimationObject.animations[0].tracks.shift();
    this.slidingAnimation = this.animationMixer.clipAction(slidingAnimationObject.animations[0]);
  }




  initialize() {

    // movements
    document.onkeydown = (e) => {
      if (e.key === 'ArrowLeft') {
        this.moveLeft();
      }if (e.key === 'ArrowRight') {
        this.moveRight();
      }if (e.key === 'ArrowUp') {
        this.jump();
      }if (e.key === 'ArrowDown') {
        this.slide();
      }
    };
  }

  update() {
    // player animation
    if (this.animationMixer) {
      this.delta = this.clock.getDelta();
      this.animationMixer.update(this.delta);
    }
    // update platform
    this.platform.position.z += this.speed * this.delta;
    this.platformClone.position.z += this.speed * this.delta;
    if (this.platform.position.z > 600) {
      this.platform.position.z = this.platformClone.position.z - this.platformSize;
    }
    if (this.platformClone.position.z > 600) {
      this.platformClone.position.z = this.platform.position.z - this.platformSize;
    }

    // update tween movements
    TWEEN.update();
  }

  hide() {

  }
}