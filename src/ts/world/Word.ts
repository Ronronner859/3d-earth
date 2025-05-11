import {
  MeshBasicMaterial, PerspectiveCamera,
  Scene, ShaderMaterial, WebGLRenderer,
  Raycaster, Vector2
} from "three";
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls";

// interfaces
import { IWord } from '../interfaces/IWord'

import { Basic } from './Basic'
import Sizes from '../Utils/Sizes'
import { Resources } from './Resources';

// earth 
import Earth from './Earth'
import Data from './Data'

export default class World {
  public basic: Basic;
  public scene: Scene;
  public camera: PerspectiveCamera;
  public renderer: WebGLRenderer
  public controls: OrbitControls;
  public sizes: Sizes;
  public material: ShaderMaterial | MeshBasicMaterial;
  public resources: Resources;
  public option: IWord;
  public earth: Earth;
  private raycaster: Raycaster;
  private mouse: Vector2;

  constructor(option: IWord) {
    /**
     * 加载资源
     */
    this.option = option

    this.basic = new Basic(option.dom)
    this.scene = this.basic.scene
    this.renderer = this.basic.renderer
    this.controls = this.basic.controls
    this.camera = this.basic.camera

    this.sizes = new Sizes({ dom: option.dom })

    this.sizes.$on('resize', () => {
      this.renderer.setSize(Number(this.sizes.viewport.width), Number(this.sizes.viewport.height))
      this.camera.aspect = Number(this.sizes.viewport.width) / Number(this.sizes.viewport.height)
      this.camera.updateProjectionMatrix()
    })

    // 初始化 Raycaster
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();

    // 添加点击事件监听
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));

    this.resources = new Resources(async () => {
      await this.createEarth()
      // 开始渲染
      this.render()
    })
  }

  // 处理鼠标点击事件
  private onMouseClick(event: MouseEvent) {
    // 计算鼠标在归一化设备坐标中的位置
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 只检测可点击的点
    const clickablePoints = this.earth?.clickablePoints || [];
    const intersects = this.raycaster.intersectObjects(clickablePoints, true);

    console.log('Intersects:', intersects); // 调试日志

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      console.log('Clicked object:', clickedObject); // 调试日志
      console.log('UserData:', clickedObject.userData); // 调试日志
      
      // 检查是否点击到了点标记
      if (clickedObject.userData && clickedObject.userData.coordinates) {
        const { lon, lat, name } = clickedObject.userData.coordinates;
        console.log('Coordinates:', { lon, lat, name }); // 调试日志
        // 跳转到高德地图
        // const url = `https://uri.amap.com/marker?position=${lon},${lat}&name=${name}`;
        const url = 'https://www.baidu.com'
        window.open(url, '_blank');
      }
    }
  }

  async createEarth() {
    // 资源加载完成，开始制作地球，注释在new Earth()类型里面
    this.earth = new Earth({
      data: Data,
      dom: this.option.dom,
      textures: this.resources.textures,
      earth: {
        radius: 50,
        rotateSpeed: 0.002,
        isRotation: false  // 设置为 false 停止地球自转
      },
      satellite: {
        show: true,
        rotateSpeed: -0.01,
        size: 1,
        number: 2
      },
      punctuation: {
        circleColor: 0x3892ff,
        lightColumn: {
          startColor: 0xe4007f, // 起点颜色
          endColor: 0xffffff, // 终点颜色
        },
      },
      flyLine: {
        color: 0xf3ae76, // 飞线的颜色
        flyLineColor: 0xff7714, // 飞行线的颜色
        speed: 0.004, // 拖尾飞线的速度
      }
    })

    this.scene.add(this.earth.group)

    await this.earth.init()

    // 隐藏dom
    const loading = document.querySelector('#loading')
    loading.classList.add('out')
  }

  /**
   * 渲染函数
   */
  public render() {
    requestAnimationFrame(this.render.bind(this))
    this.renderer.render(this.scene, this.camera)
    this.controls && this.controls.update()
    this.earth && this.earth.render()
  }
}