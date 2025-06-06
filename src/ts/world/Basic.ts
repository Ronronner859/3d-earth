/**
 * 创建 threejs 四大天王
 * 场景、相机、渲染器、控制器
 */

import * as THREE from 'three';
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls";

export class Basic {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer
  public controls: OrbitControls;
  public dom: HTMLElement;

  constructor(dom: HTMLElement) {
    this.dom = dom
    this.initScenes()
    this.setControls()
  }

  /**
   * 初始化场景
   */
  initScenes() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      100000
    );
    // 相机位置 - 调整视角使其更适合手机端观看
    this.camera.position.set(-100, 40, -300)


    this.renderer = new THREE.WebGLRenderer({
      alpha: true, // 透明
      antialias: true, // 抗锯齿
      powerPreference: 'high-performance', // 优先使用高性能模式
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制最大像素比，优化性能
    this.renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器宽高
    this.renderer.domElement.style.position = 'fixed'; // 固定位置
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.dom.appendChild(this.renderer.domElement); // 添加到dom中
  }

  /**
   * 设置控制器
   */
  setControls() {
    // 鼠标控制      相机，渲染dom
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    this.controls.autoRotateSpeed = 2 // 降低自动旋转速度
    // 使动画循环使用时阻尼或自转 意思是否有惯性
    this.controls.enableDamping = true;
    // 动态阻尼系数 就是鼠标拖拽旋转灵敏度
    this.controls.dampingFactor = 0.08; // 增加阻尼，使操作更平滑
    // 是否可以缩放
    this.controls.enableZoom = true;
    // 设置相机距离原点的最远距离
    this.controls.minDistance = 40; // 允许更近的视角
    // 设置相机距离原点的最远距离
    this.controls.maxDistance = 180; // 限制最大距离
    // 是否开启右键拖拽
    this.controls.enablePan = false;
    // 限制垂直旋转角度，防止视角过于倾斜
    this.controls.minPolarAngle = Math.PI / 4; // 45度
    this.controls.maxPolarAngle = Math.PI * 3/4; // 135度
  }
}