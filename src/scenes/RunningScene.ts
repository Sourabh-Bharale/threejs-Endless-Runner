import {
  Scene, DirectionalLight, AmbientLight, Object3D, AnimationMixer, AnimationAction, Clock,
  Box3, Group, BoxGeometry, MeshPhongMaterial, Mesh, Vector3,
} from 'three';
import * as THREE from 'three'
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


  // obstaces
  private barrelObject = new Object3D();
  private boxObject = new Object3D();
  private spikeObject = new Object3D();
  private obstacleArray: Group[] = [];

  private currentObstacleOne = new Group();
  private currentObstacleTwo = new Group();

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
      this.currentAnimation.setLoop(THREE.LoopOnce,1);
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

  // touch cotrols
  private touchstartX = 0;
  private touchendX = 0;
  private touchstartY = 0;
  private touchendY = 0;
  private handleTouch = () => {
    const pageWidth = window.innerWidth || document.body.clientWidth;
    const treshold = Math.max(1, Math.floor(0.01 * (pageWidth)));
    const limit = Math.tan(45 * (1.5 / 180) * Math.PI);
    const x = this.touchendX - this.touchstartX;
    const y = this.touchendY - this.touchstartY;
    const xy = Math.abs(x / y);
    const yx = Math.abs(y / x);
    if (Math.abs(x) > treshold || Math.abs(y) > treshold) {
      if (yx <= limit) {
        if (x < 0) {
          this.moveLeft();
        } else {
          this.moveRight();
        }
      }
      if (xy <= limit) {
        if (y < 0) {
          this.jump();
        } else {
          this.slide();
        }
      }
    }
  };


  //create obstacles
  private createLeftJumpObstacle() {
    const meshGroup = new Group();
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(0, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(20, -25, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.spikeObject.clone();
    mesh3.scale.set(0.06, 0.06, 0.06);
    mesh3.position.set(-20, -31, 0);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -800);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }
  private createCenterJumpObstacle() {
    const meshGroup = new Group();
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(-20, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(20, -25, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.spikeObject.clone();
    mesh3.scale.set(0.06, 0.06, 0.06);
    mesh3.position.set(0, -31, 0);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }
  private createRightJumpObstacle() {
    const meshGroup = new Group();
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(-20, -25, 0);
    meshGroup.add(mesh);

    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(0, -25, 0);
    meshGroup.add(mesh2);

    const mesh3 = this.spikeObject.clone();
    mesh3.scale.set(0.06, 0.06, 0.06);
    mesh3.position.set(20, -31, 0);
    meshGroup.add(mesh3);

    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }
  private createRightCenterObstacle() {
    const meshGroup = new Group();
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(0, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(20, -25, 0);
    meshGroup.add(mesh2);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }
  private createLeftCenterObstacle() {
    const meshGroup = new Group();
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(-20, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(0, -25, 0);
    meshGroup.add(mesh2);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }
  private createLeftRightObstacle() {
    const meshGroup = new Group();
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(-20, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(20, -25, 0);
    meshGroup.add(mesh2);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }
  private createCenterRightObstacle() {
    const meshGroup = new Group();
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.031, 0.031, 0.031);
    mesh.position.set(-20, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(20, -25, 0);
    meshGroup.add(mesh2);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }
  private createCenterSlideObstacle() {
    const meshGroup = new Group();
    const geometry = new BoxGeometry();
    const material = new MeshPhongMaterial({ color: 'brown' });
    const plank = new Mesh(geometry, material);
    meshGroup.add(plank);
    plank.position.set(0, -20, 0);
    plank.scale.set(40, 0.5, 7);
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(-20, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(20, -25, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.boxObject.clone();
    mesh3.scale.set(4, 2, 2);
    mesh3.position.set(0, -19, 3);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }
  private createRightSlideObstacle() {
    const meshGroup = new Group();
    const geometry = new BoxGeometry();
    const material = new MeshPhongMaterial({ color: 'brown' });
    const plank = new Mesh(geometry, material);
    meshGroup.add(plank);
    plank.position.set(20, -20, 0);
    plank.scale.set(40, 0.5, 7);
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(-20, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(0, -25, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.boxObject.clone();
    mesh3.scale.set(4, 2, 2);
    mesh3.position.set(20, -19, 3);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }
  private createLeftSlideObstacle() {
    const meshGroup = new Group();
    const geometry = new BoxGeometry();
    const material = new MeshPhongMaterial({ color: 'brown' });
    const plank = new Mesh(geometry, material);
    meshGroup.add(plank);
    plank.position.set(-20, -20, 0);
    plank.scale.set(40, 0.5, 7);
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(20, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(0, -25, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.boxObject.clone();
    mesh3.scale.set(4, 2, 2);
    mesh3.position.set(-20, -19, 3);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }


  //obstacle hitboxes
  private playerBox = new Mesh(
    new BoxGeometry(),
    new MeshPhongMaterial({
       color: 0x0000ff
      })
  );
  private playerBoxCollider = new Box3(
    new Vector3(),
    new Vector3()
  );
  private obstacleBox = new Box3(
    new Vector3(),
    new Vector3()
  );
  private obstacleBox2 = new Box3(
    new Vector3(),
    new Vector3()
  );


  // random obstacles
  private createRandomObstacle() {
    let randomNum = Math.floor(Math.random() * this.obstacleArray.length);

    while (this.obstacleArray[randomNum] === this.currentObstacleOne
      || this.obstacleArray[randomNum] === this.currentObstacleTwo) {
      randomNum = Math.floor(Math.random() * this.obstacleArray.length);
    }
    return this.obstacleArray[randomNum];
  }
  // spwan obstacles
  private spawnObstacle() {
    if (!this.currentObstacleOne.visible) {
    this.currentObstacleOne.visible = true;
    }

    if (!this.currentObstacleTwo.visible) {
    this.currentObstacleTwo.visible = true;
    this.currentObstacleTwo.position.z = this.currentObstacleOne.position.z - 450;
    }

    this.currentObstacleOne.position.z += this.speed * this.delta;
    this.currentObstacleTwo.position.z += this.speed * this.delta;

    if (this.currentObstacleOne.position.z > -40) {
    this.currentObstacleOne.visible = false;
    this.currentObstacleOne.position.z = -1100;
    this.currentObstacleOne = this.createRandomObstacle();
    }

    if (this.currentObstacleTwo.position.z > -40) {
    this.currentObstacleTwo.visible = false;
    this.currentObstacleTwo.position.z = this.currentObstacleOne.position.z - 450;
    this.currentObstacleTwo = this.createRandomObstacle();
    }
  }


  // coins
  private coinObject = new Object3D();
  private coinsArray: Group[] = [];
  private activeCoinsGroup = new Group();

  // create coins
  private generateLeftCenterRightCoins() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const leftCoin = this.coinObject.clone();
      const centerCoin = this.coinObject.clone();
      const rightCoin = this.coinObject.clone();
      leftCoin.position.set(-18, -12, -i * 20);
      centerCoin.position.set(0, -12, -i * 20);
      rightCoin.position.set(18, -12, -i * 20);
      leftCoin.scale.set(0.035, 0.035, 0.035);
      centerCoin.scale.set(0.035, 0.035, 0.035);
      rightCoin.scale.set(0.035, 0.035, 0.035);
      coinsGroup.add(leftCoin, centerCoin, rightCoin);
    }
  coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }
  private generateLeftSideCoin() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const leftCoin = this.coinObject.clone();
      leftCoin.position.set(-18, -12, -i * 20);
      leftCoin.scale.set(0.035, 0.035, 0.035);
      coinsGroup.add(leftCoin);
    }
    coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }
  private generateLeftandCenterCoins() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const leftCoin = this.coinObject.clone();
      const centerCoin = this.coinObject.clone();
      leftCoin.position.set(-18, -12, -i * 20);
      centerCoin.position.set(0, -12, -i * 20);
      leftCoin.scale.set(0.035, 0.035, 0.035);
      centerCoin.scale.set(0.035, 0.035, 0.035);
      coinsGroup.add(leftCoin, centerCoin);
    }
    coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }
  private generateCenterRightCoins() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const centerCoin = this.coinObject.clone();
      const rightCoin = this.coinObject.clone();
      centerCoin.position.set(0, -12, -i * 20);
      rightCoin.position.set(18, -12, -i * 20);
      coinsGroup.add(centerCoin, rightCoin);
      centerCoin.scale.set(0.035, 0.035, 0.035);
      rightCoin.scale.set(0.035, 0.035, 0.035);
    }
    coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }
  private generateRightCoins() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const rightCoin = this.coinObject.clone();
      rightCoin.position.set(18, -12, -i * 20);
      coinsGroup.add(rightCoin);
      rightCoin.scale.set(0.035, 0.035, 0.035);
    }
    coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }

  private generateRandomCoins() {
    const randNum = Math.floor(Math.random() * this.coinsArray.length);
    this.activeCoinsGroup = this.coinsArray[randNum];
  }

  private spawnCoin() {
    if (!this.activeCoinsGroup.visible) {
      this.activeCoinsGroup.visible = true;
    }

    this.activeCoinsGroup.position.z += 0.8 * this.speed * this.delta;
    if (this.activeCoinsGroup.position.z > 50) {
      for (let i = 0; i < this.activeCoinsGroup.children.length; i += 1) {
        if (!this.activeCoinsGroup.children[i].visible) {
          this.activeCoinsGroup.children[i].visible = true;
        }
      }
      this.activeCoinsGroup.visible = false;
      this.activeCoinsGroup.position.z = -1200;
      this.generateRandomCoins();
    }
  }

  // coin hitboxs
  private coinBox = new Box3(new Vector3(), new Vector3());

  private detectCollisionWithCoins() {
    for (let i = 0; i < this.activeCoinsGroup.children.length; i += 1) {
      this.coinBox.setFromObject(this.activeCoinsGroup.children[i]);
      if (this.playerBoxCollider.intersectsBox(this.coinBox)) {
        this.activeCoinsGroup.children[i].visible = false;
        this.activeCoinsGroup.children[i].position.z += 70;
        if (!this.isGamePaused && !this.isGameOver) {
          this.coins += 1;
        }
        (document.querySelector('.coins-count') as HTMLInputElement).innerHTML = `${this.coins}`;
        setTimeout(() => {
          this.activeCoinsGroup.children[i].position.z -= 70;
        }, 100);
      }
    }
  }


  // GameOver & restart
  private isGameOver = false;
  private stumbleAnimation!: AnimationAction;
  private isPlayerHeadStart = false;
  private gameOver() {
    this.isGameOver = true;
    this.speed = 0;
    (document.querySelector('.pause-button') as HTMLInputElement).style.display = 'none';
    (document.querySelector('.disable-touch') as HTMLInputElement).style.display = 'block';

    setTimeout(() => {
      this.clock.stop();
      (document.getElementById('game-over-modal') as HTMLInputElement).style.display = 'block';
      (document.querySelector('#current-score') as HTMLInputElement).innerHTML = this.scores.toString();
      (document.querySelector('#current-coins') as HTMLInputElement).innerHTML = this.coins.toString();
      this.stumbleAnimation.reset();
      this.player.visible = false;
    }, 3000);

    this.stumbleAnimation.reset();
    this.currentAnimation.crossFadeTo(this.stumbleAnimation, 0, false).play();
    this.currentAnimation = this.stumbleAnimation;
    this.currentObstacleOne.position.z -= 5;
    this.currentObstacleTwo.position.z -= 5;
    this.isPlayerHeadStart= false;
    this.saveCoins();
    this.saveHighScore();
  }

  private restartGame() {
    this.player.visible = true;
    (document.getElementById('game-over-modal') as HTMLInputElement).style.display = 'none';
    (document.querySelector('.disable-touch') as HTMLInputElement).style.display = 'none';
    this.currentObstacleOne.position.z = -1200;
    this.currentObstacleTwo.position.z = -1500;
    this.activeCoinsGroup.position.z = -1800;
    this.clock.start();
    this.speed = 220;
    this.coins = 0;
    this.scores = 0;
    (document.querySelector('.coins-count') as HTMLInputElement).innerHTML = '0';
    this.runningAnimation.reset();
    this.currentAnimation.crossFadeTo(this.runningAnimation, 0, false).play();
    this.player.position.z = -110;
    this.isGameOver = false;
    this.isGamePaused = false;
    this.currentAnimation = this.runningAnimation;
    (document.querySelector('.pause-button') as HTMLInputElement).style.display = 'block';
    this.player.position.x = 0;
    setTimeout(() => {
      this.isPlayerHeadStart= true;
    }, 3000);
  }


  // detect collisons
  private detectCollisionWithObstacles() {
    for (let i = 0; i < this.currentObstacleOne.children.length; i += 1) {
      this.obstacleBox.setFromObject(this.currentObstacleOne.children[i]);
      if (this.playerBoxCollider.intersectsBox(this.obstacleBox)) {
        this.gameOver();
      }
    }
    for (let i = 0; i < this.currentObstacleTwo.children.length; i += 1) {
      this.obstacleBox2.setFromObject(this.currentObstacleTwo.children[i]);

      if (this.playerBoxCollider.intersectsBox(this.obstacleBox2)) {
        this.gameOver();
      }
    }
  }

  // dashboard
  private scores = 0;
  private coins = 0;

  // game pause/play
  private isGamePaused = false;
  private pauseAndResumeGame() {
    if (!this.isGamePaused ) {
      this.clock.stop();
      (document.getElementById('game-paused-modal') as HTMLInputElement).style.display = 'block';
      this.isGamePaused = true;
    } else {
      this.clock.start();
      (document.getElementById('game-paused-modal') as HTMLInputElement).style.display = 'none';
      this.isGamePaused = false;
    }
    this.saveCoins();
    this.saveHighScore();
  }

  // local Storage
  private saveHighScore() {
    const highScore = localStorage.getItem('high-score') || 0;

    if (Number(this.scores) > Number(highScore)) {
      localStorage.setItem('high-score', this.scores.toString());
    }
  }
  private saveCoins() {
    const prevTotalCoins = localStorage.getItem('total-coins') || 0;
    const totalCoins = Number(prevTotalCoins) + this.coins;
    localStorage.setItem('coins', totalCoins.toString());
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

    // stumbling
    const stumblingAnimationObject = await this.fbxLoader.loadAsync(
      './assets/animations/stumbling.fbx'
    );
    this.stumbleAnimation = this.animationMixer.clipAction(
      stumblingAnimationObject.animations[0]
    );


    // obstacles
    this.barrelObject = await this.fbxLoader.loadAsync('../../assets/models/barrel.fbx');
    this.boxObject = await this.fbxLoader.loadAsync('../../assets/models/box.fbx');
    this.spikeObject = await this.fbxLoader.loadAsync('../../assets/models/spike.fbx');
    this.createLeftJumpObstacle();

    // load obstacles
    this.createLeftJumpObstacle();
    this.createCenterJumpObstacle();
    this.createRightJumpObstacle();
    this.createRightCenterObstacle();
    this.createLeftSlideObstacle();
    this.createCenterRightObstacle();
    this.createLeftCenterObstacle();
    this.createLeftRightObstacle();
    this.createCenterSlideObstacle();
    this.createRightSlideObstacle();



    // load coins
    this.coinObject = await this.fbxLoader.loadAsync('../../assets/models/coin.fbx');
    this.coinObject.rotation.set(90 * (Math.PI / 180), 0, 150 * (Math.PI / 180));

    // generate coins
    this.generateLeftCenterRightCoins();
    this.generateLeftSideCoin();
    this.generateLeftandCenterCoins();
    this.generateCenterRightCoins();
    this.generateRightCoins();

    // player hitbox
    this.playerBox.scale.set(50, 200, 20);
    this.playerBox.position.set(0, 90, 0);
    this.player.add(this.playerBox);

    // hide hitbox
    this.playerBox.visible = false;

    // load touch gestures
    const gestureZone = (document.getElementById('app') as HTMLInputElement);

    if (!this.isGameOver && !this.isGamePaused) {
  gestureZone.addEventListener('touchstart', (event) => {
    this.touchstartX = event.changedTouches[0].screenX;
    this.touchstartY = event.changedTouches[0].screenY;
  }, false);

  gestureZone.addEventListener('touchend', (event) => {
    this.touchendX = event.changedTouches[0].screenX;
    this.touchendY = event.changedTouches[0].screenY;
    this.handleTouch();
  }, false);
    }

  }




  initialize() {

    // movements
    document.onkeydown = (e) => {
      if (!this.isGameOver && !this.isGamePaused) {
        if (e.key === 'ArrowLeft') {
          this.moveLeft();
        } if (e.key === 'ArrowRight') {
          this.moveRight();
        }
        if (e.key === 'ArrowUp') {
          this.jump();
        }
        if (e.key === 'ArrowDown') {
          this.slide();
        }
        if (e.key === ' ') {
          this.pauseAndResumeGame();
        }
      }
    };

    // dashboard
    (document.querySelector('.scores-container') as HTMLInputElement).style.display = 'block';
    (document.querySelector('.coins-container') as HTMLInputElement).style.display = 'block';

    //pause / play
    (document.querySelector('.pause-button') as HTMLInputElement).style.display = 'block';

    (document.querySelector('.pause-button') as HTMLInputElement).onclick = () => {
      this.pauseAndResumeGame();
    };

    (document.getElementById('resume-button') as HTMLInputElement).onclick = () => {
      this.pauseAndResumeGame();
    };

    // restart
    (document.getElementById('restart-button') as HTMLInputElement).onclick = () => { this.restartGame(); };

    // headstart
    setTimeout(() => {
      this.isPlayerHeadStart = true;
    }, 3000);
    if (this.isPlayerHeadStart) {
      this.spawnObstacle();
      this.spawnCoin();
    }
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

    // update obstacles
    this.spawnObstacle();

    // update collison detections
    this.playerBoxCollider.setFromObject(this.playerBox);
    this.detectCollisionWithObstacles();

    // update spawn coins
    this.spawnCoin();
    this.detectCollisionWithCoins();

    // update dashboard
    this.scores += Math.round(this.speed * this.delta);
    (document.querySelector('.scores-count') as HTMLInputElement).innerHTML = this.scores.toString();

    // update speed
    if (!this.isGameOver && this.speed < 400 && !this.isGamePaused ) {
      this.speed += 0.06;
    }
  }

  hide() {

  }
}